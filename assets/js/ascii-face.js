(function () {
  // Monospace chars at 9px are ~2× taller than wide.
  // Every horizontal measurement on the canvas (in cols) must be multiplied
  // by ASPECT so the face appears correctly proportioned on screen.
  const CHAR_W  = 5.5;                    // px per character (Courier New @ 9px)
  const CHAR_H  = 11.5;                   // px per line (9px × 1.28 line-height)
  const ASPECT  = CHAR_H / CHAR_W;        // ≈ 2.09 — cols must be wider to look right

  // Dark → light ramp.  We INVERT brightness before indexing so that
  // dark canvas pixels → dense chars (appear dark on white page) and
  // bright canvas pixels → sparse chars (appear light / invisible).
  const RAMP = ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

  let canvas, ctx, pre;
  let W, H;
  let rafId, t0;

  // ─── init ────────────────────────────────────────────────────────
  function init() {
    pre = document.getElementById('ascii-face');
    if (!pre) return;

    canvas = document.createElement('canvas');
    ctx    = canvas.getContext('2d', { willReadFrequently: true });

    resize();
    window.addEventListener('resize', () => { resize(); });

    t0 = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function resize() {
    W = Math.ceil(window.innerWidth  / CHAR_W);
    H = Math.ceil(window.innerHeight / CHAR_H);
    canvas.width  = W;
    canvas.height = H;
  }

  let lastFrame = 0;
  const TARGET_FPS = 24;
  const FRAME_MS   = 1000 / TARGET_FPS;

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;
    render((now - t0) / 1000);
  }

  // ─── draw face onto hidden canvas ────────────────────────────────
  // All x-coordinates are in COLUMN units, y in ROW units.
  // The face's horizontal extent in columns is stretched by ASPECT so
  // it looks proportional when each column is ~2× narrower than each row.
  function drawFace(t) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Face dimensions — make it large and fill the viewport.
    const fh = H * 1.28;                      // face height in rows (taller than screen)
    const fw = fh * 0.72 * ASPECT;            // face width in cols (corrected for aspect)

    const cx = W * 0.5;
    // Position so eyes sit at ~38% down the viewport.
    const EYE_OFFSET = fh * 0.10;             // eyes are 10% above face center
    const cy = H * 0.38 + EYE_OFFSET;

    // Rotating key light
    const angle = t * 0.38;
    const lx = cx + Math.cos(angle)        * fw * 0.55;
    const ly = cy + Math.sin(angle * 0.55) * fh * 0.18 - fh * 0.05;

    // ── Face oval ──
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, fw / 2, fh / 2, 0, 0, Math.PI * 2);
    ctx.clip();

    // Skin base
    const skin = ctx.createRadialGradient(cx, cy - fh * 0.04, 0, cx, cy, fh * 0.62);
    skin.addColorStop(0,    '#d5d5d5');
    skin.addColorStop(0.45, '#a0a0a0');
    skin.addColorStop(0.78, '#5a5a5a');
    skin.addColorStop(1,    '#111');
    ctx.fillStyle = skin;
    ctx.fillRect(0, 0, W, H);

    // Key light
    const kl = ctx.createRadialGradient(lx, ly, 0, lx, ly, fw * 0.88);
    kl.addColorStop(0,    'rgba(255,255,255,0.60)');
    kl.addColorStop(0.38, 'rgba(255,255,255,0.26)');
    kl.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = kl;
    ctx.fillRect(0, 0, W, H);

    // Rim light (opposite side)
    const rlx = cx - (lx - cx) * 0.4;
    const rly = cy - (ly - cy) * 0.3;
    const rl  = ctx.createRadialGradient(rlx, rly, 0, rlx, rly, fw * 0.7);
    rl.addColorStop(0, 'rgba(180,180,180,0.18)');
    rl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rl;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();

    // ── Hair ──
    ctx.save();
    // Top mass
    ctx.beginPath();
    ctx.ellipse(cx, cy - fh * 0.3, fw * 0.52, fh * 0.34, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#090909';
    ctx.fill();
    // Sides
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + s * fw * 0.44, cy - fh * 0.14, fw * 0.12, fh * 0.24, s * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = '#090909';
      ctx.fill();
      // Hair shadow onto face
      const hs = ctx.createRadialGradient(cx + s * fw * 0.45, cy, 0, cx + s * fw * 0.45, cy, fw * 0.22);
      hs.addColorStop(0, 'rgba(0,0,0,0.55)');
      hs.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hs;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // ── Shared eye measurements ──
    const eyY  = cy - EYE_OFFSET;             // eye center row
    const eyX  = fw * 0.195;                  // half-distance between eyes (cols)
    // For a ~3:1 eye ratio on screen: erx_screen / ery_screen = 3
    // erx*CHAR_W / (ery*CHAR_H) = 3  →  erx = 3 * ery * ASPECT
    const ery  = fh * 0.030;                  // eye half-height in rows
    const erx  = ery * 3 * ASPECT;            // eye half-width in cols (proportional)
    const browY = eyY - ery * 4.2;

    // ── Eyebrows ──
    ctx.lineWidth = ery * 1.2;
    ctx.lineCap   = 'round';
    for (const s of [-1, 1]) {
      const ex = cx + s * eyX;
      ctx.beginPath();
      ctx.moveTo(ex - erx * 1.1, browY + ery * (s < 0 ?  0.6 : -0.6));
      ctx.quadraticCurveTo(ex, browY - ery * 1.4,
                           ex + erx * 1.1, browY + ery * (s < 0 ? -0.6 :  0.6));
      ctx.strokeStyle = 'rgba(6,6,6,0.92)';
      ctx.stroke();
    }

    // ── Eyes ──
    for (const s of [-1, 1]) {
      const ex = cx + s * eyX;

      // Socket shadow
      const sock = ctx.createRadialGradient(ex, eyY, 0, ex, eyY, erx * 1.8);
      sock.addColorStop(0,    'rgba(0,0,0,0.7)');
      sock.addColorStop(0.55, 'rgba(0,0,0,0.35)');
      sock.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = sock;
      ctx.beginPath();
      ctx.ellipse(ex, eyY, erx * 1.85, ery * 3.0, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyelid clip
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, eyY, erx, ery, 0, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(ex - erx, eyY - ery, erx * 2, ery * 2);

      // Iris
      const iris = ctx.createRadialGradient(ex, eyY, 0, ex, eyY, ery * 0.92);
      iris.addColorStop(0,   '#58637a');
      iris.addColorStop(0.5, '#2e3548');
      iris.addColorStop(1,   '#0d1020');
      ctx.fillStyle = iris;
      ctx.beginPath();
      ctx.arc(ex, eyY, ery * 0.92, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(ex, eyY, ery * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Catchlight
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.arc(ex - ery * 0.32, eyY - ery * 0.3, ery * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Lid edge
      ctx.beginPath();
      ctx.ellipse(ex, eyY, erx, ery, 0, 0, Math.PI * 2);
      ctx.lineWidth   = 0.7;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.stroke();

      // Under-eye shadow
      const ue = ctx.createRadialGradient(ex, eyY + ery * 1.7, 0, ex, eyY + ery * 1.7, erx * 1.1);
      ue.addColorStop(0, 'rgba(0,0,0,0.28)');
      ue.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ue;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Nose ──
    // Nose measurements in same corrected units
    const nW    = fw  * 0.12;              // nostril spread (cols)
    const nBaseY = eyY + fh * 0.18;        // nose base row
    const nTipY  = eyY + fh * 0.135;       // nose tip row

    // Bridge highlight
    const bh = ctx.createLinearGradient(cx - nW * 0.3, eyY + ery * 2, cx + nW * 0.3, nBaseY);
    bh.addColorStop(0,   'rgba(255,255,255,0)');
    bh.addColorStop(0.4, 'rgba(255,255,255,0.22)');
    bh.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = bh;
    ctx.beginPath();
    ctx.ellipse(cx, nTipY, nW * 0.28, fh * 0.062, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nostril shadows
    for (const s of [-1, 1]) {
      const ns = ctx.createRadialGradient(cx + s * nW * 0.88, nBaseY, 0,
                                          cx + s * nW * 0.88, nBaseY, nW * 0.85);
      ns.addColorStop(0, 'rgba(0,0,0,0.52)');
      ns.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ns;
      ctx.beginPath();
      ctx.ellipse(cx + s * nW * 0.88, nBaseY, nW * 0.82, fh * 0.048, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nostrils
    for (const s of [-1, 1]) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.beginPath();
      ctx.ellipse(cx + s * nW * 0.7, nBaseY + fh * 0.02,
                  nW * 0.36, fh * 0.022, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tip highlight
    const th = ctx.createRadialGradient(cx, nTipY, 0, cx, nTipY, nW * 0.7);
    th.addColorStop(0, 'rgba(255,255,255,0.3)');
    th.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = th;
    ctx.fillRect(0, 0, W, H);

    // ── Mouth ──
    const mY = eyY + fh * 0.26;
    const mW = fw  * 0.22;
    const lH = fh  * 0.040;

    // Philtrum shadow
    const ph = ctx.createRadialGradient(cx, nBaseY + fh * 0.04, 0, cx, nBaseY + fh * 0.04, nW * 0.5);
    ph.addColorStop(0, 'rgba(0,0,0,0.22)');
    ph.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ph;
    ctx.fillRect(0, 0, W, H);

    // Lips
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - mW, mY);
    ctx.bezierCurveTo(cx - mW * 0.52, mY - lH * 0.58,
                      cx - mW * 0.13, mY - lH * 1.18, cx,             mY - lH * 0.92);
    ctx.bezierCurveTo(cx + mW * 0.13, mY - lH * 1.18,
                      cx + mW * 0.52, mY - lH * 0.58, cx + mW,        mY);
    ctx.bezierCurveTo(cx + mW * 0.6,  mY + lH * 1.28,
                      cx - mW * 0.6,  mY + lH * 1.28, cx - mW,        mY);
    ctx.closePath();
    const lg = ctx.createLinearGradient(cx, mY - lH, cx, mY + lH * 1.28);
    lg.addColorStop(0,   '#8a8a8a');
    lg.addColorStop(0.4, '#787878');
    lg.addColorStop(1,   '#484848');
    ctx.fillStyle = lg;
    ctx.fill();
    // Lower lip highlight
    ctx.beginPath();
    ctx.ellipse(cx, mY + lH * 0.65, mW * 0.32, lH * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.restore();

    // Lip crease
    ctx.beginPath();
    ctx.moveTo(cx - mW, mY);
    ctx.bezierCurveTo(cx - mW * 0.3, mY + lH * 0.15,
                      cx + mW * 0.3, mY + lH * 0.15, cx + mW, mY);
    ctx.lineWidth   = 1.1;
    ctx.strokeStyle = 'rgba(0,0,0,0.58)';
    ctx.stroke();

    // Mouth corner shadows
    for (const s of [-1, 1]) {
      const cs = ctx.createRadialGradient(cx + s * mW, mY, 0, cx + s * mW, mY, mW * 0.25);
      cs.addColorStop(0, 'rgba(0,0,0,0.44)');
      cs.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cs;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Jaw / chin shadow ──
    const jaw = ctx.createRadialGradient(cx, cy + fh * 0.44, 0, cx, cy + fh * 0.44, fw * 0.42);
    jaw.addColorStop(0, 'rgba(0,0,0,0.3)');
    jaw.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = jaw;
    ctx.fillRect(0, 0, W, H);

    // ── Neck ──
    const nkW   = fw  * 0.24;
    const nkTop = cy  + fh * 0.48;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - nkW, nkTop);
    ctx.lineTo(cx - nkW * 1.2, H + 4);
    ctx.lineTo(cx + nkW * 1.2, H + 4);
    ctx.lineTo(cx + nkW, nkTop);
    ctx.closePath();
    ctx.clip();

    const nk = ctx.createLinearGradient(cx - nkW, nkTop, cx + nkW, nkTop);
    nk.addColorStop(0,    '#1a1a1a');
    nk.addColorStop(0.28, '#888');
    nk.addColorStop(0.5,  '#bbb');
    nk.addColorStop(0.72, '#888');
    nk.addColorStop(1,    '#1a1a1a');
    ctx.fillStyle = nk;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ─── canvas pixels → ASCII string ────────────────────────────────
  function render(t) {
    drawFace(t);

    const pixels = ctx.getImageData(0, 0, W, H).data;
    const rampN  = RAMP.length - 1;
    const lines  = new Array(H);

    for (let y = 0; y < H; y++) {
      const row = new Array(W);
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        // Perceptual brightness
        let b = (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255;

        // Small organic shimmer that keeps the face alive when lighting is static
        b += 0.04 * Math.sin(x * 0.72 + t * 4.1) * Math.cos(y * 0.55 - t * 2.9);
        b  = b < 0 ? 0 : b > 1 ? 1 : b;

        // Invert: dark canvas pixel → dense char (dark on white page)
        row[x] = RAMP[Math.round((1 - b) * rampN)];
      }
      lines[y] = row.join('');
    }

    pre.textContent = lines.join('\n');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
