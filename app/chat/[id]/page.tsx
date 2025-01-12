'use client';

import { Chat, Message } from '@/db/schema';
import { MessageComponent } from '@/components/ui/message';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const suggestedActions = [
  {
    title: "What's the summary",
    label: 'of these documents?',
    action: "what's the summary of these documents?",
  },
  {
    title: 'Who is the author',
    label: 'of these documents?',
    action: 'who is the author of these documents?',
  },
];

export default function ChatPage() {
  const { id } = useParams();
  const [chat, setChat] = useState<Chat | null>(null);

  useEffect(() => {
    const fetchChat = async () => {
      console.log('fetching chat', id);
      const response = await fetch(`/api/chat/${id}`);
      const chat: Chat = await response.json();
      setChat(chat);
    };
    fetchChat();
  }, [id]);

  const [input, setInput] = useState('');

  const submitMessage = async (
    message: Omit<Message, 'id' | 'createdAt' | 'chatId'>
  ) => {
    const response = await fetch(`/api/chat/${id}`, {
      method: 'POST',
      body: JSON.stringify({ ...message }),
    });
    const messageResponse: Message = await response.json();
    append(messageResponse);
  };

  const append = (message: Omit<Message, 'id' | 'createdAt' | 'chatId'>) => {
    setChat((prevChat) => {
      if (!prevChat) {
        return prevChat;
      }

      if (prevChat.messages) {
        return { ...prevChat, messages: [...prevChat.messages, message] };
      }

      return { ...prevChat, messages: [message] };
    });

    if (message.role === 'user') {
      submitMessage(message);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(input);
    submitMessage({
      role: 'user',
      content: input,
    });
    setInput('');
  };

  return (
    <div className="flex flex-row justify-center pb-20 h-dvh bg-white dark:bg-zinc-900">
      <div className="flex flex-col justify-between items-center gap-4">
        <div className="flex flex-col gap-4 h-full w-dvw items-center overflow-y-scroll">
          {chat?.messages?.map((message, index) => (
            <MessageComponent
              key={`${id}-${index}`}
              role={message.role}
              content={message.content}
            />
          ))}
          <div className="flex-shrink-0 min-w-[24px] min-h-[24px]" />
        </div>
        {chat?.messages?.length === 0 && (
          <div className="grid sm:grid-cols-2 gap-2 w-full px-4 md:px-0 mx-auto md:max-w-[500px]">
            {suggestedActions.map((suggestedAction, index) => (
              <button
                key={index}
                onClick={async () => {
                  append({
                    role: 'user',
                    content: suggestedAction.action,
                  });
                }}
                className="w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
              >
                <span className="font-medium">{suggestedAction.title}</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {suggestedAction.label}
                </span>
              </button>
            ))}
          </div>
        )}
        <form
          className="flex flex-row gap-2 relative items-center w-full md:max-w-[500px] max-w-[calc(100dvw-32px) px-4 md:px-0"
          onSubmit={handleSubmit}
        >
          <input
            className="bg-zinc-100 rounded-md px-2 py-1.5 flex-1 outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300"
            placeholder="Send a message..."
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
          />
        </form>
      </div>
    </div>
  );
}
