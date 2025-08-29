export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google";
  category: "fast" | "balanced" | "powerful";
  description?: string;
  contextWindow?: number;
  isDefault?: boolean;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS-20B",
    provider: "openai",
    category: "fast",
    description: "Fast and cost-effective model for general tasks",
    contextWindow: 32768,
    isDefault: true,
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    provider: "openai",
    category: "powerful",
    description: "Most capable OpenAI model with excellent reasoning",
    contextWindow: 128000,
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    category: "balanced",
    description: "Smaller, faster version of GPT-4o with good performance",
    contextWindow: 128000,
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    category: "balanced",
    description: "Google's latest multimodal model with fast performance",
    contextWindow: 32768,
  },
];

export const getDefaultModel = (): AIModel => {
  return AI_MODELS.find((model) => model.isDefault) || AI_MODELS[0];
};

export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find((model) => model.id === id);
};

export const getModelsByProvider = (
  provider: AIModel["provider"]
): AIModel[] => {
  return AI_MODELS.filter((model) => model.provider === provider);
};

export const getModelsByCategory = (
  category: AIModel["category"]
): AIModel[] => {
  return AI_MODELS.filter((model) => model.category === category);
};

// For backwards compatibility and API routes
export const DEFAULT_MODEL_ID = getDefaultModel().id;

// Common model used in API routes for streaming
export const DEFAULT_API_MODEL = "openai/gpt-4o";
