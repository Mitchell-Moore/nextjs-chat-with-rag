'use client';

import { BotIcon, UserIcon } from '@/components/ui/icons';
import { ReactNode } from 'react';
import { Markdown } from '@/components/ui/markdown';

export const MessageComponent = ({
  role,
  content,
}: {
  role: string;
  content: string | ReactNode;
}) => {
  return (
    <div
      className={`flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20`}
    >
      <div className="size-[24px] flex flex-col justify-center items-center flex-shrink-0 text-zinc-400">
        {role === 'assistant' ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-6 w-full">
        <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
          <Markdown>{content as string}</Markdown>
        </div>
      </div>
    </div>
  );
};
