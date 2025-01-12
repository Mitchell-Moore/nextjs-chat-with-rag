import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import pdf from 'pdf-parse';
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import { db } from '@/db';
import { chatsTable, chunksTable, filesTable } from '@/db/schema';
import { redirect } from 'next/navigation';

async function saveFile(file: File) {
  const fileUploadId = crypto.randomUUID();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `chat-files/${fileUploadId}.${file.type.split('/')[1]}`;
  const content = await pdf(buffer);
  const { url } = await put(fileName, buffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN!,
    contentType: file.type,
  });
  return {
    id: fileUploadId,
    filename: fileName,
    path: url,
    content,
  };
}

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Hello World files upload' });
}

const fileSchema = z.instanceof(File);
export async function POST(request: Request) {
  console.log('uploading file');
  const formData = await request.formData();
  const file = formData.get('file');

  const parsedFile = fileSchema.safeParse(file);

  if (!parsedFile.success) {
    console.log(parsedFile.error);
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  try {
    const { id, filename, path, content } = await saveFile(parsedFile.data);
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunkedContent = await textSplitter.createDocuments([content.text]);

    const { embeddings } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: chunkedContent.map((chunk) => chunk.pageContent),
    });
    const fileUpload = await db.insert(filesTable).values({
      id: id,
      name: filename,
      path: path,
      userId: 'f013db28-21db-4619-83c4-3152b1fdf446',
    });

    const chunks = await db.insert(chunksTable).values(
      chunkedContent.map((chunk) => ({
        fileId: id,
        content: chunk.pageContent,
        embedding: embeddings[chunkedContent.indexOf(chunk)],
      }))
    );

    const chats = await db
      .insert(chatsTable)
      .values({
        userId: 'f013db28-21db-4619-83c4-3152b1fdf446',
      })
      .returning();

    const chatId = chats[0].id;
    redirect(`/chat/${chatId}`);
  } catch (error) {
    console.error('Error saving the file:', error);
    return NextResponse.json(
      { error: 'Error saving the file' },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: 'File uploaded' });
}
