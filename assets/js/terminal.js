(function () {
  // Typed terminal session on the contact page. Commands are typed
  // character by character; output lines (with real links) appear whole.
  // Reduced-motion users get the full session instantly.

  const pre = document.getElementById('terminal-session');
  if (!pre) return;

  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LINES = [
    { cmd: 'whoami' },
    { html: 'ken matsuura — software builder, vancouver bc' },
    { cmd: 'cat contact.txt' },
    { html: 'email:     <a href="mailto:kmatsuura04@gmail.com">kmatsuura04@gmail.com</a>' },
    { html: 'github:    <a href="https://github.com/KM101304" target="_blank" rel="noopener">github.com/KM101304</a>' },
    { html: 'linkedin:  <a href="https://www.linkedin.com/in/ken-matsuura-8a0761290/" target="_blank" rel="noopener">in/ken-matsuura-8a0761290</a>' },
    { html: 'location:  vancouver, bc' },
    { cmd: 'echo "$RESPONSE_POLICY"' },
    { html: 'async preferred — i respond to everything.' }
  ];

  const TYPE_MS = 34;       // per character while typing a command
  const CMD_PAUSE = 260;    // after a command, before its output
  const OUT_PAUSE = 120;    // between output lines

  const caret = document.createElement('span');
  caret.className = 'term-caret';
  caret.textContent = '▍';

  function promptSpan() {
    const s = document.createElement('span');
    s.className = 'term-prompt';
    s.textContent = '$ ';
    return s;
  }

  function addLine(line) {
    const div = document.createElement('div');
    if (line.cmd !== undefined) {
      div.appendChild(promptSpan());
      const cmd = document.createElement('span');
      cmd.className = 'term-cmd';
      cmd.textContent = line.cmd;
      div.appendChild(cmd);
    } else {
      div.className = 'term-out';
      div.innerHTML = line.html;
    }
    pre.appendChild(div);
    return div;
  }

  if (reduceMotion) {
    LINES.forEach(addLine);
    return;
  }

  let li = 0;

  function nextLine() {
    if (li >= LINES.length) {
      // Idle prompt with a blinking caret at the end of the session
      const div = document.createElement('div');
      div.appendChild(promptSpan());
      div.appendChild(caret);
      pre.appendChild(div);
      return;
    }
    const line = LINES[li++];

    if (line.cmd !== undefined) {
      const div = document.createElement('div');
      div.appendChild(promptSpan());
      const cmd = document.createElement('span');
      cmd.className = 'term-cmd';
      div.appendChild(cmd);
      div.appendChild(caret);
      pre.appendChild(div);

      let ci = 0;
      (function typeChar() {
        if (ci < line.cmd.length) {
          cmd.textContent += line.cmd[ci++];
          setTimeout(typeChar, TYPE_MS + Math.random() * 28);
        } else {
          caret.remove();
          setTimeout(nextLine, CMD_PAUSE);
        }
      })();
    } else {
      addLine(line);
      setTimeout(nextLine, OUT_PAUSE);
    }
  }

  setTimeout(nextLine, 350);
})();
