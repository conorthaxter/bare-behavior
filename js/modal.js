import { submitToMailingList } from './config.js';

const SEEN_KEY = 'bb_modal_seen';

export function initOfferModal() {
  const overlay = document.getElementById('offer-modal');
  if (!overlay) return;
  const closeBtn = overlay.querySelector('.modal-close');
  const form = overlay.querySelector('.modal-form');
  const input = overlay.querySelector('input[type="email"]');

  let autoShown = false;

  function open() {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));
  }

  function close() {
    overlay.classList.remove('is-open');
    setTimeout(() => { overlay.hidden = true; }, 500);
  }

  function autoOpenOnce() {
    if (autoShown || sessionStorage.getItem(SEEN_KEY)) return;
    autoShown = true;
    sessionStorage.setItem(SEEN_KEY, '1');
    open();
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitToMailingList(input.value, 'popup').catch(() => {});
    overlay.classList.add('is-submitted');
    setTimeout(close, 1600);
  });

  // Trigger: first scroll intent OR ~2s idle on hero, whichever first — only after intro completes.
  function armTriggers() {
    const idleTimer = setTimeout(autoOpenOnce, 2000);

    const onScrollIntent = () => {
      autoOpenOnce();
      teardown();
    };

    function teardown() {
      window.removeEventListener('wheel', onScrollIntent);
      window.removeEventListener('touchmove', onScrollIntent);
      clearTimeout(idleTimer);
    }

    window.addEventListener('wheel', onScrollIntent, { passive: true, once: true });
    window.addEventListener('touchmove', onScrollIntent, { passive: true, once: true });
  }

  return { armTriggers, open, close };
}
