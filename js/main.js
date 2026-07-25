import { initIntro } from './intro.js';
import { initOfferModal } from './modal.js';
import { initServices, closeMobileModal, playServicesIntro } from './services.js';
import { initScrollSnap, initNavActiveState, initCardTransitions, initServicesReveal, initTitleReveal } from './scroll.js';
import { initFit, registerFuzzyText } from './fit.js';
import { initAddressBox } from './address-box.js';
import { createFuzzyText } from './fuzzy-text.js';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initHeroFuzz() {
  const canvas = document.querySelector('.hero-fuzz-canvas');
  const wrap = document.querySelector('.hero-fuzz-wrap');
  if (!canvas || !wrap) return;

  const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim();
  const fuzzyText = createFuzzyText({ canvas, word: 'FUZZ', fontFamily });
  registerFuzzyText(fuzzyText);

  wrap.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;
    if (prefersReducedMotion()) return;
    fuzzyText.playOneShot();
  });
}

// CSS scroll-snap (mandatory + scroll-snap-stop:always, needed so a fast
// scroll can't skip past Come See Us into the footer — see base.css) can
// fight a programmatic scrollIntoView while it's mid-flight: the snap
// machinery re-resolves against the *current* scroll position on every
// frame, and on some engines (this shows up on mobile Safari in particular)
// that resolves to the nearest/first snap point rather than letting the
// scroll continue on to the intended target — nav links landing back on
// hero regardless of which one was clicked. Turning snap off for the
// duration of the scroll and back on once it settles sidesteps the
// conflict entirely rather than depending on any particular engine's
// snap-vs-programmatic-scroll resolution order.
function wireNavSmoothScroll() {
  const html = document.documentElement;

  document.querySelectorAll('a[data-section]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.dataset.section;
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();

      const wasSnapping = html.classList.contains('snap-enabled');
      if (wasSnapping) html.classList.remove('snap-enabled');

      let settled = false;
      const reenable = () => {
        if (settled) return;
        settled = true;
        if (wasSnapping) html.classList.add('snap-enabled');
        window.removeEventListener('scrollend', reenable);
      };
      window.addEventListener('scrollend', reenable);
      setTimeout(reenable, 1200); // scrollend isn't supported everywhere — fallback

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function wireFooterNewsletter() {
  const form = document.querySelector('.footer-newsletter-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    // placeholder — wire to an email provider later
    console.log('footer newsletter submit', input.value);
    input.value = '';
    input.placeholder = 'Thanks — check your inbox!';
  });
}

function initFaqAccordion() {
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });
}

function wireServiceModalClose() {
  const overlay = document.getElementById('service-modal');
  if (!overlay) return;
  overlay.querySelector('.service-modal-close').addEventListener('click', closeMobileModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMobileModal();
  });
}

function initBioModal() {
  const overlay = document.getElementById('bio-modal');
  const triggers = document.querySelectorAll('[data-bio-trigger]');
  if (!overlay || !triggers.length) return;

  const nameEl = overlay.querySelector('.bio-modal-name');
  const textEl = overlay.querySelector('.bio-modal-text');

  function open(bio) {
    nameEl.textContent = bio.querySelector('.bio-name').textContent;
    textEl.textContent = bio.querySelector('.bio-text').textContent;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));
  }

  function close() {
    overlay.classList.remove('is-open');
    setTimeout(() => {
      overlay.hidden = true;
    }, 400);
  }

  triggers.forEach((el) => {
    el.addEventListener('click', () => open(el.closest('.bio')));
  });
  overlay.querySelector('.bio-modal-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

async function main() {
  wireNavSmoothScroll();
  wireServiceModalClose();
  wireFooterNewsletter();
  initFaqAccordion();
  initBioModal();
  initHeroFuzz();

  await initServices();
  initFit();

  initScrollSnap();
  initNavActiveState();
  initCardTransitions();
  initTitleReveal();
  initServicesReveal(playServicesIntro);
  initAddressBox();

  const offerModal = initOfferModal();

  initIntro({
    onComplete: () => {
      offerModal.armTriggers();
    },
  });
}

main();
