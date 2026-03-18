# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- `pnpm dev` - Start Next.js development server with Turbopack
- `pnpm build` - Build for production (also runs TypeScript check)
- `pnpm lint` - Run Biome linter
- `pnpm format` - Format code with Biome
- `pnpm check` - Run both linter and formatter checks
- `npx tsc --noEmit` - Type-check without building

Never run servers — the user handles all server processes.

## Architecture Overview

### Tech Stack
- **Next.js 16** with App Router and Turbopack
- **Tailwind CSS v4** with Geist fonts
- **Biome** for linting and formatting (2-space indent, double quotes, ES5 trailing commas, 80 char line width)
- **TypeScript** strict mode (`noExplicitAny` disabled in Biome, but avoid it)
- **Vercel AI SDK v6** with `@ai-sdk/gateway` for multi-model access
- **shadcn/ui** + Radix UI for components (`src/components/ui/`)
- **AI Elements** (`src/components/ai-elements/`) for all chat/AI UI — never build custom AI UI components

### How a Tool Works (end-to-end)

Each of the 80+ tools follows a strict three-part pattern:

1. **API route** at `src/app/api/[tool-name]/route.ts` — POST handler that streams AI responses
2. **Page** at `src/app/tools/[tool-name]/page.tsx` — React client component
3. **Registry entry** in `src/lib/tools.ts` — metadata (id, name, description, icon, category, href)

The page uses `useToolHistory(toolId)` to auto-save every interaction to localStorage, and renders a secondary sidebar with execution history via `<ToolHistorySidebar>`.

### AI Configuration (`src/lib/ai-config.ts`)

All API routes use two shared utilities:

- **`getApiKeyFromHeaders(headers)`** — checks `x-api-key` then `authorization: Bearer ...`; returns `null` if absent
- **`getModelFromRequest(body, fallback?)`** — resolves model from `body.model` or `body.selectedModel`, validates via `getModelById()`, falls back to `DEFAULT_API_MODEL`

API key is injected into `process.env.AI_GATEWAY_API_KEY` at request time — it comes from the user's browser, not a server env var.

### Models (`src/lib/models.ts`)

14 models across OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek. Default is `openai/gpt-oss-120b`. `DEFAULT_API_MODEL` is used as the fallback in all API routes.

### Client-Side Storage (`src/lib/storage/`)

All user data lives in localStorage — no backend database. Key hooks exported from `src/lib/storage/`:

- **`useToolHistory(toolId)`** — `executions`, `activeExecution`, `updateCurrentExecution({inputs?, outputs?, settings?})`, `clearActiveExecution()`, `loadExecution(id)`, `deleteExecution(id)`
- **`usePreferences()`** — `preferences` (defaultModel, theme, sidebarCollapsed, toolSettings), `updatePreferences(updates)`, `isLoaded`
- **`usePinnedTools()`** — pinned tools state for the primary sidebar

```typescript
interface ToolExecution {
  id: string;
  toolId: string;
  timestamp: number;
  title: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  settings: Record<string, any>;
}
```

### Layout

Root layout (`src/app/layout.tsx`) wraps everything in `<Providers>` → `<SidebarProvider>` → `<AppSidebar>` + `<SidebarInset>`. The primary sidebar is collapsible; each tool page renders its own secondary history sidebar.

## Adding a New AI Tool

1. **API route** `src/app/api/[tool-name]/route.ts`:

```typescript
import { streamText } from "ai";
import { getApiKeyFromHeaders, getModelFromRequest } from "@/lib/ai-config";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const apiKey = getApiKeyFromHeaders(new Headers(req.headers));
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key is required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    process.env.AI_GATEWAY_API_KEY = apiKey;
    const body = await req.json();
    const model = getModelFromRequest(body);
    const result = streamText({ model, messages: body.messages });
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

2. **Page** `src/app/tools/[tool-name]/page.tsx` — use `useToolHistory`, auto-save inputs on change and outputs after streaming, include TopBar "New" button via `clearActiveExecution()`, render `<ToolHistorySidebar>`.

3. **Register** in `src/lib/tools.ts`.

### Streaming Considerations
- Prevent auto-save during streaming (`status === "streaming"`) to avoid race conditions
- Handle `AbortError` silently — don't show error UI for user-initiated cancellations
- Save final state after streaming completes
