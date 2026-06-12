# Ken Matsuura — Personal Site

Personal site deployed on GitHub Pages.

**Live:** https://km101304.github.io/Ken_Matsuura/

---

## What this is

Minimal multi-page personal site: home, projects, about, and contact. The home
page renders an animated ASCII-art portrait on a canvas behind a frosted-glass
content card; the inner pages are plain, fast, text-first HTML.

## Pages

- `index.html` — intro and current work, with the ASCII-art background
- `projects.html` — project archive grouped by category
- `about.html` — background, how I learned, what I use
- `contact.html` — email and channels
- `404.html` — custom not-found page (served by GitHub Pages)

## Stack

Plain HTML / CSS / JavaScript. No framework, no build step, no dependencies.
Deploys directly from the repository root via GitHub Pages.

- `assets/css/style.css` — all styles
- `assets/js/ascii-face.js` — ASCII portrait renderer (canvas, 12fps, respects
  `prefers-reduced-motion`)
- `assets/img/face.jpg` — source image for the ASCII portrait

## Local preview

```bash
# Any static server works — e.g.:
npx serve .
# or
python3 -m http.server 8080
```
