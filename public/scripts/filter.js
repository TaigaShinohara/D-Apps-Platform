const controls = document.querySelector('[data-filters]');
if (controls) {
  controls.hidden = false;
  const category = controls.querySelector('[data-category]');
  const platform = controls.querySelector('[data-platform]');
  const cards = [...document.querySelectorAll('[data-app-card]')];
  const status = document.querySelector('[data-result-status]');
  controls.addEventListener('change', () => {
    let count = 0;
    for (const card of cards) {
      card.hidden = !(
        (!category.value || card.dataset.category === category.value) &&
        (!platform.value ||
          card.dataset.platforms.split(',').includes(platform.value))
      );
      if (!card.hidden) count++;
    }
    status.textContent =
      document.documentElement.lang === 'ja'
        ? `${count}件のアプリ`
        : `${count} apps`;
  });
}
