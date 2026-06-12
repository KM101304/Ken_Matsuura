# Ken Matsuura — Personal Site

Personal site deployed on GitHub Pages.

**Live:** https://km101304.github.io/Ken_Matsuura/

---

## What this is

Minimal multi-page personal site: home, projects, about, and contact.
Text-first serif pages with static, monochrome ASCII art plates set in the
white space like illustrations in a printed book — inspired by
*Zen and the Art of the Macintosh*. A classic Mac on the home page, mountains
on about, a sailboat on projects, a teacup on contact, an ensō on the 404.

## Pages

- `index.html` — intro and current work
- `projects.html` — project archive grouped by category
- `about.html` — background, how I learned, what I use
- `contact.html` — email and channels
- `404.html` — custom not-found page (served by GitHub Pages)

## Stack

Plain HTML / CSS. No JavaScript, no framework, no build step, no
dependencies. Deploys directly from the repository root via GitHub Pages.

- `assets/css/style.css` — all styles
- ASCII art lives inline in each page as `<pre class="ascii-art">` plates

## Local preview

```bash
# Any static server works — e.g.:
npx serve .
# or
python3 -m http.server 8080
```
