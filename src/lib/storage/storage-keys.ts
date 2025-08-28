export const STORAGE_KEYS = {
  API_KEY: "constellai-api-key",
  USER_DATA: "constellai-user-data",
  PREFERENCES: "constellai-preferences",
  TOOL_EXECUTIONS: "constellai-tool-executions",
  ACTIVE_EXECUTIONS: "constellai-active-executions",
  PINNED_TOOLS: "constellai-pinned-tools",
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
} as const;

export const DEFAULT_PREFERENCES = {
  defaultModel: "openai/gpt-oss-20b",
  theme: "system" as const,
  sidebarCollapsed: false,
  toolSettings: {},
};
