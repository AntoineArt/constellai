"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useQueryState } from "nuqs";
import { MarkdownMessage } from "@/components/chat/markdown";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface SendState {
  isSending: boolean;
  error?: string;
}

export default function ChatPage() {
  const [conversationId, setConversationId] = useQueryState("c");
  const conversations = useQuery(api.index.listMyConversations) ?? [];
  const selectedConversationId: Id<"conversations"> | undefined = useMemo(
    () => (conversationId as unknown as Id<"conversations">) ?? conversations[0]?._id,
    [conversationId, conversations],
  );
  const messages = useQuery(
    api.index.listMessages,
    selectedConversationId ? { conversationId: selectedConversationId } : "skip",
  );

  const createMyConversation = useMutation(api.index.createMyConversation);
  const sendMyMessage = useMutation(api.index.sendMyMessage);
  const writeAssistantMessagePublic = useMutation(api.index.writeAssistantMessagePublic);

  const [input, setInput] = useState("");
  const [sendState, setSendState] = useState<SendState>({ isSending: false });

  useEffect(() => {
    if (!conversationId && conversations.length > 0) setConversationId(conversations[0]._id);
  }, [conversationId, conversations, setConversationId]);

  async function handleCreateConversation() {
    const id = await createMyConversation({ modelId: "gpt-4o-mini" });
    await setConversationId(id as unknown as string);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConversationId || !input.trim()) return;
    setSendState({ isSending: true });
    try {
      await sendMyMessage({ conversationId: selectedConversationId as Id<"conversations">, content: input.trim() });
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const text = await res.text();
      await writeAssistantMessagePublic({ conversationId: selectedConversationId as Id<"conversations">, content: text });
      setInput("");
      setSendState({ isSending: false });
    } catch (err) {
      setSendState({ isSending: false, error: err instanceof Error ? err.message : "Erreur" });
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Chat</h2>
      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        <aside className="border rounded p-3 h-[70vh] overflow-auto space-y-2">
          <button className="w-full border rounded px-3 py-2" onClick={handleCreateConversation}>Nouvelle conversation</button>
          <div className="text-sm text-zinc-600">Conversations</div>
          <div className="space-y-1">
            {conversations.map((c) => (
              <button
                key={c._id}
                onClick={() => setConversationId(c._id)}
                className={`block w-full text-left px-2 py-1 rounded ${c._id === selectedConversationId ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
              >
                {c.title ?? "Sans titre"}
              </button>
            ))}
          </div>
        </aside>
        <div>
          <div className="border rounded p-4 h-[60vh] overflow-auto mb-4 space-y-3">
            {messages?.map((m) => (
              <div key={m._id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block max-w-[80%] rounded px-3 py-2 ${m.role === "user" ? "bg-zinc-100" : "bg-white"}`}>
                  {m.role === "assistant" ? <MarkdownMessage content={m.content} /> : <span>{m.content}</span>}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrire un message..."
            />
            <button className="border rounded px-3 py-2" type="submit" disabled={sendState.isSending}>
              {sendState.isSending ? "Envoi..." : "Envoyer"}
            </button>
          </form>
          {sendState.error ? <div className="text-sm text-red-600 mt-2">{sendState.error}</div> : null}
        </div>
      </div>
    </main>
  );
}


