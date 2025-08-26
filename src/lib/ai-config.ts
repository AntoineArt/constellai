export function getApiKeyFromHeaders(headers: Headers): string | null {
  return (
    headers.get("x-api-key") ||
    headers.get("authorization")?.replace("Bearer ", "") ||
    null
  );
}
