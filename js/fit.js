// Viewport-driven sizing: measure natural text/content dimensions at a
// reference size, then scale proportionally to fill the available box exactly.
// (Font metrics scale linearly with font-size, so one measurement is enough —
// no iterative/binary-search fitting needed.)

function naturalWidth(el, refPx) {
  // Block/flex/grid boxes stretch to fill their container by default, and
  // text that's allowed to wrap wraps *before* it hits its true intrinsic
  // width — both would make getBoundingClientRect() report a wrong (clamped)
  // width. `width: max-content` forces shrink-to-fit reliably even on grid
  // items (unlike `display: inline-block`, which CSS "blockifies" back to
  // block-level sizing on a grid item, silently no-op-ing the trick).
  // getBoundingClientRect() reports the *painted* (post-transform) box, so
  // any scaleX already applied from a previous fit pass would contaminate
  // this measurement — neutralize it first. fitHero() always re-sets the
  // real transform immediately after calling this, so there's nothing to
  // restore here.
  const prevWidth = el.style.width;
  const prevWhiteSpace = el.style.whiteSpace;
  const prevTransform = el.style.transform;
  el.style.transform = 'none';
  el.style.fontSize = refPx + 'px';
  el.style.width = 'max-content';
  el.style.whiteSpace = 'nowrap';
  const width = el.getBoundingClientRect().width;
  el.style.width = prevWidth;
  el.style.whiteSpace = prevWhiteSpace;
  el.style.transform = prevTransform;
  return width;
}

let fuzzyTextInstance = null;
export function registerFuzzyText(instance) {
  fuzzyTextInstance = instance;
}

export function fitHero() {
  const hero = document.querySelector('.hero');
  const headline = document.querySelector('.hero-headline');
  const less = document.querySelector('.hero-less');
  const fuzzWrap = document.querySelector('.hero-fuzz-wrap');
  const sub = document.querySelector('.hero-sub-text');
  if (!hero || !headline || !less || !fuzzWrap || !sub) return;

  const availWidth = headline.clientWidth;
  const SUB_RATIO = 0.34; // "more confidence" size relative to LESS/FUZZ's shared size

  // LESS and FUZZ share one font-size (their whole point per this pass), so
  // solve for it from the vertical budget directly rather than the width:
  // width-fill is handled per-word afterward via independent scaleX stretch.
  const heroStyle = getComputedStyle(hero);
  const padTop = parseFloat(heroStyle.paddingTop) || 0;
  const padBottom = parseFloat(heroStyle.paddingBottom) || 0;
  const availHeight = hero.clientHeight - padTop - padBottom;
  const SUB_GAP = 32; // var(--sp-4)

  // Filling 100% of availHeight reads fine on a wide/short desktop
  // viewport, but on a narrow/tall phone screen it means LESS+FUZZ alone
  // eat the vast majority of the screen before "more confidence" (or
  // anything else) is even visible — oversized rather than bold. Mobile
  // targets a bit less than the full budget, leaving real breathing room.
  const FILL_RATIO = window.innerWidth <= 900 ? 0.82 : 1;

  // LESS line-height 0.8 + FUZZ's matching box (~0.8, net ~0.75 after its
  // negative margin-top) + the sub line at SUB_RATIO of the shared size.
  let bigSize = ((availHeight - SUB_GAP) * FILL_RATIO) / (0.8 + 0.75 + SUB_RATIO);

  const WORD_WIDTH_RATIO = 0.74; // LESS and FUZZ share this width, not the full row

  function apply(size) {
    // `transform: scaleX()` scales the element's own layout box — a plain
    // `display: block` span with no explicit width fills its *container*
    // (1240px here) regardless of how much of that the text actually needs,
    // so scaling that box overshoots massively. `width: max-content` (kept
    // permanently, not just during measurement) shrinks the box to the
    // text's true intrinsic width first, so the scaleX below scales the
    // right reference and lands exactly on the target width.
    // LESS targets the same width as FUZZ (not the full row) — matching
    // widths, not one word stretched to fill the line.
    const lessScaleX = (availWidth * WORD_WIDTH_RATIO) / naturalWidth(less, size);
    less.style.fontSize = size + 'px';
    less.style.width = 'max-content';
    less.style.transform = `scaleX(${lessScaleX})`;

    if (fuzzyTextInstance) {
      fuzzyTextInstance.setBox({ fontSizePx: size, targetWidth: availWidth * WORD_WIDTH_RATIO });
    }

    // .hero-sub-text is inline-block (shrinks to content already) inside a
    // text-align:center parent, so no margin:auto juggling is needed here —
    // just size + stretch it; centering falls out of the parent for free.
    const subSize = size * SUB_RATIO;
    const subScaleX = availWidth / naturalWidth(sub, subSize);
    sub.style.fontSize = subSize + 'px';
    sub.style.transform = `scaleX(${subScaleX})`;
  }

  apply(bigSize);

  // Vertical correction pass: measure what actually rendered (the 0.75/0.8
  // ratios above are an estimate) and scale everything down together once
  // if it overshoots the available height.
  const headlineTop = headline.getBoundingClientRect().top;
  const subBottom = sub.getBoundingClientRect().bottom;
  const stackHeight = subBottom - headlineTop;
  if (stackHeight > availHeight) {
    apply(bigSize * (availHeight / stackHeight));
  }
}

// document.fonts.ready alone isn't reliable here: it resolves once every
// *currently pending* font load settles, but a font nothing has asked to
// render yet may not have even started fetching — exactly the case for
// hero text measured before first paint. Explicitly requesting the exact
// faces we're about to measure forces the fetch and guarantees they're
// really in place before any width/height measurement runs (this was the
// root cause of FUZZ landing in a different spot on a cold load vs a warm
// reload — a font-load timing race, not a positioning bug).
export async function ensureFontsLoaded() {
  const specs = [
    '400 100px "DM Serif Display"',
    '700 100px "DM Sans"',
    '900 100px "DM Sans"',
  ];
  try {
    await Promise.all(specs.map((spec) => document.fonts.load(spec)));
  } catch (e) {
    // ignore — fall through to fonts.ready below regardless
  }
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

let resizeTimer = null;
export function initFit() {
  // Only the hero needs viewport-driven sizing (fill exactly). Every other
  // card (services/info/faqs/bookings) now uses one fixed reference
  // font-size, with overflow-y:auto as the fallback if content runs long —
  // see .card-content / #services-menu in the CSS.
  const run = () => {
    fitHero();
  };

  ensureFontsLoaded().then(run).catch(run);
  // Fonts can still shift metrics slightly after `ready` resolves in some browsers; re-run once more.
  requestAnimationFrame(() => requestAnimationFrame(run));

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(run, 150);
  });

  return run;
}
