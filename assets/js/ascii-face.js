(function () {
  // Dark → light character ramp (perceptual density)
  const RAMP = ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

  let canvas, ctx, pre;
  let W, H;                     // canvas dims (= char cols/rows)
  const CHAR_W = 7.2;           // px per char at font-size 9px
  const CHAR_H = 11.5;          // px per line
  const FPS    = 22;
  const FRAME  = 1000 / FPS;
  let last = 0, t0 = null;

  // ─── bootstrap ───────────────────────────────────────────────────
  function init() {
    pre = document.getElementById('ascii-face');
    if (!pre) return;

    canvas = document.createElement('canvas');
    ctx    = canvas.getContext('2d', { willReadFrequently: true });

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }

  function resize() {
    W = Math.ceil(window.innerWidth  / CHAR_W);
    H = Math.ceil(window.innerHeight / CHAR_H);
    canvas.width  = W;
    canvas.height = H;
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (ts - last < FRAME) return;
    last = ts;
    if (!t0) t0 = ts;
    render((ts - t0) / 1000);
  }

  // ─── canvas face drawing ──────────────────────────────────────────
  function drawFace(t) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.5;
    const cy = H * 0.46;
    const sc = Math.min(W, H) * 0.43;   // scale unit

    const fw = sc * 0.72;   // face half-width
    const fh = sc;          // face half-height

    // ── rotating key light ──
    const ka = t * 0.42;
    const lx = cx + Math.cos(ka)       * fw * 0.75;
    const ly = cy - fh * 0.08 + Math.sin(ka * 0.58) * fh * 0.28;

    // ══ FACE OVAL ══
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, fw, fh, 0, 0, Math.PI * 2);
    ctx.clip();

    // ambient base
    const amb = ctx.createRadialGradient(cx, cy - fh * 0.06, 0, cx, cy, fh * 1.05);
    amb.addColorStop(0,    '#d0d0d0');
    amb.addColorStop(0.42, '#8a8a8a');
    amb.addColorStop(0.72, '#555');
    amb.addColorStop(1,    '#111');
    ctx.fillStyle = amb;
    ctx.fillRect(0, 0, W, H);

    // key light
    const key = ctx.createRadialGradient(lx, ly, 0, lx, ly, fw * 1.5);
    key.addColorStop(0,    'rgba(255,255,255,0.58)');
    key.addColorStop(0.32, 'rgba(255,255,255,0.24)');
    key.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = key;
    ctx.fillRect(0, 0, W, H);

    // rim light (opposite)
    const rlx = cx - (lx - cx) * 0.38;
    const rly = cy - (ly - cy) * 0.38;
    const rim = ctx.createRadialGradient(rlx, rly, 0, rlx, rly, fw * 1.1);
    rim.addColorStop(0, 'rgba(160,160,160,0.19)');
    rim.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();

    // ══ HAIR ══
    ctx.save();
    // top mass
    ctx.beginPath();
    ctx.ellipse(cx, cy - fh * 0.29, fw * 0.57, fh * 0.38, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#080808';
    ctx.fill();
    // side burns
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + s * fw * 0.88, cy - fh * 0.12, fw * 0.18, fh * 0.28, s * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#080808';
      ctx.fill();
      // hair shadow on face
      const hs = ctx.createRadialGradient(cx + s*fw*0.72, cy - fh*0.05, 0, cx + s*fw*0.72, cy, fw*0.32);
      hs.addColorStop(0, 'rgba(0,0,0,0.52)');
      hs.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hs;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // ══ EYEBROWS ══
    const eyY  = cy - fh * 0.113;
    const eyX  = fw * 0.228;
    const erx  = fw * 0.138;
    const ery  = fh * 0.051;
    const brY  = eyY - ery * 3.9;

    ctx.lineWidth = ery * 1.15;
    ctx.lineCap   = 'round';
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx + s*(eyX - erx*1.15), brY + ery*(s < 0 ? 0.55 : -0.55));
      ctx.quadraticCurveTo(cx + s*eyX, brY - ery*1.35, cx + s*(eyX + erx*1.15), brY + ery*(s < 0 ? -0.55 : 0.55));
      ctx.strokeStyle = 'rgba(8,8,8,0.9)';
      ctx.stroke();
      ctx.restore();
    }

    // ══ EYES ══
    for (const s of [-1, 1]) {
      const ex = cx + s * eyX;

      // socket shadow
      const sock = ctx.createRadialGradient(ex, eyY, 0, ex, eyY, erx * 1.95);
      sock.addColorStop(0,   'rgba(0,0,0,0.68)');
      sock.addColorStop(0.5, 'rgba(0,0,0,0.32)');
      sock.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = sock;
      ctx.beginPath();
      ctx.ellipse(ex, eyY, erx * 2, ery * 3.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // eyelid clip
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, eyY, erx, ery, 0, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = '#e6e6e6';
      ctx.fillRect(ex - erx, eyY - ery, erx*2, ery*2);

      const iris = ctx.createRadialGradient(ex, eyY, 0, ex, eyY, ery * 0.9);
      iris.addColorStop(0,   '#5a6070');
      iris.addColorStop(0.5, '#2e3440');
      iris.addColorStop(1,   '#0e1018');
      ctx.fillStyle = iris;
      ctx.beginPath();
      ctx.arc(ex, eyY, ery * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(ex, eyY, ery * 0.44, 0, Math.PI * 2);
      ctx.fill();

      // specular
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.beginPath();
      ctx.arc(ex - ery*0.3, eyY - ery*0.3, ery*0.19, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // lid edge
      ctx.beginPath();
      ctx.ellipse(ex, eyY, erx, ery, 0, 0, Math.PI * 2);
      ctx.lineWidth   = 0.7;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();

      // under-eye
      const ue = ctx.createRadialGradient(ex, eyY + ery*1.6, 0, ex, eyY + ery*1.6, erx*1.25);
      ue.addColorStop(0, 'rgba(0,0,0,0.25)');
      ue.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ue;
      ctx.fillRect(0, 0, W, H);
    }

    // ══ NOSE ══
    const nbY = cy + fh * 0.072;   // nose base Y
    const ntY = cy + fh * 0.19;    // tip Y
    const nw  = fw * 0.112;

    // bridge highlight
    const bh = ctx.createLinearGradient(cx - nw*0.25, eyY+ery*2, cx + nw*0.25, ntY);
    bh.addColorStop(0,   'rgba(255,255,255,0)');
    bh.addColorStop(0.4, 'rgba(255,255,255,0.2)');
    bh.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = bh;
    ctx.beginPath();
    ctx.ellipse(cx, (eyY*0.6 + ntY*0.4), nw*0.32, (ntY - eyY)*0.54, 0, 0, Math.PI*2);
    ctx.fill();

    // nose side shadows
    for (const s of [-1, 1]) {
      const ns = ctx.createRadialGradient(cx + s*nw*0.95, nbY, 0, cx + s*nw*0.95, nbY, nw*0.92);
      ns.addColorStop(0, 'rgba(0,0,0,0.48)');
      ns.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ns;
      ctx.beginPath();
      ctx.ellipse(cx + s*nw*0.95, nbY + fh*0.012, nw*0.88, fh*0.058, 0, 0, Math.PI*2);
      ctx.fill();
    }

    // tip highlight
    const th = ctx.createRadialGradient(cx, ntY - fh*0.01, 0, cx, ntY, nw*0.78);
    th.addColorStop(0, 'rgba(255,255,255,0.32)');
    th.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = th;
    ctx.fillRect(0, 0, W, H);

    // nostrils
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + s*nw*0.72, ntY + fh*0.021, nw*0.39, fh*0.022, s*0.38, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fill();
    }

    // ══ MOUTH ══
    const mY  = cy + fh * 0.295;
    const mW  = fw * 0.218;
    const lH  = fh * 0.044;

    // philtrum shadow
    const ph = ctx.createRadialGradient(cx, ntY + fh*0.038, 0, cx, ntY + fh*0.038, nw*0.48);
    ph.addColorStop(0, 'rgba(0,0,0,0.22)');
    ph.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ph;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - mW, mY);
    ctx.bezierCurveTo(cx - mW*0.52, mY - lH*0.55,  cx - mW*0.14, mY - lH*1.15, cx,     mY - lH*0.88);
    ctx.bezierCurveTo(cx + mW*0.14, mY - lH*1.15,  cx + mW*0.52, mY - lH*0.55, cx + mW, mY);
    ctx.bezierCurveTo(cx + mW*0.6,  mY + lH*1.25,  cx - mW*0.6,  mY + lH*1.25, cx - mW, mY);
    ctx.closePath();

    const lg = ctx.createLinearGradient(cx, mY - lH, cx, mY + lH*1.25);
    lg.addColorStop(0,   '#909090');
    lg.addColorStop(0.4, '#787878');
    lg.addColorStop(1,   '#484848');
    ctx.fillStyle = lg;
    ctx.fill();

    // lower lip highlight
    ctx.beginPath();
    ctx.ellipse(cx, mY + lH*0.62, mW*0.33, lH*0.44, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.restore();

    // lip crease
    ctx.beginPath();
    ctx.moveTo(cx - mW, mY);
    ctx.bezierCurveTo(cx - mW*0.28, mY + lH*0.14, cx + mW*0.28, mY + lH*0.14, cx + mW, mY);
    ctx.lineWidth   = 1.1;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.stroke();

    // mouth corner shadows
    for (const s of [-1, 1]) {
      const cs = ctx.createRadialGradient(cx + s*mW, mY, 0, cx + s*mW, mY, mW*0.27);
      cs.addColorStop(0, 'rgba(0,0,0,0.42)');
      cs.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cs;
      ctx.fillRect(0, 0, W, H);
    }

    // ══ JAW / CHIN ══
    const chin = ctx.createRadialGradient(cx, cy + fh*0.46, 0, cx, cy + fh*0.46, fw*0.44);
    chin.addColorStop(0, 'rgba(0,0,0,0.3)');
    chin.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = chin;
    ctx.fillRect(0, 0, W, H);

    // ══ NECK ══
    const nkW  = fw * 0.265;
    const nkTop = cy + fh * 0.47;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - nkW, nkTop);
    ctx.lineTo(cx - nkW * 1.18, H);
    ctx.lineTo(cx + nkW * 1.18, H);
    ctx.lineTo(cx + nkW, nkTop);
    ctx.closePath();
    ctx.clip();

    const nk = ctx.createLinearGradient(cx - nkW, 0, cx + nkW, 0);
    nk.addColorStop(0,   '#1a1a1a');
    nk.addColorStop(0.28,'#888');
    nk.addColorStop(0.5, '#bbb');
    nk.addColorStop(0.72,'#888');
    nk.addColorStop(1,   '#1a1a1a');
    ctx.fillStyle = nk;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // ══ SHOULDERS ══
    const shY = cy + fh * 0.78;
    const shW = W * 0.44;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, shY, shW, fh * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.restore();
  }

  // ─── pixel → ASCII ───────────────────────────────────────────────
  function render(t) {
    drawFace(t);

    const pixels = ctx.getImageData(0, 0, W, H).data;
    const n      = RAMP.length - 1;
    const lines  = [];

    for (let y = 0; y < H; y++) {
      let row = '';
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const b = (0.299 * pixels[i] + 0.587 * pixels[i+1] + 0.114 * pixels[i+2]) / 255;
        row += RAMP[Math.round(b * n)];
      }
      lines.push(row);
    }

    pre.textContent = lines.join('\n');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
