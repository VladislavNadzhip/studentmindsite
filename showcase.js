/* Интерактивные виджеты: флешкарта, майнд-мапа, LaTeX-демо, чат Амадеуса */

/* ── KaTeX: статичные формулы ── */
function renderStaticMath() {
  if (typeof katex === 'undefined') {
    setTimeout(renderStaticMath, 100);
    return;
  }
  document.querySelectorAll('[data-katex]').forEach((el) => {
    katex.render(el.dataset.katex, el, {
      throwOnError: false,
      displayMode: el.dataset.display === 'true',
    });
  });
  startLatexDemo();
}

/* ── Флешкарта ── */
const flashcard = document.getElementById('flashcard');
if (flashcard) {
  const flip = () => flashcard.classList.toggle('flipped');
  flashcard.addEventListener('click', flip);
  flashcard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
  });
}

/* ── Майнд-мапа ── */
const svg = document.getElementById('mindmap-svg');
if (svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = {
    red: '#ef4444',
    blue: '#3b82f6',
    cyan: '#22d3ee',
    gold: '#fbbf24',
  };

  const nodes = [
    { id: 0, label: 'Производная', x: 280, y: 195, c: 'gold', main: true },
    { id: 1, label: 'Касательная', x: 110, y: 80, c: 'cyan' },
    { id: 2, label: 'Правила дифференцирования', x: 400, y: 60, c: 'blue' },
    { id: 3, label: 'Экстремумы', x: 105, y: 250, c: 'red' },
    { id: 4, label: 'Теорема Лагранжа', x: 175, y: 345, c: 'blue' },
    { id: 5, label: 'Ряд Тейлора', x: 445, y: 300, c: 'cyan' },
    { id: 6, label: 'Градиент', x: 470, y: 170, c: 'red' },
  ];
  const edges = [ [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [3,4], [5,2] ];

  nodes.forEach((n, i) => {
    n.bx = n.x; n.by = n.y;   // базовая позиция (меняется при перетаскивании)
    n.phase = i * 1.7;
  });

  const edgeEls = edges.map(([a, b]) => {
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('class', 'mm-edge');
    svg.appendChild(line);
    return { line, a, b };
  });

  const nodeEls = nodes.map((n) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'mm-node' + (n.main ? ' mm-main' : ''));
    const text = document.createElementNS(NS, 'text');
    text.textContent = n.label;
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dy', '0.34em');
    g.appendChild(text);
    svg.appendChild(g);
    // рамка подгоняется под ширину текста после первого рендера
    const rect = document.createElementNS(NS, 'rect');
    g.insertBefore(rect, text);
    requestAnimationFrame(() => {
      const tw = text.getComputedTextLength();
      const rw = tw + 28;
      const rh = n.main ? 40 : 32;
      rect.setAttribute('x', -rw / 2);
      rect.setAttribute('y', -rh / 2);
      rect.setAttribute('width', rw);
      rect.setAttribute('height', rh);
      rect.setAttribute('rx', rh / 2);
    });
    rect.setAttribute('stroke', COLORS[n.c]);
    g.style.setProperty('--node-glow', COLORS[n.c]);
    return g;
  });

  let dragging = null;
  const svgPoint = (e) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  nodeEls.forEach((g, i) => {
    g.addEventListener('pointerdown', (e) => {
      dragging = i;
      g.setPointerCapture(e.pointerId);
      g.classList.add('dragging');
      e.preventDefault();
    });
    g.addEventListener('pointermove', (e) => {
      if (dragging !== i) return;
      const p = svgPoint(e);
      nodes[i].bx = Math.max(50, Math.min(510, p.x));
      nodes[i].by = Math.max(30, Math.min(370, p.y));
    });
    const release = () => { if (dragging === i) { dragging = null; g.classList.remove('dragging'); } };
    g.addEventListener('pointerup', release);
    g.addEventListener('pointercancel', release);
  });

  function tick(t) {
    const s = t * 0.001;
    nodes.forEach((n, i) => {
      const idle = dragging === i ? 0 : 1;
      n.x = n.bx + Math.sin(s * 0.7 + n.phase) * 4 * idle;
      n.y = n.by + Math.cos(s * 0.55 + n.phase * 1.3) * 3.5 * idle;
      nodeEls[i].setAttribute('transform', `translate(${n.x}, ${n.y})`);
    });
    edgeEls.forEach(({ line, a, b }) => {
      line.setAttribute('x1', nodes[a].x);
      line.setAttribute('y1', nodes[a].y);
      line.setAttribute('x2', nodes[b].x);
      line.setAttribute('y2', nodes[b].y);
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── LaTeX-демо: код печатается, рендер появляется ── */
const SAMPLES = [
  '\\int_0^{\\infty} e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}',
  '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
  'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}\\,(x-a)^n',
  'e^{i\\pi} + 1 = 0',
];

let latexStarted = false;
function startLatexDemo() {
  const codeEl = document.getElementById('latex-code');
  const outEl = document.getElementById('latex-preview-out');
  if (!codeEl || !outEl || latexStarted) return;
  latexStarted = true;

  let sample = 0;

  function typeNext() {
    const code = SAMPLES[sample];
    let i = 0;
    codeEl.textContent = '';
    outEl.classList.remove('shown');

    const typer = setInterval(() => {
      i++;
      codeEl.textContent = code.slice(0, i);
      if (i >= code.length) {
        clearInterval(typer);
        katex.render(code, outEl, { throwOnError: false, displayMode: true });
        outEl.classList.add('shown');
        sample = (sample + 1) % SAMPLES.length;
        setTimeout(typeNext, 3200);
      }
    }, 45);
  }
  typeNext();
}

/* ── Чат Амадеуса: сообщения появляются по очереди ── */
const chatDemo = document.getElementById('chat-demo');
if (chatDemo) {
  const steps = chatDemo.querySelectorAll('.chat-step');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      steps.forEach((el, i) => {
        setTimeout(() => el.classList.add('shown'), 500 + i * 750);
      });
    });
  }, { threshold: 0.35 });
  io.observe(chatDemo);
}

renderStaticMath();
