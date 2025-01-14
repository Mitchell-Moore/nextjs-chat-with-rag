import { openai } from '@ai-sdk/openai';
import {
  cosineSimilarity,
  embed,
  Experimental_LanguageModelV1Middleware,
  generateObject,
  generateText,
} from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { chunksTable, filesTable } from '@/db/schema';
import { inArray, eq } from 'drizzle-orm';
// schema for validating the custom provider metadata
const selectionSchema = z.object({
  user: z.object({
    userId: z.string(),
  }),
});

export const ragMiddleware: Experimental_LanguageModelV1Middleware = {
  transformParams: async ({ params }) => {
    const { prompt: messages, providerMetadata } = params;

    const { success, data } = selectionSchema.safeParse(providerMetadata);

    if (!success) {
      return params;
    }

    const userId = data.user.userId;

    const recentMessage = messages.pop();

    if (!recentMessage || recentMessage.role !== 'user') {
      if (recentMessage) {
        messages.push(recentMessage);
      }
      return params;
    }

    const lastUserMessageContent = recentMessage.content
      .filter((content) => content.type === 'text')
      .map((content) => content.text)
      .join('\n');

    // Classify the user prompt as whether it requires more context or not
    const { object: classification } = await generateObject({
      // fast model for classification:
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      output: 'enum',
      enum: ['question', 'statement', 'other'],
      system: 'classify the user message as a question, statement, or other',
      prompt: lastUserMessageContent,
    });

    // only use RAG for questions
    if (classification !== 'question') {
      messages.push(recentMessage);
      return params;
    }

    // Use hypothetical document embeddings:
    const { text: hypotheticalAnswer } = await generateText({
      // fast model for generating hypothetical answer:
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      system: 'Answer the users question:',
      prompt: lastUserMessageContent,
    });

    // Embed the hypothetical answer
    const { embedding: hypotheticalAnswerEmbedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: hypotheticalAnswer,
    });

    const fileIds = await db
      .select({ id: filesTable.id })
      .from(filesTable)
      .where(eq(filesTable.userId, userId));

    // find relevant chunks based on the selection
    const chunksBySelection = await db
      .select()
      .from(chunksTable)
      .where(
        inArray(
          chunksTable.fileId,
          fileIds.map((file) => file.id)
        )
      );

    const chunksWithSimilarity = chunksBySelection.map((chunk) => ({
      ...chunk,
      similarity: cosineSimilarity(
        hypotheticalAnswerEmbedding,
        chunk.embedding ?? []
      ),
    }));

    // rank the chunks by similarity and take the top K
    chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    const k = 10;
    const topKChunks = chunksWithSimilarity.slice(0, k);

    // add the chunks to the last user message
    messages.push({
      role: 'user',
      content: [
        ...recentMessage.content,
        {
          type: 'text',
          text: 'Here is some relevant information that you can use to answer the question:',
        },
        ...topKChunks.map((chunk) => ({
          type: 'text' as const,
          text: chunk.content,
        })),
      ],
    });
    return { ...params, prompt: messages };
  },
};
