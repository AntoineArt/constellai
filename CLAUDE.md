# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Package Management
- `pnpm install` - Install dependencies
- `pnpm dev` - Start Next.js development server with Turbopack
- `pnpm build` - Build application for production with Turbopack
- `pnpm start` - Start production server

### Code Quality
- `pnpm format` - Format code with Biome
- `pnpm lint` - Run Biome linter
- `pnpm check` - Run both linter and formatter checks

### Convex Backend
- `pnpm convex:dev` - Start Convex development mode (run in separate terminal)
- `pnpm convex:deploy` - Deploy Convex functions to production

## Architecture Overview

### Tech Stack
- **Next.js 15** with App Router and Turbopack
- **Convex** for backend-as-a-service with real-time database
- **Tailwind CSS v4** for styling
- **Biome** for linting and formatting
- **TypeScript** with strict configuration
- **Vercel AI SDK** with Gateway for AI model access
- **shadcn/ui** with Radix UI primitives for components
- **AI Elements** for chat UI components

### Project Structure
- `src/app/` - Next.js App Router pages and layouts
  - `api/` - API routes for 80+ AI tools (chat, regex, content generation, analysis, etc.)
  - `tools/` - Tool-specific pages matching API routes
- `src/components/` - React components
  - `ai-elements/` - AI-specific components (conversation, message, etc.)
  - `ui/` - shadcn/ui component library
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and configurations
  - `storage/` - Client-side localStorage utilities
  - `tools.ts` - Tool registry with metadata and icons
- `convex/` - Convex backend functions and schema
- `docs/` - Product specifications and concepts
- Root contains config files (biome.json, tsconfig.json, etc.)

### Convex Backend Architecture
- **Schema**: Defined in `convex/schema.ts` using `defineSchema` and `defineTable`
- **Functions**: Use new Convex syntax with explicit args/returns validation
- **Types**: Auto-generated in `convex/_generated/` - never edit manually
- **Pattern**: Export `query` and `mutation` functions with proper validation

Example Convex function pattern:
```typescript
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      createdAt: Date.now(),
    });
  },
});
```

### Frontend Architecture
- **Providers**: Convex client wrapped in `src/app/providers.tsx`
- **Layout**: Root layout includes font loading and provider wrapping with sidebar
- **Styling**: Tailwind utilities with Geist fonts (sans and mono variants)
- **Client Components**: Use "use client" directive when needed for Convex hooks
- **Sidebar Navigation**: Uses shadcn/ui sidebar with collapsible primary navigation
- **AI Integration**: API routes handle AI model requests with API key authentication
- **Client-Side Storage**: Unified localStorage system for all user data and tool history

### Client-Side Storage Architecture
All user data is stored client-side using localStorage with plans for future database sync:

- **Storage Location**: `src/lib/storage/` - centralized storage utilities
- **Universal Tool Pattern**: All tools (chat, regex, summarizer, etc.) follow the same storage pattern
- **Tool Executions**: Each tool interaction is stored as a `ToolExecution` with inputs, outputs, and metadata
- **Tool History**: Every tool has a secondary sidebar showing execution history
- **Preferences**: User settings, default models, and tool-specific configurations
- **Auto-Save**: Tool state is automatically saved as users interact

#### Storage Structure
```typescript
interface ToolExecution {
  id: string;
  toolId: string; 
  timestamp: number;
  title: string; // Auto-generated or user-set
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  settings: Record<string, any>;
}
```

#### Key Components
- `useToolHistory(toolId)` - Hook for managing tool executions and history
- `usePreferences()` - Hook for user preferences and settings  
- Secondary sidebar component for each tool showing execution history
- "New" button in TopBar to start fresh tool sessions

### Product Vision (from docs/concept.md)
ConstellAI is designed as a bold, fast web app offering AI tools with credit-based usage. Key features:
- **Authentication**: Clerk integration with App Router (planned)
- **AI Tools**: 80+ specialized tools including chat, regex, content generation, analysis, and productivity tools
- **Navigation**: Primary sidebar (left) with secondary sidebar for tool history
- **Billing**: Credit system with prepaid/postpaid options via Polar (planned)
- **Attachments**: UploadThing integration for file uploads (planned)

