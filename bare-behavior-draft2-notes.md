# Bare Behavior — Draft 2 Revision Notes (Skeleton / Scale Pass)

This is a **skeleton and scale pass**, not a decor pass. The governing problem in Draft 1 is that content is sized small and floated in the middle of the viewport instead of being **sized to fill the viewport (minus margins)**. Fix scale and alignment first; decorative elements (wax graphic, etc.) are intentionally removed this pass and revisited later.

Read Section 1 first — it's the principle everything else serves.

---

## 1. Governing Principle: Fill the Viewport

Every section is sized to the viewport, not to fixed pixel values. Type and figures scale with viewport width/height (fluid `clamp()`, `vw`/`vh` units, or measured JS sizing) so each section fills the screen between header and footer, with consistent margins. Draft 1's elements are capped by fixed sizes and sit too small — remove those caps and drive sizing from the viewport.

Everything stays on the strict 12-col grid with consistent vertical rhythm (8px base; section margins tied to the existing spacing scale). "Airy but aligned" comes from grid discipline, not from empty floating space.

---

## 2. Scale Targets (the core of this pass)

### 2a. Hero — fill full width AND height
- **LESS / FUZZ / more confidence** must occupy the full width and height of the viewport (minus outer margins). Currently far too small and centered.
- LESS and FUZZ each run nearly edge-to-edge horizontally; the longest line approaches the side margins.
- The three-line stack fills the vertical space between header and footer.
- Drive with fluid sizing off viewport dimensions — NOT a fixed font-size cap. Type grows until the longest line nearly touches the side margins and the stack height fills the viewport.

### 2b. Services — figures set the height; menu matches it EXACTLY
Most important item in the pass. Exact, not approximate.

- The two **body SVGs** are sized to **fill the viewport height minus a top/bottom margin**. They are the tallest element and anchor the section's scale. (Margin: tie to existing vertical rhythm — ~96–128px equivalent — tuned to look balanced.)
- The **entire right-hand menu** (all category headers + all service lines) must match the **exact same vertical height** as the figures: menu top aligns to figure top, last service line's bottom aligns to figure bottom.
- To fit the full menu into that height: **tighten line spacing, and reduce text size only as needed** — but keep text **as large as possible** while still fitting. Priority order: (1) match the figure height, (2) maximize text size within that.
- Implement by **measuring the figure height and sizing/spacing the list to match** — do not eyeball. The menu is a single column whose height is locked to the figures.
- **Fallback for very short/wide viewports:** prioritize matching height down to a sensible minimum font size; below that minimum, allow the section to breathe rather than render text unreadably small. (Default — flag if exact match should always win.)

### 2c. Info / FAQ / other text sections — left panel alignment
- Left-hand body text currently sits too low.
- The **top of the left body text must align with the baseline of the section title** (the bottom of the line the big serif title sits on). Title baseline and body-text top share one horizontal line.
- Currently the body copy is dropped well below it.

### 2d. Global spacing pass
- Spacing needs work across the whole site. Enforce grid + consistent vertical rhythm everywhere. Tighten alignment section by section against the 12-col grid.

---

## 3. Animation / Load Fixes (read as bugs — fix early)

### 3a. Page flash before intro
Visible flash before the "bare behavior" type-on begins. First paint should be the clean ivory loading screen and nothing else. Likely causes: FOUC (CSS/fonts loading after first paint), or hero content painting before the intro overlay mounts. Fix: intro overlay present in initial HTML with inline critical CSS; preload DM Sans/DM Serif with no swap-flash; keep hero content fully hidden (not merely opacity-0 post-paint) until the intro hands off.

### 3b. Wordmark overlaps itself during slide-up
The header "bare behavior" renders before the loading-screen wordmark finishes sliding up, so both briefly show and overlap. There must only ever be ONE "bare behavior" visible at any moment. Fix: single-element FLIP (center → header slot), OR keep the header wordmark hidden until the slide completes, then hand off.

---

## 4. Structure Changes

### 4a. Header & footer — transparent
Both get fully transparent backgrounds. No fill, no bar. Content sits over / scrolls under seamlessly.

### 4b. Nav rename + reorder
- Rename "book" → "bookings".
- Reorder nav to match section order: **services · bookings · info · faqs**.
- "bookings" scrolls to the in-page Bookings section (not an external link).

