(function () {
  // water tank fill
  var fill = document.getElementById('tankFill');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setFill() {
    if (fill) fill.style.width = fill.getAttribute('data-w') + '%';
  }
  if (reduced) {
    setFill();
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            setFill();
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    if (fill) io.observe(fill);
  } else {
    setFill();
  }

  // roadmap filter (wait bucket includes hold-phases marked data-status="wait")
  var buttons = Array.prototype.slice.call(
    document.querySelectorAll('.filters button'),
  );
  var phases = Array.prototype.slice.call(document.querySelectorAll('.phase'));
  var emptyMsg = document.getElementById('emptyMsg');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', 'false');
      });
      btn.setAttribute('aria-pressed', 'true');
      var f = btn.getAttribute('data-filter');
      var shown = 0;
      phases.forEach(function (ph) {
        var s = ph.getAttribute('data-status');
        var match = f === 'all' || s === f || (f === 'wait' && s === 'wait');
        ph.classList.toggle('hidden', !match);
        if (match) shown++;
      });
      emptyMsg.classList.toggle('show', shown === 0);
    });
  });

  // accordions
  Array.prototype.forEach.call(
    document.querySelectorAll('.phase-toggle'),
    function (t) {
      t.addEventListener('click', function () {
        var open = t.getAttribute('aria-expanded') === 'true';
        t.setAttribute('aria-expanded', String(!open));
        var detail = t.parentElement.querySelector('.phase-detail');
        if (detail) detail.classList.toggle('open', !open);
      });
    },
  );

  // Black Friday countdown (to 2026-11-27 JST)
  var el = document.getElementById('bfDays');
  if (el) {
    var target = new Date('2026-11-27T00:00:00+09:00').getTime();
    var now = Date.now();
    var days = Math.ceil((target - now) / 86400000);
    el.textContent = days > 0 ? String(days) : days === 0 ? '0' : '開催中';
  }
})();
