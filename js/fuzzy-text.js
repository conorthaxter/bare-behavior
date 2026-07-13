// Canvas "fuzzy text" effect: renders a word with soft, curly hair fibers
// growing out of its full 360° outline. All geometry (follicle detection +
// fiber shape) happens in a fixed REF-space coordinate system; the canvas's
// own transform matrix (device-pixel-ratio × the caller's scaleX/scaleY)
// stretches that ref-space drawing up to whatever final on-page size is
// needed, so the fiber constants below can stay literal (as specified)
// while the effect still reads as "bushy" at hero-heading sizes.

const REF_FONT_SIZE = 140; // reference px the follicle/fiber constants are tuned for
const PAD_REF = 22; // ref-space breathing room around the glyphs for fiber overflow
const SOLID_ALPHA = 60;
const ROOT_INSET = 2.5;
const NORMAL_RADIUS = 3;
const CULL_THRESHOLD = 0.5;
const SEGMENTS = 6;

function parseColor(varName, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const hex = /^#?[0-9a-f]{6}$/i.test(raw) ? raw.replace('#', '') : fallback;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function buildFollicles(word, fontString) {
  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');
  mctx.font = fontString;
  const metrics = mctx.measureText(word);
  const ascent = metrics.actualBoundingBoxAscent || REF_FONT_SIZE * 0.72;
  const descent = metrics.actualBoundingBoxDescent || REF_FONT_SIZE * 0.02;
  const textWidth = metrics.width;

  const refW = Math.ceil(textWidth + PAD_REF * 2);
  const refH = Math.ceil(ascent + descent + PAD_REF * 2);
  const baselineX = PAD_REF;
  const baselineY = PAD_REF + ascent;

  const off = document.createElement('canvas');
  off.width = refW;
  off.height = refH;
  const octx = off.getContext('2d');
  octx.font = fontString;
  octx.textAlign = 'left';
  octx.textBaseline = 'alphabetic';
  octx.fillStyle = '#000';
  octx.fillText(word, baselineX, baselineY);

  const { data } = octx.getImageData(0, 0, refW, refH);
  const solid = (x, y) => {
    if (x < 0 || y < 0 || x >= refW || y >= refH) return false;
    return data[(y * refW + x) * 4 + 3] > SOLID_ALPHA;
  };

  const follicles = [];
  for (let y = 0; y < refH; y++) {
    for (let x = 0; x < refW; x++) {
      if (!solid(x, y)) continue;
      let hasEmpty = false;
      for (let dy = -1; dy <= 1 && !hasEmpty; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (!solid(x + dx, y + dy)) { hasEmpty = true; break; }
        }
      }
      if (!hasEmpty) continue;
      if (Math.random() > CULL_THRESHOLD) continue;

      let nx = 0, ny = 0;
      for (let dy = -NORMAL_RADIUS; dy <= NORMAL_RADIUS; dy++) {
        for (let dx = -NORMAL_RADIUS; dx <= NORMAL_RADIUS; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (dx * dx + dy * dy > NORMAL_RADIUS * NORMAL_RADIUS) continue;
          if (!solid(x + dx, y + dy)) { nx += dx; ny += dy; }
        }
      }
      const nlen = Math.hypot(nx, ny);
      let normal;
      if (nlen < 0.0001) {
        const a = Math.random() * Math.PI * 2;
        normal = { x: Math.cos(a), y: Math.sin(a) };
      } else {
        normal = { x: nx / nlen, y: ny / nlen };
      }

      follicles.push({
        x: x - normal.x * ROOT_INSET,
        y: y - normal.y * ROOT_INSET,
        angle: Math.atan2(normal.y, normal.x),
      });
    }
  }

  const fibers = [];
  follicles.forEach((f) => {
    const count = 2 + Math.floor(Math.random() * 4); // 2..5
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() * 2 - 1) * 0.9;
      fibers.push({
        x: f.x,
        y: f.y,
        angle: f.angle + spread,
        len: 6 + Math.random() * 6,
        curl: (Math.random() - 0.5) * 2.6,
        base: 1.0 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        sway: 0.25 + Math.random() * 0.4,
        shade: 0.3 + Math.random() * 0.35,
      });
    }
  });

  return { refW, refH, baselineX, baselineY, fibers, textWidth };
}

