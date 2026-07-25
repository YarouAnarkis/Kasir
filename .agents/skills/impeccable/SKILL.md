---
name: impeccable
description: Impeccable frontend design skills, anti-slop rules, and visual quality guidelines to prevent generic AI UI patterns and build high-craft, professional web interfaces.
---

# Impeccable: Anti-Slop & High-Craft Frontend Design System

Use this skill to strip generic AI "slop" from interfaces, enforce precise typography and layout hierarchy, and elevate web applications to human-crafted, premium quality.

---

## 🚫 The 64 Anti-Slop Rules (What NEVER To Do)

### 1. Visual Details & Bad Decor
- **No Side-Tab Accent Borders**: Never put a thick 4px-6px colored border on one side of a rounded card (`border-left: 4px solid ...`). It is the #1 tell of AI-generated UIs.
- **No Border Accents Clashing with Radius**: Do not mix heavy colored borders (`3px solid`) with large rounded corners (`border-radius: 16px+`).
- **No Hairline Borders with Diffuse Shadows**: Avoid combining 1px thin borders with wide, blurry soft shadows (`0 0 30px rgba(0,0,0,0.2)`). Choose defined borders OR elevation shadow, not both.
- **No Gratuitous Glassmorphism & Neon Orbs**: Avoid blurred background orbs, fake frosted glass cards, and glowing borders used as random background noise.
- **No Decorative Grid Backgrounds**: Do not overlay graph paper / grid lines on landing backgrounds unless it's a technical canvas or mapping tool.
- **No Extreme Over-Rounding on Cards**: Do not round small cards or containers with 24px+ radius. Keep cards between 8px-16px radius; reserve full pills (`rounded-full`) exclusively for buttons, badges, and tags.
- **No Amateurish Hand-Drawn SVG Doodles**: Avoid crude hand-coded SVG mascots or doodles. Use high-quality icons or real vector assets.

### 2. Typography & Hierarchy
- **No Flat Type Hierarchy**: Avoid font sizes that are too close together (e.g. 17px heading vs 15px body). Maintain at least a 1.25x scale ratio between text levels.
- **No Hero Eyebrow Pill Chips**: Avoid putting tiny uppercase letter-spaced pill badges (`bg-indigo-50 text-indigo-600 rounded-full px-3 py-1`) immediately above a big headline.
- **No Repeated Section Kickers**: Do not spam identical uppercase tracking labels (`FEATURES`, `PRICING`, `ABOUT`) above every single section title.
- **No Oversized Hero Sentences**: Avoid giant 56px+ full-sentence headlines that take up the whole screen. Keep headlines punchy.
- **No Italic Serif Display Abuse**: Do not use oversized italic serif fonts for random tech marketing keywords. Keep typography purposeful.
- **No Icon Tiles Stacked Above Headings**: Avoid placing a small rounded-square icon box directly stacked on top of a feature heading. Use side-by-side icons or clean inline layouts.
- **No Inter Everywhere**: Avoid using default uncustomized system sans fonts without custom weight rhythms or distinct brand pairing.

### 3. Color & Contrast
- **No Purple-to-Blue AI Gradients**: Avoid default purple-to-cyan or purple-to-pink gradient text and buttons on dark mode backgrounds.
- **No Status-Chip Soup**: Avoid plastering bright red, green, blue, yellow status badges on every list item and table cell. Use subtle muted tones.
- **No Low-Contrast Gray Text**: Ensure text meets WCAG AA contrast (≥4.5:1 for body text, ≥3.1:1 for headlines/labels). Never use ultra-faint gray text on white.
- **No Disappearing Dividers in Dark Mode**: Ensure borders and dividers stay visible across both light and dark themes.

### 4. Layout, Cards & Space
- **No Cardocalypse (Cards in Cards)**: Avoid nesting cards inside cards inside cards (3-5 levels deep). Use whitespace, subtle dividers, or clean backgrounds.
- **No Copy-Paste Repeated Layouts**: Vary layout structures between sections (e.g., split grid, asymmetrical showcase, interactive table).
- **No Tight Padding**: Maintain consistent 8px/16px/24px/32px spacing rhythm. Give elements breathing room.

---

## 🎨 High-Craft Principles (How To Build Impeccable UI)

1. **Commit to a Clear Visual Domain**:
   - For a Coffee Shop POS: Rich Dark Espresso (`#1e130c`), Warm Cream (`#fbf9f5`), Amber Accents (`#d97706`), tactile buttons, and authentic thermal receipt aesthetics.
2. **Tactile & Responsive States**:
   - Every interactive control must have clear press feedback (`active:scale-[0.98]` or smooth hover background shift) without layout jitter.
3. **Purposeful Form Controls**:
   - Format numbers with locale separators (`20.000` instead of `20000`).
   - Use clear input modes (`inputMode="numeric"`, `type="text"` with auto-formatting).
   - Guarantee controlled input values with empty string fallbacks (`value={state || ""}`).
4. **Graceful Degradation**:
   - Always include `onError` image fallback handlers to prevent broken browser icon frames.
