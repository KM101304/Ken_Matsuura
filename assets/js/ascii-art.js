(function () {
  // Contained ASCII art piece for the home page terminal panel:
  // a 3D trefoil torus knot rendered as a lit, z-buffered tube of
  // characters, with a rainbow gradient flowing along the curve and a
  // sparse drifting particle field behind it. The knot tilts toward the
  // pointer and the field ripples around it. Never drawn behind text.

  const FONT_PX = 12;
  const CH_W = FONT_PX * 0.602;          // monospace advance ≈ 0.6em
  const CH_H = FONT_PX * 1.16;
  const PANEL_H = 300;                   // must match #ascii-art CSS height

  const RAMP = '.,-~:;=!*#%$@';
  const FIELD_CHARS = ['·', ':', '+', '*'];

  // Knot geometry: trefoil (p=2, q=3)
  const P = 2, Q = 3;
  const R = 1.9, CR = 0.95;              // curve radii
  const TUBE = 0.28;                     // tube thickness
  const CURVE_STEPS = 400;
  const RING_STEPS = 14;
  const K2 = 5.2;                        // camera distance

  const FRAME_MS = 1000 / 20;
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let canvas, ctx;
  let W, H;                              // grid size in characters
  let chars, bright, hue, zbuf;          // per-cell state (bright -1 = field)
  let lastFrame = 0, t0;

  // Pointer state, in grid coordinates; rotation eases toward the pointer
  let mx = -1, my = -1, mouseOn = false;
  let tiltX = 0, tiltY = 0;

  function init() {
    canvas = document.getElementById('ascii-art');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    canvas.parentElement.addEventListener('pointermove', function (e) {
      const r = canvas.getBoundingClientRect();
      mx = (e.clientX - r.left) / CH_W;
      my = (e.clientY - r.top) / CH_H;
      mouseOn = true;
    });
    canvas.parentElement.addEventListener('pointerleave', function () {
      mouseOn = false;
    });

    if (reduceMotion) {
      render(2.2);                       // single static frame
    } else {
      t0 = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;

    W = Math.max(20, Math.floor(cssW / CH_W));
    H = Math.max(10, Math.floor(PANEL_H / CH_H));

    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(PANEL_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT_PX + 'px monospace';
    ctx.textBaseline = 'top';

    const n = W * H;
    chars  = new Array(n);
    bright = new Float32Array(n);
    hue    = new Float32Array(n);
    zbuf   = new Float32Array(n);

    if (reduceMotion) render(2.2);
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;
    render((now - t0) / 1000);
  }

  function render(t) {
    chars.fill(null);
    zbuf.fill(0);

    // Ease the knot's tilt toward the pointer, drift when idle
    const targetY = mouseOn ? (mx / W - 0.5) * 2.2 : Math.sin(t * 0.17) * 0.5;
    const targetX = mouseOn ? (my / H - 0.5) * 1.6 : Math.cos(t * 0.13) * 0.4;
    tiltY += (targetY - tiltY) * 0.06;
    tiltX += (targetX - tiltX) * 0.06;

    drawField(t);
    drawKnot(t);
    paint(t);
  }

  // Sparse drifting particles, with a ripple around the pointer
  function drawField(t) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let v = Math.sin(x * 0.16 - t * 0.55) *
                Math.cos(y * 0.33 + t * 0.38) +
                Math.sin((x + y * 2) * 0.055 + t * 0.21);
        if (mouseOn) {
          const dx = x - mx, dy = (y - my) * 1.9;
          const d = Math.sqrt(dx * dx + dy * dy);
          v += 1.1 * Math.sin(d * 0.55 - t * 4.2) * Math.exp(-d * 0.07);
        }
        if (v > 1.25) {
          const i = y * W + x;
          chars[i] = FIELD_CHARS[Math.min(3, Math.floor((v - 1.25) * 5))];
          bright[i] = -1;
        }
      }
    }
  }

  function curvePoint(s, out) {
    const r = R + CR * Math.cos(Q * s);
    out[0] = r * Math.cos(P * s);
    out[1] = r * Math.sin(P * s);
    out[2] = CR * Math.sin(Q * s) * 1.35;
  }

  // Z-buffered, lit tube around the trefoil curve
  function drawKnot(t) {
    const rotZ = t * 0.42;
    const ax = tiltX + 0.25, ay = tiltY;
    const cosX = Math.cos(ax), sinX = Math.sin(ax);
    const cosY = Math.cos(ay), sinY = Math.sin(ay);
    const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

    // Fit by grid height; widen x to compensate for tall character cells
    const K1y = H * K2 * 3 / (8 * (R + CR + TUBE)) * 0.94;
    const K1x = K1y * (CH_H / CH_W);
    const cx = W / 2, cy = H / 2;

    // Light direction (toward viewer, slightly top-left), unnormalized ~1
    const lx = -0.35, ly = 0.5, lz = -0.79;

    const c0 = [0, 0, 0], c1 = [0, 0, 0], c2 = [0, 0, 0];
    const breathe = 1 + 0.06 * Math.sin(t * 0.6);

    for (let si = 0; si < CURVE_STEPS; si++) {
      const s = (si / CURVE_STEPS) * Math.PI * 2;
      curvePoint(s, c0);
      curvePoint(s + 0.02, c1);
      curvePoint(s - 0.02, c2);

      // Tangent via central difference
      let tx = c1[0] - c2[0], ty = c1[1] - c2[1], tz = c1[2] - c2[2];
      const tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
      tx /= tl; ty /= tl; tz /= tl;

      // Frame: N = T × up (fallback when parallel), B = T × N
      let nx = ty, ny = -tx, nz = 0;                     // T × (0,0,1)
      let nl = Math.sqrt(nx * nx + ny * ny) || 1;
      nx /= nl; ny /= nl;
      const bx = ty * nz - tz * ny;
      const by = tz * nx - tx * nz;
      const bz = tx * ny - ty * nx;

      const hueS = (si / CURVE_STEPS) * 360;

      for (let ai = 0; ai < RING_STEPS; ai++) {
        const a = (ai / RING_STEPS) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);

        // Surface normal and point in model space
        const snx = ca * nx + sa * bx;
        const sny = ca * ny + sa * by;
        const snz = ca * nz + sa * bz;
        let x = (c0[0] + TUBE * snx) * breathe;
        let y = (c0[1] + TUBE * sny) * breathe;
        let z = (c0[2] + TUBE * snz) * breathe;

        // Rotate point and normal: Z, then X, then Y
        let x1 = x * cosZ - y * sinZ,  y1 = x * sinZ + y * cosZ;
        let y2 = y1 * cosX - z * sinX, z2 = y1 * sinX + z * cosX;
        let x3 = x1 * cosY + z2 * sinY, z3 = -x1 * sinY + z2 * cosY;

        let nx1 = snx * cosZ - sny * sinZ,  ny1 = snx * sinZ + sny * cosZ;
        let ny2 = ny1 * cosX - snz * sinX,  nz2 = ny1 * sinX + snz * cosX;
        let nx3 = nx1 * cosY + nz2 * sinY,  nz3 = -nx1 * sinY + nz2 * cosY;

        const zc = K2 + z3;
        const ooz = 1 / zc;
        const xp = Math.floor(cx + K1x * ooz * x3);
        const yp = Math.floor(cy - K1y * ooz * y2);
        if (xp < 0 || xp >= W || yp < 0 || yp >= H) continue;

        const i = yp * W + xp;
        if (ooz <= zbuf[i]) continue;
        zbuf[i] = ooz;

        // Lambert shading with a floor so the dark side stays visible
        const L = Math.max(0.07, nx3 * lx + ny2 * ly + nz3 * lz);
        bright[i] = Math.min(1, L);
        hue[i] = hueS;
        chars[i] = RAMP[Math.min(RAMP.length - 1, Math.floor(L * RAMP.length))];
      }
    }
  }

  function paint(t) {
    ctx.fillStyle = '#06060a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const flow = t * 40;                       // gradient slides along the knot
    const fieldColor =
      'hsla(' + ((t * 9 + 210) % 360) + ',45%,46%,0.32)';

    let lastColor = '';
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const ch = chars[i];
        if (!ch) continue;
        let color;
        if (bright[i] < 0) {
          color = fieldColor;
        } else {
          const h = (hue[i] + flow) % 360;
          const l = 32 + bright[i] * 38;
          color = 'hsl(' + h + ',90%,' + l + '%)';
        }
        if (color !== lastColor) { ctx.fillStyle = color; lastColor = color; }
        ctx.fillText(ch, x * CH_W, y * CH_H);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
