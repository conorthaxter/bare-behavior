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

function wireNavSmoothScroll() {
  document.querySelectorAll('a[data-section]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.dataset.section;
      const target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();
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
