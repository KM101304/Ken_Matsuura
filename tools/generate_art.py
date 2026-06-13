"""Generates the tonal ASCII art plates used across the site.

Ink-wash style: brightness fields built from value-noise fbm, composed
peaks, and flat-tone silhouettes, quantized to a character density ramp
with jitter dithering. White background = paper; dense chars = ink.

Usage:  python3 tools/generate_art.py        (requires numpy)
Then paste the relevant piece into its page's <pre class="ascii-art">.
"""
import numpy as np

RAMP = " .,:;!+xom%#@"   # light -> dark, ink on white paper
NL = len(RAMP) - 1

def smooth(t):
    return t * t * (3 - 2 * t)

def vnoise2(w, h, fx, fy, seed):
    """Smooth value noise field of shape (h, w)."""
    rng = np.random.default_rng(seed)
    gw, gh = int(fx) + 2, int(fy) + 2
    g = rng.random((gh + 1, gw + 1))
    ys = np.linspace(0, fy, h, endpoint=False)
    xs = np.linspace(0, fx, w, endpoint=False)
    xi, yi = np.floor(xs).astype(int), np.floor(ys).astype(int)
    xf, yf = smooth(xs - xi), smooth(ys - yi)
    g00 = g[np.ix_(yi, xi)]
    g10 = g[np.ix_(yi, xi + 1)]
    g01 = g[np.ix_(yi + 1, xi)]
    g11 = g[np.ix_(yi + 1, xi + 1)]
    top = g00 * (1 - xf) + g10 * xf
    bot = g01 * (1 - xf) + g11 * xf
    return top * (1 - yf[:, None]) + bot * yf[:, None]

def fbm2(w, h, fx, fy, seed, octaves=4):
    out = np.zeros((h, w))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        out += amp * vnoise2(w, h, fx * 2**o, fy * 2**o, seed + o * 101)
        tot += amp
        amp *= 0.5
    return out / tot

def fbm1(w, freq, seed, octaves=4):
    return fbm2(w, 1, freq, 1, seed, octaves)[0]

def to_text(B, seed=7):
    rng = np.random.default_rng(seed)
    jit = rng.uniform(-0.3, 0.3, B.shape)
    idx = np.clip((1 - B) * NL + jit, 0, NL).round().astype(int)
    rows = ["".join(RAMP[i] for i in row).rstrip() for row in idx]
    while rows and not rows[0]:
        rows.pop(0)
    while rows and not rows[-1]:
        rows.pop()
    return "\n".join(rows)


def moon(B, X, Y, mx, my, r, halo=0.13):
    d = np.sqrt((X - mx) ** 2 + ((Y - my) * 2.0) ** 2)
    B -= halo * np.exp(-((d - r) / (r * 0.7)) ** 2) * (d > r)
    B[d < r] = 1.0
    return B

def birds(B, spots):
    for y, x in spots:
        B[y, x - 1] = min(B[y, x - 1], 0.30)
        B[y - 1, x] = min(B[y - 1, x], 0.30)
        B[y, x + 1] = min(B[y, x + 1], 0.30)
    return B

def ridge_from_peaks(W, H, peaks, seed):
    xs = np.arange(W)
    ridge = np.full(W, H * 2.0)
    wob = (fbm1(W, 8, seed) - 0.5) * 2.0
    for cx, w, top in peaks:
        prof = top * H + (np.abs(xs - cx) / w) ** 1.35 * (H - top * H)
        prof = np.where(np.abs(xs - cx) < w * 1.6, prof, H * 2.0)
        ridge = np.minimum(ridge, prof)
    return ridge + wob

def pines(B, ridge, rng, tone=0.05, dense=0.35):
    H, W = B.shape
    for x in range(3, W - 3, 2):
        if rng.random() > dense:
            continue
        y = int(ridge[x])
        if not (4 <= y < H - 2) or abs(ridge[x + 2] - ridge[x - 2]) > 2.0:
            continue
        B[y - 2, x] = tone
        B[y - 1, x - 1:x + 2] = np.minimum(B[y - 1, x - 1:x + 2], tone + 0.05)
        B[y, x] = tone
    return B

def water_rows(W, y0, y1, seed, glint_x=None):
    rows = np.ones((y1 - y0, W))
    rng = np.random.default_rng(seed)
    for k in range(y1 - y0):
        if k % 2 == 0:
            continue
        depth = k / max(1, y1 - y0 - 1)
        n = fbm1(W, 7, seed + 17 * k, octaves=3)
        chop = fbm1(W, 14, seed + 91 * k, octaves=2)
        mask = (n > 0.56 - 0.20 * depth) & (chop > 0.38)
        tone = 0.55 - 0.35 * depth
        if glint_x is not None:
            xs = np.arange(W)
            cut = np.exp(-((xs - glint_x) / 4.5) ** 2)
            mask &= rng.random(W) > cut * 0.92
        rows[k, mask] = tone
    return rows

