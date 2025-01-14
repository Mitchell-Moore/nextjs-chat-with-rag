import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { chatsTable, messagesTable } from '@/db/schema';
import { convertToCoreMessages, Message, streamText } from 'ai';
import { customModel } from '@/app/ai';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const results = await db.query.chatsTable.findFirst({
    where: eq(chatsTable.id, id),
    with: {
      messages: true,
    },
  });

  return new Response(JSON.stringify(results));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { messages } = await request.json();

  const result = await streamText({
    model: customModel,
    system:
      'you are a friendly assistant! keep your responses concise and helpful.',
    messages: convertToCoreMessages(messages),
    experimental_providerMetadata: {
      user: {
        userId: 'f013db28-21db-4619-83c4-3152b1fdf446',
      },
    },
    onFinish: async ({ text }) => {
      await createMessage({
        id,
        messages: [...messages, { role: 'assistant', content: text }],
        author: 'test',
      });
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  return result.toDataStreamResponse({});
}

async function createMessage({
  id,
  messages,
  author,
}: {
  id: string;
  messages: Message[];
  author: string;
}) {
  await db.insert(messagesTable).values({
    chatId: id,
    content: messages[messages.length - 2].content,
    role: messages[messages.length - 2].role,
  });
  await db.insert(messagesTable).values({
    chatId: id,
    content: messages[messages.length - 1].content,
    role: messages[messages.length - 1].role,
  });
}
