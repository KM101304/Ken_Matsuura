(function () {
  const CHAR_W = 5.5;
  const CHAR_H = 11.5;
  const ASPECT = CHAR_H / CHAR_W;  // ≈ 2.09

  const RAMP = ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
  const rampN = RAMP.length - 1;

  let shape, sCtx, out, oCtx;
  let W, H;
  let lastFrame = 0, t0;
  const FRAME_MS = 1000 / 24;

  function init() {
    out = document.getElementById('ascii-face');
    if (!out) return;

    shape = document.createElement('canvas');
    sCtx  = shape.getContext('2d', { willReadFrequently: true });
    oCtx  = out.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    t0 = performance.now();
    requestAnimationFrame(loop);
  }

  function resize() {
    W = Math.ceil(window.innerWidth  / CHAR_W);
    H = Math.ceil(window.innerHeight / CHAR_H);
    shape.width  = W;
    shape.height = H;
    out.width    = window.innerWidth;
    out.height   = window.innerHeight;
    oCtx.font         = '9px monospace';
    oCtx.textBaseline = 'top';
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;
    render((now - t0) / 1000);
  }

  function clamp(mn, v, mx) { return v < mn ? mn : v > mx ? mx : v; }

  // ─── draw face in full color onto the hidden shape canvas ───────────────────
  function drawFace(t) {
    sCtx.clearRect(0, 0, W, H);

    const fh = H * 1.28;
    const fw = fh * 0.72 * ASPECT;
    const cx = W * 0.5;
    const EYE_OFFSET = fh * 0.10;
    const cy = H * 0.38 + EYE_OFFSET;

    // Slowly rotating key light
    const angle = t * 0.38;
    const lx = cx + Math.cos(angle)        * fw * 0.55;
    const ly = cy + Math.sin(angle * 0.55) * fh * 0.18 - fh * 0.05;

    // ── Face oval ──────────────────────────────────────────────────────────────
    sCtx.save();
    sCtx.beginPath();
    sCtx.ellipse(cx, cy, fw / 2, fh / 2, 0, 0, Math.PI * 2);
    sCtx.clip();

    // Skin tone gradient — warm highlights to deep shadow
    const skin = sCtx.createRadialGradient(cx, cy - fh * 0.04, 0, cx, cy, fh * 0.62);
    skin.addColorStop(0,    '#f2c090');
    skin.addColorStop(0.45, '#d4845a');
    skin.addColorStop(0.78, '#9a4c28');
    skin.addColorStop(1,    '#5c2510');
    sCtx.fillStyle = skin;
    sCtx.fillRect(0, 0, W, H);

    // Key light (warm)
    const kl = sCtx.createRadialGradient(lx, ly, 0, lx, ly, fw * 0.88);
    kl.addColorStop(0,    'rgba(255,240,210,0.58)');
    kl.addColorStop(0.38, 'rgba(255,220,180,0.24)');
    kl.addColorStop(1,    'rgba(0,0,0,0)');
    sCtx.fillStyle = kl;
    sCtx.fillRect(0, 0, W, H);

    // Rim light
    const rlx = cx - (lx - cx) * 0.4;
    const rly = cy - (ly - cy) * 0.3;
    const rl = sCtx.createRadialGradient(rlx, rly, 0, rlx, rly, fw * 0.7);
    rl.addColorStop(0, 'rgba(200,150,110,0.18)');
    rl.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = rl;
    sCtx.fillRect(0, 0, W, H);

    sCtx.restore();

    // ── Hair ───────────────────────────────────────────────────────────────────
    sCtx.save();
    sCtx.beginPath();
    sCtx.ellipse(cx, cy - fh * 0.3, fw * 0.52, fh * 0.34, 0, Math.PI, Math.PI * 2);
    sCtx.fillStyle = '#0e0400';
    sCtx.fill();
    for (const s of [-1, 1]) {
      sCtx.beginPath();
      sCtx.ellipse(cx + s * fw * 0.44, cy - fh * 0.14, fw * 0.12, fh * 0.24, s * 0.1, 0, Math.PI * 2);
      sCtx.fillStyle = '#0e0400';
      sCtx.fill();
      const hs = sCtx.createRadialGradient(cx + s * fw * 0.45, cy, 0, cx + s * fw * 0.45, cy, fw * 0.22);
      hs.addColorStop(0, 'rgba(20,5,0,0.55)');
      hs.addColorStop(1, 'rgba(20,5,0,0)');
      sCtx.fillStyle = hs;
      sCtx.fillRect(0, 0, W, H);
    }
    sCtx.restore();

    // ── Eye geometry ───────────────────────────────────────────────────────────
    const eyY  = cy - EYE_OFFSET;
    const eyX  = fw * 0.195;
    const ery  = fh * 0.030;
    const erx  = ery * 3 * ASPECT;
    const browY = eyY - ery * 4.2;

    // ── Eyebrows ───────────────────────────────────────────────────────────────
    sCtx.lineWidth = ery * 1.2;
    sCtx.lineCap   = 'round';
    for (const s of [-1, 1]) {
      const ex = cx + s * eyX;
      sCtx.beginPath();
      sCtx.moveTo(ex - erx * 1.1, browY + ery * (s < 0 ?  0.6 : -0.6));
      sCtx.quadraticCurveTo(ex, browY - ery * 1.4,
                            ex + erx * 1.1, browY + ery * (s < 0 ? -0.6 :  0.6));
      sCtx.strokeStyle = 'rgba(16,5,0,0.92)';
      sCtx.stroke();
    }

    // ── Eyes ───────────────────────────────────────────────────────────────────
    for (const s of [-1, 1]) {
      const ex = cx + s * eyX;

      // Socket shadow
      const sock = sCtx.createRadialGradient(ex, eyY, 0, ex, eyY, erx * 1.8);
      sock.addColorStop(0,    'rgba(40,10,0,0.70)');
      sock.addColorStop(0.55, 'rgba(40,10,0,0.35)');
      sock.addColorStop(1,    'rgba(40,10,0,0)');
      sCtx.fillStyle = sock;
      sCtx.beginPath();
      sCtx.ellipse(ex, eyY, erx * 1.85, ery * 3.0, 0, 0, Math.PI * 2);
      sCtx.fill();

      sCtx.save();
      sCtx.beginPath();
      sCtx.ellipse(ex, eyY, erx, ery, 0, 0, Math.PI * 2);
      sCtx.clip();

      // Sclera
      sCtx.fillStyle = '#e8ddd0';
      sCtx.fillRect(ex - erx, eyY - ery, erx * 2, ery * 2);

      // Iris (blue-grey)
      const iris = sCtx.createRadialGradient(ex, eyY, 0, ex, eyY, ery * 0.92);
      iris.addColorStop(0,   '#6a9ad8');
      iris.addColorStop(0.5, '#3a6aaa');
      iris.addColorStop(1,   '#0d2050');
      sCtx.fillStyle = iris;
      sCtx.beginPath();
      sCtx.arc(ex, eyY, ery * 0.92, 0, Math.PI * 2);
      sCtx.fill();

      // Pupil
      sCtx.fillStyle = '#04020a';
      sCtx.beginPath();
      sCtx.arc(ex, eyY, ery * 0.45, 0, Math.PI * 2);
      sCtx.fill();

      // Catchlight
      sCtx.fillStyle = 'rgba(255,255,255,0.95)';
      sCtx.beginPath();
      sCtx.arc(ex - ery * 0.32, eyY - ery * 0.3, ery * 0.2, 0, Math.PI * 2);
      sCtx.fill();

      sCtx.restore();

      sCtx.beginPath();
      sCtx.ellipse(ex, eyY, erx, ery, 0, 0, Math.PI * 2);
      sCtx.lineWidth   = 0.7;
      sCtx.strokeStyle = 'rgba(20,5,0,0.55)';
      sCtx.stroke();

      // Under-eye shadow
      const ue = sCtx.createRadialGradient(ex, eyY + ery * 1.7, 0, ex, eyY + ery * 1.7, erx * 1.1);
      ue.addColorStop(0, 'rgba(80,20,0,0.28)');
      ue.addColorStop(1, 'rgba(80,20,0,0)');
      sCtx.fillStyle = ue;
      sCtx.fillRect(0, 0, W, H);
    }

    // ── Nose ───────────────────────────────────────────────────────────────────
    const nW     = fw  * 0.12;
    const nBaseY = eyY + fh * 0.18;
    const nTipY  = eyY + fh * 0.135;

    const bh = sCtx.createLinearGradient(cx - nW * 0.3, eyY + ery * 2, cx + nW * 0.3, nBaseY);
    bh.addColorStop(0,   'rgba(255,220,180,0)');
    bh.addColorStop(0.4, 'rgba(255,220,180,0.22)');
    bh.addColorStop(1,   'rgba(255,220,180,0)');
    sCtx.fillStyle = bh;
    sCtx.beginPath();
    sCtx.ellipse(cx, nTipY, nW * 0.28, fh * 0.062, 0, 0, Math.PI * 2);
    sCtx.fill();

    for (const s of [-1, 1]) {
      const ns = sCtx.createRadialGradient(cx + s * nW * 0.88, nBaseY, 0,
                                           cx + s * nW * 0.88, nBaseY, nW * 0.85);
      ns.addColorStop(0, 'rgba(50,15,0,0.52)');
      ns.addColorStop(1, 'rgba(50,15,0,0)');
      sCtx.fillStyle = ns;
      sCtx.beginPath();
      sCtx.ellipse(cx + s * nW * 0.88, nBaseY, nW * 0.82, fh * 0.048, 0, 0, Math.PI * 2);
      sCtx.fill();
    }

    for (const s of [-1, 1]) {
      sCtx.fillStyle = 'rgba(30,5,0,0.75)';
      sCtx.beginPath();
      sCtx.ellipse(cx + s * nW * 0.7, nBaseY + fh * 0.02,
                   nW * 0.36, fh * 0.022, s * 0.35, 0, Math.PI * 2);
      sCtx.fill();
    }

    const th = sCtx.createRadialGradient(cx, nTipY, 0, cx, nTipY, nW * 0.7);
    th.addColorStop(0, 'rgba(255,210,170,0.3)');
    th.addColorStop(1, 'rgba(255,210,170,0)');
    sCtx.fillStyle = th;
    sCtx.fillRect(0, 0, W, H);

    // ── Mouth ──────────────────────────────────────────────────────────────────
    const mY = eyY + fh * 0.26;
    const mW = fw  * 0.22;
    const lH = fh  * 0.040;

    const ph = sCtx.createRadialGradient(cx, nBaseY + fh * 0.04, 0, cx, nBaseY + fh * 0.04, nW * 0.5);
    ph.addColorStop(0, 'rgba(60,15,0,0.22)');
    ph.addColorStop(1, 'rgba(60,15,0,0)');
    sCtx.fillStyle = ph;
    sCtx.fillRect(0, 0, W, H);

    sCtx.save();
    sCtx.beginPath();
    sCtx.moveTo(cx - mW, mY);
    sCtx.bezierCurveTo(cx - mW * 0.52, mY - lH * 0.58,
                       cx - mW * 0.13, mY - lH * 1.18, cx,        mY - lH * 0.92);
    sCtx.bezierCurveTo(cx + mW * 0.13, mY - lH * 1.18,
                       cx + mW * 0.52, mY - lH * 0.58, cx + mW,   mY);
    sCtx.bezierCurveTo(cx + mW * 0.6,  mY + lH * 1.28,
                       cx - mW * 0.6,  mY + lH * 1.28, cx - mW,   mY);
    sCtx.closePath();
    const lg = sCtx.createLinearGradient(cx, mY - lH, cx, mY + lH * 1.28);
    lg.addColorStop(0,   '#e07070');
    lg.addColorStop(0.4, '#c05050');
    lg.addColorStop(1,   '#803030');
    sCtx.fillStyle = lg;
    sCtx.fill();
    sCtx.beginPath();
    sCtx.ellipse(cx, mY + lH * 0.65, mW * 0.32, lH * 0.42, 0, 0, Math.PI * 2);
    sCtx.fillStyle = 'rgba(255,200,180,0.28)';
    sCtx.fill();
    sCtx.restore();

    sCtx.beginPath();
    sCtx.moveTo(cx - mW, mY);
    sCtx.bezierCurveTo(cx - mW * 0.3, mY + lH * 0.15,
                       cx + mW * 0.3, mY + lH * 0.15, cx + mW, mY);
    sCtx.lineWidth   = 1.1;
    sCtx.strokeStyle = 'rgba(60,10,0,0.58)';
    sCtx.stroke();

    for (const s of [-1, 1]) {
      const cs = sCtx.createRadialGradient(cx + s * mW, mY, 0, cx + s * mW, mY, mW * 0.25);
      cs.addColorStop(0, 'rgba(60,10,0,0.44)');
      cs.addColorStop(1, 'rgba(60,10,0,0)');
      sCtx.fillStyle = cs;
      sCtx.fillRect(0, 0, W, H);
    }

    // ── Jaw shadow ─────────────────────────────────────────────────────────────
    const jaw = sCtx.createRadialGradient(cx, cy + fh * 0.44, 0, cx, cy + fh * 0.44, fw * 0.42);
    jaw.addColorStop(0, 'rgba(40,10,0,0.3)');
    jaw.addColorStop(1, 'rgba(40,10,0,0)');
    sCtx.fillStyle = jaw;
    sCtx.fillRect(0, 0, W, H);

    // ── Neck ───────────────────────────────────────────────────────────────────
    const nkW   = fw  * 0.24;
    const nkTop = cy  + fh * 0.48;

    sCtx.save();
    sCtx.beginPath();
    sCtx.moveTo(cx - nkW, nkTop);
    sCtx.lineTo(cx - nkW * 1.2, H + 4);
    sCtx.lineTo(cx + nkW * 1.2, H + 4);
    sCtx.lineTo(cx + nkW, nkTop);
    sCtx.closePath();
    sCtx.clip();

    const nk = sCtx.createLinearGradient(cx - nkW, nkTop, cx + nkW, nkTop);
    nk.addColorStop(0,    '#5c2510');
    nk.addColorStop(0.28, '#a85a38');
    nk.addColorStop(0.5,  '#d48060');
    nk.addColorStop(0.72, '#a85a38');
    nk.addColorStop(1,    '#5c2510');
    sCtx.fillStyle = nk;
    sCtx.fillRect(0, 0, W, H);
    sCtx.restore();
  }

  // ─── sample color + brightness → draw colored chars on output canvas ────────
  function render(t) {
    drawFace(t);
    const pixels = sCtx.getImageData(0, 0, W, H).data;

    oCtx.clearRect(0, 0, out.width, out.height);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
        if (a < 8) continue;

        let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        brightness += 0.04 * Math.sin(x * 0.72 + t * 4.1) * Math.cos(y * 0.55 - t * 2.9);
        brightness  = clamp(0, brightness, 1);

        const ch = RAMP[Math.round((1 - brightness) * rampN)];
        if (ch === ' ') continue;

        oCtx.fillStyle = `rgb(${r},${g},${b})`;
        oCtx.fillText(ch, x * CHAR_W, y * CHAR_H);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
