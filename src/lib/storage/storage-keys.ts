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
  BLOG_POST_GENERATOR: "blog-post-generator",
  PRESS_RELEASE_WRITER: "press-release-writer",
  PRODUCT_DESCRIPTION_WRITER: "product-description-writer",
  RESUME_BUILDER: "resume-builder",
  COVER_LETTER_GENERATOR: "cover-letter-generator",
  GRANT_PROPOSAL_WRITER: "grant-proposal-writer",
  TECHNICAL_DOCUMENTATION_WRITER: "technical-documentation-writer",
  CONTENT_CALENDAR_PLANNER: "content-calendar-planner",
  HEADLINE_GENERATOR: "headline-generator",
  META_DESCRIPTION_GENERATOR: "meta-description-generator",
  NEWSLETTER_CREATOR: "newsletter-creator",
  SCRIPT_WRITER: "script-writer",
  STORY_GENERATOR: "story-generator",
  LOGO_CONCEPT_GENERATOR: "logo-concept-generator",
  COLOR_PALETTE_GENERATOR: "color-palette-generator",
} as const;

export const DEFAULT_PREFERENCES = {
  defaultModel: "openai/gpt-oss-20b",
  theme: "system" as const,
  sidebarCollapsed: false,
  toolSettings: {},
};
