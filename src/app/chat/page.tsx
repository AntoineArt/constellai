"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useQueryState } from "nuqs";
import { ChatMessage } from "@/components/chat/message";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ModelPicker } from "./modelPicker";
import { ChatUploader } from "@/components/chat/uploader";

interface SendState {
  isSending: boolean;
  error?: string;
}

export default function ChatPage() {
  const [conversationId, setConversationId] = useQueryState("c");
  const [search, setSearch] = useState<string>("");
  const conversations = useQuery(api.index.listMyConversations) ?? [];
  const searched = useQuery(api.index.searchMyConversations, search ? { q: search } : "skip");
  const allowedModels = useQuery(api.index.listAllowedModels) ?? [];
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
  const renameConversation = useMutation(api.index.renameConversation);
  const reportUsageForConversation = useMutation(api.index.reportUsageForConversation);
  const deleteConversation = useMutation(api.index.deleteConversation);
  const deleteMessageIfOwner = useMutation(api.index.deleteMessageIfOwner);

  const [input, setInput] = useState("");
  const [sendState, setSendState] = useState<SendState>({ isSending: false });
  const [modelId, setModelId] = useState<string>("gpt-4o-mini");
  const [attachments, setAttachments] = useState<Array<{ url: string; name?: string | null; kind: string }>>([]);
  const [resendDraft, setResendDraft] = useState<string>("");
  const [streamingText, setStreamingText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    if (!conversationId && conversations.length > 0) setConversationId(conversations[0]._id);
  }, [conversationId, conversations, setConversationId]);

  async function handleCreateConversation() {
    const id = await createMyConversation({ modelId });
    await setConversationId(id as unknown as string);
  }

  async function handleRename(conversationIdToRename: Id<"conversations">) {
    const next = prompt("New title");
    if (next && next.trim()) await renameConversation({ conversationId: conversationIdToRename, title: next.trim() });
  }

  async function handleDelete(conversationIdToDelete: Id<"conversations">) {
    if (!confirm("Delete conversation permanently?")) return;
    await deleteConversation({ conversationId: conversationIdToDelete });
    if (conversationIdToDelete === selectedConversationId) await setConversationId("");
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConversationId || !(resendDraft || input).trim()) return;
    setSendState({ isSending: true });
    try {
      const content = (resendDraft || input).trim();
      await sendMyMessage({ conversationId: selectedConversationId as Id<"conversations">, content });
      if (!conversations.find((c) => c._id === selectedConversationId)?.title) {
        try {
          const t = await fetch("/api/chat/title", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, modelId }) }).then((r) => r.json());
          if (t?.title) await renameConversation({ conversationId: selectedConversationId as Id<"conversations">, title: t.title });
        } catch {}
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: content, attachments, modelId, conversationId: selectedConversationId }),
      });
      const data = (await res.json()) as { text: string; modelId: string; usage?: { inputTokens?: number; outputTokens?: number } };
      await writeAssistantMessagePublic({ conversationId: selectedConversationId as Id<"conversations">, content: data.text });
      if (data.usage && (data.usage.inputTokens || data.usage.outputTokens)) {
        await reportUsageForConversation({
          conversationId: selectedConversationId as Id<"conversations">,
          modelId: data.modelId,
          promptTokens: data.usage.inputTokens ?? 0,
          completionTokens: data.usage.outputTokens ?? 0,
        });
      }
      setInput("");
      setResendDraft("");
      setSendState({ isSending: false });
    } catch (err) {
      setSendState({ isSending: false, error: err instanceof Error ? err.message : "Erreur" });
    }
  }

  async function handleStream() {
    if (!selectedConversationId || !(resendDraft || input).trim()) return;
    setStreamingText("");
    setIsStreaming(true);
    const controller = new AbortController();
    setAbortController(controller);
    try {
      const content = (resendDraft || input).trim();
      await sendMyMessage({ conversationId: selectedConversationId as Id<"conversations">, content });
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: content, attachments, modelId, conversationId: selectedConversationId }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("Streaming failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let acc = "";
      while (!done) {
        const result = await reader.read();
        done = result.done ?? false;
        if (result.value) {
          const chunk = decoder.decode(result.value, { stream: !done });
          acc += chunk;
          setStreamingText((prev) => prev + chunk);
        }
      }
      if (acc.trim()) await writeAssistantMessagePublic({ conversationId: selectedConversationId as Id<"conversations">, content: acc });
      setInput("");
      setResendDraft("");
    } catch (e) {
      // Swallow aborts
    } finally {
      setIsStreaming(false);
      setAbortController(null);
      setStreamingText("");
    }
  }

  function handleStop() {
    if (abortController) abortController.abort();
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Chat</h2>
      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        <aside className="border rounded p-3 h-[70vh] overflow-auto space-y-2">
          <button className="w-full border rounded px-3 py-2" onClick={handleCreateConversation}>New conversation</button>
          <div className="text-xs mt-2">Model</div>
          <ModelPicker current={modelId} onSelect={setModelId} />
          <div className="mt-2">
            <ChatUploader onUploaded={(files) => setAttachments(files.slice(0, 3))} />
          </div>
          <div className="mt-2">
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Search conversations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-zinc-600">Conversations</div>
          <div className="space-y-1">
            {(searched ?? conversations)
              .filter((c) => (c.title ?? "Untitled").toLowerCase().includes(search.toLowerCase()))
              .map((c) => (
              <button
                key={c._id}
                onClick={() => setConversationId(c._id)}
                className={`block w-full text-left px-2 py-1 rounded ${c._id === selectedConversationId ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{c.title ?? "Untitled"}</span>
                  <span className="shrink-0 flex gap-1 opacity-70">
                    <a className="underline text-xs" onClick={(e) => { e.preventDefault(); handleRename(c._id); }}>Rename</a>
                    <a className="underline text-xs" onClick={(e) => { e.preventDefault(); handleDelete(c._id); }}>Delete</a>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>
        <div>
          <div className="border rounded p-4 h-[60vh] overflow-auto mb-4 space-y-3">
            {messages?.map((m) => (
              <ChatMessage
                key={m._id}
                role={m.role as any}
                content={m.content}
                attachments={m.attachments as any}
                onEdit={m.role === "user" ? () => { setResendDraft(m.content); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); } : undefined}
                onDelete={m.role === "user" ? () => deleteMessageIfOwner({ messageId: m._id as Id<"messages"> }) : undefined}
              />
            ))}
            {isStreaming && streamingText ? (
              <ChatMessage role={"assistant" as any} content={streamingText} />
            ) : null}
          </div>
          {attachments.length ? (
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              {attachments.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-2 border rounded px-2 py-1">
                  <a className="underline" href={f.url} target="_blank" rel="noreferrer">{f.name ?? f.url}</a>
                  <button className="text-zinc-500" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>✕</button>
                </span>
              ))}
            </div>
          ) : null}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={resendDraft || input}
              onChange={(e) => { if (resendDraft) setResendDraft(e.target.value); else setInput(e.target.value); }}
              placeholder="Write a message..."
            />
            <button className="border rounded px-3 py-2" type="submit" disabled={sendState.isSending || isStreaming || (allowedModels.length > 0 && !allowedModels.includes(modelId))}>
              {sendState.isSending ? "Sending..." : "Send"}
            </button>
            <button type="button" className="border rounded px-3 py-2" onClick={isStreaming ? handleStop : handleStream} disabled={sendState.isSending || (allowedModels.length > 0 && !allowedModels.includes(modelId))}>
              {isStreaming ? "Stop" : "Stream"}
            </button>
          </form>
          {allowedModels.length > 0 && !allowedModels.includes(modelId) ? (
            <div className="text-xs text-yellow-700 mt-1">Selected model not allowed in your current mode.</div>
          ) : null}
          {resendDraft ? <div className="text-xs text-zinc-500 mt-1">Editing previous message (sends as new)</div> : null}
          {sendState.error ? <div className="text-sm text-red-600 mt-2">{sendState.error}</div> : null}
        </div>
      </div>
    </main>
  );
}


