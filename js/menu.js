/* ============================================================
   Страница «Меню» — логика
   Абсурдные позиции, убегающие кнопки «В корзину»,
   меняющиеся цены, случайные бейджи «нет в наличии»
   ============================================================ */

(function () {
  'use strict';

  const bug = () => BugEngine.isBugMode();

  const ITEMS = [
    { id: 'latte', emoji: '☕', name: 'Латте', bugName: 'Латте на стипендию',
      desc: 'Классика жанра', bugDesc: 'Если стипендия не пришла — просто смотрите на него',
      price: 180 },
    { id: 'cappuccino', emoji: '🥛', name: 'Капучино', bugName: 'Капучино с надеждой',
      desc: 'С молочной пенкой', bugDesc: 'Пенка держится дольше, чем ваша мотивация',
      price: 170 },
    { id: 'raf', emoji: '🍮', name: 'Раф', bugName: 'Раф с сожалением',
      desc: 'С ванильным сиропом', bugDesc: 'Ваниль маскирует грусть',
      price: 220 },
    { id: 'espresso', emoji: '⚡', name: 'Эспрессо', bugName: 'Эспрессо для храбрости',
      desc: 'Крепкий и честный', bugDesc: 'Пьёте — и идёте на пару',
      price: 120 },
    { id: 'mocha', emoji: '🍫', name: 'Мокко', bugName: 'Мокко с долгом',
      desc: 'С шоколадом', bugDesc: 'Шоколад сейчас, долг потом',
      price: 240 },
    { id: 'flatwhite', emoji: '🫗', name: 'Флэт уайт', bugName: 'Флэт уайт с ипотекой',
      desc: 'Двойной эспрессо с молоком', bugDesc: 'Двойной эспрессо, чтобы не думать о платеже',
      price: 200 },
    { id: 'tea', emoji: '🍵', name: 'Чай', bugName: 'Чай грусть',
      desc: 'Чёрный или зелёный', bugDesc: 'Пакетик уже был использован, но мы его просушили',
      price: 90 },
    { id: 'cocoa', emoji: '🍫', name: 'Какао', bugName: 'Какао с ностальгией',
      desc: 'Горячий шоколад', bugDesc: 'Вкус детства, который вы не вернёте',
      price: 150 },
    { id: 'croissant', emoji: '🥐', name: 'Круассан', bugName: 'Круассан вчерашний',
      desc: 'С маслом', bugDesc: 'Но сегодня он свежее, чем завтра',
      price: 130 },
    { id: 'syrnik', emoji: '🧀', name: 'Сырник', bugName: 'Сырник с характером',
      desc: 'Домашний', bugDesc: 'Может отказаться вас обслуживать',
      price: 160 }
  ];

  document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
  });

  function renderMenu() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    grid.innerHTML = '';

    ITEMS.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'menu-item';
      card.dataset.id = item.id;

      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.style.display = 'none';
      badge.textContent = 'нет в наличии';
      card.appendChild(badge);

      const emoji = document.createElement('span');
      emoji.className = 'item-emoji';
      emoji.textContent = item.emoji;
      card.appendChild(emoji);

      const title = document.createElement('h3');
      title.textContent = bug() ? item.bugName : item.name;
      card.appendChild(title);

      const desc = document.createElement('p');
      desc.className = 'item-desc';
      desc.textContent = bug() ? item.bugDesc : item.desc;
      card.appendChild(desc);

      const price = document.createElement('div');
      price.className = 'item-price';
      price.textContent = formatPrice(displayPrice(item.price));
      card.appendChild(price);

      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'В корзину';
      btn.addEventListener('click', (e) => addToCart(e, item, index));
      card.appendChild(btn);

      grid.appendChild(card);

      if (bug()) {
        BugEngine.makeDodge(btn, 55);
        setupPriceHover(price, item);
        setupRandomBadge(badge);
      }
    });
  }

  /* Цена: в режиме багов ×3, при наведении прыгает */
  function displayPrice(normal) {
    return bug() ? normal * 3 : normal;
  }

  function formatPrice(n) {
    return n.toLocaleString('ru-RU') + ' ₽';
  }

  function setupPriceHover(priceEl, item) {
    priceEl.addEventListener('mouseenter', () => {
      const rnd = item.price * (2 + Math.random() * 3);
      priceEl.textContent = formatPrice(Math.round(rnd));
    });
    priceEl.addEventListener('mouseleave', () => {
      priceEl.textContent = formatPrice(displayPrice(item.price));
    });
  }

  /* Бейдж «нет в наличии» появляется и исчезает */
  function setupRandomBadge(badge) {
    const toggle = () => {
      badge.style.display = Math.random() < 0.4 ? 'inline-block' : 'none';
      setTimeout(toggle, 2500 + Math.random() * 4000);
    };
    setTimeout(toggle, 2000 + Math.random() * 3000);
  }

  /* Добавление в корзину с багами */
  function addToCart(e, item, index) {
    e.preventDefault();
    e.stopPropagation();

    let cart = BugEngine.getCart();
    let target = item;

    if (bug()) {
      // Иногда добавляем не ту позицию
      if (Math.random() < 0.3) {
        const neighbor = ITEMS[(index + (Math.random() < 0.5 ? 1 : -1) + ITEMS.length) % ITEMS.length];
        target = neighbor;
      }
    }

    const existing = cart.find((i) => i.id === target.id);
    if (existing) {
      existing.qty += bug() ? 2 : 1; // в режиме багов добавляем сразу 2
    } else {
      cart.push({ id: target.id, name: target.name, price: target.price, qty: bug() ? 2 : 1 });
    }

    BugEngine.saveCart(cart);
    BugEngine.updateCartCounter();

    // Всплывающая подсказка о добавлении
    const tip = document.createElement('div');
    tip.className = 'bug-tooltip';
    tip.style.left = (e.clientX + 10) + 'px';
    tip.style.top = (e.clientY + 10) + 'px';
    if (bug()) {
      tip.textContent = target.id === item.id
        ? 'Добавлено ×2 (мы посчитали за вас)'
        : 'Добавлено: ' + target.name + ' (не то, что вы просили)';
    } else {
      tip.textContent = 'Добавлено: ' + target.name;
    }
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 1800);
  }
})();