// Общий подвал из config.js — одинаковый на всех страницах (главная, юридические, 404).
// Тёмное фото машины, название и описание, кнопка главного действия, разделы, условные контакты текстом,
// мессенджеры-заглушки иконками (ведут к форме), документы; внизу — копирайт и «ВЕСТЛАЙН» во всю ширину (выбор владельца, dkrent).
(function () {
  var mount = document.querySelector('[data-include="footer"]');
  if (!mount || !window.SITE) return;
  var ROOT = new URL('../../', document.currentScript.src);
  var site = window.SITE;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function local(href) { return href && !/^[a-z][a-z0-9+.-]*:/i.test(href) ? new URL(href, ROOT).href : ''; }
  function link(text, href, cls) { var a = el('a', cls, text); a.href = href; return a; }

  var footer = el('footer', 'site-footer');
  var inner = el('div', 'site-footer__inner');

  var brand = el('div', 'site-footer__brand');
  brand.append(el('p', 'site-footer__head', site.name || ''));   // все колонки начинаются одинаково: подпись под общей линией (правка 2026-10-06)
  if (site.tagline) brand.append(el('p', 'site-footer__tagline', site.tagline));
  if (site.cta && local(site.cta.href)) brand.append(link(site.cta.label, local(site.cta.href), 'button'));
  inner.append(brand);

  if ((site.menu || []).length) {
    var nav = el('nav', 'site-footer__col site-footer__col--nav'); nav.setAttribute('aria-label', 'Разделы');
    nav.append(el('p', 'site-footer__head', 'Разделы'));
    site.menu.forEach(function (m) { var u = local(m.href); if (u) nav.append(link(m.title, u)); });
    inner.append(nav);
  }

  var contacts = el('div', 'site-footer__col site-footer__col--contacts');
  contacts.append(el('p', 'site-footer__head', 'Связь'));
  var phone = String(site.phone || '').replace(/[^\d+]/g, '');
  if (phone) contacts.append(link(site.phone, 'tel:' + phone));
  var email = String(site.email || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) contacts.append(link(email, 'mailto:' + email));
  (site.contactsText || []).forEach(function (t, i) { contacts.append(el('span', i === 0 ? 'site-footer__phone' : null, t)); });   // условные контакты — только текстом
  var stubs = site.messengerStubs;
  if (stubs && stubs.labels && local(stubs.href)) {
    var row = el('div', 'site-footer__msg');
    stubs.labels.forEach(function (l) { var a = link(l, local(stubs.href)); a.setAttribute('data-icon', l.toLowerCase()); a.setAttribute('aria-label', l); row.append(a); });
    contacts.append(row);
    if (window.siteIcons) window.siteIcons.decorate(row);   // иконки вместо названий
  }
  inner.append(contacts);

  var legal = el('div', 'site-footer__col site-footer__col--legal');
  legal.append(el('p', 'site-footer__head', 'Документы'));
  (site.legal || []).forEach(function (item) { var u = local(item && item.href); if (u) legal.append(link(item.title, u)); });
  inner.append(legal);

  var bottom = el('div', 'site-footer__bottom');
  bottom.append(el('p', null, '© ' + new Date().getFullYear() + ' ' + (site.name || '')));
  inner.append(bottom);
  footer.append(inner);

  var word = el('p', 'site-footer__word', site.name || '');
  word.setAttribute('aria-hidden', 'true');
  footer.append(word);
  mount.replaceChildren(footer);
})();