def boat(B, hy, bx):
    B[hy + 1, bx - 3:bx + 4] = 0.05
    B[hy,     bx - 2:bx + 3] = 0.12
    B[hy - 1, bx] = 0.05
    B[hy - 2, bx] = 0.05
    B[hy + 3, bx - 2:bx + 3] = np.minimum(B[hy + 3, bx - 2:bx + 3], 0.6)
    return B

def landscape(W=86, H=32, seed=5):
    B = np.ones((H, W))
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    rng = np.random.default_rng(seed)
    B = np.minimum(B, 0.975 + 0.025 * fbm2(W, H, 6, 4, seed + 1))
    B = moon(B, X, Y, W * 0.78, H * 0.13, W * 0.043)

    tex = fbm2(W, H, 9, 6, seed + 5)
    wy = int(H * 0.79)
    layer_defs = [
        (0.78, [(26, 30, 0.28), (68, 20, 0.40)]),
        (0.55, [(52, 19, 0.36), (6, 15, 0.48)]),
        (0.13, [(12, 26, 0.46), (79, 16, 0.58)]),
    ]
    ridges = []
    for li, (tone, peaks) in enumerate(layer_defs):
        ridge = ridge_from_peaks(W, H, peaks, seed + 31 + li * 13)
        ridges.append(ridge)
        below = (Y >= ridge[None, :]) & (Y < wy)
        edge = (Y - ridge[None, :]) < 1.2
        fade = smooth(np.clip((Y - (wy - 5)) / 4.0, 0, 1)) * (0.97 - tone)
        shade = tone + 0.07 * tex + fade - np.where(edge, 0.13, 0)
        B = np.where(below, np.minimum(B, shade), B)

    # one mist band across the middle distance
    wave = H * 0.58 + 1.1 * np.sin(np.arange(W) * 0.16 + 2.0)
    m = np.exp(-((Y - wave[None, :]) / 1.0) ** 2)
    B = np.where(m > 0.5, np.maximum(B, 0.95), B)

    # pines on the near dark ridge
    B = pines(B, ridges[2], rng, tone=0.04, dense=0.5)

    B[wy:H] = water_rows(W, wy, H, seed + 23, glint_x=W * 0.78)
    B = boat(B, wy + 2, int(W * 0.34))
    B = birds(B, [(4, 16), (6, 25)])
    return to_text(B, seed)

def bonsai(W=54, H=22, seed=9):
    B = np.ones((H, W))
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    rng = np.random.default_rng(seed)
    tex = fbm2(W, H, 8, 5, seed + 2)

    def stroke(x0, y0, x1, y1, w0, w1, tone=0.06):
        n = int(max(abs(x1 - x0), 2 * abs(y1 - y0)) * 3) + 2
        for i in range(n):
            t = i / (n - 1)
            cx, cy = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            wd = w0 + (w1 - w0) * t
            m = (X - cx) ** 2 + ((Y - cy) * 2.0) ** 2 <= wd * wd
            np.minimum(B, np.where(m, tone, 1), out=B)

    def pad(cx, cy, a, b, tone=0.40):
        nx = (X - cx) / a
        ny = (Y - cy) * 2.0 / b
        r2 = nx ** 2 + ny ** 2 + 0.5 * (fbm2(W, H, 10, 7, seed + int(cx)) - 0.5)
        m = r2 <= 1
        shade = tone + 0.25 * tex + 0.12 * np.clip(ny + 0.4, 0, 1)
        np.minimum(B, np.where(m, shade, 1), out=B)

    # foliage clouds first, trunk drawn over them
    pad(W * 0.28, H * 0.32, 9.5, 3.8)
    pad(W * 0.70, H * 0.24, 8.5, 3.4)
    pad(W * 0.48, H * 0.10, 8.0, 2.8)

    # trunk: S-curve, dark, drawn over foliage
    stroke(W * 0.52, H - 4, W * 0.46, H * 0.66, 2.2, 1.6)
    stroke(W * 0.46, H * 0.66, W * 0.55, H * 0.40, 1.6, 1.1)
    stroke(W * 0.55, H * 0.40, W * 0.48, H * 0.16, 1.1, 0.6)
    stroke(W * 0.48, H * 0.60, W * 0.30, H * 0.38, 1.0, 0.4)   # left branch
    stroke(W * 0.54, H * 0.38, W * 0.68, H * 0.29, 0.8, 0.4)   # right branch

    # pot
    cx = W // 2
    B[H - 3, cx - 11:cx + 12] = 0.28
    B[H - 2, cx - 10:cx + 11] = 0.10
    B[H - 1, cx - 8:cx + 9] = 0.16
    for x in range(cx - 13, cx + 14):                          # moss dots
        if rng.random() > 0.72:
            B[H - 4, x] = min(B[H - 4, x], 0.55)
    return to_text(B, seed)

