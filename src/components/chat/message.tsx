"use client";

import { MarkdownMessage } from "./markdown";

interface Attachment {
  url: string;
  name?: string | null;
  kind: string;
}

interface Props {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Array<Attachment>;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ChatMessage({ role, content, attachments, onEdit, onDelete }: Props) {
  const isUser = role === "user";
  return (
    <div className={`group ${isUser ? "text-right" : "text-left"}`}>
      <div className={`inline-block max-w-[80%] rounded px-3 py-2 align-top ${isUser ? "bg-zinc-100" : "bg-white"}`}>
        {role === "assistant" ? <MarkdownMessage content={content} /> : <span>{content}</span>}
        {attachments && attachments.length ? (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {attachments.map((a, i) => (
              <a key={i} className="underline" href={a.url} target="_blank" rel="noreferrer">{a.name ?? a.url}</a>
            ))}
          </div>
        ) : null}
      </div>
      {isUser ? (
        <span className="inline-flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity align-top ml-2 text-xs text-zinc-500">
          {onEdit ? <button className="underline" onClick={onEdit}>Edit & resend</button> : null}
          {onDelete ? <button className="underline" onClick={onDelete}>Delete</button> : null}
        </span>
      ) : null}
    </div>
  );
}


