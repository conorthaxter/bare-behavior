import { SERVICE_REGIONS, CATEGORY_ORDER, formatPrice } from './services-data.js';

const VIEWBOX = { w: 329.32, h: 754.19 };
const BACK_VIEWBOX_NATIVE = { w: 324.23, h: 749.24 };
const BACK_OFFSET = {
  x: (VIEWBOX.w - BACK_VIEWBOX_NATIVE.w) / 2,
  y: (VIEWBOX.h - BACK_VIEWBOX_NATIVE.h) / 2,
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function loadSvg(url) {
  const res = await fetch(url);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  return doc.documentElement;
}

const regionEls = {};
let frontSvgEl = null;
let backSvgEl = null;

export async function initServices() {
  const frontSlot = document.querySelector('.figure-front');
  const backSlot = document.querySelector('.figure-back');
  if (!frontSlot || !backSlot) return;

  const [frontSvg, backSvg] = await Promise.all([
    loadSvg('assets/body-front.svg'),
    loadSvg('assets/body-back.svg'),
  ]);

  frontSvg.setAttribute('viewBox', `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`);
  frontSvg.removeAttribute('width');
  frontSvg.removeAttribute('height');
  frontSlot.appendChild(frontSvg);
  frontSvgEl = frontSvg;

  // Recenter the back figure (its own artwork is slightly off-center vs front) into the shared viewBox.
  const backGroup = document.createElementNS(SVG_NS, 'g');
  backGroup.setAttribute('transform', `translate(${BACK_OFFSET.x}, ${BACK_OFFSET.y})`);
  [...backSvg.childNodes].forEach((node) => {
    if (node.nodeType === 1) backGroup.appendChild(node);
    else backSvg.removeChild(node);
  });
  backSvg.appendChild(backGroup);
  backSvg.setAttribute('viewBox', `0 0 ${VIEWBOX.w} ${VIEWBOX.h}`);
  backSvg.removeAttribute('width');
  backSvg.removeAttribute('height');
  backSlot.appendChild(backSvg);
  backSvgEl = backSvg;

  SERVICE_REGIONS.forEach((region) => {
    const svg = region.side === 'front' ? frontSvg : backSvg;
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', region.dotXY[0]);
    circle.setAttribute('cy', region.dotXY[1]);
    circle.setAttribute('r', 8);
    circle.setAttribute('class', 'figure-dot');
    circle.setAttribute('data-region', region.id);
    circle.setAttribute('tabindex', '0');
    circle.setAttribute('role', 'button');
    circle.setAttribute('aria-label', region.items.map((i) => i.name).join(', '));
    svg.appendChild(circle);
    regionEls[region.id] = { region, circle };
  });

  renderMenu();
  wireInteractions();
  renderMobileList();
}

// Body alone in column 1; Below the Belt + Face stack in column 2 (Face
// underneath Below the Belt) — Body's item count alone is close to what
// Face+Below the Belt add up to together, which keeps both columns roughly
// the same height instead of one running much longer than the other.
const COLUMN_2_CATEGORIES = ['Below the Belt', 'Face'];

function renderMenu() {
  const menu = document.getElementById('services-menu');
  if (!menu) return;
  menu.innerHTML = '';

  const col1 = document.createElement('div');
  col1.className = 'services-menu-column';
  const col2 = document.createElement('div');
  col2.className = 'services-menu-column';
  menu.appendChild(col1);
  menu.appendChild(col2);

  // Column 2's own internal order (Below the Belt, then Face underneath)
  // differs from CATEGORY_ORDER (used elsewhere, e.g. the mobile list) —
  // render in that explicit sequence rather than CATEGORY_ORDER's.
  const renderOrder = ['Body', ...COLUMN_2_CATEGORIES];

  renderOrder.forEach((category) => {
    const regions = SERVICE_REGIONS.filter((r) => r.category === category);
    if (!regions.length) return;

    const catEl = document.createElement('div');
    catEl.className = 'services-category';
    catEl.dataset.category = category;

    const title = document.createElement('div');
    title.className = 'services-category-title';
    title.dataset.category = category;
    title.textContent = category;
    catEl.appendChild(title);

    regions.forEach((region) => {
      region.items.forEach((item, idx) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'service-item-row';
        row.textContent = item.name;
        row.dataset.region = region.id;
        row.dataset.itemIndex = idx;
        catEl.appendChild(row);
      });
    });

    (COLUMN_2_CATEGORIES.includes(category) ? col2 : col1).appendChild(catEl);
  });
}

