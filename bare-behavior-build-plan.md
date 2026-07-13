# Bare Behavior — Build Plan (for Claude Code)

Single-page marketing site for a waxing studio. Premium editorial feel, strict grid, heavy scroll choreography, one interactive centerpiece (the body-map services section). This document is the implementation spec. Build it in phases; each phase is independently testable.

---

## 0. Stack & Conventions

- **No framework required.** Plain HTML + CSS + vanilla JS (ES modules) is sufficient and keeps it light. If a build step is wanted, Vite is fine. Do NOT reach for React unless asked — this is a static one-pager.
- **Animation:** Use the native Web Animations API + CSS transitions for most things. Use **GSAP + ScrollTrigger** for the scroll-snap choreography and the SVG draw-on (it's worth the dependency here). IntersectionObserver is the fallback if avoiding GSAP.
- **Fonts:** Google Fonts — **DM Serif Display** (display/headlines) and **DM Sans** (body/UI). Load via `<link>` with `display=swap`.
- **No localStorage for persistence of design state**, but sessionStorage IS used for the intro-replay logic (see Phase 2).
- **Accessibility:** honor `prefers-reduced-motion` — when set, skip all intro choreography and scroll animations, render final states immediately.

---

## 1. Design Tokens (define once, in `:root`)

```css
:root {
  /* Color — ONLY these three, by role */
  --bg:      #FFFAED;  /* warm ivory — page background */
  --ink:     #342222;  /* deep brown — text, active states, lines */
  --accent:  #D1B8B8;  /* dusty rose — inactive dots/list items, dividers, connectors */

  /* Grid */
  --max-width: 1440px;
  --margin: 100px;     /* outer page margin at desktop */
  --gutter: 24px;
  --columns: 12;

  /* Vertical rhythm — 8px base. Use ONLY these. */
  --sp-1: 8px;   --sp-2: 16px;  --sp-3: 24px;  --sp-4: 32px;
  --sp-6: 48px;  --sp-8: 64px;  --sp-12: 96px; --sp-16: 128px;
  --section-pad: var(--sp-16); /* generous — this creates the airy feel */

  /* Type scale (tune sizes against Figma PNGs; these are starting values) */
  --wordmark-tracking: 0.18em;  /* MEASURE precisely off comp — critical, client cares */
  --font-display: "DM Serif Display", serif;
  --font-sans: "DM Sans", sans-serif;
}
```

**Grid rule:** every section uses the same 12-col grid. Nothing gets an arbitrary left/right position — all elements start and end on column lines. Build a reusable `.grid` container (max-width, auto margins, 12-col `display: grid`, gutter gap) and place everything in it.

**Type ramp (apply globally, don't re-spec per section):**
- Wordmark: DM Sans, 700, lowercase, `letter-spacing: var(--wordmark-tracking)`. Identical in loading screen and header.
- Hero LESS/FUZZ: DM Serif Display, uppercase, fluid `clamp()` near viewport width. Tighten `line-height` so the two lines nest architecturally (client explicitly approved tuning leading here).
- Hero "more confidence": DM Sans, large, lowercase.
- Section titles ("services", "info", "FAQs"): DM Serif Display, italic, large, right-aligned in their column.
- Body copy: DM Sans, ~18px, line-height ~1.6.
- Labels/nav/prices: DM Sans, small, with tracking.

---

## 2. Phase 1 — Structure & Grid (build first, no animation)

Build the full static page with all sections in final resting state, on the grid, correctly typeset. Get spacing and alignment perfect BEFORE any motion. Sections top to bottom:

1. `#hero` (final state: LESS/FUZZ/more confidence + wordmark in header)
2. `#services`
3. `#info`
4. `#faqs`
5. `#come-see-us`
- Persistent `header` (wordmark + nav: services / info / faqs / book)
- Persistent `footer` ("2026 — Get 10% off your first service!")

Nav links smooth-scroll to sections. "book" opens an external booking URL in a new tab (placeholder const `BOOKING_URL` for now). Footer offer link opens the modal (Phase 4).

**Checkpoint:** page looks like the Figma comps, statically, at desktop. Alignment tight to grid.

---

## 3. Phase 2 — Intro Choreography (`#hero`)

Runs on load. **Scroll-locked until complete** (lock via `overflow:hidden` on body + prevent wheel/touch; release on completion). Gate the whole thing on `sessionStorage.getItem('bb_intro_seen')`.

**First visit this session** (flag absent):
1. Loading screen: "bare behavior" types on letter-by-letter, each letter fading in (opacity + slight blur→sharp). Keep it brief but deliberate (~1.2–1.6s total).
2. Eased fade, then the wordmark glides up to its header position (FLIP technique: animate from center to the real header slot).
3. **LESS** eases in from left (translateX + fade).
4. **FUZZ** sweeps in from right, starting with `filter: blur(8px)` and resolving to `blur(0)` over ~400ms as it settles — the "defuzz." (No wobble/distort — blur-resolve only.)
5. **more** rises from below (translateY + fade).
6. **confidence** rises from below, just after "more".
7. Adjective cycle: the second word rolls through `["comfort","you","smooth"]` and lands on `"confidence"`, holding. **"more" stays fixed**; only the second word animates. Each swap = **blur-roll**: outgoing word fades+blurs UP and out while incoming fades+blurs in from just below, both `clip-path`-masked to the line box so it reads as rolling within the line height. ~1.2–1.5s per word. Do NOT loop — settle on "confidence".
8. Release scroll lock. Set `sessionStorage.setItem('bb_intro_seen','1')`.

**Return visit this session** (flag present): skip type-on and the LESS/FUZZ/adjective sequence. Just show the wordmark and let it settle into the header; hero renders in final resting state. No scroll lock.

**Layout note for the adjective:** anchor "more" and the adjective as a left-anchored pair (Option B — left-aligned to grid) so nothing shifts as word length varies. The rolling word lives in a slot whose baseline/left-edge is fixed; only vertical roll + blur animates.

**Reduced motion:** skip all of the above, render final hero immediately, no lock.

---

## 4. Phase 3 — Scroll Snapping & Section Transitions

- Full-page scroll-snap: each section snaps to fill the viewport (`scroll-snap-type: y mandatory` on the scroll container, `scroll-snap-align: start` on sections) OR GSAP ScrollTrigger snap — prefer ScrollTrigger for control over the shared-element transitions below.
- **Heavy/premium easing.** Slow, weighted feel. No snappy/bouncy curves.
- **Info → FAQ shared element:** the side contact box is the SAME element visually across both sections — it stays STATIONARY while the left-hand content (Info copy ↔ FAQ list) swaps via fade + subtle slide as you scroll between them. Implement as a persistent positioned element with content cross-fading, or a pinned ScrollTrigger where only the left column translates/fades. The contact box must not move.

**Reduced motion:** disable snap, normal scroll, instant content (no cross-fade slide).

---

## 5. Phase 4 — 10% Modal

- Trigger: on first scroll intent OR ~2s idle on hero — whichever first — but only AFTER intro completes. Show **once per session** (`sessionStorage 'bb_modal_seen'`).
- Overlay **blocks scroll** while open. Blurred hero behind (see comp image 7).
- Contents: "Get 10% off your first service!" (DM Serif Display italic), subtext, email input + submit button. Wire submit to a placeholder handler (`onSubmit(email)`), ready to connect to an email provider later.
- Dismiss (X or submit) → closes, stays gone for session. Scroll to services enabled after close.
- **Footer offer link** opens this SAME modal manually, and must work ALWAYS (even after dismissed/submitted this session) since it's a deliberate click.

---

## 6. Phase 5 — Services Section (the centerpiece)

### 6a. Figures & coordinate system
- Two SVGs: `body-front.svg` (23 stroke paths), `body-back.svg` (single compound fill path). **Normalize both to a shared viewBox** so they render as a matched pair (front exported clean strokes; back is a filled compound path and is slightly off-center — re-center in code, don't ask the user to re-export). Recolor both to `var(--ink)` for strokes/fill; ensure the back reads as line-weight consistent with the front (may need to render its fill as none + stroke, or accept filled silhouette — test visually).
- Both figures live INSIDE their SVG coordinate space. **Dots are `<circle>` elements in the same SVG**, so they scale with the figure across screen sizes (this is the whole reason for SVG — dots stay welded to body locations).

### 6b. Dot map (place `<circle>` per region at figure coordinates; tune visually against comps 4–6)

**Front figure dots:** Arms, Chest, Legs, Shoulders, Neck, Stomach, Face (on the face), Below-the-Belt (genital area).
**Back figure dots:** Back, Glutes, Between the Cheeks.

### 6c. Data model (from client CSV — see DATA below)
Each dot governs one or more services. Hovering a dot shows a box with the **full group**. Each list item also appears in the right-hand menu; hovering a list item activates its governing dot and shows the group box **with that item emphasized** (dark) and the rest of the group slightly lighter.

### 6d. Interaction
- **Two-way highlight, one active at a time.** Hover dot ⇄ hover list item both activate the same region.
- **Active styling:** active dot + active list item + their category header → `var(--ink)` (dark). Everything else → `var(--accent)` (rose). Category headers are bold by default, color-shift on active.
- **Info box:** appears at a FIXED horizontal offset from the active dot (same left/right distance each time), but **vertical position tracks the dot**. Side (left vs right of figure) is assigned per-dot to avoid colliding with the other figure / running off-grid — precompute per dot.
- **Connector:** dotted line (`var(--accent)` or `--ink`) from dot to box. It meets the box near its TOP — box sits ~90% below the connection point, ~8–10% above it, with a small top margin before the attach point.
- Box contents: service name(s) + price(s), grouped, DM Sans, on the grid's type scale. Box outline in `var(--accent)`.

### 6e. Mobile (finesse required — no interactive map)
- Render the **service list only**. Tap a service → **modal** with that service's info, organized on a small internal grid (define a uniform modal layout: title, price, description, and a small front-or-back figure showing a SINGLE dot at that service's location — illustrative only, non-interactive).
- Keep aesthetic (ivory/ink/rose, type ramp) but prioritize legibility and tap targets.

### 6f. Services animations (on scroll into view)
1. **Figures draw themselves in** via `stroke-dashoffset` (front first, then back), ~1.2s. (Back is a fill path — either convert to stroke for the draw-on, or fade/mask it in to match; test.)
2. **Dots pop in** staggered after draw completes — scale 0→1 with slight overshoot, ~60ms stagger, top-to-bottom.
3. **Right-hand list** staggers in line-by-line (y-offset + fade), synced with dots. Category headers lead each group.
4. **"services" title** rises from below (same family as hero "confidence").
5. On activate: info box fades+scales up from connector point; connector draws via `stroke-dashoffset` (~200ms); dot rose→brown, list item grey→brown simultaneously.
6. Optional **parallax:** figures drift a few px slower than the list within the snapped section.

**Reduced motion:** figures/dots/list appear instantly; hover interaction still works; no parallax.

---

## 7. DATA — Services (source of truth; prices as given, some TBD)

Group headers: **Body**, **Face**, **Below the Belt**. `$--` = price TBD (render as "inquire" or omit — client deciding; make it a single config flag `TBD_PRICE_DISPLAY`).

**Dot: Arms** (front) — Arms $55 · Arms (half) $42 · Underarms $22
**Dot: Back** (back) — Back $71 · Back (partial) $32
**Dot: Chest** (front) — Chest $71
**Dot: Legs** (front) — Legs $85 · Legs (half) $48 · Half leg $25 · Inner thigh $12
**Dot: Shoulders** (front) — Shoulders $19
**Dot: Neck** (front) — Neck $20   *(note: comp showed $85 in a demo — that was an error; real price $20)*
**Dot: Stomach** (front) — Stomach (partial) $32
**Dot: Face** (front, on face) — Eyebrows $12+ (brow cleanup, middle brow) · Lip $14 · Chin $18 · Cheeks $18 · Sideburns $18 · Nostrils $20 · Ears $20
**Dot: Glutes** (back) — Glutes $32
**Dot: Between the Cheeks** (back) — Between the Cheeks $21
**Dot: Below the Belt** (front, genital area) — Bare Mini (Bikini) $40 · Bare Midi (Bikini Tight) $55 · Bare Maxi (Brazilian) $69 · Manzilian $95
**Add-ons** (list under Below the Belt; prices TBD) — Brazilian Rehab (steam, extractions, mask) $-- · Manzilian Rehab $-- · Vagacial $--

Recommend a single `services.js` data file: array of regions `{ id, side: 'front'|'back', dotXY: [x,y], boxSide: 'left'|'right', category, items: [{name, price, note?}] }`. UI renders from this — never hard-code prices in markup.

---

## 8. Assets on hand
- `body-front.svg`, `body-back.svg` — the two line figures (normalize viewBoxes as noted).
- `statue.png` — treated marble torso (duotone/grain), available as a hero/brand texture if wanted later. Not required for core build.
- `wax.png` — the rose wax-blob graphic seen in Info/FAQ comps; place as a decorative element in those sections per comps.

---

## 9. Build order (recommended)
1. Phase 1 static grid + all sections + header/footer. Nail alignment.
2. Phase 5 services (static: figures, dots, data-driven list, hover boxes, connectors) — highest-risk, build early.
3. Phase 5 mobile list→modal.
4. Phase 4 modal (10% offer).
5. Phase 2 intro choreography.
6. Phase 3 scroll-snap + Info↔FAQ shared contact box.
7. Phase 5 services animations + parallax.
8. Reduced-motion pass, mobile finesse pass, cross-browser check.

## 10. Definition of done
- Pixel-tight to comps at desktop; clean responsive down to mobile.
- Every gap a multiple of 8; everything on the 12-col grid.
- Wordmark tracking matches comp exactly.
- Intro plays once/session, scroll-locked, settles on "confidence".
- Modal once/session + always-on footer trigger.
- Services: two-way hover, grouped boxes, tracking connector, correct data.
- Full scroll-snap; Info↔FAQ contact box stationary.
- `prefers-reduced-motion` fully honored.
