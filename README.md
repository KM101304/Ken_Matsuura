# Ken Matsuura — Personal Site

Personal site deployed on GitHub Pages.

**Live:** https://km101304.github.io/Ken_Matsuura/

---

## What this is

Minimal multi-page personal site: home, projects, about, and contact.
Text-first serif pages with terminal-window accents — an animated ASCII
torus-knot art piece on the home page, an ASCII stack diagram on the about
page, and a typed shell session on the contact page.

## Pages

- `index.html` — intro and current work, with the ASCII art panel
- `projects.html` — project archive grouped by category
- `about.html` — background, how I learned, stack map
- `contact.html` — typed terminal session with email and channels
- `404.html` — custom not-found page (served by GitHub Pages)

## Stack

Plain HTML / CSS / JavaScript. No framework, no build step, no dependencies.
Deploys directly from the repository root via GitHub Pages.

- `assets/css/style.css` — all styles
- `assets/js/ascii-art.js` — ASCII torus-knot renderer (canvas, z-buffered,
  pointer-reactive, respects `prefers-reduced-motion`)
- `assets/js/terminal.js` — typed terminal session on the contact page

## Local preview

```bash
# Any static server works — e.g.:
npx serve .
# or
python3 -m http.server 8080
```
