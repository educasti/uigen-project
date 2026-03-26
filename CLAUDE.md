# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup       # First-time setup: install deps + Prisma generate + migrate
npm run dev         # Start dev server (Turbopack) at http://localhost:3000
npm run build       # Production build
npm run lint        # ESLint
npm run test        # Run all Vitest tests
npm run db:reset    # Reset SQLite database
```

To run a single test file:
```bash
npx vitest run src/path/to/__tests__/file.test.tsx
```

## Environment

Copy `.env.example` to `.env` and optionally add `ANTHROPIC_API_KEY`. Without it, the app uses a `MockLanguageModel` that returns static demo components (`src/lib/provider.ts`).

## Architecture

UIGen is a Next.js 15 app (App Router) where Claude generates React components into an **in-memory virtual file system**, which are then transpiled with Babel and rendered in an iframe.

### Request Flow

1. User sends a chat message → `POST /api/chat` (`src/app/api/chat/route.ts`)
2. Route calls Claude via Vercel AI SDK with two tools: `str_replace_editor` (view/create/edit files) and `file_manager` (delete/rename)
3. Claude invokes tools to write files into the **VirtualFileSystem** (`src/lib/file-system.ts`)
4. Tool results are surfaced to the frontend via streaming; `FileSystemContext` applies them
5. `PreviewFrame` picks up file changes, transpiles via `jsx-transformer.ts` (Babel standalone), and renders in an iframe using ESM import maps (dependencies load from `esm.sh`)

### Key Abstractions

| File | Role |
|------|------|
| `src/lib/file-system.ts` | In-memory VFS: create/update/delete/replace in files |
| `src/lib/contexts/file-system-context.tsx` | React context wrapping VFS; applies AI tool calls |
| `src/lib/contexts/chat-context.tsx` | Wraps Vercel AI SDK `useChat`; wires tool execution to FileSystemContext |
| `src/lib/transform/jsx-transformer.ts` | Babel-based JSX→ESM transpiler + import map builder |
| `src/components/preview/PreviewFrame.tsx` | Iframe renderer; reacts to VFS changes |
| `src/lib/provider.ts` | Returns real Anthropic model or MockLanguageModel depending on env |
| `src/lib/prompts/generation.tsx` | System prompt: Claude always writes to `/App.jsx`, uses `@/` imports, Tailwind CSS |
| `src/lib/tools/` | Tool definitions passed to Claude (`str_replace_editor`, `file_manager`) |
| `src/lib/auth.ts` | JWT sessions via `jose`; stored in httpOnly cookies |
| `src/actions/` | Next.js server actions for auth and project CRUD |
| `prisma/schema.prisma` | SQLite schema: `User`, `Project` (projects store serialized VFS snapshots) |

### Project persistence

Authenticated users' projects are saved to SQLite via Prisma. The full VFS state is serialized and stored on the `Project` model. Guest sessions use only local state.

The database schema is defined in `prisma/schema.prisma` — reference it whenever you need to understand the structure of data stored in the database.

### Component & style conventions

- UI primitives live in `src/components/ui/` (Shadcn/Radix)
- Tailwind CSS v4 — no `tailwind.config.js`; config is in CSS via `@theme`
- Import alias `@/` maps to `src/`
- Generated components should always have `/App.jsx` as the entry point
