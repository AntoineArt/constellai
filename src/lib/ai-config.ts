import { createGateway } from "@ai-sdk/gateway";
import { DEFAULT_API_MODEL, getModelById } from "./models";

export function getApiKeyFromHeaders(headers: Headers): string | null {
  return (
    headers.get("x-api-key") ||
    headers.get("authorization")?.replace("Bearer ", "") ||
    null
  );
}

export function getModelFromRequest(
  body: any,
  toolSpecificDefault?: string
): string {
  // Priority: 1) user selection, 2) tool-specific default, 3) global default
  const requestedModel = body?.model || body?.selectedModel;
  const fallback = toolSpecificDefault || DEFAULT_API_MODEL;

  if (requestedModel && getModelById(requestedModel)) {
    return requestedModel;
  }

  return fallback;
}

export function createGatewayModel(modelId: string, apiKey: string) {
  const gateway = createGateway({
    apiKey,
  });

  return gateway.languageModel(modelId);
}