let activeRegionId = null;

function wireInteractions() {
  const infobox = document.getElementById('service-infobox');
  const connector = infobox.querySelector('.infobox-connector');
  const content = infobox.querySelector('.infobox-content');
  const wrap = document.querySelector('.services-figures-wrap');

  function clearActive() {
    activeRegionId = null;
    Object.values(regionEls).forEach(({ circle }) => circle.classList.remove('is-active'));
    document.querySelectorAll('.service-item-row').forEach((el) => {
      el.classList.remove('is-active');
      el.classList.remove('is-dim');
    });
    document.querySelectorAll('.services-category-title').forEach((el) => el.classList.remove('is-dim'));
    infobox.classList.remove('is-visible');
  }

  function activate(regionId, emphasizedIndex) {
    activeRegionId = regionId;
    const { region, circle } = regionEls[regionId];

    Object.values(regionEls).forEach(({ circle: c }) => c.classList.toggle('is-active', c === circle));

    document.querySelectorAll('.services-category-title').forEach((el) => {
      el.classList.toggle('is-dim', el.dataset.category !== region.category);
    });
    // Only the exact hovered item lights up — not every item sharing its
    // dot/region. Hovering the dot itself (emphasizedIndex == null, no one
    // specific item) leaves the whole list dim; hovering a list row lights
    // up only that row.
    document.querySelectorAll('.service-item-row').forEach((el) => {
      const isExactItem = el.dataset.region === regionId && Number(el.dataset.itemIndex) === emphasizedIndex;
      el.classList.toggle('is-active', isExactItem);
      el.classList.toggle('is-dim', !isExactItem);
    });

    content.innerHTML = '';
    region.items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'infobox-row';
      if (emphasizedIndex == null || idx === emphasizedIndex) row.classList.add('is-emphasized');
      const name = document.createElement('span');
      name.textContent = item.name;
      const price = document.createElement('span');
      price.textContent = formatPrice(item);
      row.appendChild(name);
      row.appendChild(price);
      content.appendChild(row);
    });

    positionInfobox(region, circle, infobox, connector, wrap);
    infobox.classList.add('is-visible');
  }

  Object.entries(regionEls).forEach(([id, { circle }]) => {
    circle.addEventListener('mouseenter', () => activate(id));
    circle.addEventListener('focus', () => activate(id));
    circle.addEventListener('mouseleave', clearActive);
    circle.addEventListener('blur', clearActive);
  });

  document.querySelectorAll('.service-item-row').forEach((row) => {
    row.addEventListener('mouseenter', () => activate(row.dataset.region, Number(row.dataset.itemIndex)));
    row.addEventListener('focus', () => activate(row.dataset.region, Number(row.dataset.itemIndex)));
    row.addEventListener('mouseleave', clearActive);
    row.addEventListener('blur', clearActive);
  });

  window.addEventListener('resize', () => {
    if (activeRegionId) {
      const { region, circle } = regionEls[activeRegionId];
      positionInfobox(region, circle, infobox, connector, wrap);
    }
  });
}

function positionInfobox(region, circle, infobox, connector, wrap) {
  const wrapRect = wrap.getBoundingClientRect();
  const circleRect = circle.getBoundingClientRect();
  const cx = circleRect.left + circleRect.width / 2 - wrapRect.left;
  const cy = circleRect.top + circleRect.height / 2 - wrapRect.top;

  const boxWidth = infobox.offsetWidth || 240;
  const OFFSET_X = 40;
  const TOP_MARGIN = 14;

  const left = region.boxSide === 'right' ? cx + OFFSET_X : cx - OFFSET_X - boxWidth;
  const top = cy - TOP_MARGIN;

  infobox.style.left = `${left}px`;
  infobox.style.top = `${top}px`;

  const connLeft = region.boxSide === 'right' ? cx : left + boxWidth;
  const connWidth = region.boxSide === 'right' ? left - cx : cx - (left + boxWidth);
  connector.style.top = `${cy}px`;
  connector.style.left = `${connLeft}px`;
  connector.style.width = `${Math.max(connWidth, 0)}px`;
}

