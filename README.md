# ConstellAI

A modern web application built with Next.js 15, Tailwind CSS v4, Biome, and Convex.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Tailwind CSS v4** - Utility-first CSS framework
- **Biome** - Fast linter and formatter
- **Convex** - Backend-as-a-Service with real-time database
- **TypeScript** - Type-safe JavaScript
- **pnpm** - Fast, disk space efficient package manager

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd constellai
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
The Convex setup should have created a `.env.local` file with the necessary environment variables. If not, you'll need to run:
```bash
npx convex dev --once --configure=new
```

4. Start the development server:
```bash
pnpm dev
```

5. In another terminal, start Convex development mode:
```bash
pnpm convex:dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run Biome linter
- `pnpm format` - Format code with Biome
- `pnpm check` - Run Biome check (lint + format)
- `pnpm convex:dev` - Start Convex development mode
- `pnpm convex:deploy` - Deploy Convex functions

## Project Structure

```
constellai/
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout with providers
│       ├── page.tsx        # Home page with Convex integration
│       ├── providers.tsx   # Convex provider setup
│       └── globals.css     # Global styles
├── convex/
│   ├── schema.ts          # Database schema
│   ├── users.ts           # User management functions
│   └── _generated/        # Auto-generated Convex types
├── public/                # Static assets
├── biome.json            # Biome configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Features

- **Real-time Database**: Convex provides real-time updates and automatic caching
- **Type Safety**: Full TypeScript support with generated types
- **Modern Styling**: Tailwind CSS v4 with utility-first approach
- **Code Quality**: Biome for linting and formatting
- **Fast Development**: Next.js 15 with Turbopack for rapid development

## Development

### Adding New Convex Functions

1. Create a new file in the `convex/` directory (e.g., `convex/posts.ts`)
2. Export your functions using the new Convex syntax:

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});
```

3. Update your schema in `convex/schema.ts` if needed
4. Use the functions in your React components with `useQuery` and `useMutation`

### Styling

This project uses Tailwind CSS v4. You can:

- Use utility classes directly in your JSX
- Create custom components with Tailwind classes
- Use the new `@apply` directive in CSS files

### Code Quality

Biome is configured for:
- Linting with recommended rules
- Code formatting with consistent style
- Import organization
- TypeScript support

Run `pnpm check` to ensure code quality before committing.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables from your `.env.local` file
4. Deploy!

### Convex Deployment

Deploy your Convex functions to production:

```bash
pnpm convex:deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm check` to ensure code quality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