## Development Guidelines

### Convex Development
- Always update `convex/schema.ts` when adding new tables
- Use proper validation with `v` validators for all function args and returns
- Index frequently queried fields in schema definitions
- Functions auto-generate TypeScript types - import from `convex/_generated/api`

### Code Standards
- Follow existing Biome configuration (2-space indentation, double quotes, trailing commas, semicolons)
- Use `import type` for type-only imports
- Prefer server components over client components when possible
- `noExplicitAny` is disabled but avoid `any` type when possible (explicitly disabled in Biome config and enforced in project rules)
- Use `const` over `let` (enforced by Biome)
- Use `for of` loops over `forEach` where possible
- Strings use double quotes consistently with ES5 trailing commas
- Line width limit: 80 characters
- Maintain consistent error handling in API routes with proper status codes
- Use `// biome-ignore` comments when dependency warnings are incorrect but necessary
- All unused variables throw errors
- Follow React 19 patterns with proper error boundaries and suspense
- **AI UI Components**: Always use AI Elements from `src/components/ai-elements/` for chat interfaces, messages, conversations, and AI-related UI - never build custom AI UI components

### Environment Setup
- Convex requires `NEXT_PUBLIC_CONVEX_URL` environment variable
- Run `npx convex dev --once --configure=new` if env setup needed
- Development requires both `pnpm dev` and `pnpm convex:dev` running concurrently (user runs these)
- AI integration requires API keys passed via headers (`x-api-key` or `authorization` with Bearer token)
- Never run servers - user handles all server processes

## File Patterns

### Adding New Convex Functions
1. Create/edit file in `convex/` directory
2. Export functions using new Convex syntax with validation
3. Update `convex/schema.ts` if new tables needed
4. Import and use in React components with `useQuery`/`useMutation`

### Adding New Pages
1. Create files in `src/app/` following App Router conventions
2. Use TypeScript and proper metadata exports
3. Wrap client-side Convex usage in "use client" components
4. Follow existing layout and styling patterns

### Adding New AI Tools
1. Create API route in `src/app/api/[tool-name]/route.ts`
2. Implement POST handler with proper API key validation using `getApiKeyFromHeaders`
3. Use Vercel AI SDK for model integration
4. Add tool page in `src/app/tools/[tool-name]/page.tsx`
5. Integrate `useToolHistory(toolId)` hook for execution storage and history
6. Add tool to `src/lib/tools.ts` registry
7. Follow existing patterns for error handling and streaming responses

### Universal Tool Implementation Pattern
Every tool should follow this consistent pattern:

1. **Use storage hooks**:
   ```typescript
   const toolHistory = useToolHistory("tool-name");
   const { preferences } = usePreferences();
   ```

2. **TopBar integration**:
   - Include "New" button to start fresh (`toolHistory.clearActiveExecution()`)
   - Support model selection with default from preferences
   
3. **Auto-save inputs/outputs**:
   ```typescript
   // Save as user types
   toolHistory.updateCurrentExecution({ 
     inputs: { userInput: value } 
   });
   
   // Save results after API call
   toolHistory.updateCurrentExecution({ 
     outputs: { result: apiResponse } 
   });
   ```

4. **Secondary sidebar**: Show tool execution history with ability to switch between executions

5. **Streaming considerations**:
   - Prevent auto-save during streaming (`status === "streaming"`) to avoid race conditions
   - Save final conversation state after streaming completes
   - Handle AbortError gracefully without showing error messages to users
   - Use proper cleanup in AbortController for cancelled requests

### Tool Registry
- All tools are registered in `src/lib/tools.ts` with metadata (id, name, description, icon, category, href)
- Tools are organized by categories: General, Development, Text Processing, Communication, Marketing, etc.
- Each tool has a consistent URL pattern: `/tools/[tool-name]/page.tsx`

### API Route Pattern
```typescript
import { streamText } from "ai";
import { getApiKeyFromHeaders } from "@/lib/ai-config";

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
    // Handle request logic here
  } catch (error) {
    // Consistent error handling
  }
}
```