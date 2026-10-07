// Прелоадер главной — одометр первого экрана. Шкала заполняется по мере загрузки (шрифты, фото первого экрана, вся страница),
// километры набегают до 068 420, подпись «Проверяем пробег» сменяется на «Пробег подтверждён»; затем тёмный экран уходит вверх
// колоннами по сетке (приём S-2K) и открывает первый экран — там одометр продолжает свою анимацию (событие preloader:done).
// Показывается только если в <head> поставлен класс is-preloading: есть JS и нет reduced motion. Минимум 1,6 с, максимум 6 с.
(function () {
  var root = document.documentElement, box = document.querySelector('[data-preloader]');
  if (!box) return;
  if (!root.classList.contains('is-preloading')) { box.remove(); return; }
  var NS = 'http://www.w3.org/2000/svg';
  var gauge = box.querySelector('[data-preload-gauge]'), digits = box.querySelector('[data-preload-km]'), label = box.querySelector('[data-preload-label]');
  var n = Number(gauge.getAttribute('data-ticks') || 71), km = Number(digits.getAttribute('data-preload-km')), ticks = [];
  gauge.setAttribute('viewBox', '0 0 240 128');
  for (var i = 0; i < n; i++) {
    var a = Math.PI + (Math.PI * i) / (n - 1), r1 = 100 - (i % 5 === 0 ? 12 : 7), line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', (120 + r1 * Math.cos(a)).toFixed(2)); line.setAttribute('y1', (120 + r1 * Math.sin(a)).toFixed(2));
    line.setAttribute('x2', (120 + 100 * Math.cos(a)).toFixed(2)); line.setAttribute('y2', (120 + 100 * Math.sin(a)).toFixed(2));
    line.setAttribute('class', 'tick');
    gauge.appendChild(line); ticks.push(line);
  }
  gauge.classList.add('is-on');

  // Готовность: шрифты, фото первого экрана, событие load — по трети шкалы
  var ready = 0, PARTS = 3;
  function part() { ready = Math.min(PARTS, ready + 1); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(part, part); else part();
  var heroImg = document.querySelector('.hero__bg img');
  if (!heroImg || heroImg.complete) part(); else { heroImg.addEventListener('load', part); heroImg.addEventListener('error', part); }
  if (document.readyState === 'complete') part(); else addEventListener('load', part);

  var t0 = performance.now(), MIN = 1600, MAX = 6000, shown = 0, lastHead = -1;
  function render(v) {
    var head = Math.round(v * (n - 1));
    if (head !== lastHead) {
      lastHead = head;
      ticks.forEach(function (t, k) { t.setAttribute('class', k < head ? 'tick tick--on' : k === head ? 'tick tick--on tick--head' : 'tick'); });
    }
    var s = String(Math.round(km * v)).padStart(6, '0');
    digits.textContent = s.slice(0, 3) + ' ' + s.slice(3);
  }
  (function frame(now) {
    var el = now - t0, real = el > MAX ? 1 : ready / PARTS;
    // пока ресурсы грузятся, стрелка всё равно ползёт (до 90%), но не быстрее минимального времени
    var target = Math.min(el / MIN, real === 1 ? 1 : Math.max(real * 0.9, Math.min(0.9, el / 3200)));
    shown += (target - shown) * 0.09;
    if (real === 1 && 1 - shown < 0.002) shown = 1;
    render(shown);
    if (shown < 1) { requestAnimationFrame(frame); return; }
    finish();
  })(t0);

  function finish() {
    label.textContent = 'Пробег подтверждён';
    box.classList.add('is-done');
    setTimeout(function () {
      box.classList.add('is-out');                 // колонны уходят вверх, первый экран открывается
      root.classList.remove('is-preloading');      // анимации первого экрана и прокрутка — включаются
      setTimeout(function () { dispatchEvent(new Event('preloader:done')); }, 250);
      setTimeout(function () { box.remove(); }, 1400);
    }, 500);
  }
})();
