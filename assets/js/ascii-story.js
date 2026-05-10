const FRAMES = [
  {
    caption: "software looks like one big wall before you understand it.",
    art:
`  ████████████████████████████████████████
  █                                      █
  █                                      █
  █          S O F T W A R E            █
  █                                      █
  █                                      █
  ████████████████████████████████████████`
  },

  {
    caption: "then you start to see the seams.",
    art:
`  ████████████│███████████████│███████████
  ████████████│███████████████│███████████
  ════════════╪═══════════════╪═══════════
  ████████████│███████████████│███████████
  ████████████│███████████████│███████████
  ════════════╪═══════════════╪═══════════
  ████████████│███████████████│███████████`
  },

  {
    caption: "files. apis. databases. interfaces. that's it.",
    art:
`  ┌────────────┐       ┌────────────┐
  │  browser   │──────▶│   server   │
  └────────────┘       └─────┬──────┘
                             │
                       ┌─────▼──────┐
                       │  database  │
                       └────────────┘`
  },

  {
    caption: "you open VS Code. you immediately break something.",
    art:
`  $ npm install
  added 847 packages in 12s

  $ npm start
  ▶  Error: ENOENT: no such file or directory

  $ node server.js
  ▶  ReferenceError: fetch is not defined`
  },

  {
    caption: "debugging becomes the classroom.",
    art:
`  ▶ Cannot read property 'map' of undefined
    → data is never the shape you expect

  ▶ CORS policy blocked this request
    → systems have boundaries for reasons

  ▶ relation "users" does not exist
    → infrastructure order matters`
  },

  {
    caption: "ai moved the hard part. it did not remove it.",
    art:
`  before:  memorize syntax to write code

  after:   design systems that actually work
           debug what actually broke
           explain requirements precisely
           know what to build and why

  verdict: harder. just different.`
  },

  {
    caption: "the early builds were all broken. that's how you learn.",
    art:
`  v0.1  ─  broke on first real user
  v0.2  ─  broke under real data volume
  v0.3  ─  broke when the schema changed
  v0.4  ─  broke when auth was added
  v0.5  ─  broke in production only
  v0.6  ─  broke the payment flow
        ...
  v1.0  ─  shipped`
  },

  {
    caption: "and eventually you ship something that actually works.",
    art:
`  ┌────────────────────────────────────┐
  │                                    │
  │   ✓  frontend    ✓  backend        │
  │   ✓  auth        ✓  database       │
  │   ✓  payments    ✓  deployed       │
  │                                    │
  │   v1.0 is live.                    │
  │                                    │
  └────────────────────────────────────┘`
  },
];

(function () {
  const pre     = document.getElementById('ascii-story');
  const caption = document.getElementById('ascii-caption');
  if (!pre || !caption) return;

  let index = 0;

  function show() {
    // fade out
    pre.style.opacity     = '0';
    caption.style.opacity = '0';

    setTimeout(function () {
      pre.textContent     = FRAMES[index].art;
      caption.textContent = FRAMES[index].caption;
      index = (index + 1) % FRAMES.length;

      // fade in
      pre.style.opacity     = '1';
      caption.style.opacity = '1';
    }, 320);
  }

  show();
  setInterval(show, 4800);
})();
