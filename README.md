# Kaylee — Study & Scrapbook

A cozy study app with Pomodoro timers (and points), notes, AI summaries, auto flashcards, planner, and a **digital scrapbook** on every page: upload PNGs and rearrange them on a grid-paper style canvas.

## Stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**
- **Shadcn-style UI** (Radix primitives + CVA + Tailwind)
- **Local storage** for MVP; repository interface ready for future auth + DB

## Features

- **Dashboard**: Today’s focus minutes, points, upcoming tasks, quick links
- **Pomodoro**: Focus/break timer with configurable length; completed sessions earn points and persist
- **Notes & AI**: Create and edit notes; AI summarize and generate flashcards (API routes ready to wire)
- **Flashcards**: Review cards with simple Again / Good / Easy; list from notes or manual add
- **Planner**: Add tasks by date, mark done; list grouped by day
- **Scrapbook**: On every main page, add PNG/images and drag to rearrange; positions saved per page

## Design

- Cozy, scrapbook-style theme: cream paper, grid background, sage/clover accents
- Handwritten-style font for headings (Caveat), DM Sans for body
- Cards use a subtle “washi tape” border

## Getting started

1. **Install**
   ```bash
   pnpm install
   ```

2. **Run**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

3. **Build**
   ```bash
   pnpm build
   pnpm start
   ```

## Project layout

- `app/` — App Router pages (dashboard, pomodoro, notes, flashcards, planner)
- `components/` — UI: `app-shell`, `scrapbook/`, `dashboard/`, `pomodoro/`, `notes/`, `flashcards/`, `planner/`, `ui/`
- `lib/` — `domain.ts` (types), `repositories.ts` (interface), `storage-local.ts` (localStorage impl), `utils.ts`

The previous static site files are in `legacy/`.
