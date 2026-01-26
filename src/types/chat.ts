export interface MessagePart {
  type: string;
  text?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts?: MessagePart[];
  content?: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: number;
  }>;
  model: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}
