"""Generates the tonal ASCII art plates used across the site.

Ink-wash style: brightness fields built from value-noise fbm, composed
peaks, and Lambert-shaded forms, quantized to a character density ramp
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



def moon(B, X, Y, mx, my, r):
    d = np.sqrt((X - mx) ** 2 + ((Y - my) * 2.0) ** 2)
    B -= 0.13 * np.exp(-((d - r) / (r * 0.7)) ** 2) * (d > r)
    B[d < r] = 1.0
    return B

def ridge_from_peaks(W, H, peaks, seed):
    xs = np.arange(W)
    ridge = np.full(W, H * 2.0)
    wob = (fbm1(W, 6, seed) - 0.5) * 1.6
    for cx, w, top in peaks:
        prof = top * H + (np.abs(xs - cx) / w) ** 1.35 * (H - top * H)
        prof = np.where(np.abs(xs - cx) < w * 1.6, prof, H * 2.0)
        ridge = np.minimum(ridge, prof)
    return ridge + wob

def mountains(B, X, Y, H, W, wy, layer_defs, tex, seed):
    for li, (tone, peaks) in enumerate(layer_defs):
        ridge = ridge_from_peaks(W, H, peaks, seed + 31 + li * 13)
        below = (Y >= ridge[None, :]) & (Y < wy)
        edge = (Y - ridge[None, :]) < 1.2
        fade = smooth(np.clip((Y - (wy - 4)) / 3.5, 0, 1)) * (0.97 - tone)
        shade = tone + 0.06 * tex + fade - np.where(edge, 0.14, 0)
        B = np.where(below, np.minimum(B, shade), B)
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
            cut = np.exp(-((xs - glint_x) / 4.0) ** 2)
            mask &= rng.random(W) > cut * 0.92
        rows[k, mask] = tone
    return rows

def landscape(W=70, H=24, seed=5):
    B = np.ones((H, W))
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    B = np.minimum(B, 0.975 + 0.025 * fbm2(W, H, 5, 3, seed + 1))
    B = moon(B, X, Y, W * 0.76, H * 0.15, W * 0.05)
    tex = fbm2(W, H, 8, 5, seed + 5)
    wy = int(H * 0.78)
    layer_defs = [
        (0.76, [(22, 24, 0.30), (55, 16, 0.44)]),
        (0.52, [(42, 15, 0.38)]),
        (0.12, [(9, 21, 0.44), (64, 13, 0.62)]),
    ]
    B = mountains(B, X, Y, H, W, wy, layer_defs, tex, seed)
    B[wy:H] = water_rows(W, wy, H, seed + 23, glint_x=W * 0.76)
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

def seascape(W=62, H=14, seed=27):
    B = np.ones((H, W))
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    B = np.minimum(B, 0.975 + 0.025 * fbm2(W, H, 5, 3, seed + 1))
    sx = W * 0.70
    B = moon(B, X, Y, sx, H * 0.20, W * 0.04)
    hy = int(H * 0.40)
    B[hy:H] = water_rows(W, hy, H, seed + 9, glint_x=sx)
    bx = int(W * 0.26)
    B[hy + 1, bx - 3:bx + 4] = 0.05
    B[hy,     bx - 2:bx + 3] = 0.12
    B[hy - 1, bx] = 0.05
    B[hy - 2, bx] = 0.05
    B[hy + 3, bx - 2:bx + 3] = np.minimum(B[hy + 3, bx - 2:bx + 3], 0.6)
    return to_text(B, seed)

def stones(W=32, H=17, seed=44):
    B = np.ones((H, W))
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    tex = fbm2(W, H, 6, 4, seed)
    sand = (Y % 3 == 1) & (Y > H * 0.66)
    B = np.where(sand & (fbm2(W, H, 4, 3, seed + 2) > 0.30), 0.88, B)
    for cx, cy, a, b in [(16, 12.6, 7.0, 5.2), (15.3, 8.4, 5.2, 3.6), (16.4, 5.4, 3.4, 2.6)]:
        nx = (X - cx) / a
        ny = (Y - cy) * 2.0 / b
        inside = nx ** 2 + ny ** 2 <= 1
        # light from upper-left: brightness high where normal faces it
        shade = 1.12 - np.clip(0.50 + 0.34 * (nx * 0.5 + ny * 0.85) - 0.06 * tex, 0.06, 0.88)
        B = np.where(inside, np.clip(shade, 0.08, 0.9), B)
    shadow = ((X - 19) / 9.0) ** 2 + ((Y - 15.2) * 2 / 1.8) ** 2 <= 1
    B = np.where(shadow & (B > 0.85), 0.74, B)
    return to_text(B, seed)


if __name__ == "__main__":
    print("=== LANDSCAPE (index.html) ===");        print(landscape())
    print("\n=== ENSO (about.html) ===");          print(enso())
    print("\n=== SEASCAPE (projects.html) ===");   print(seascape())
    print("\n=== STONES (contact.html) ===");      print(stones())
    print("\n=== ENSO variant (404.html) ===");    print(enso(W=30, H=15, seed=19, gap_at=2.2))
