'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '../../components/ai-elements/conversation';
import { Message as ChatMessage, MessageAvatar, MessageContent } from '../../components/ai-elements/message';
import {
	PromptInput,
	PromptInputButton,
	PromptInputModelSelect,
	PromptInputModelSelectContent,
	PromptInputModelSelectItem,
	PromptInputModelSelectTrigger,
	PromptInputModelSelectValue,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from '../../components/ai-elements/prompt-input';
import { Response } from '../../components/ai-elements/response';

export default function ChatPage() {
	const [model, setModel] = useState('anthropic/claude-3.5-sonnet');
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const abortRef = useRef(null);

	return (
		<div className="mx-auto flex h-[100dvh] max-w-3xl flex-col">
			<header className="sticky top-0 z-10 border-b bg-background/80 px-4 py-3 backdrop-blur">
				<div className="flex items-center gap-2">
					<span className="font-semibold">Chat</span>
					<div className="ml-auto flex items-center gap-2">
						<PromptInputModelSelect defaultValue={model} onValueChange={(value) => setModel(value)}>
							<PromptInputModelSelectTrigger>
								<PromptInputModelSelectValue />
							</PromptInputModelSelectTrigger>
							<PromptInputModelSelectContent>
								<PromptInputModelSelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</PromptInputModelSelectItem>
								<PromptInputModelSelectItem value="openai/gpt-4o-mini">GPT-4o Mini</PromptInputModelSelectItem>
								<PromptInputModelSelectItem value="groq/llama-3.3-70b-versatile">Llama 3.3 70B</PromptInputModelSelectItem>
								<PromptInputModelSelectItem value="openai/gpt-oss-20b">GPT-OSS 20B</PromptInputModelSelectItem>
							</PromptInputModelSelectContent>
						</PromptInputModelSelect>
					</div>
				</div>
			</header>

			<Conversation>
				<ConversationContent>
					{messages.map((m) => (
						<ChatMessage key={m.id} from={m.role === 'user' ? 'user' : 'assistant'}>
							<MessageAvatar name={m.role === 'user' ? 'You' : 'AI'} />
							<MessageContent>
								{m.role === 'assistant' ? (
									<Response>{m.content}</Response>
								) : (
									<div className="whitespace-pre-wrap">{m.content}</div>
								)}
							</MessageContent>
						</ChatMessage>
					))}
					<ConversationScrollButton />
				</ConversationContent>
			</Conversation>

			<div className="sticky bottom-0 border-t bg-background/80 p-4 backdrop-blur">
				{error && (
					<div className="mb-2 text-sm text-red-600">{String(error)}</div>
				)}
				<PromptInput
					onSubmit={async (e) => {
						e.preventDefault();
						const value = input.trim();
						if (!value || isLoading) return;
						setError(null);
						const nextMessages = [
							...messages,
							{ id: crypto.randomUUID(), role: 'user', content: value },
							{ id: crypto.randomUUID(), role: 'assistant', content: '' },
						];
						setMessages(nextMessages);
						setInput("");
						const controller = new AbortController();
						abortRef.current = controller;
						setIsLoading(true);
						try {
							const res = await fetch('/api/chat', {
								method: 'POST',
								headers: { 'content-type': 'application/json' },
								body: JSON.stringify({ messages: nextMessages.map(({ role, content }) => ({ role, content })), model }),
								signal: controller.signal,
							});
							if (!res.ok || !res.body) {
								setError(`Request failed: ${res.status} ${res.statusText}`);
								setIsLoading(false);
								return;
							}
							const reader = res.body.getReader();
							const decoder = new TextDecoder();
							let done = false;
							while (!done) {
								const { value: chunk, done: readerDone } = await reader.read();
								done = readerDone;
								if (chunk) {
									const text = decoder.decode(chunk, { stream: true });
									setMessages((prev) => {
										const updated = [...prev];
										const lastIndex = updated.length - 1;
										if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
											updated[lastIndex] = { ...updated[lastIndex], content: updated[lastIndex].content + text };
										}
										return updated;
									});
								}
							}
						} catch (err) {
							if (err?.name !== 'AbortError') setError(err?.message || String(err));
						} finally {
							setIsLoading(false);
						}
					}}>
					<PromptInputTextarea
						name="input"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask anything…"
					/>
					<PromptInputToolbar>
						<PromptInputTools />
						<div className="flex items-center gap-2">
							<PromptInputButton
								variant="outline"
								onClick={() => {
									if (abortRef.current) abortRef.current.abort();
								}}
								disabled={!isLoading}>
								Stop
							</PromptInputButton>
							<PromptInputSubmit status={isLoading ? 'submitted' : undefined} />
						</div>
					</PromptInputToolbar>
				</PromptInput>
			</div>
		</div>
	);
}


