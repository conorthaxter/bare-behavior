import { ensureFontsLoaded } from './fit.js';

const SEEN_KEY = 'bb_intro_seen';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function lockScroll() {
  document.body.classList.add('no-scroll');
}
function unlockScroll() {
  document.body.classList.remove('no-scroll');
}

function splitIntoChars(el) {
  const text = el.textContent;
  el.textContent = '';
  return [...text].map((ch) => {
    const span = document.createElement('span');
    // A lone space as the sole content of an inline-block box collapses to
    // zero width (it sits at the edge of its own formatting context, so
    // normal whitespace-collapsing rules trim it) — a non-breaking space
    // renders instead, keeping the gap between "bare" and "behavior".
    span.textContent = ch === ' ' ? ' ' : ch;
    span.style.display = 'inline-block';
    el.appendChild(span);
    return span;
  });
}

function flipWordmark(fromEl, toEl, gsapInstance) {
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();

  const fromCenterX = fromRect.left + fromRect.width / 2;
  const fromCenterY = fromRect.top + fromRect.height / 2;
  const toCenterX = toRect.left + toRect.width / 2;
  const toCenterY = toRect.top + toRect.height / 2;

  const scale = toRect.height > 0 ? toRect.height / fromRect.height : 1;
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  return gsapInstance.to(fromEl, {
    x: dx,
    y: dy,
    scale,
    duration: 0.9,
    ease: 'power3.inOut',
  });
}

export function initIntro({ onComplete }) {
  const introSlot = document.querySelector('.wordmark-intro-slot');
  const introWordmark = introSlot.querySelector('.wordmark');
  const header = document.querySelector('.site-header');
  const headerWordmark = header.querySelector('.wordmark');

  const heroLess = document.querySelector('.hero-less');
  const heroFuzzWrap = document.querySelector('.hero-fuzz-wrap');
  const heroSub = document.querySelector('.hero-sub-text');

  const gsapInstance = window.gsap;
  const hasGsap = !!gsapInstance;

  function showFinalState() {
    introSlot.style.display = 'none';
    header.classList.add('is-visible');
    header.classList.add('wordmark-ready');
    heroLess.style.opacity = 1;
    // js/fit.js sets heroLess's scaleX transform independently (async, via
    // document.fonts.ready) — nothing to do for it here.
    // Jump straight to the resting position — no slide, no bush-up one-shot.
    heroFuzzWrap.style.transition = 'none';
    heroFuzzWrap.classList.add('is-in-view');
    heroSub.style.opacity = 1;
    unlockScroll();
    onComplete && onComplete();
  }

  if (prefersReducedMotion()) {
    showFinalState();
    return;
  }

  const seen = sessionStorage.getItem(SEEN_KEY);

  if (seen) {
    // Return visit: skip type-on / LESS-FUZZ sequence. Settle straight into final state.
    showFinalState();
    return;
  }

  if (!hasGsap) {
    // GSAP failed to load — degrade gracefully to final state rather than a broken/stuck intro.
    showFinalState();
    return;
  }

  lockScroll();

  // Wait for the wordmark's actual font/weight to be fetched before typing
  // it on — measuring/painting it before that silently uses a fallback face
  // for a frame or two, then swaps once the real font arrives mid-animation
  // (the "sometimes the font loads wrong" glitch). The curtain is already up
  // (critical CSS) and the wordmark itself starts at opacity:0, so this wait
  // is invisible — just a blank curtain a little longer, never wrong-font text.
  ensureFontsLoaded().then(() => {
    gsapInstance.set([heroLess, heroSub], { opacity: 0 });
    gsapInstance.set(heroLess, { x: -40 });

    const chars = splitIntoChars(introWordmark);
    gsapInstance.set(chars, { opacity: 0, filter: 'blur(6px)' });
    // Reveal the parent in this same synchronous pass — chars are already
    // individually hidden above, so nothing paints in between (no flash of
    // the plain, un-split word this was hidden from in the first place).
    introWordmark.style.opacity = '1';

    const tl = gsapInstance.timeline({
      onComplete: () => {
        sessionStorage.setItem(SEEN_KEY, '1');
        unlockScroll();
        onComplete && onComplete();
      },
    });

    tl.to(chars, {
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.4,
      stagger: 0.075,
      ease: 'power1.out',
    });

    tl.to({}, { duration: 0.3 }); // brief hold on the completed wordmark

    tl.add(() => {
      header.classList.add('is-visible');
      // The header's own wordmark stays hidden (see .wordmark-text in
      // header-footer.css) until this glide finishes, so only ONE "bare
      // behavior" is ever on screen at a time.
      flipWordmark(introWordmark, headerWordmark, gsapInstance).eventCallback('onComplete', () => {
        introSlot.style.display = 'none';
        header.classList.add('wordmark-ready');
      });
    });

    tl.to({}, { duration: 0.9 }); // let the FLIP glide play out

    tl.to(heroLess, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }, '+=0.05');
    // FUZZ owns its own entrance (CSS slide-in-from-right -> transitionend ->
    // canvas bush-up one-shot, wired in main.js/fuzzy-text.js) — just start it.
    tl.add(() => {
      heroFuzzWrap.classList.add('is-in-view');
    }, '-=0.35');
    tl.to(heroSub, { opacity: 1, duration: 1, ease: 'power2.out' }, '-=0.1');

    tl.to({}, { duration: 0.4 }); // hold, settled
  });
}
