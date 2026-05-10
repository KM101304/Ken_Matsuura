# Ken Matsuura — Portfolio

Personal portfolio site deployed on GitHub Pages.

**Live:** https://km101304.github.io/Ken_Matsuura/

---

## What this is

Terminal-aesthetic single-page portfolio. Covers my background, build philosophy, projects, and tech stack. Designed to feel like a personal operating system, not a generic developer template.

## Sections

- `~/story.log` — how I learned to build software (non-traditional path)
- `~/projects` — GitHub systems archive with category filter
- `~/stack.map` — tools and how they connect as a dependency graph
- `~/build_philosophy` — how I think about software
- `~/connect` — contact and channels

## Stack

Plain HTML / CSS / JavaScript. No framework, no build step, no dependencies beyond a Google Font. Deploys directly from `main` branch root.

## Editing projects

Update [`assets/js/projects.js`](assets/js/projects.js) — each project is a plain object in the `PROJECTS` array. Fields: `name`, `type`, `category`, `status`, `featured`, `description`, `problem`, `stack`, `github`, `demo`, `learned`, `updated`.

## Local preview

```bash
# Any static server works — e.g.:
npx serve .
# or
python3 -m http.server 8080
```
