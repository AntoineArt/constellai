### ConstellAI — Product Concept and v0 Spec

#### Vision
Bold, fast web app offering a growing library of AI tools. Users buy credits in USD, consume per usage, with limited mode when out of balance. Designed for developers first, but broadly useful to everyone.

#### v0 Tools
- **Chat**: high‑quality chat per conversation with a fixed model per thread, streaming responses, attachments, full content history, secondary sidebar for conversations, edit‑and‑resend from any user message, Markdown rendering with code blocks and copy.
- **Regex Generator**: natural language → regex (JavaScript/ECMAScript and PCRE) with live tester (sample text, matches/groups), human‑readable explanation, and ready‑to‑copy snippets (JS, Python). Fixed model.

#### Navigation & Layout
- **Primary sidebar (left)**: collapsible to icons‑only with smooth animations; draggable reorder of pinned tools; footer: Library and User dropdown.
- **Secondary sidebar**: positioned to the right of the primary nav, still on the left side of the content. Shows the current tool’s history (Chat → conversation list with search; Regex → recent sessions). The main content area renders the active conversation or tool.

#### Authentication (Clerk, App Router)
- Use `@clerk/nextjs@latest` with App Router.
- Middleware must use `clerkMiddleware()` from `@clerk/nextjs/server`.
- Wrap the app with `<ClerkProvider>` in `app/layout.tsx`.
- Provide `<SignedIn>`, `<SignedOut>`, `<UserButton>` in the header or layout.

```ts
// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server"

export default clerkMiddleware()

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
```

```tsx
// app/layout.tsx
import type { Metadata } from "next"
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

export const metadata: Metadata = {
  title: "ConstellAI",
  description: "Bold library of AI tools",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="flex items-center justify-between px-6 py-3 border-b">
            <div className="font-bold">ConstellAI</div>
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton />
                <SignUpButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
```

