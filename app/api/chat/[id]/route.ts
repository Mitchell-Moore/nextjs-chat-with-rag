import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { chatsTable, messagesTable } from '@/db/schema';

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
}