function fiberPolygon(fiber, growth, t) {
  const centerline = [{ x: fiber.x, y: fiber.y }];
  let heading = fiber.angle;
  let x = fiber.x;
  let y = fiber.y;
  for (let s = 1; s <= SEGMENTS; s++) {
    const prog = s / SEGMENTS;
    const breeze = Math.sin(t * 1.4 + fiber.phase) * fiber.sway * growth;
    heading += fiber.curl * 0.09 * (0.4 + prog) + breeze * 0.05 * prog;
    const stepLen = (fiber.len * growth) / SEGMENTS;
    x += Math.cos(heading) * stepLen;
    y += Math.sin(heading) * stepLen;
    centerline.push({ x, y });
  }

  const left = [];
  const right = [];
  for (let s = 0; s <= SEGMENTS; s++) {
    const prog = s / SEGMENTS;
    const width = fiber.base * (1 - prog) * (1 - prog * 0.6) * growth;
    const a = centerline[Math.max(0, s - 1)];
    const b = centerline[Math.min(SEGMENTS, s + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLen = Math.hypot(dx, dy) || 1;
    const px = -dy / segLen;
    const py = dx / segLen;
    const c = centerline[s];
    left.push({ x: c.x + (px * width) / 2, y: c.y + (py * width) / 2 });
    right.push({ x: c.x - (px * width) / 2, y: c.y - (py * width) / 2 });
  }
  return { left, right };
}

export function createFuzzyText({ canvas, word, fontFamily, fontWeight = '400', colorVar = '--ink', colorFallback = '342222' }) {
  const ctx = canvas.getContext('2d');
  const fontString = () => `${fontWeight} ${REF_FONT_SIZE}px ${fontFamily}`;

  // Deferred, not built here: measuring/scanning glyphs before the webfont
  // has actually finished loading silently falls back to a different font's
  // metrics, producing a wrong (and load-to-load *inconsistent*, since font
  // load timing races) natural width. Built lazily on the first setBox()
  // call instead, which the caller only makes once document.fonts.ready
  // has resolved.
  let layout = null;
  let color = parseColor(colorVar, colorFallback);
  let growth = 0;
  let target = 0;
  let t = Math.random() * 10;
  let scaleX = 1;
  let scaleY = 1;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let rafId = null;
  let running = false;

  function applyCanvasSize() {
    const cssW = layout.refW * scaleX;
    const cssH = layout.refH * scaleY;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    // The canvas box is padded (PAD_REF) beyond the glyphs themselves for
    // fiber overflow room — pull it back by that same scaled amount so the
    // *visible text*, not the padded box, is what lines up with the wrap's
    // left edge (otherwise the glyphs land visibly right of where the rest
    // of the hero's margin math expects them).
    canvas.style.marginLeft = -(PAD_REF * scaleX) + 'px';
    canvas.style.marginTop = -(PAD_REF * scaleY) + 'px';
  }

  function frame() {
    if (!layout) { running = false; return; } // setBox() hasn't run yet — nothing to paint

    growth += (target - growth) * 0.12;
    t += 0.016;

    ctx.setTransform(dpr * scaleX, 0, 0, dpr * scaleY, 0, 0);
    ctx.clearRect(0, 0, layout.refW, layout.refH);

    if (growth > 0.001) {
      const rgb = `${color.r},${color.g},${color.b}`;
      layout.fibers.forEach((fiber) => {
        const { left, right } = fiberPolygon(fiber, growth, t);
        ctx.beginPath();
        ctx.moveTo(left[0].x, left[0].y);
        for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
        for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
        ctx.closePath();
        ctx.fillStyle = `rgba(${rgb},${fiber.shade})`;
        ctx.fill();
      });
    }

    ctx.font = fontString();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    ctx.fillText(word, layout.baselineX, layout.baselineY);

    // Only stop the loop once fully retracted and idle — while any fuzz is
    // showing (growth > 0) the idle breeze sway must keep animating, even
    // once growth has settled at its target.
    const idleAtZero = target === 0 && growth < 0.001;
    if (idleAtZero) {
      growth = 0;
      running = false;
      return;
    }
    rafId = requestAnimationFrame(frame);
  }

  function ensureRunning() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }

  let isHovering = false;
  // Hover only drives the effect while "armed". Disarmed for the duration of
  // the intro's one-shot bush-up so a cursor that happens to already be
  // resting over FUZZ on load can't fight the retract (either re-triggering
  // mid-hold, or snapping the fuzz back up right after it just shrank down).
  // Stays armed by default so returning visitors — who never get a one-shot,
  // see showFinalState() in intro.js — get plain, always-on hover.
  let hoverArmed = true;

  function setBox({ fontSizePx, targetWidth }) {
    if (!layout) layout = buildFollicles(word, fontString());
    scaleY = fontSizePx / REF_FONT_SIZE;
    // The canvas transform applies scaleX/scaleY as independent axes (not
    // sequential/compounding), so the X scale needed to hit targetWidth is
    // solved directly against the ref-space text width — scaleY plays no
    // part in it. Scale X against the *text* width only (not the padded ref
    // box) so the fiber breathing room doesn't skew the fit — it just
    // stretches along for the ride.
    scaleX = targetWidth > 0 && layout.textWidth > 0 ? targetWidth / layout.textWidth : scaleY;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    applyCanvasSize();
    ensureRunning(); // paint at least one resting frame so the box isn't blank
  }

  function playOneShot() {
    hoverArmed = false; // a resting cursor can't fight this one-shot
    target = 1;
    ensureRunning();
    setTimeout(() => {
      // Always retract — a cursor merely resting over FUZZ (never having
      // left and re-entered) doesn't count as a real hover trigger.
      target = 0;
      ensureRunning();
      // If nothing's there right now, it's safe to arm immediately. If the
      // cursor IS resting on it, stay disarmed until a genuine leave fires
      // (below) — otherwise it'd jump right back to fuzzy the instant it
      // finished retracting.
      if (!isHovering) hoverArmed = true;
    }, 600);
  }

  function armHover() {
    const enter = () => {
      isHovering = true;
      if (hoverArmed) { target = 1; ensureRunning(); }
    };
    const leave = () => {
      isHovering = false;
      hoverArmed = true;
      target = 0;
      ensureRunning();
    };
    canvas.addEventListener('pointerenter', enter);
    canvas.addEventListener('pointerdown', enter);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('pointerup', leave);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); enter(); }, { passive: false });
    canvas.addEventListener('touchend', (e) => { e.preventDefault(); leave(); }, { passive: false });
  }

  armHover();

  return { setBox, playOneShot };
}
