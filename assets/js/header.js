// Общая шапка из config.js. Работает с диска, с сервера и со страниц во вложенных папках.
// Телефон — условный, показывается текстом без звонка по клику (contactsText[0]).
(function () {
  var mount = document.querySelector('[data-include="header"]');
  if (!mount || !window.SITE) return;
  var ROOT = new URL('../../', document.currentScript.src);
  var site = window.SITE;
  function safeUrl(value) {
    var raw = String(value || '').trim();
    if (!raw || /\s/.test(raw)) return '';
    if (/^(https?:|mailto:|tel:|viber:|tg:)/i.test(raw)) return raw;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return '';
    if (raw.charAt(0) === '#') return raw;
    return new URL(raw, ROOT).href;
  }
  function link(text, href, className) {
    var a = document.createElement('a');
    a.textContent = text || '';
    var url = safeUrl(href);
    if (url) a.href = url;
    if (className) a.className = className;
    return a;
  }
  var header = document.createElement('header');
  header.className = 'site-header';
  header.append(link(site.name, 'index.html#top', 'site-header__name'));   // логотип — к первому экрану главной (правка 2026-10-07); прелоадер при этом не повторяется
  var nav = document.createElement('nav');
  nav.className = 'site-header__nav';
  nav.setAttribute('aria-label', 'Основное меню');
  (site.menu || []).forEach(function (item) { nav.append(link(item.title, item.href)); });
  header.append(nav);
  if (site.contactsText && site.contactsText[0]) {
    var phone = document.createElement('span');
    phone.className = 'site-header__phone';
    phone.textContent = site.contactsText[0];
    header.append(phone);
  }
  if (site.cta && safeUrl(site.cta.href)) {
    var cta = link(site.cta.label, site.cta.href, 'button button--small');
    // Короткая подпись для телефона (cta.short): обе версии в разметке, видимость — в base.css
    if (site.cta.short) { cta.textContent = ''; var l = document.createElement('span'); l.className = 'cta-long'; l.textContent = site.cta.label; var s = document.createElement('span'); s.className = 'cta-short'; s.textContent = site.cta.short; cta.append(l, s); }
    header.append(cta);
  }

  // Бургер (правка 2026-10-07): до 1199px меню не помещается в строку — пункты уходят в панель под шапкой.
  // Панель — то же меню (nav), раскладку меняет base.css по классу is-menu-open. Закрывается по пункту, Esc и повторному нажатию.
  nav.id = 'site-menu';
  nav.querySelectorAll('a').forEach(function (a, i) { var n = document.createElement('span'); n.className = 'site-header__nav-i'; n.textContent = String(i + 1).padStart(2, '0'); a.prepend(n); });
  if (site.contactsText && site.contactsText[0]) {
    var navPhone = document.createElement('span');
    navPhone.className = 'site-header__nav-phone';
    navPhone.textContent = site.contactsText[0];
    nav.append(navPhone);
  }
  var burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'site-header__burger';
  burger.setAttribute('aria-controls', 'site-menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Открыть меню');
  burger.innerHTML = '<i></i><i></i>';
  header.append(burger);
  var root = document.documentElement;
  root.classList.add('js-menu');
  function setMenu(open) {
    root.classList.toggle('is-menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }
  burger.addEventListener('click', function () { setMenu(!root.classList.contains('is-menu-open')); });
  // любая ссылка шапки закрывает меню: пункт, логотип и «Заказать подбор» (правка 2026-10-07: при открытом меню кнопка
  // прокручивала страницу под панелью, а панель оставалась — «нажала, ничего не произошло»)
  header.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('is-menu-open')) { setMenu(false); burger.focus(); } });
  matchMedia('(min-width: 1200px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  mount.replaceChildren(header);
})();
