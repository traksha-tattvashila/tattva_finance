---
name: Tattva Finance Brand Tokens
description: Locked brand colors, typography, and CSS variable mapping for Tattva Finance
---

## Brand Colors (hex → CSS HSL)

| Token        | Hex       | CSS HSL          |
|--------------|-----------|------------------|
| Primary      | #5B21B6   | 263 69% 42%      |
| Primary Dark | #4C1D95   | 263 68% 35%      |
| Accent Gold  | #D4A017   | 44 79% 47%       |
| Success      | #10B981   | 161 94% 40%      |
| Warning      | #F59E0B   | 38 92% 50%       |
| Danger       | #EF4444   | 0 84% 60%        |
| Background   | #F8F7FC   | 252 67% 98%      |
| Dark BG      | #0F0B1A   | 256 42% 7%       |
| Text         | #1E1B4B   | 244 46% 20%      |

## Typography

- Body: Inter (Google Fonts, already loaded)
- Headings: Playfair Display (Google Fonts link added to index.html)
- Applied via `@layer base { h1, h2, .font-display { font-family: 'Playfair Display', Georgia, serif; } }`

## Dark mode primary

In dark mode, primary is lightened to `263 70% 62%` for accessibility against the dark background.

**Why:** The locked #5B21B6 would have insufficient contrast against #0F0B1A.

**How to apply:** Update `--primary` in `.dark {}` block in index.css; light mode keeps 263 69% 42%.
