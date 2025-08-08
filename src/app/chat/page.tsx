"use client";

import { useCompletion } from "@ai-sdk/react";

export default function ChatPage() {
  const { completion, input, handleInputChange, handleSubmit, isLoading, stop } = useCompletion({ api: "/api/chat" });
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Chat</h2>
      <div className="border rounded p-4 h-[30vh] overflow-auto mb-4 whitespace-pre-wrap">{completion}</div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={handleInputChange}
          placeholder="Écrire un message..."
        />
        <button className="border rounded px-3 py-2" type="submit">Envoyer</button>
        {isLoading ? (
          <button className="border rounded px-3 py-2" type="button" onClick={() => stop()}>Stop</button>
        ) : null}
      </form>
    </main>
  );
}


