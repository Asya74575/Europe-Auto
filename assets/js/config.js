// Один источник для всех страниц: название, контакты, мессенджеры, аналитика, меню.
// Правится здесь — меняется на каждой странице. Относительные ссылки — от папки site/.
window.SITE = {
  name: "Вестлайн",
  tagline: "Пригоняем из Европы машины 2–⁠7 лет с подтверждённым пробегом: находим, проверяем до покупки, везём автовозом и ставим на учёт.",
  phone: "",            // "+375 29 000-00-00"; пусто — не показывается
  email: "",            // пусто — не показывается
  // Условные контакты портфолио: показываются текстом, без звонка и письма по клику (BRIEF.md).
  contactsText: ["+375 00 000-00-00", "info@example.com", "Минск, ул. Примерная, 00"],   // адрес — заглушка
  messengers: {         // полные ссылки; пустые не показываются
    telegram: "",       // https://t.me/username
    whatsapp: "",       // https://wa.me/375290000000 (только цифры номера)
    viber: "",          // viber://chat?number=%2B375290000000
    instagram: "",      // https://instagram.com/username
    max: ""             // ссылка «Поделиться профилем» из приложения MAX
  },
  // Показательные кнопки мессенджеров: ведут к форме заявки (компания условная). Показываются иконками (icons.js).
  messengerStubs: { labels: ["Viber", "WhatsApp", "Telegram", "Instagram"], href: "index.html#order" },
  metrikaId: "",        // номер счётчика Яндекс.Метрики; пусто — Метрика не подключается и баннер не показывается
  cookieBanner: false,  // аналитики нет (BRIEF.md) — баннер не нужен
  cookiePolicy: "legal/cookies.html",
  menu: [               // по порядку блоков на странице; «Расчёт» и «Калькулятор» — один блок, второй пункт заменён на «Откуда»
    { title: "Откуда", href: "index.html#source" },
    { title: "Как работаем", href: "index.html#how" },
    { title: "Пригнанные", href: "index.html#cars" },
    { title: "Цены", href: "index.html#price" },
    { title: "Расчёт", href: "index.html#calc" },
    { title: "О компании", href: "index.html#about" },
    { title: "Отзывы", href: "index.html#reviews" },
    { title: "Вопросы", href: "index.html#faq" }
  ],
  cta: { label: "Заказать подбор", short: "Подбор", href: "index.html#order" },
  legal: [
    { title: "Политика конфиденциальности", href: "legal/privacy.html" },
    { title: "Согласие на обработку данных", href: "legal/consent.html" },
    { title: "Cookie", href: "legal/cookies.html" }
  ]
};
