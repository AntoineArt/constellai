import { MessageSquare, Zap, FileText } from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: typeof MessageSquare;
  category: string;
  href: string;
}

export const tools: Tool[] = [
  {
    id: "chat",
    name: "AI Chat",
    description:
      "Have conversations with AI models. Support for attachments and streaming responses.",
    icon: MessageSquare,
    category: "Conversation",
    href: "/tools/chat",
  },
  {
    id: "regex",
    name: "Regex Generator",
    description:
      "Generate regular expressions from natural language with live testing and explanations.",
    icon: Zap,
    category: "Development",
    href: "/tools/regex",
  },
  {
    id: "summarizer",
    name: "Text Summarizer",
    description: "Summarize long texts and documents using advanced AI models.",
    icon: FileText,
    category: "Text Processing",
    href: "/tools/summarizer",
  },
];
