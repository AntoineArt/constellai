export interface AIModel {
  id: string;
  name: string;
  isDefault?: boolean;
}

export const AI_MODELS: AIModel[] = [
  // OpenAI
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS-120B",
    isDefault: true,
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
  },
  // Anthropic
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
  },
  {
    id: "anthropic/claude-opus-4.6",
    name: "Claude Opus 4.6",
  },
  // Google
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
  },
  // Meta
  {
    id: "meta/llama-4-scout",
    name: "Llama 4 Scout",
  },
  {
    id: "meta/llama-4-maverick",
    name: "Llama 4 Maverick",
  },
  // Mistral
  {
    id: "mistral/mistral-small",
    name: "Mistral Small",
  },
  {
    id: "mistral/mistral-large-3",
    name: "Mistral Large 3",
  },
  // DeepSeek
  {
    id: "deepseek/deepseek-v3.2",
    name: "DeepSeek V3.2",
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
  },
];

export const getDefaultModel = (): AIModel => {
  return AI_MODELS.find((model) => model.isDefault) || AI_MODELS[0];
};

export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find((model) => model.id === id);
};

// For backwards compatibility and API routes
export const DEFAULT_MODEL_ID = getDefaultModel().id;

// Common model used in API routes for streaming
export const DEFAULT_API_MODEL = "openai/gpt-oss-120b";
