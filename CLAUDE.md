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

### Project Structure
- `src/app/` - Next.js App Router pages and layouts
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
- **Layout**: Root layout includes font loading and provider wrapping
- **Styling**: Tailwind utilities with Geist fonts (sans and mono variants)
- **Client Components**: Use "use client" directive when needed for Convex hooks

### Product Vision (from docs/concept.md)
ConstellAI is designed as a bold, fast web app offering AI tools with credit-based usage. Key features planned:
- **Authentication**: Clerk integration with App Router
- **AI Tools**: Chat and Regex Generator initially
- **Navigation**: Primary sidebar (left) with secondary sidebar for tool history
- **Billing**: Credit system with prepaid/postpaid options via Polar
- **Attachments**: UploadThing integration for file uploads

## Development Guidelines

### Convex Development
- Always update `convex/schema.ts` when adding new tables
- Use proper validation with `v` validators for all function args and returns
- Index frequently queried fields in schema definitions
- Functions auto-generate TypeScript types - import from `convex/_generated/api`

### Code Standards
- Follow existing Biome configuration (2-space indentation, double quotes, trailing commas)
- Use `import type` for type-only imports
- Prefer server components over client components when possible
- Never use `any` type (explicitly disabled in Biome config)

### Environment Setup
- Convex requires `NEXT_PUBLIC_CONVEX_URL` environment variable
- Run `npx convex dev --once --configure=new` if env setup needed
- Development requires both `pnpm dev` and `pnpm convex:dev` running

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