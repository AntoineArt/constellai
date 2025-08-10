'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GlobeIcon, MicIcon } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { useQuery, useMutation } from 'convex/react';
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
import { Sources, SourcesContent, SourcesTrigger, Source } from '../../components/ai-elements/source';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '../../components/ai-elements/reasoning';

export default function ChatPage() {
	const [model, setModel] = useState('openai/gpt-oss-20b');
	const [input, setInput] = useState('');
	const [webSearch, setWebSearch] = useState(false);
	const [selectedThreadId, setSelectedThreadId] = useState(null);
	const threads = useQuery('threads:list') ?? [];
	const threadMessages = useQuery('messages:listByThread', selectedThreadId ? { threadId: selectedThreadId } : 'skip');
	const createThread = useMutation('threads:create');
	const appendMessage = useMutation('messages:append');

	// Pick first thread by default
	useEffect(() => {
		if (!selectedThreadId && threads.length > 0) setSelectedThreadId(threads[0]._id);
	}, [threads, selectedThreadId]);

	const currentThreadIdRef = useRef(null);
	useEffect(() => { currentThreadIdRef.current = selectedThreadId; }, [selectedThreadId]);

	const { messages, sendMessage, status, error, setMessages } = useChat({
		api: '/api/chat',
		id: selectedThreadId ?? 'default',
		body: { model, webSearch },
		onFinish: async (assistantMessage) => {
			const tid = currentThreadIdRef.current;
			if (!tid) return;
			const text = Array.isArray(assistantMessage.parts)
				? assistantMessage.parts
					.filter((p) => (p?.type === 'text' || p?.type === 'reasoning') && typeof p.text === 'string')
					.map((p) => p.text)
					.join('\n\n')
				: (assistantMessage.content ?? '');
			if (text && text.length > 0) {
				await appendMessage({ threadId: tid, role: 'assistant', content: text });
			}
		},
	});

	const lastHydratedThreadIdRef = useRef(null);
	useEffect(() => {
		// Wait until we have data for the selected thread before hydrating
		if (!selectedThreadId) return;
		if (threadMessages === undefined) return; // still loading
		if (lastHydratedThreadIdRef.current === selectedThreadId) return;
		const mapped = threadMessages.map((m) => ({ id: m._id, role: m.role, parts: [{ type: 'text', text: m.content }] }));
		setMessages(mapped);
		lastHydratedThreadIdRef.current = selectedThreadId;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedThreadId, threadMessages]);

	return (
		<div className="mx-auto flex h-[100dvh] max-w-3xl flex-col">
			<header className="sticky top-0 z-10 border-b bg-background/80 px-4 py-3 backdrop-blur">
				<div className="flex items-center gap-2">
					<span className="font-semibold">Chat</span>

				</div>
			</header>

			<div className="flex h-full">
				<aside className="w-72 shrink-0 border-r p-3 bg-background/60 backdrop-blur hidden md:flex md:flex-col">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-semibold">Threads</span>
						<button
							className="text-xs underline"
							onClick={async () => {
								const title = prompt('Thread title', 'New chat');
								if (!title) return;
								const id = await createThread({ title });
								setSelectedThreadId(id);
							}}>
							New
						</button>
					</div>
					<div className="space-y-1 overflow-y-auto">
						{threads.map((t) => (
							<button
								key={t._id}
								className={`w-full text-left rounded px-2 py-1.5 text-sm hover:bg-accent ${selectedThreadId === t._id ? 'bg-accent' : ''}`}
								onClick={() => setSelectedThreadId(t._id)}>
								<div className="truncate font-medium">{t.title}</div>
								{t.lastMessage && (
									<div className="truncate text-muted-foreground text-xs">{t.lastMessage}</div>
								)}
							</button>
						))}
					</div>
				</aside>
				<div className="flex-1 flex flex-col">
					<Conversation>
						<ConversationContent>
							{messages.map((message) => (
								<div key={message.id}>
									{message.role === 'assistant' && (
										<Sources>
											{message.parts.map((part, i) => {
												switch (part.type) {
													case 'source-url': {
														const count = message.parts.filter(p => p.type === 'source-url').length;
														return (
															<>
																<SourcesTrigger count={count} />
																<SourcesContent key={`${message.id}-sources`}>
																	<Source href={part.url} title={part.url} />
																</SourcesContent>
															</>
														);
													}
													default:
														return null;
												}
											})}
										</Sources>
									)}

									<ChatMessage from={message.role}>
										<MessageAvatar name={message.role === 'user' ? 'You' : 'AI'} />
										<MessageContent>
											{message.parts.map((part, i) => {
												switch (part.type) {
													case 'text':
														return (
															<Response key={`${message.id}-${i}`}>{part.text}</Response>
														);
													case 'reasoning':
														return (
															<Reasoning key={`${message.id}-${i}`} className="w-full" isStreaming={status === 'streaming'}>
																<ReasoningTrigger />
																<ReasoningContent>{part.text}</ReasoningContent>
															</Reasoning>
														);
													default:
														return null;
												}
											})}
										</MessageContent>
									</ChatMessage>
								</div>
							))}
							<ConversationScrollButton />
						</ConversationContent>
					</Conversation>
				</div>
			</div>

			<div className="sticky bottom-0 border-t bg-background/80 p-4 backdrop-blur">
				{error && (
					<div className="mb-2 text-sm text-red-600">{String(error.message || error)}</div>
				)}
				<PromptInput
					onSubmit={async (e) => {
						e.preventDefault();
						if (!input.trim()) return;
						let activeThreadId = selectedThreadId;
						if (!activeThreadId) {
							const title = input.slice(0, 60) || 'New chat';
							activeThreadId = await createThread({ title });
							setSelectedThreadId(activeThreadId);
						}
						currentThreadIdRef.current = activeThreadId;
						// Persist user message first
						await appendMessage({ threadId: activeThreadId, role: 'user', content: input });
						sendMessage(
							{ text: input },
							{ body: { model, webSearch } },
						);
						setInput('');
					}}>
					<PromptInputTextarea
						onChange={(e) => setInput(e.target.value)}
						value={input}
						placeholder="Ask anything…"
					/>
					<PromptInputToolbar>
						<PromptInputTools>
							<PromptInputButton
								variant={webSearch ? 'default' : 'ghost'}
								onClick={() => setWebSearch((v) => !v)}
							>
								<GlobeIcon size={16} />
								<span>Search</span>
							</PromptInputButton>
							<PromptInputButton variant="ghost">
								<MicIcon size={16} />
							</PromptInputButton>
							<PromptInputModelSelect
								onValueChange={(value) => setModel(value)}
								value={model}
							>
								<PromptInputModelSelectTrigger>
									<PromptInputModelSelectValue />
								</PromptInputModelSelectTrigger>
								<PromptInputModelSelectContent>
									<PromptInputModelSelectItem value="openai/gpt-4o-mini">GPT-4o Mini</PromptInputModelSelectItem>
									<PromptInputModelSelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</PromptInputModelSelectItem>
									<PromptInputModelSelectItem value="groq/llama-3.3-70b-versatile">Llama 3.3 70B</PromptInputModelSelectItem>
									<PromptInputModelSelectItem value="openai/gpt-oss-20b">GPT-OSS 20B</PromptInputModelSelectItem>
								</PromptInputModelSelectContent>
							</PromptInputModelSelect>
						</PromptInputTools>
						<div className="flex items-center gap-2">
							<PromptInputSubmit status={status} />
						</div>
					</PromptInputToolbar>
				</PromptInput>
			</div>
		</div>
	);
}



