// ─── TYPING EFFECT ───────────────────────────────────────────────────────────

function typeWriter(el, text, speed = 38) {
  let i = 0;
  el.textContent = '';
  function tick() {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(tick, speed + Math.random() * 20);
    }
  }
  tick();
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

function initNav() {
  const nav = document.getElementById('nav');
  const navLinks = document.querySelector('.nav-links');
  const toggle = document.getElementById('navToggle');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 24);
    updateActiveLink();
  }, { passive: true });

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    toggle.classList.toggle('open');
  });

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('open');
    });
  });
}

function updateActiveLink() {
  const sections = ['home', 'story', 'projects', 'stack', 'philosophy', 'connect'];
  let current = 'home';

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 80) current = id;
  });

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}

// ─── PROJECT RENDERING ───────────────────────────────────────────────────────

const STATUS_MAP = {
  active:   { label: 'ACTIVE',    cls: 'status-active' },
  shipped:  { label: 'SHIPPED',   cls: 'status-shipped' },
  wip:      { label: 'WIP',       cls: 'status-wip' },
  archived: { label: 'ARCHIVED',  cls: 'status-archived' },
};

function buildCard(p) {
  const s = STATUS_MAP[p.status] || STATUS_MAP.archived;
  const tags = p.stack.map(t => `<span class="stack-tag">${t}</span>`).join('');
  const ghLink = p.github
    ? `<a href="${p.github}" target="_blank" rel="noopener" class="project-link">$ view repo</a>`
    : '';
  const demoLink = p.demo
    ? `<a href="${p.demo}" target="_blank" rel="noopener" class="project-link secondary">↗ live</a>`
    : '';

  return `
    <article class="project-card${p.featured ? ' featured' : ''}" data-cat="${p.category}">
      <div class="card-top">
        <div class="project-name">${p.name}</div>
        <span class="project-status ${s.cls}">${s.label}</span>
      </div>
      <div class="project-type">[${p.type.toUpperCase()}]</div>
      <p class="project-desc">${p.description}</p>
      <div class="project-problem">${p.problem}</div>
      <div class="project-stack">${tags}</div>
      <div class="card-footer">
        <div class="project-links">${ghLink}${demoLink}</div>
        <span class="project-meta">upd: ${p.updated}</span>
      </div>
    </article>`;
}

function renderProjects(filter = 'all') {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const list = filter === 'all'
    ? PROJECTS
    : PROJECTS.filter(p => p.category === filter);

  const sorted = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  grid.innerHTML = sorted.map(buildCard).join('');

  // Re-observe new cards
  grid.querySelectorAll('.project-card').forEach(el => revealObserver.observe(el));
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProjects(btn.dataset.filter);
    });
  });
}

// ─── SCROLL REVEAL ───────────────────────────────────────────────────────────

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('revealed');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

function initReveal() {
  document.querySelectorAll(
    '.log-entry, .principle, .stack-cat, .connect-link, .hero-name-block, .hero-tagline, .hero-raw-lines, .hero-links'
  ).forEach(el => revealObserver.observe(el));
}

// ─── HERO ASCII SCRAMBLE ─────────────────────────────────────────────────────

const CHARS = '│─┼┐┘└┌╔╗╚╝║═▓░▒█▄▀';

function scrambleText(el, finalText, duration = 700) {
  const steps = Math.floor(duration / 40);
  let step = 0;
  const interval = setInterval(() => {
    if (step >= steps) {
      el.textContent = finalText;
      clearInterval(interval);
      return;
    }
    const progress = step / steps;
    const resolved = Math.floor(progress * finalText.length);
    el.textContent = finalText.slice(0, resolved) +
      finalText.slice(resolved).replace(/[^\s\n]/g, () =>
        CHARS[Math.floor(Math.random() * CHARS.length)]
      );
    step++;
  }, 40);
}

// ─── COPY COMMAND ────────────────────────────────────────────────────────────

function initCopyCommands() {
  document.querySelectorAll('.copy-cmd').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.cmd;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = orig;
          btn.classList.remove('copied');
        }, 1800);
      });
    });
  });
}

// ─── STORY LOG EXPAND ────────────────────────────────────────────────────────

function initStoryExpand() {
  document.querySelectorAll('.log-entry[data-expandable]').forEach(entry => {
    const more = entry.querySelector('.log-more');
    const toggle = entry.querySelector('.expand-toggle');
    if (!more || !toggle) return;
    toggle.addEventListener('click', () => {
      const open = more.classList.toggle('expanded');
      toggle.textContent = open ? '[-] collapse' : '[+] expand';
    });
  });
}

// ─── BOOT SEQUENCE ───────────────────────────────────────────────────────────

function runBootSequence() {
  const lines = document.querySelectorAll('.boot-line');
  lines.forEach((line, i) => {
    setTimeout(() => {
      line.classList.add('visible');
    }, i * 120);
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  runBootSequence();

  // Typing effect in hero — delayed so boot sequence runs first
  const typingTarget = document.getElementById('typingTarget');
  if (typingTarget) {
    setTimeout(() => {
      typeWriter(
        typingTarget,
        'AI-native systems builder turning fragmented tools into functioning software.',
        34
      );
    }, 900);
  }

  // Projects
  renderProjects('all');
  initFilters();

  // Interactions
  initReveal();
  initCopyCommands();
  initStoryExpand();
});
