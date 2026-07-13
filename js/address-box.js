const DOCKED_SECTIONS = ['bookings', 'info', 'faqs'];

export function initAddressBox() {
  const box = document.getElementById('address-box');
  if (!box) return;
  if (window.innerWidth <= 900) return; // mobile: static copy inside Come See Us handles this instead

  let state = 'hidden';

  function place(x, y) {
    box.style.transform = `translate(${x}px, ${y}px)`;
  }

  function positionDocked(animate) {
    // Right offset matches the grid's own side margin; bottom offset matches
    // --card-bottom so the box's bottom edge lines up exactly with the
    // Bookings embed placeholder's bottom edge (same clearance, same card system).
    const style = getComputedStyle(document.documentElement);
    const margin = parseFloat(style.getPropertyValue('--margin')) || 24;
    const cardBottom = parseFloat(style.getPropertyValue('--card-bottom')) || margin;
    const r = box.getBoundingClientRect();
    const x = window.innerWidth - r.width - margin;
    const y = window.innerHeight - r.height - cardBottom;
    if (!animate) box.style.transition = 'none';
    place(x, y);
    if (!animate) requestAnimationFrame(() => { box.style.transition = ''; });
  }

  function positionOffscreen() {
    const margin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--margin')) || 24;
    const r = box.getBoundingClientRect();
    const x = window.innerWidth - r.width - margin;
    place(x, window.innerHeight + 60);
  }

  function setState(next) {
    if (state === next) return;

    if (next === 'hidden') {
      box.classList.remove('is-visible');
      positionOffscreen();
    } else if (next === 'docked') {
      box.classList.add('is-visible');
      positionDocked(true);
    }
    state = next;
  }

  // start below the fold, invisible, ready to slide up on first dock
  positionOffscreen();

  // Box only ever docks bottom-right for Bookings/Info/FAQs; Come See Us has
  // its own bios now (address details live in the footer instead), so any
  // other section — including Come See Us and the footer — just hides it.
  const intersecting = new Set();
  function resolveState() {
    if (DOCKED_SECTIONS.some((id) => intersecting.has(id))) return 'docked';
    return 'hidden';
  }

  function onIntersect(entries) {
    entries.forEach((entry) => {
      const id = entry.target.dataset.addressBoxWatch;
      if (entry.isIntersecting) intersecting.add(id);
      else intersecting.delete(id);
    });
    setState(resolveState());
  }

  const sectionObserver = new IntersectionObserver(onIntersect, { threshold: 0.5 });
  DOCKED_SECTIONS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.dataset.addressBoxWatch = id;
      sectionObserver.observe(el);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth <= 900) {
      box.classList.remove('is-visible');
      return;
    }
    if (state === 'docked') positionDocked(false);
    else positionOffscreen();
  });
}