def torii(W=70, H=20, seed=27):
    B = np.ones((H, W))
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    rng = np.random.default_rng(seed)
    B = np.minimum(B, 0.978 + 0.022 * fbm2(W, H, 6, 3, seed + 1))
    sxp = W * 0.72
    B = moon(B, X, Y, sxp, H * 0.18, W * 0.038)

    hy = int(H * 0.55)
    B[hy:H] = water_rows(W, hy, H, seed + 9, glint_x=sxp)

    cx, T, top, span = int(W * 0.30), 0.05, 2, 13
    B[top, cx - span:cx + span + 1] = T                       # kasagi
    B[top - 1, cx - span:cx - span + 3] = T                   # upturned ends
    B[top - 1, cx + span - 2:cx + span + 1] = T
    B[top + 1, cx - span + 3:cx + span - 2] = T               # shimaki
    B[top + 3, cx - 10:cx + 11] = T                           # nuki
    B[top + 1:top + 3, cx:cx + 1] = T                         # gakuzuka
    for s in (-1, 1):                                         # pillars
        for yy in range(top + 1, hy + 2):
            t = (yy - top) / (hy + 2 - top)
            px = int(round(cx + s * (8 + 1.3 * t)))
            B[yy, px:px + 2] = T
    for yy in range(hy + 2, min(H, hy + 7)):                  # reflection
        if yy % 2 == 0:
            continue
        for s in (-1, 1):
            px = cx + s * 9 + rng.integers(-1, 2)
            B[yy, px:px + 2] = np.minimum(B[yy, px:px + 2], 0.5)
    B = birds(B, [(3, int(W * 0.52)), (5, int(W * 0.60))])
    return to_text(B, seed)

def lantern(W=44, H=24, seed=40):
    B = np.ones((H, W))
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    rng = np.random.default_rng(seed)
    B = np.minimum(B, 0.978 + 0.022 * fbm2(W, H, 5, 3, seed + 1))
    B = moon(B, X, Y, W * 0.16, H * 0.13, W * 0.045)

    cx = W // 2 + 4
    def slab(y, hw, tone=0.08):
        B[y, cx - hw:cx + hw + 1] = np.minimum(B[y, cx - hw:cx + hw + 1], tone)

    slab(4, 0); slab(5, 1)                                    # finial
    slab(6, 3); slab(7, 6); slab(8, 9)                        # roof
    B[8, cx - 11:cx - 9] = 0.08; B[8, cx + 10:cx + 12] = 0.08 # tips
    B[7, cx - 11] = 0.30; B[7, cx + 11] = 0.30
    for y in range(9, 13):
        slab(y, 5)
    B[10, cx - 1:cx + 2] = 1.0; B[11, cx - 1:cx + 2] = 1.0    # glow window
    B[10, cx - 4] = 1.0; B[10, cx + 4] = 1.0                  # side windows
    B[11, cx - 4] = 1.0; B[11, cx + 4] = 1.0
    slab(13, 7)                                               # platform
    for y in range(14, 18):
        slab(y, 2, 0.12)
    slab(18, 6); slab(19, 8)                                  # base

    g = (Y == 20) & (rng.random((H, W)) > 0.6)                # grass
    B = np.where(g, 0.55, B)
    g2 = (Y == 21) & (rng.random((H, W)) > 0.75)
    B = np.where(g2, 0.75, B)
    for fy, fx in [(9, 9), (14, 36), (17, 7)]:                # fireflies
        B[fy, fx] = min(B[fy, fx], 0.45)
    return to_text(B, seed)


def enso(W=38, H=18, seed=12, gap_at=-0.7):
    B = np.ones((H, W))
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    u, v = X - W / 2, (Y - H / 2) * 2.0
    d = np.sqrt(u * u + v * v)
    th = np.arctan2(v, u)
    R = W * 0.36
    thick = 1.6 * (1 + 0.25 * np.sin(th + 2.2))
    ang = np.angle(np.exp(1j * (th - gap_at)))
    openm = smooth(np.clip((np.abs(ang) - 0.20) / 0.35, 0, 1))
    ink = np.exp(-((d - R) / thick) ** 2)
    streak = 0.8 + 0.2 * np.sin(th * 9 + 4 * fbm2(W, H, 4, 3, seed))
    B = 1 - 0.95 * np.clip(ink * streak * openm * 1.5, 0, 1)
    return to_text(B, seed)

if __name__ == "__main__":
    print("=== LANDSCAPE (index.html) ===");      print(landscape())
    print("\n=== BONSAI (about.html) ===");      print(bonsai())
    print("\n=== TORII (projects.html) ===");    print(torii())
    print("\n=== LANTERN (contact.html) ===");   print(lantern())
    print("\n=== ENSO (404.html) ===");          print(enso(W=30, H=15, seed=19, gap_at=2.2))
