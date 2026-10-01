# Vision Ritual

**The vision board that makes you plan.**

Not another collage maker. Vision Ritual is built on WOOP research (Wish → Outcome → Obstacle → if-then Plan): you set a goal, the board generates itself, and a 30-second daily ritual — check in on your plan, keep the streak, note one gratitude — keeps it alive. Weekly reviews and quarterly resets keep it honest.

Built for students & placements: internships, first jobs, GATE/CAT, exams — plus general life areas.

## Screens

- **Onboarding Q&A** — "Where do you want to be in 12 months?" → goals, life-area suggestions, affirmations → generated board
- **Today** — daily action check-in, streaks, gratitude prompt (~30 seconds)
- **Goals** — full WOOP editor: wish, outcome, obstacle, if-then plan, deadlines, milestones, progress
- **Board** — generated living collage (no canvas editing); tiles show progress rings and launch wallpaper mode
- **Wallpaper** — 1080×1920 lock-screen PNG export, all-goals or single-goal focus
- **Review** — weekly review (plan followed? blockers? progress), quarterly board reset, archive history, "came true" tracking

## Tech

Vite + React + TypeScript. No canvas library, no backend. All data in `localStorage` (`vision-ritual.v1`) with JSON backup export/import.

## Run it

```bash
npm install
npm run dev
```
