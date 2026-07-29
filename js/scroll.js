function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initScrollSnap() {
  if (prefersReducedMotion()) return;
  document.documentElement.classList.add('snap-enabled');
}

export function initNavActiveState() {
  const navLinks = [...document.querySelectorAll('.site-nav a[data-section]')];
  if (!navLinks.length) return;
  const sections = navLinks
    .map((a) => document.getElementById(a.dataset.section))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.section === id));
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach((s) => observer.observe(s));
}

// Uniform per-card choreography (services / info / faqs): title
// slides in from the right and settles BEFORE content starts its
// opacity+upward entrance; on the way out, title slides off left before
// content fades/drops away. Same lead-then-follow relationship in both
// directions, just mirrored.
const CARD_STAGGER_MS = 220;

export function initCardTransitions() {
  const cards = [
    { section: document.getElementById('info'), title: document.querySelector('#info .card-title'), content: [document.querySelector('#info .card-content')] },
    { section: document.getElementById('faqs'), title: document.querySelector('#faqs .card-title'), content: [document.querySelector('#faqs .card-content')] },
  ].filter((c) => c.section && c.title);

  if (!cards.length) return;

  if (prefersReducedMotion()) {
    cards.forEach(({ title, content }) => {
      title.classList.add('is-in-view');
      content.forEach((el) => el && el.classList.add('is-in-view'));
    });
    return;
  }

  cards.forEach(({ section, title, content }) => {
    let enterTimer = null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          clearTimeout(enterTimer);
          if (entry.isIntersecting) {
            title.classList.remove('is-exiting');
            title.classList.add('is-in-view');
            enterTimer = setTimeout(() => {
              content.forEach((el) => {
                if (!el) return;
                el.classList.remove('is-exiting');
                el.classList.add('is-in-view');
              });
            }, CARD_STAGGER_MS);
          } else {
            title.classList.remove('is-in-view');
            title.classList.add('is-exiting');
            content.forEach((el) => {
              if (!el) return;
              el.classList.remove('is-in-view');
              el.classList.add('is-exiting');
            });
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(section);
  });
}

export function initTitleReveal() {
  // Come See Us (bottom-up reveal + its bios) and the Services title (its
  // figures/list have their own bespoke draw-on in playServicesIntro, so
  // only the title itself needs the generic right-in/left-out treatment
  // here) — neither is part of the card-content system above.
  const targets = [
    { title: document.querySelector('.come-see-us-title'), content: document.querySelector('.bios') },
    { title: document.querySelector('.services-title'), content: null },
  ].filter((t) => t.title);

  if (!targets.length) return;

  if (prefersReducedMotion()) {
    targets.forEach(({ title, content }) => {
      title.classList.add('is-in-view');
      if (content) content.classList.add('is-in-view');
    });
    return;
  }

  targets.forEach(({ title, content }) => {
    const section = title.closest('.section');
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          title.classList.toggle('is-in-view', entry.isIntersecting);
          title.classList.toggle('is-exiting', !entry.isIntersecting);
          if (content) {
            setTimeout(() => content.classList.toggle('is-in-view', entry.isIntersecting), entry.isIntersecting ? CARD_STAGGER_MS : 0);
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(section);
  });
}

export function initServicesReveal(playServicesIntro) {
  const services = document.getElementById('services');
  if (!services) return;

  if (prefersReducedMotion()) {
    playServicesIntro({ instant: true });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playServicesIntro({ instant: false });
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 }
  );
  observer.observe(services);
}
