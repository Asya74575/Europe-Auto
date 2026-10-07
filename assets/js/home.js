// Главная «Вестлайн»: одометр первого экрана, закрепление с «лестницей» (S-2K), фото во весь экран, переходы прямоугольниками,
// шаги, карусели, маршрут, отзывы, калькулятор, подсветка слов.
// Каждое движение — от 0,8 с с мягким торможением; работа только в ответ на прокрутку, курсор или ввод.
// Без JS всё видно в конечном состоянии; при prefers-reduced-motion — сразу конечное состояние.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var twoCols = matchMedia('(max-width: 1100px)');   // до 1100px сетка из двух колонок
  var compact = matchMedia('(max-width: 1280px)');   // 1280 и уже — плотнее: окно фото стоянки прижато к верху кадра
  var root = document.documentElement;
  var fmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  var NS = 'http://www.w3.org/2000/svg';
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // Один обработчик прокрутки на всё, что следует за ней (каждый раз — один кадр)
  var onScroll = [], sQueued = false;
  function scrollFrame() { sQueued = false; onScroll.forEach(function (f) { f(); }); }
  function requestScroll() { if (!sQueued) { sQueued = true; requestAnimationFrame(scrollFrame); } }
  addEventListener('scroll', requestScroll, { passive: true });
  addEventListener('resize', requestScroll);

  // ---------- Одометр первого экрана (правка 2026-10-06) ----------
  // Как приборы при запуске двигателя: шкала пробегает до конца и возвращается к показанию, светлый штрих-«стрелка» едет по ней;
  // цифры крутятся барабанами (младшие — больше оборотов). Повтор — при наведении и когда первый экран снова в кадре.
  var odo = document.querySelector('[data-odo]');
  if (odo) {
    var gauge = odo.querySelector('[data-gauge]'), digits = odo.querySelector('[data-km]');
    var n = Number(gauge.getAttribute('data-ticks') || 61), fill = Number(gauge.getAttribute('data-fill') || 0);
    var r = 100, cx = 120, cy = 120, ticks = [];
    gauge.setAttribute('viewBox', '0 0 240 128');
    for (var i = 0; i < n; i++) {
      var a = Math.PI + (Math.PI * i) / (n - 1), long = i % 5 === 0, r1 = r - (long ? 12 : 7);
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', (cx + r1 * Math.cos(a)).toFixed(2)); line.setAttribute('y1', (cy + r1 * Math.sin(a)).toFixed(2));
      line.setAttribute('x2', (cx + r * Math.cos(a)).toFixed(2)); line.setAttribute('y2', (cy + r * Math.sin(a)).toFixed(2));
      line.setAttribute('class', 'tick');
      gauge.appendChild(line); ticks.push(line);
    }
    var lastLevel = -1;
    function setLevel(level) {
      var head = Math.round(level * (n - 1));
      if (head === lastLevel) return;
      lastLevel = head;
      ticks.forEach(function (t, k) { t.setAttribute('class', k < head ? 'tick tick--on' : k === head ? 'tick tick--on tick--head' : 'tick'); });
    }
    // Барабаны: лента 0–9, повторённая по числу оборотов
    var km = String(digits.getAttribute('data-km')).padStart(6, '0'), TURNS = [0, 1, 1, 2, 2, 3], drums = [];
    digits.textContent = '';
    km.split('').forEach(function (ch, k) {
      if (k === 3) { var gap = document.createElement('i'); gap.className = 'gap'; digits.appendChild(gap); }
      var dg = document.createElement('i'), strip = document.createElement('span'), cells = (TURNS[k] + 1) * 10;
      dg.className = 'dg';
      for (var c = 0; c < cells; c++) { var b = document.createElement('b'); b.textContent = c % 10; strip.appendChild(b); }
      dg.appendChild(strip); digits.appendChild(dg);
      drums.push({ strip: strip, to: (TURNS[k] * 10 + Number(ch)) / cells, delay: k * 70 });
    });
    function rollDrums(instant) {
      drums.forEach(function (d) {
        d.strip.style.transition = 'none';
        d.strip.style.transform = 'translateY(' + (instant ? -d.to * 100 : 0) + '%)';
      });
      if (instant) return;
      void digits.offsetWidth;   // сброс в 000 000 применён — дальше прокрутка с анимацией
      drums.forEach(function (d) {
        d.strip.style.transition = '';
        d.strip.style.transitionDelay = d.delay + 'ms';
        d.strip.style.transform = 'translateY(' + (-d.to * 100).toFixed(3) + '%)';
      });
    }
    var sweeping = false;
    function sweep(delay) {
      if (sweeping) return;
      sweeping = true; odo.classList.remove('is-idle'); lastLevel = -1; setLevel(0);
      setTimeout(function () {
        rollDrums(false);
        var t0 = performance.now(), UP = 1000, HOLD = 180, DOWN = 1100;
        (function frame(now) {
          var t = now - t0, level;
          if (t < UP) level = easeInOut(t / UP);
          else if (t < UP + HOLD) level = 1;
          else level = 1 - (1 - fill) * easeInOut(clamp01((t - UP - HOLD) / DOWN));
          setLevel(level);
          if (t < UP + HOLD + DOWN) requestAnimationFrame(frame);
          else { sweeping = false; odo.classList.add('is-idle'); }
        })(t0);
      }, delay);
    }
    gauge.classList.add('is-on');
    if (reduce) { setLevel(fill); rollDrums(true); }
    else {
      // с прелоадером — после того как он ушёл (его одометр передаёт эстафету этому)
      if (root.classList.contains('is-preloading')) addEventListener('preloader:done', function () { sweep(300); }, { once: true });
      else sweep(450);
      if (finePointer) odo.addEventListener('mouseenter', function () { sweep(0); });
      if ('IntersectionObserver' in window) {
        var wasOut = false;
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (!e.isIntersecting) wasOut = true; else if (wasOut) { wasOut = false; sweep(150); } });
        }).observe(odo);
      }
    }
  }

  // ---------- Закрепление и «лестница» (S-2K, правки 2026-10-06) ----------
  // Кадр останавливается на экране (sticky), следующий блок наезжает на него снизу. Последняя колонна «лестницы» — это край
  // следующего блока: идёт ровно с прокруткой, поэтому сразу под ней текст и пустого экрана нет. Остальные колонны идут впереди
  // лесенкой, левая первой. У фото «Откуда машины» сначала окно растёт от колонок 2–3 до всего экрана (data-grow-len, в экранах).
  var pinEls = Array.prototype.slice.call(document.querySelectorAll('[data-pin]'));
  if (pinEls.length && !reduce) {
    root.classList.add('js-pin');
    var STAIR_STEP = 0.12, pinVW = 0, pinVH = 0;
    var pins = pinEls.map(function (el) {
      return { el: el, stage: el.querySelector('[data-pin-stage]'), space: el.querySelector('.pin__space'), cols: el.querySelectorAll('[data-stair] i'),
        follow: el.nextElementSibling, frame: el.querySelector('[data-grow]'), img: el.querySelector('[data-grow] img'), section: el.closest('.section'),
        growLen: Number(el.getAttribute('data-grow-len') || 0), top: 0, grow: 0, cover: 0 };
    });
    function measurePins() {
      var vw = root.clientWidth, vh = innerHeight;
      // на телефоне высота окна прыгает при скрытии адресной строки — пересчёт только при заметном изменении
      if (vw === pinVW && Math.abs(vh - pinVH) < 120) return;
      pinVW = vw; pinVH = vh;
      pins.forEach(function (p) {
        p.grow = Math.round(vh * p.growLen); p.cover = vh;
        p.space.style.height = (p.grow + p.cover) + 'px';
        if (p.follow) p.follow.style.marginTop = -p.cover + 'px';   // следующий блок наезжает на кадр, пока тот стоит
        p.top = Math.min(0, vh - p.stage.offsetHeight);             // кадр выше экрана останавливается, когда виден его низ
        p.stage.style.top = p.top + 'px';
      });
    }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    var pRaf = 0;
    function pinFrame() {
      pRaf = 0;
      var vw = root.clientWidth, vh = innerHeight, two = twoCols.matches;
      pins.forEach(function (p) {
        if (p.frame) {
          // окно фото: от колонок 2–3 (до 1100px — от полей страницы) до всего экрана
          var t = p.grow ? clamp01((p.top - p.el.getBoundingClientRect().top) / p.grow) : 1;
          var g = p.section ? parseFloat(getComputedStyle(p.section).paddingLeft) || 0 : 0, col = (vw - 2 * g) / 4;
          var x0 = two ? g : g + col, w0 = vw - 2 * x0, h0 = Math.min(vh * 0.62, w0 * 0.62), e = smooth(t);
          var yT = compact.matches ? 0 : (vh - h0) / 2, yB = vh - h0 - yT;   // сверху и снизу; на 1280 и уже — без пустоты над фото
          p.frame.style.clipPath = 'inset(' + (yT * (1 - e)).toFixed(1) + 'px ' + (x0 * (1 - e)).toFixed(1) + 'px ' + (yB * (1 - e)).toFixed(1) + 'px)';
          if (p.img) p.img.style.transform = 'scale(' + (1.16 - 0.16 * e).toFixed(4) + ')';
        }
        var stageTop = p.stage.getBoundingClientRect().top, H = p.stage.offsetHeight;
        var edge = p.follow ? p.follow.getBoundingClientRect().top : vh, q = clamp01((vh - edge) / vh);
        var k = two ? 2 : 4, span = 1 - STAIR_STEP * (k - 2), narrow = vw < 768;
        for (var i = 0; i < k; i++) {
          // 767 и уже (правка 2026-10-07): текст первого экрана — на всю ширину, и левая колонна, обгоняя прокрутку втрое,
          // закрывала гарантии за 20–30px. Здесь она сначала идёт вместе с краем блока и уходит вперёд плавно, не больше чем на 12% экрана.
          var y = i === k - 1 ? edge : narrow ? edge - vh * 0.12 * smooth(clamp01(q / 0.5)) : Math.min(edge, vh * (1 - easeOut(clamp01((q - i * STAIR_STEP) / span))));
          p.cols[i].style.transform = 'translateY(' + Math.max(0, Math.min(H + 2, y - stageTop)).toFixed(1) + 'px)';
        }
      });
    }
    function requestPin() { if (!pRaf) pRaf = requestAnimationFrame(pinFrame); }
    measurePins(); pinFrame();
    onScroll.push(requestPin);
    addEventListener('resize', function () { measurePins(); requestPin(); });
    addEventListener('load', function () { pinVW = 0; measurePins(); requestPin(); });
  }

  // ---------- Смена фона между остальными блоками: фон следующего блока поднимается прямоугольниками по колонкам ----------
  // Прогресс — от прокрутки: 0, когда край блока входит снизу в кадр, 1 — когда он поднялся до 40% высоты экрана.
  // Колонки стартуют по очереди, направление чередуется; прогресс догоняет прокрутку с инерцией около 0,2 с.
  var edges = Array.prototype.slice.call(document.querySelectorAll('[data-edge]'));
  if (edges.length && !reduce) {
    root.classList.add('js-edges');
    var curtains = edges.map(function (el, k) {
      var order = (el.getAttribute('data-order') || (k % 2 ? '3 2 1 0' : '0 1 2 3')).split(' ').map(Number);
      return { el: el, cols: el.children, order: order, shown: -1, target: 0 };
    });
    var STEP = 0.11, SPAN = 1 - STEP * 3, cRaf = 0;
    function curtainFrame() {
      var vh = innerHeight, moving = false, two = twoCols.matches;
      curtains.forEach(function (c) {
        var b = c.el.getBoundingClientRect().bottom;
        c.target = clamp01((vh - b) / (vh * 0.6));
        if (c.shown < 0) c.shown = c.target;   // первый кадр — сразу на месте, без «доезда»
        var d = c.target - c.shown;
        if (Math.abs(d) > 0.0008) { c.shown += d * 0.12; moving = true; } else c.shown = c.target;
        for (var i = 0; i < (two ? 2 : 4); i++) {
          var slot = two ? (c.order[0] < c.order[3] ? i : 1 - i) * 1.5 : c.order.indexOf(i);
          var p = smooth(clamp01((c.shown - slot * STEP) / SPAN));
          c.cols[i].style.transform = 'scaleY(' + p.toFixed(4) + ')';
        }
      });
      cRaf = moving ? requestAnimationFrame(curtainFrame) : 0;
    }
    onScroll.push(function () { if (!cRaf) cRaf = requestAnimationFrame(curtainFrame); });
    curtainFrame();
  }

  // ---------- Строка стран, вариант 2: линия маршрута идёт от Германии к Минску вслед за прокруткой ----------
  var trip = document.querySelector('[data-trip]');
  if (trip && !reduce) {
    root.classList.add('js-trip');
    var tripGrid = trip.querySelector('.trip__grid'), stops = Array.prototype.slice.call(trip.querySelectorAll('.trip__stop'));
    var tripShown = -1, tripRaf = 0;
    function tripFrame() {
      var r = tripGrid.getBoundingClientRect(), vh = innerHeight;
      var target = clamp01((vh * 0.85 - r.top) / (r.height + vh * 0.3)) * stops.length;
      if (tripShown < 0) tripShown = target;
      var d = target - tripShown, moving = Math.abs(d) > 0.002;
      tripShown = moving ? tripShown + d * 0.14 : target;
      stops.forEach(function (s, i) {
        s.style.setProperty('--fill', clamp01(tripShown - i).toFixed(3));
        s.classList.toggle('is-on', tripShown > i + 0.06);
      });
      tripRaf = moving ? requestAnimationFrame(tripFrame) : 0;
    }
    onScroll.push(function () { if (!tripRaf) tripRaf = requestAnimationFrame(tripFrame); });
    tripFrame();
  }

  // ---------- «Как работаем»: текущий шаг — по середине экрана ----------
  var steps = document.querySelectorAll('.how .step'), toc = document.querySelectorAll('.how__toc li');
  if (steps.length && 'IntersectionObserver' in window) {
    var stepIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var k = Number(e.target.getAttribute('data-step'));
        steps.forEach(function (s, i) { s.classList.toggle('is-now', i === k); });
        toc.forEach(function (li, i) { li.classList.toggle('is-now', i === k); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { stepIO.observe(s); });
  }

  // ---------- Отзывы до 1100px (правка 2026-10-07 «сложно воспринимать»): лента карточек, как «Пригнанные».
  // Карточки собираются из тех же отзывов; на компьютере остаются вкладки, лента скрыта (home.css) ----------
  var voicesBox = document.querySelector('[data-voices]');
  if (voicesBox) {
    var vs = document.createElement('div');
    vs.className = 'slider voice-slider';
    vs.setAttribute('data-slider', ''); vs.setAttribute('aria-roledescription', 'карусель'); vs.setAttribute('aria-label', 'Отзывы клиентов');
    vs.innerHTML = '<div class="slider__view" tabindex="0"><div class="slider__track"></div></div>' +
      '<div class="slider__bar"><p class="slider__count caption" aria-live="polite"><b data-slider-now>01</b> / <span data-slider-total>05</span></p>' +
      '<span class="slider__progress" aria-hidden="true"><i data-slider-progress></i></span>' +
      '<div class="slider__nav"><button class="slider__btn" type="button" data-slider-prev aria-label="Предыдущий отзыв">←</button><button class="slider__btn" type="button" data-slider-next aria-label="Следующий отзыв">→</button></div></div>' +
      '<div class="slider__cursor" aria-hidden="true"><span>Листать</span></div>';
    var vTrack = vs.querySelector('.slider__track');
    voicesBox.querySelectorAll('[data-voice]').forEach(function (a) {
      var card = document.createElement('article');
      card.className = 'voice-card';
      Array.prototype.forEach.call(a.children, function (ch) { card.appendChild(ch.cloneNode(true)); });
      vTrack.appendChild(card);
    });
    voicesBox.after(vs);
    root.classList.add('js-voice-cards');
  }

  // ---------- Карусели (правка 2026-10-06): лента двигается своим движением, без прокрутки внутри блока ----------
  // Тянуть мышью (курсор-круг «Листать») или пальцем, колесо/тачпад вбок, стрелки и клавиши ← →; отпускание — с инерцией
  // и привязкой к карточке. Вертикальное колесо не перехватывается — страница не «стопорится».
  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var view = slider.querySelector('.slider__view'), track = slider.querySelector('.slider__track'), items = Array.prototype.slice.call(track.children);
    var nowEl = slider.querySelector('[data-slider-now]'), totalEl = slider.querySelector('[data-slider-total]'), bar = slider.querySelector('[data-slider-progress]');
    var prev = slider.querySelector('[data-slider-prev]'), next = slider.querySelector('[data-slider-next]'), cursor = slider.querySelector('.slider__cursor');
    var x = 0, target = 0, step = 1, perView = 1, maxIndex = 0, index = 0, raf = 0, viewW = 1;
    function pad(v) { return (v < 10 ? '0' : '') + v; }
    function limit(v) { return Math.max(0, Math.min(maxIndex * step, v)); }
    function measure() {
      viewW = view.clientWidth; step = items[0].getBoundingClientRect().width || 1;
      perView = Math.max(1, Math.round(viewW / step)); maxIndex = Math.max(0, items.length - perView);
      index = Math.min(index, maxIndex); x = target = index * step; render(); status();
    }
    function render() {
      track.style.transform = 'translate3d(' + (-x).toFixed(2) + 'px,0,0)';
      if (bar) bar.style.transform = 'scaleX(' + Math.min(1, (x + viewW) / (items.length * step)).toFixed(4) + ')';
    }
    function status() {
      if (nowEl) nowEl.textContent = perView > 1 ? pad(index + 1) + '–' + pad(Math.min(items.length, index + perView)) : pad(index + 1);
      if (totalEl) totalEl.textContent = pad(items.length);
      prev.disabled = index <= 0; next.disabled = index >= maxIndex;
    }
    function animate() {
      var d = target - x;
      if (Math.abs(d) < 0.4) { x = target; raf = 0; render(); return; }
      x += d * 0.12; render();
      raf = requestAnimationFrame(animate);
    }
    function goTo(k) {
      index = Math.max(0, Math.min(maxIndex, k)); target = index * step; status();
      if (reduce) { x = target; render(); return; }
      if (!raf) raf = requestAnimationFrame(animate);
    }
    prev.addEventListener('click', function () { goTo(index - 1); });
    next.addEventListener('click', function () { goTo(index + 1); });
    view.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
    });
    addEventListener('resize', measure);
    addEventListener('load', measure);
    measure();

    // Колесо и тачпад: только горизонтальное движение листает ленту
    var wheelTimer = 0;
    view.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 1) return;
      e.preventDefault();
      target = limit(target + e.deltaX);
      if (!raf) raf = requestAnimationFrame(animate);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () { goTo(Math.round(target / step)); }, 160);
    }, { passive: false });

    // Перетаскивание мышью и пальцем (pointer events; touch-action: pan-y оставляет вертикаль странице)
    var down = false, dragging = false, startX = 0, startY = 0, startPos = 0, lastX = 0, lastT = 0, vel = 0, pid = null;
    view.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true; dragging = false; pid = e.pointerId;
      startX = lastX = e.clientX; startY = e.clientY; startPos = x; lastT = performance.now(); vel = 0;
      if (e.pointerType === 'mouse') e.preventDefault();   // без выделения текста и перетаскивания картинок
    });
    view.addEventListener('pointermove', function (e) {
      if (!down || e.pointerId !== pid) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { down = false; return; }   // вертикальный жест — прокрутка страницы
        dragging = true; slider.classList.add('is-dragging');
        try { view.setPointerCapture(pid); } catch (err) {}
      }
      var pos = startPos - dx, max = maxIndex * step;
      if (pos < 0) pos *= 0.35; else if (pos > max) pos = max + (pos - max) * 0.35;   // у края — с сопротивлением
      var now = performance.now();
      vel = 0.8 * vel + 0.2 * ((e.clientX - lastX) / Math.max(1, now - lastT));
      lastX = e.clientX; lastT = now;
      x = target = pos; render();
    });
    function release() {
      if (!down) return;
      down = false;
      if (!dragging) return;
      dragging = false; slider.classList.remove('is-dragging');
      var projected = x - vel * 240, k = Math.round(projected / step);
      k = Math.max(index - perView, Math.min(index + perView, k));   // за один бросок — не дальше одного экрана
      goTo(k);
      view.addEventListener('click', function stop(ev) { ev.preventDefault(); ev.stopPropagation(); }, { capture: true, once: true });
    }
    view.addEventListener('pointerup', release);
    view.addEventListener('pointercancel', release);
    view.addEventListener('dragstart', function (e) { e.preventDefault(); });

    if (!finePointer || !cursor) return;   // телефон и планшет: листание пальцем, без курсора-круга
    // Курсор-круг «Листать» (Hispano Suiza) догоняет мышь за 0,2 с; цикл работает, только пока круг в пути
    slider.classList.add('has-cursor');
    var cx = 0, cy = 0, tx = 0, ty = 0, cRafS = 0;
    function follow() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cursor.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px) scale(' + (dragging ? 1.2 : 1) + ')';
      cRafS = Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(follow) : 0;
    }
    function point(e) { var rr = slider.getBoundingClientRect(); tx = e.clientX - rr.left; ty = e.clientY - rr.top; if (!cRafS) cRafS = requestAnimationFrame(follow); }
    view.addEventListener('pointerenter', function (e) { var rr = slider.getBoundingClientRect(); cx = tx = e.clientX - rr.left; cy = ty = e.clientY - rr.top; slider.classList.add('is-hover'); point(e); });
    view.addEventListener('pointerleave', function () { if (!dragging) slider.classList.remove('is-hover'); });
    view.addEventListener('pointermove', point);
    view.addEventListener('pointerup', function (e) { point(e); var rr = view.getBoundingClientRect(); if (e.clientX < rr.left || e.clientX > rr.right || e.clientY < rr.top || e.clientY > rr.bottom) slider.classList.remove('is-hover'); });
  });

  // ---------- Отзывы, вариант 2: вкладки-клиенты, отзыв сменяется вертикальным сдвигом; сами листаются, пока блок в кадре ----------
  document.querySelectorAll('[data-voices]').forEach(function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll('[data-voice-tab]')), panels = Array.prototype.slice.call(box.querySelectorAll('[data-voice]'));
    var cur = 0, stopped = reduce;
    box.classList.add('js-voices');
    function show(k, user) {
      k = (k + panels.length) % panels.length;
      if (user) { stopped = true; box.classList.remove('is-playing'); }
      if (k === cur) return;
      var old = cur; cur = k;
      panels[old].classList.remove('is-on'); panels[old].classList.add('is-out');
      setTimeout(function () { panels[old].classList.remove('is-out'); }, 900);
      panels[k].classList.remove('is-out'); panels[k].classList.add('is-on');
      tabs.forEach(function (t, i) { var on = i === k; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i, true); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault(); show(i + d, true); tabs[cur].focus();
      });
      // полоса над вкладкой дошла до конца — следующий отзыв (наведение ставит полосу на паузу)
      t.querySelector('.voices__bar').addEventListener('animationend', function () { if (!stopped && i === cur) show(cur + 1); });
    });
    var vp = box.querySelector('[data-voice-prev]'), vn = box.querySelector('[data-voice-next]');
    if (vp) vp.addEventListener('click', function () { show(cur - 1, true); });
    if (vn) vn.addEventListener('click', function () { show(cur + 1, true); });
    if (!stopped && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { box.classList.toggle('is-playing', e.isIntersecting && !stopped); }); }, { threshold: 0.4 }).observe(box);
    }
  });

  // ---------- О компании: счётчик 0 → 540, когда низ цифры поднялся выше 85% экрана (не за прелоадером);
  // ушёл из кадра — сбрасывается и при возвращении считает снова (правка 2026-10-06: «нет анимации цифры»).
  // До 1100px счёта нет — сразу «540» (правка 2026-10-07) ----------
  var counter = document.querySelector('[data-count]');
  if (counter && !reduce) {
    var countTo = Number(counter.getAttribute('data-count')), countState = 0, countRaf = 0;   // 0 — ждёт, 1 — считает или досчитал, 2 — без счёта
    if (!twoCols.matches) counter.textContent = '000';
    function countRun() {
      var t0 = performance.now();
      (function frame(now) {
        var t = clamp01((now - t0) / 2600);
        counter.textContent = String(Math.round(countTo * (1 - Math.pow(1 - t, 3)))).padStart(3, '0');
        countRaf = t < 1 ? requestAnimationFrame(frame) : 0;
      })(t0);
    }
    function countFrame() {
      if (twoCols.matches) {
        if (countState !== 2) { countState = 2; cancelAnimationFrame(countRaf); counter.textContent = String(countTo); }
        return;
      }
      if (countState === 2) { countState = 0; counter.textContent = '000'; }
      if (root.classList.contains('is-preloading')) return;
      var r = counter.getBoundingClientRect(), vh = innerHeight;
      if (!countState && r.bottom < vh * 0.85 && r.bottom > 0) { countState = 1; countRun(); }
      else if (countState && (r.top > vh || r.bottom < 0)) { countState = 0; cancelAnimationFrame(countRaf); counter.textContent = '000'; }
    }
    onScroll.push(countFrame);
    addEventListener('preloader:done', countFrame);
    countFrame();
  }
  var myths = Array.prototype.slice.call(document.querySelectorAll('[data-myth]'));
  if (myths.length && !reduce) {
    root.classList.add('js-myths');
    function mythFrame() { var vh = innerHeight; myths.forEach(function (m) { m.classList.toggle('is-on', m.getBoundingClientRect().top < vh * 0.7); }); }
    onScroll.push(mythFrame);
    mythFrame();
  }

  // ---------- «Три пакета» уже 768: таблица листается вбок; затухание справа, пока есть что листать, подсказка гаснет после первого жеста ----------
  var tx = document.querySelector('[data-tariff-x]');
  if (tx) {
    var tScroll = tx.querySelector('.tariff__scroll');
    function tariffEdge() {
      var left = tScroll.scrollLeft;
      tx.parentNode.classList.toggle('is-fit', tScroll.scrollWidth <= tScroll.clientWidth + 2);
      tx.classList.toggle('is-end', left + tScroll.clientWidth >= tScroll.scrollWidth - 2);
      if (left > 8) tx.parentNode.classList.add('is-moved');
    }
    tScroll.addEventListener('scroll', tariffEdge, { passive: true });
    addEventListener('resize', tariffEdge);
    tariffEdge();
  }

  // ---------- Калькулятор: условные ставки, итог в € и BYN; суммы меняются плавно (0,8 с) ----------
  var calc = document.querySelector('[data-calc]');
  var current = null;
  if (calc) {
    var RATE = 3.5, DELIVERY = 1100, FEES = 250;
    var price = calc.querySelector('[name="price"]'), range = calc.querySelector('[name="priceRange"]'), cc = calc.querySelector('[name="cc"]');
    var ccField = calc.querySelector('[data-cc]'), dutyRule = calc.querySelector('[data-duty-rule]'), packName = calc.querySelector('[data-pack-name]');
    var shown = {}, anim = 0;
    calc.querySelectorAll('[data-value]').forEach(function (el) { shown[el.getAttribute('data-value')] = Number(el.textContent.replace(/[^\d]/g, '')) || 0; });
    function val(name) { var r = calc.querySelector('[name="' + name + '"]:checked'); return r ? r.value : ''; }
    function compute() {
      var p = Math.min(150000, Math.max(3000, Number(price.value) || 0)), age = val('age'), fuel = val('fuel'), v = Math.min(6500, Math.max(800, Number(cc.value) || 0));
      var duty, rule;
      if (fuel === 'ev') { duty = 0; rule = 'электромобиль'; }
      else if (age === 'lt3') { duty = Math.max(p * 0.48, v * 2.5); rule = '48% цены, не меньше 2,5 € за см³'; }
      else if (age === '5to7') { duty = v * 3; rule = '3 € за см³'; }
      else { duty = v * 1.5; rule = '1,5 € за см³'; }
      var packEl = calc.querySelector('[name="pack"]:checked'), service = Number(packEl.value), total = p + DELIVERY + Math.round(duty) + FEES + service;
      return { car: p, delivery: DELIVERY, duty: Math.round(duty), fees: FEES, service: service, total: total, byn: Math.round(total * RATE), rule: rule, pack: packEl.getAttribute('data-name'), age: age, fuel: fuel, cc: v };
    }
    function render(values) {
      Object.keys(values).forEach(function (k) {
        var el = calc.querySelector('[data-value="' + k + '"]');
        if (el) el.textContent = fmt.format(values[k]) + (k === 'byn' ? '' : ' €');
      });
    }
    function update() {
      var r = compute(), target = { car: r.car, delivery: r.delivery, duty: r.duty, fees: r.fees, service: r.service, total: r.total, byn: r.byn };
      current = r;
      ccField.hidden = r.fuel === 'ev';
      dutyRule.textContent = r.rule; packName.textContent = '«' + r.pack + '»';
      var from = Object.assign({}, shown), t0 = performance.now();
      if (anim) cancelAnimationFrame(anim);
      (function step(now) {
        var t = reduce ? 1 : Math.min(1, (now - t0) / 800), e = 1 - Math.pow(1 - t, 3), v = {};
        Object.keys(target).forEach(function (k) { v[k] = from[k] + (target[k] - from[k]) * e; });
        render(v); shown = v;
        anim = t < 1 ? requestAnimationFrame(step) : 0;
      })(t0);
    }
    price.addEventListener('input', function () { range.value = price.value; update(); });
    range.addEventListener('input', function () { price.value = range.value; update(); });
    cc.addEventListener('input', update);
    calc.querySelectorAll('input[type="radio"]').forEach(function (r) { r.addEventListener('change', update); });
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    update();
  }

  // «Отправить расчёт» и кнопки пакетов — переносят выбор в форму заявки
  var order = document.getElementById('order'), orderForm = order && order.querySelector('form');
  function toOrder() {
    if (!order) return;
    document.getElementById('order-form').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    var name = orderForm.querySelector('[name="name"]');
    setTimeout(function () { name.focus({ preventScroll: true }); }, reduce ? 0 : 900);
  }
  var send = document.querySelector('[data-calc-send]');
  if (send && orderForm) send.addEventListener('click', function () {
    if (!current) return;
    var ages = { lt3: 'до 3 лет', '3to5': '3–5 лет', '5to7': '5–7 лет' }, fuels = { petrol: 'бензин', diesel: 'дизель', hybrid: 'гибрид', ev: 'электро' };
    orderForm.querySelector('[name="car"]').value = 'Расчёт: машина ' + fmt.format(current.car) + ' €, ' + ages[current.age] + ', ' + fuels[current.fuel] +
      (current.fuel === 'ev' ? '' : ' ' + fmt.format(current.cc) + ' см³') + '. Итого под ключ ≈ ' + fmt.format(current.total) + ' € (≈ ' + fmt.format(current.byn) + ' BYN), пример расчёта.';
    orderForm.querySelector('[name="package"]').value = current.pack;
    toOrder();
  });
  document.querySelectorAll('[data-package]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      if (!orderForm) return;
      e.preventDefault();
      orderForm.querySelector('[name="package"]').value = b.getAttribute('data-package');
      toOrder();
    });
  });

  // ---------- «Почему Вестлайн»: слова подсвечиваются по мере прокрутки (S-2K) ----------
  var para = document.querySelector('[data-words]');
  if (para && !reduce) {
    var words = [];
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/([ \t\n]+)/).forEach(function (part) {   // неразрывный пробел не делит слово: «С 2019» — одно слово
            if (!part) return;
            if (/^[ \t\n]+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); words.push(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) split(n);
      });
    })(para);
    var wq = false, lit = -1;
    function light() {
      wq = false;
      var r = para.getBoundingClientRect(), h = innerHeight;
      var p = Math.min(1, Math.max(0, (h * 0.85 - r.top) / (r.height + h * 0.35)));
      var k = Math.round(p * words.length);
      if (k === lit) return;
      lit = k;
      words.forEach(function (w, i) { w.classList.toggle('is-on', i < k); });
    }
    addEventListener('scroll', function () { if (!wq) { wq = true; requestAnimationFrame(light); } }, { passive: true });
    addEventListener('resize', light);
    light();
  }

})();
