const filterGroup = document.querySelector('.filters');
const filterButtons = [...filterGroup.querySelectorAll('button[data-filter]')];
const phases = [...document.querySelectorAll('.phase')];
const filterStatus = document.getElementById('filterStatus');

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    for (const candidate of filterButtons) {
      candidate.setAttribute('aria-pressed', String(candidate === button));
    }
    const { filter } = button.dataset;
    let shown = 0;
    for (const phase of phases) {
      phase.hidden = filter !== 'all' && phase.dataset.status !== filter;
      if (!phase.hidden) shown++;
    }
    filterStatus.textContent = `${phases.length}件中${shown}件を表示`;
  });
}
filterGroup.hidden = false;

const countdown = document.getElementById('bfCountdown');
const dayStart = Date.parse(`${countdown.dateTime}T00:00:00+09:00`);
const dayMs = 86_400_000;
const remaining = dayStart - Date.now();
if (remaining > 0) {
  countdown.textContent = `あと${Math.ceil(remaining / dayMs)}日`;
} else {
  countdown.textContent = remaining > -dayMs ? '本日' : '終了';
}

const fill = document.getElementById('tankFill');
if (
  'IntersectionObserver' in window &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    fill.classList.add('rise');
    observer.disconnect();
  });
  observer.observe(fill);
}
