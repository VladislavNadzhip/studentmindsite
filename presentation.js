const SLIDES = [
  {
    icon: '🧠',
    title: 'Student Mind',
    subtitle: 'Vibe-coding? Vibe studying!',
    bg: ['#dc2626', '#2563eb'],
  },
  {
    icon: '📖',
    title: 'PDF-библиотека',
    subtitle: 'Читай учебники, выделяй формулы ножницами → мгновенная флешкарта',
    bg: ['#2563eb', '#22d3ee'],
  },
  {
    icon: '🃏',
    title: 'Флешкарты FSRS',
    subtitle: 'Умное интервальное повторение с LaTeX. Экспорт в Anki для телефона.',
    bg: ['#22d3ee', '#fbbf24'],
  },
  {
    icon: '🌌',
    title: 'Cosmic Mind Map',
    subtitle: 'Граф понятий растёт автоматически из ваших AI-запросов',
    bg: ['#fbbf24', '#dc2626'],
  },
  {
    icon: '🤖',
    title: 'AI-панель',
    subtitle: 'Claude, Perplexity, DeepSeek — ваша сессия, без API-ключей',
    bg: ['#dc2626', '#1d4ed8'],
  },
  {
    icon: '🎓',
    title: 'Скачай бесплатно',
    subtitle: '~10 МБ · Windows · 100% локально · MIT License',
    bg: ['#2563eb', '#fbbf24'],
  },
];

const SLIDE_DURATION = 5000;
let currentSlide = 0;
let isPlaying = true;
let slideTimer = null;
let progressRAF = null;
let slideStart = 0;

const canvas = document.getElementById('presentation-canvas');
const ctx = canvas.getContext('2d');
const slideContent = document.getElementById('slide-content');
const progressBar = document.getElementById('progress-bar');
const slideCounter = document.getElementById('slide-counter');
const playToggle = document.getElementById('play-toggle');
const playIcon = document.getElementById('play-icon');

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.scale(2, 2);
}

function drawBackground(slide, progress) {
  const w = canvas.width / 2;
  const h = canvas.height / 2;
  const [c1, c2] = slide.bg;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(5,5,8,0.7)';
  ctx.fillRect(0, 0, w, h);

  const t = Date.now() * 0.001;
  for (let i = 0; i < 30; i++) {
    const x = (Math.sin(t * 0.3 + i * 1.7) * 0.5 + 0.5) * w;
    const y = (Math.cos(t * 0.2 + i * 2.3) * 0.5 + 0.5) * h;
    const r = 20 + Math.sin(t + i) * 10;
    const alpha = 0.03 + Math.sin(t * 0.5 + i) * 0.02;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(34,211,238,${alpha})`;
    ctx.fill();
  }

  for (let i = 0; i < 15; i++) {
    const x1 = Math.random() * w;
    const y1 = Math.random() * h;
    const x2 = x1 + (Math.random() - 0.5) * 100;
    const y2 = y1 + (Math.random() - 0.5) * 100;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(251,191,36,${0.05 + progress * 0.05})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function renderSlideContent(slide) {
  slideContent.classList.remove('active');
  requestAnimationFrame(() => {
    slideContent.innerHTML = `
      <span class="slide-icon">${slide.icon}</span>
      <h3>${slide.title}</h3>
      <p>${slide.subtitle}</p>
    `;
    slideContent.classList.add('active');
  });
}

function updateCounter() {
  slideCounter.textContent = `${currentSlide + 1} / ${SLIDES.length}`;
}

function goToSlide(index) {
  currentSlide = ((index % SLIDES.length) + SLIDES.length) % SLIDES.length;
  renderSlideContent(SLIDES[currentSlide]);
  updateCounter();
  slideStart = performance.now();
  if (isPlaying) resetTimer();
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

function resetTimer() {
  clearTimeout(slideTimer);
  slideStart = performance.now();
  slideTimer = setTimeout(nextSlide, SLIDE_DURATION);
}

function animateProgress() {
  if (!isPlaying) return;
  const elapsed = performance.now() - slideStart;
  const pct = Math.min(elapsed / SLIDE_DURATION, 1) * 100;
  progressBar.style.width = pct + '%';
  drawBackground(SLIDES[currentSlide], pct / 100);
  progressRAF = requestAnimationFrame(animateProgress);
}

function startPlayback() {
  isPlaying = true;
  playIcon.textContent = '⏸';
  resetTimer();
  cancelAnimationFrame(progressRAF);
  animateProgress();
}

function pausePlayback() {
  isPlaying = false;
  playIcon.textContent = '▶';
  clearTimeout(slideTimer);
  cancelAnimationFrame(progressRAF);
}

playToggle.addEventListener('click', () => {
  isPlaying ? pausePlayback() : startPlayback();
});

document.getElementById('next-slide').addEventListener('click', () => {
  nextSlide();
  if (isPlaying) startPlayback();
});

document.getElementById('prev-slide').addEventListener('click', () => {
  prevSlide();
  if (isPlaying) startPlayback();
});

resizeCanvas();
goToSlide(0);
startPlayback();

window.addEventListener('resize', () => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  resizeCanvas();
});