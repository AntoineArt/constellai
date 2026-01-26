export interface AIModel {
  id: string;
  name: string;
  provider: string;
  isDefault?: boolean;
  contextWindow?: number;
  features?: string[];
}

export const AI_MODELS: AIModel[] = [
  // OpenAI GPT OSS
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS-120B",
    provider: "OpenAI",
    isDefault: true,
    contextWindow: 128000,
    features: ["open-source", "large-context", "cost-effective"],
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS-20B",
    provider: "OpenAI",
    contextWindow: 128000,
    features: ["open-source", "fast", "cost-effective"],
  },
  // Claude (Anthropic)
  {
    id: "anthropic/claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "Anthropic",
    contextWindow: 200000,
    features: ["vision", "reasoning", "extended-context"],
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    contextWindow: 200000,
    features: ["vision", "fast", "cost-effective"],
  },
  {
    id: "anthropic/claude-haiku-4",
    name: "Claude Haiku 4",
    provider: "Anthropic",
    contextWindow: 200000,
    features: ["ultra-fast", "cost-effective"],
  },
  // OpenAI GPT
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    provider: "OpenAI",
    contextWindow: 128000,
    features: ["vision", "reasoning", "advanced"],
  },
  {
    id: "openai/gpt-4.5-turbo",
    name: "GPT-4.5 Turbo",
    provider: "OpenAI",
    contextWindow: 128000,
    features: ["vision", "fast"],
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    contextWindow: 128000,
    features: ["vision", "multimodal"],
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    contextWindow: 128000,
    features: ["fast", "cost-effective"],
  },
  // Google Gemini
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    contextWindow: 1000000,
    features: ["vision", "extended-context", "multimodal"],
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    contextWindow: 1000000,
    features: ["ultra-fast", "extended-context"],
  },
  {
    id: "google/gemini-2-flash-thinking",
    name: "Gemini 2 Flash Thinking",
    provider: "Google",
    contextWindow: 32000,
    features: ["reasoning", "fast"],
  },
  // DeepSeek
  {
    id: "deepseek/deepseek-v3",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    contextWindow: 128000,
    features: ["reasoning", "open-weights", "cost-effective"],
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    contextWindow: 64000,
    features: ["reasoning", "mathematical", "open-weights"],
  },
  // Meta Llama
  {
    id: "meta/llama-4-405b",
    name: "Llama 4 405B",
    provider: "Meta",
    contextWindow: 128000,
    features: ["open-weights", "reasoning"],
  },
  {
    id: "meta/llama-4-70b",
    name: "Llama 4 70B",
    provider: "Meta",
    contextWindow: 128000,
    features: ["open-weights", "fast"],
  },
  // xAI Grok
  {
    id: "xai/grok-3",
    name: "Grok 3",
    provider: "xAI",
    contextWindow: 128000,
    features: ["reasoning", "real-time"],
  },
  {
    id: "xai/grok-3-mini",
    name: "Grok 3 Mini",
    provider: "xAI",
    contextWindow: 128000,
    features: ["fast", "cost-effective"],
  },
  // Mistral
  {
    id: "mistral/mistral-large-3",
    name: "Mistral Large 3",
    provider: "Mistral",
    contextWindow: 128000,
    features: ["reasoning", "multilingual"],
  },
  {
    id: "mistral/mistral-medium-3",
    name: "Mistral Medium 3",
    provider: "Mistral",
    contextWindow: 128000,
    features: ["balanced", "cost-effective"],
  },
  {
    id: "mistral/mistral-small-3",
    name: "Mistral Small 3",
    provider: "Mistral",
    contextWindow: 128000,
    features: ["fast", "cost-effective"],
  },
];

export const getDefaultModel = (): AIModel => {
  return AI_MODELS.find((model) => model.isDefault) || AI_MODELS[0];
};

export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find((model) => model.id === id);
};

export const getModelsByProvider = (provider: string): AIModel[] => {
  return AI_MODELS.filter((model) => model.provider === provider);
};

export const getProviders = (): string[] => {
  return Array.from(new Set(AI_MODELS.map((model) => model.provider)));
};

// For backwards compatibility and API routes
export const DEFAULT_MODEL_ID = getDefaultModel().id;

// Common model used in API routes for streaming
export const DEFAULT_API_MODEL = "openai/gpt-oss-120b";