#### AI & Components
- **Vercel AI SDK + Gateway** for model access and usage telemetry.
- **AI Elements** (built on shadcn/ui) to accelerate chat UIs: Conversation, Message, PromptInput, Loader, etc. See AI Elements overview: [AI Elements docs](https://ai-sdk.dev/elements/overview).
- **Streaming** support with a Stop button.
- **Rendering**: Markdown with syntax highlighting and copy buttons.

#### Model Availability
- **Whitelist (v0)**: `gpt-oss-120b`, `gpt-oss-20b`, Claude 4 Sonnet, Gemini 2.5 Pro, Gemini 2.5 Flash. Use the Gateway canonical IDs in code.
- **Limited mode**: only `gpt-oss-20b`.

#### Attachments
- **Storage**: UploadThing.
- **Limits**: up to 3 attachments/message, max 10 MB each.
- **Types**: PDF, DOCX, TXT/MD, CSV, URLs, images.
- **Parsing**: pass files/URLs directly to multimodal models; no server‑side text extraction in v0.

#### History & Logging
- **User‑facing history**: full content for each tool (inputs, outputs, settings, attachments). Indefinite retention by default. Users can delete their own sessions; applies to all future tools as well.
- **Internal usage log** (immutable, no content): model ID, token counts, applied rate version, cost (micro‑USD), gateway request IDs, timestamps, status. Source of truth for credits and audits; never deletable by users.
- **Linkage**: each user history record references its billing usage event ID for reconciliation.

#### Credits, Pricing, and Billing
- **Currency**: USD tracked in micro‑USD (1 USD = 1_000_000 micros). All math done with `BigInt`.
- **Margin**: 5% added to provider cost at usage time.
- **Welcome**: $5 one‑time per new user.
- **Referrals**: $10 for inviter and $10 for invitee, triggered only after the invitee purchases ≥ $20 prepaid credits.
- **Limited mode**: when balance ≤ 0, allow daily budget of $0.50, only `gpt-oss-20b` and selected tools (Chat, Regex).
- **Prepaid**: credit top‑ups via Polar products; debited immediately after each usage.
- **Auto‑recharge (prepaid)**: optional Polar subscription that adds a fixed $20/month of credits, capped to $50/month.
- **Postpaid**: opt‑in; rolling 30‑day cycle. At cycle end, auto‑charge outstanding usage via Polar. Prepaid is consumed first; no postpaid cap. Dunning on failure; restrict to limited mode until resolved.
- **Progress bar (user dropdown)**: shows used since last payment, date of last payment (most recent successful transaction), and remaining prepaid credits.

#### Pricing Source & Sync
- **Rates storage**: versioned tables in Convex; per‑model input/output rates in micro‑USD per 1,000,000 tokens.
- **Canonical source**: `gateway.getAvailableModels()`; daily scheduled sync to detect changes and write a new version. Manual overrides are supported and preserved.
- **Billing stamp**: each usage event stores the applied rate version and margin ppm.

#### Cost Computation (rules)
- Compute input and output separately using ceiling rounding to avoid under‑charging:
  - input_micro = ceil(prompt_tokens × input_rate_per_million / 1,000,000)
  - output_micro = ceil(completion_tokens × output_rate_per_million / 1,000,000)
- base = input_micro + output_micro
- margin_micro = ceil(base × margin_ppm / 1,000,000)
- total_micro = base + margin_micro

#### Data Model (Convex, key tables)
- `users`: clerk_user_id, email, referral_code, referred_by_code, created_at
- `wallets`: user_id, usd_micro_balance, updated_at
- `creditTransactions`: user_id, amount_usd_micro (+/−), source ("purchase" | "usage" | "welcome" | "referral" | "autorecharge" | "postpaid" | "adjustment"), ref_id, created_at
- `usageEvents` (immutable): user_id, tool_slug, model_id, prompt_tokens, completion_tokens, usd_micro_cost, usd_micro_margin, gateway_request_id, rate_version, status, created_at
- `toolExecutions` (user history): user_id, tool_slug, model_id, input, attachments, output, settings, duration_ms, usage_event_id, created_at, deleted_at?
- `tools`: slug, name, category, tags, is_active, default_model_id, free_mode_enabled, free_mode_models
- `toolPins`: user_id, tool_slug, position
- `limits`: user_id, free_mode_daily_usd_micro_quota, free_mode_used_today_usd_micro, rollup_date
- `modelRates`: model_id, provider, input_per_million_usd_micro, output_per_million_usd_micro, version, effective_from, is_active
- `modelRateHistory`: snapshot per change with changed_at, changed_by
- `postpaidCycles`: user_id, window_start, window_end, usd_micro_charges, status
- `referrals`: code, owner_user_id, uses_count, created_at
- `grants`: user_id, type ("welcome" | "referral_self" | "referral_friend"), usd_micro, created_at

#### Tool Details
- **Chat**
  - Per‑conversation model selection from whitelist.
  - Streaming with Stop.
  - Attachments (3 × 10 MB; PDF/DOCX/TXT/MD/CSV/URLs/images), passed directly to model.
  - Auto‑title from first exchange; rename; edit‑and‑resend from any past user message.
  - Secondary sidebar lists conversations with search; click to open.
  - Markdown rendering with code blocks and copy buttons.
- **Regex Generator**
  - Fixed model: `gpt-oss-20b`.
  - Output patterns for JavaScript (ECMAScript) and PCRE.
  - Live tester: paste sample text to see matches/groups/highlights in real time.
  - Explanation and ready‑to‑copy code snippets (JS, Python).
  - Sessions appear in the secondary sidebar (recent runs), full content stored.

#### Theming & Styling
- **Tailwind v4 + shadcn/ui** with components and tokens centralized in a single theme file (e.g., `app/tweakcn.css`) to swap the entire theme easily.
- **Light‑first**, theme toggle (light/system/dark) inside the user dropdown.
- Icons via `react-icons` (prefer `/fa6` or `/md`, size 20).

#### Payments (Polar) — Flows
- **Prepaid purchase**: user completes a Polar checkout; webhook `paid` increases `wallets.usd_micro_balance` and writes a `creditTransactions` record.
- **Auto‑recharge**: Polar subscription renews monthly for $20, capped to $50/month net additions; webhook `paid` credits wallet and records transaction.
- **Postpaid cycle close**: every rolling 30 days, compute outstanding usage; create and capture a one‑off Polar payment; on success, mark cycle paid; on failure, retry per dunning schedule and restrict to limited mode until settled.

#### Observability & Integrity
- Internal usage log is the source of truth; no content stored there.
- Optional analytics later (Axiom). Nightly reconciliation against Gateway stats.

#### Open Source (mid‑term)
- Target license: AGPL‑3.0 or dual license later.
- Clean separation between tool UI, billing core, and provider adapters. Provide mock adapters for self‑hosting.
- Docs: Quickstart, Tool authoring guide, Billing accuracy, Privacy and retention.

#### Milestones
- M1: Auth + shell (sidebars, theme), model whitelist guardrails, UploadThing wiring.
- M2: Chat end‑to‑end (streaming, attachments, history) + internal usage logs + credit debit.
- M3: Regex Generator with tester; fixed model; history.
- M4: Polar prepaid + welcome/referrals + limited mode enforcement.
- M5: Postpaid cycles + auto‑recharge; dunning; progress bar metrics (used since last payment, last payment date, remaining credits).
- M6: Daily model rate sync via `gateway.getAvailableModels()` with versioned storage.

#### Notes
- Use pnpm. Prefer server components; keep client islands minimal; avoid unnecessary effects. Use `import type` for types; prefer `for of` over `forEach`. Strings use ".


