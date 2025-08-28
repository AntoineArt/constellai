export const STORAGE_KEYS = {
  API_KEY: "api-key",
  PREFERENCES: "preferences",
} as const;

export const TOOL_IDS = {
  CHAT: "chat",
  REGEX: "regex",
  SUMMARIZER: "summarizer",
  SQL_GENERATOR: "sql-generator",
  API_DOCS_GENERATOR: "api-docs-generator",
  SCHEMA_DESIGNER: "schema-designer",
  ENV_GENERATOR: "env-generator",
  COMPLEXITY_ANALYZER: "complexity-analyzer",
  PERFORMANCE_OPTIMIZER: "performance-optimizer",
  README_GENERATOR: "readme-generator",
  ERROR_DECODER: "error-decoder",
  PR_MESSAGE_WRITER: "pr-message-writer",
  EMAIL_TEMPLATE_GENERATOR: "email-template-generator",
  SOCIAL_MEDIA_POST_GENERATOR: "social-media-post-generator",
  CONTACT_CARD_GENERATOR: "contact-card-generator",
} as const;

export const DEFAULT_PREFERENCES = {
  defaultModel: "openai/gpt-oss-20b",
  theme: "system" as const,
  sidebarCollapsed: false,
  toolSettings: {},
};
