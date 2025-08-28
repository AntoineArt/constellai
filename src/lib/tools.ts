import { MessageSquare, Zap, FileText, Database, FileCode, Table, Settings, BarChart3 } from "lucide-react";

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
  {
    id: "sql-generator",
    name: "SQL Query Generator",
    description: "Generate SQL queries from natural language with optimization suggestions.",
    icon: Database,
    category: "Development",
    href: "/tools/sql-generator",
  },
  {
    id: "api-docs-generator",
    name: "API Documentation Generator",
    description: "Generate OpenAPI/Swagger docs from code or descriptions.",
    icon: FileCode,
    category: "Development",
    href: "/tools/api-docs-generator",
  },
  {
    id: "schema-designer",
    name: "Database Schema Designer",
    description: "Create database schemas from requirements with relationships and indexes.",
    icon: Table,
    category: "Development",
    href: "/tools/schema-designer",
  },
  {
    id: "env-generator",
    name: "Environment Config Generator",
    description: "Create .env templates with documentation and validation rules.",
    icon: Settings,
    category: "Development",
    href: "/tools/env-generator",
  },
  {
    id: "complexity-analyzer",
    name: "Code Complexity Analyzer",
    description: "Analyze and suggest code simplifications with complexity metrics.",
    icon: BarChart3,
    category: "Development",
    href: "/tools/complexity-analyzer",
  },
];
