(function () {
  const CHAR_W = 4.2;   // 7px monospace ≈ 4.2px wide
  const CHAR_H = 9.0;   // 7px × 1.28 line-height ≈ 9px tall

  // Ordered sparse → dense; inverted brightness maps dark image areas to dense chars
  const RAMP   = ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
  const rampN  = RAMP.length - 1;

  let shape, sCtx, out, oCtx;
  let W, H;
  let img, imgReady = false;
  let lastFrame = 0, t0;
  const FRAME_MS = 1000 / 12;   // 12fps — plenty smooth for a slow background drift
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    out = document.getElementById('ascii-face');
    if (!out) return;

    shape = document.createElement('canvas');
    sCtx  = shape.getContext('2d', { willReadFrequently: true });
    oCtx  = out.getContext('2d');

    img        = new Image();
    img.onload = function () {
      imgReady = true;
      if (reduceMotion) render(0);
    };
    img.src    = 'assets/img/face.jpg';

    resize();
    window.addEventListener('resize', resize);
    if (!reduceMotion) {
      t0 = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function resize() {
    // Backing store scaled by devicePixelRatio so glyphs stay sharp on retina
    const dpr = window.devicePixelRatio || 1;
    W = Math.ceil(window.innerWidth  / CHAR_W);
    H = Math.ceil(window.innerHeight / CHAR_H);
    shape.width  = W;
    shape.height = H;
    out.width        = Math.round(window.innerWidth  * dpr);
    out.height       = Math.round(window.innerHeight * dpr);
    out.style.width  = window.innerWidth  + 'px';
    out.style.height = window.innerHeight + 'px';
    oCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    oCtx.font         = '7px monospace';
    oCtx.textBaseline = 'top';
    if (reduceMotion && imgReady) render(0);
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;
    render((now - t0) / 1000);
  }

  function clamp(mn, v, mx) { return v < mn ? mn : v > mx ? mx : v; }

  // HSL → RGB  (h, s, l all in [0, 1])
  function h2r(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  function hsl(h, s, l) {
    h = ((h % 1) + 1) % 1;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      Math.round(h2r(p, q, h + 1/3) * 255),
      Math.round(h2r(p, q, h)       * 255),
      Math.round(h2r(p, q, h - 1/3) * 255)
    ];
  }

  function drawFace(t) {
    // Dark fill ensures full-viewport coverage — no transparent gaps
    sCtx.fillStyle = '#06060a';
    sCtx.fillRect(0, 0, W, H);
    if (!imgReady) return;

    const imgAR = img.naturalWidth / img.naturalHeight;
    const vpAR  = W / H;

    // Cover: scale so the image fills the viewport dimension that's limiting
    let scale = vpAR > imgAR
      ? W / img.naturalWidth     // wide viewport: fill by width
      : H / img.naturalHeight;   // tall viewport: fill by height

    scale *= 1.12;  // slightly oversized so drift stays within bounds

    // Slow breath + drift
    const zoom   = 1.0 + 0.03 * Math.sin(t * 0.13);
    const driftX =       0.012 * W * Math.sin(t * 0.07);
    const driftY =       0.012 * H * Math.sin(t * 0.09);

    const dw = img.naturalWidth  * scale * zoom;
    const dh = img.naturalHeight * scale * zoom;

    // Horizontally centered; vertically biased upward to frame the face
    const dx = (W - dw) / 2 + driftX;
    const dy = (H - dh) * 0.25  + driftY;   // 25% from top shows hat→chin on portrait

    sCtx.drawImage(img, dx, dy, dw, dh);
  }

  function render(t) {
    drawFace(t);
    const pixels = sCtx.getImageData(0, 0, W, H).data;

    // Build a 64-entry color table once per frame — one HSL call per bucket, not per pixel.
    // Colors shift with time so the face keeps cycling.
    const BUCKETS = 64;
    const timeRot = (t * 0.045) % 1;
    const colorTable = new Array(BUCKETS);
    for (let bi = 0; bi < BUCKETS; bi++) {
      const bv  = bi / (BUCKETS - 1);
      const h   = (bv * 0.78 + timeRot) % 1;
      const s   = 0.95;
      const l   = clamp(0.14, 0.20 + bv * 0.26, 0.46);
      const [cr, cg, cb] = hsl(h, s, l);
      colorTable[bi] = `rgb(${cr},${cg},${cb})`;
    }

    oCtx.clearRect(0, 0, out.width, out.height);
    let lastColor = '';

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];

        let bri = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        bri = clamp(0, (bri - 0.10) * 1.55, 1);
        bri += 0.03 * Math.sin(x * 0.72 + t * 4.1) * Math.cos(y * 0.55 - t * 2.9);
        bri  = clamp(0, bri, 1);

        const ch = RAMP[Math.round((1 - bri) * rampN)];
        if (ch === ' ') continue;

        const color = colorTable[Math.round(bri * (BUCKETS - 1))];
        if (color !== lastColor) { oCtx.fillStyle = color; lastColor = color; }
        oCtx.fillText(ch, x * CHAR_W, y * CHAR_H);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
