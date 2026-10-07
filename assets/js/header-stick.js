// Шапка закреплена сверху (base.css), тёмная. Прозрачная (класс is-clear) — только над тёмным первым экраном
// с атрибутом data-header-clear, пока страница в самом верху. На светлых страницах (юридические, 404) фон есть всегда:
// белый текст шапки на светлом фоне не читается. Без JS шапка всегда с фоном. Работает только по прокрутке, без постоянного цикла.
(function () {
  var mount = document.querySelector('[data-include="header"]');
  if (!mount) return;
  var hero = document.querySelector('[data-header-clear]');
  var queued = false;
  function update() {
    queued = false;
    var clear = !!hero && window.scrollY < 4;
    mount.classList.toggle('is-clear', clear);
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
})();