function renderMobileList() {
  const list = document.getElementById('services-mobile-list');
  if (!list) return;
  list.innerHTML = '';

  CATEGORY_ORDER.forEach((category) => {
    const regions = SERVICE_REGIONS.filter((r) => r.category === category);
    if (!regions.length) return;

    const catEl = document.createElement('div');
    catEl.className = 'services-category';

    const title = document.createElement('div');
    title.className = 'services-category-title';
    title.dataset.category = category;
    title.textContent = category;
    catEl.appendChild(title);

    regions.forEach((region) => {
      region.items.forEach((item, idx) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'service-item-row';
        row.textContent = item.name;
        row.addEventListener('click', () => openMobileModal(region, idx));
        catEl.appendChild(row);
      });
    });

    list.appendChild(catEl);
  });
}

async function openMobileModal(region, itemIndex) {
  const overlay = document.getElementById('service-modal');
  if (!overlay) return;
  const item = region.items[itemIndex];

  overlay.querySelector('.service-modal-title').textContent = item.name;
  overlay.querySelector('.service-modal-price').textContent = formatPrice(item);
  overlay.querySelector('.service-modal-desc').textContent = item.note || '';

  const figureHost = overlay.querySelector('.service-modal-figure');
  figureHost.innerHTML = '';
  const svgUrl = region.side === 'front' ? 'assets/body-front.svg' : 'assets/body-back.svg';
  const svg = await loadSvg(svgUrl);
  const nativeW = region.side === 'front' ? VIEWBOX.w : BACK_VIEWBOX_NATIVE.w;
  const nativeH = region.side === 'front' ? VIEWBOX.h : BACK_VIEWBOX_NATIVE.h;
  svg.setAttribute('viewBox', `0 0 ${nativeW} ${nativeH}`);
  svg.removeAttribute('width');
  svg.removeAttribute('height');

  const dotX = region.side === 'front' ? region.dotXY[0] : region.dotXY[0] - BACK_OFFSET.x;
  const dotY = region.side === 'front' ? region.dotXY[1] : region.dotXY[1] - BACK_OFFSET.y;
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', dotX);
  circle.setAttribute('cy', dotY);
  circle.setAttribute('r', 9);
  circle.setAttribute('class', 'figure-dot');
  svg.appendChild(circle);
  figureHost.appendChild(svg);

  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('is-open'));
}

export function closeMobileModal() {
  const overlay = document.getElementById('service-modal');
  if (!overlay) return;
  overlay.classList.remove('is-open');
  setTimeout(() => {
    overlay.hidden = true;
  }, 400);
}

// ---------- Phase 5f: enter-view animations ----------
let servicesIntroPlayed = false;

export function playServicesIntro({ instant } = {}) {
  if (servicesIntroPlayed) return;
  servicesIntroPlayed = true;

  const title = document.querySelector('.services-title');
  const dots = Object.values(regionEls).map((r) => r.circle);
  const listRows = [...document.querySelectorAll('.services-menu .services-category-title, .services-menu .service-item-row')];
  const frontPaths = frontSvgEl ? [...frontSvgEl.querySelectorAll('path')] : [];
  const backPaths = backSvgEl ? [...backSvgEl.querySelectorAll('path')] : [];

  if (instant || prefersReducedMotion() || !window.gsap) {
    dots.forEach((d) => d.setAttribute('transform', 'scale(1)'));
    return;
  }

  const gsapInstance = window.gsap;
  const allPaths = [...frontPaths, ...backPaths];

  gsapInstance.set(dots, { scale: 0, transformOrigin: '50% 50%' });
  gsapInstance.set(listRows, { opacity: 0, y: 16 });
  gsapInstance.set(title, { opacity: 0, y: 24 });

  // Both figures are the same open-outline artwork (not a solid silhouette),
  // so both draw on identically via stroke-dasharray/dashoffset.
  allPaths.forEach((path) => {
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
  });

  const tl = gsapInstance.timeline();

  tl.to(title, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
  tl.to(
    allPaths,
    { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.015 },
    '-=0.2'
  );
  tl.to(
    dots,
    { scale: 1, duration: 0.4, ease: 'back.out(2.5)', stagger: 0.06 },
    '-=0.3'
  );
  tl.to(
    listRows,
    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.04 },
    '-=0.5'
  );
}