### 4c. Section order
Hero → Services → **Bookings** → Info → FAQ → Come See Us.

### 4d. Section titles slide in from the RIGHT
Titles ("services", "bookings", "info", "faqs") animate in from the right edge (not up from the bottom) to avoid colliding with the sticky address box at bottom-right. Titles sit high in their section; ensure their entry path clears the box's top edge.

---

## 5. New: Bookings Section (Acuity embed placeholder)

- Add directly beneath Services.
- Build a **placeholder embed container** now — styled and sized — that the client's real Acuity embed code drops into later. Reserve layout so swapping in the real embed shifts nothing.
- The embed fills the **remaining usable width**; the sticky address box sits bottom-right (Section 6).
- **Acuity styling reality (context, not a task):** Acuity embeds are CSS-customizable only on Premium/Powerhouse plans, limited to ~two dozen supported selectors (colors, ONE font via `@font-face`, spacing, hiding elements), single font only (no serif/sans pairing inside the embed). It gets close to brand, not pixel-identical. Frame the embed in a bordered/contained element so it reads as intentional. Appointment name/price/duration/description come from the client's Appointment Types (the master services sheet).

---

## 6. Address Box — single sticky element

Replaces Draft 1's inline boxes (duplicated inside Info and FAQ). There is now ONE box.

- **Remove** the inline box from Info/FAQ content flow entirely.
- **First appears at the Bookings section.** On Bookings entering view, the box **slides up into the bottom-right** of the viewport and becomes sticky there.
- **Always bottom-right.** Stays sticky in that exact position — no re-animation between sections — through **Bookings → Info → FAQ**.
- In Bookings specifically: box pinned bottom-right, Acuity embed fills the remaining width.
- **At Come See Us — choreographed hand-off, order matters:**
  1. "come see us <3" text slides up from the bottom.
  2. THEN the address box slides from bottom-right into the **center** of the section (its resting home per the Come See Us comp).
- The box makes only two animated moves ever: (a) slide up to bottom-right at Bookings, (b) slide to center at Come See Us (after the title).
- "Click here to book:" inside the box links/scrolls to the Bookings embed section.
- **Mobile:** no sticky side-box. The box appears only at Come See Us, in normal flow, at the bottom of the screen under "come see us". It does not appear in the other sections on mobile.

---

## 7. Content / Rendering Fixes Observed in Draft 1

- **Info typo:** "Inclusive to **evervBODY**" → "every**BODY**".
- **Info missing bullet:** only 3 of 4 "Why Choose Us" checks show; restore the 4th — "Results that keep you coming back."
- **Services hover states:** verify two-way hover is wired (hover dot OR list item → that item + its category header go dark `--ink`, everything else fades to rose `--accent`). Draft 1 may show resting state only — confirm it toggles.
- **Hero resting state:** ensure "confidence" resolves to sharp after the blur-roll settle — not permanently blurred (Draft 1 shows the mid-animation frame).

---

## 8. Removed This Pass
- **Wax graphic** — removed entirely from Info/FAQ. Web decor revisited later. Sections are text + sticky box only for now.

---

## 9. Unchanged / Good in Draft 1
- Wordmark tracking — preserve.
- Hero LESS/FUZZ type *treatment* (serif/sans, roman/italic interplay) — good; only the SCALE is wrong (2a).
- Section titles in serif italic — good.
- Ivory / ink / rose palette discipline — holding.
- Body figures render cleanly; front dots reasonable (fine-tune coordinates + scale per 2b).
- Footer "2026 / Get 10% off your first service!" — keep (now transparent bg).

---

## 10. Build Order for This Pass
1. **Scale fixes first** — hero fill (2a), services figure+menu height match (2b), left-panel baseline alignment (2c), global spacing (2d). This is the point of the pass.
2. Animation bug fixes — flash (3a), wordmark overlap (3b).
3. Header/footer transparency (4a), nav rename + reorder (4b), titles-from-right (4d).
4. New Bookings section + placeholder embed (5).
5. Single sticky address box with full journey + Come See Us hand-off (6).
6. Content fixes (7), remove wax (8).
7. Re-test scroll-snap across the 6 sections; mobile pass.
