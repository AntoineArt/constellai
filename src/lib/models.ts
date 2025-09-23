export interface AIModel {
  id: string;
  name: string;
  isDefault?: boolean;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS-20B",
    isDefault: true,
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS-120B",
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
  },
  },
  {
    id: "mistral/mistral-small",
    name: "Mistral small",
  },
  {
    id: "mistral/mistral-medium",
    name: "Mistral medium",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
  },
  {
    id: "deepseek/deepseek-v3.1",
    name: "DeepSeek V3.1",
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
export const DEFAULT_API_MODEL = "openai/gpt-4o";
