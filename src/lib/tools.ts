import { MessageSquare } from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  href: string;
}

export const tools: Tool[] = [
  {
    id: "chat",
    name: "AI Chat",
    description: "Chat with AI models for general assistance and conversation.",
    icon: MessageSquare,
    category: "General",
    href: "/tools/chat",
  },
];
