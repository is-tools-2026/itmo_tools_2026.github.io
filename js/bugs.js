/* ============================================================
   Движок багов — Кофейня Стипендия
   Управляет режимом «Баги / Норма», плавающими иконками,
   опечатками, курсором, всплывающими подсказками и поп-апами
   ============================================================ */

(function () {
  'use strict';

  const BUG_KEY = 'bugMode';
  const CART_KEY = 'coffeeCart';

  const BugEngine = {
    _floatIcons: [],
    _mouse: { x: -999, y: -999 },

    /* ---------- Режим ---------- */
    isBugMode() {
      return localStorage.getItem(BUG_KEY) !== 'false';
    },

    setBugMode(on) {
      localStorage.setItem(BUG_KEY, on ? 'true' : 'false');
    },

    /* ---------- Корзина (общая) ---------- */
    getCart() {
      try {
        const raw = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(raw) ? raw : [];
      } catch (e) {
        return [];
      }
    },

    saveCart(cart) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    },

    cartCount() {
      return this.getCart().reduce((s, i) => s + (i.qty || 0), 0);
    },

    updateCartCounter() {
      const el = document.getElementById('cart-count');
      if (!el) return;
      const sum = this.cartCount();
      el.textContent = this.isBugMode() ? sum + Math.floor(Math.random() * 4) : sum;
    },

    /* ---------- Инициализация ---------- */
    init() {
      this.applyTextSwaps();
      this.setupToggle();
      this.updateCartCounter();

      if (this.isBugMode()) {
        document.documentElement.classList.add('bug-mode');
        this.startFloatingIcons();
        this.startCursorEmoji();
        this.startRandomTooltips();
        this.startRandomPopups();
        setInterval(() => this.updateCartCounter(), 2500);
      }
    },

    /* ---------- Опечатки в тексте ---------- */
    applyTextSwaps() {
      const bug = this.isBugMode();
      document.querySelectorAll('[data-bug]').forEach((el) => {
        if (bug) {
          if (el.dataset.bugHtml !== undefined) el.innerHTML = el.dataset.bugHtml;
          else el.textContent = el.dataset.bug;
        } else if (el.dataset.normal !== undefined) {
          if (el.dataset.normalHtml !== undefined) el.innerHTML = el.dataset.normalHtml;
          else el.textContent = el.dataset.normal;
        }
      });
    },

    /* ---------- Переключатель в шапке ---------- */
    setupToggle() {
      const toggle = document.getElementById('bug-toggle');
      const label = document.getElementById('switch-label');
      if (!toggle) return;
      const bug = this.isBugMode();
      toggle.checked = bug;
      if (label) label.textContent = bug ? '🐛 Баги' : '✅ Норма';
      toggle.addEventListener('change', () => {
        this.setBugMode(toggle.checked);
        location.reload();
      });
    },

    /* ---------- Плавающие иконки ---------- */
    startFloatingIcons() {
      const icons = ['☕', '🎓', '💸', '📚', '🥐', '🍩', '🧁', '🪙', '📖', '🫖', '🧾', '😴'];
      const count = 8;
      for (let i = 0; i < count; i++) {
        const el = document.createElement('span');
        el.className = 'float-icon';
        el.textContent = icons[Math.floor(Math.random() * icons.length)];
        const size = 18 + Math.random() * 26;
        el.style.fontSize = size + 'px';
        document.body.appendChild(el);
        this._floatIcons.push({
          el,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 1.4,
          vy: (Math.random() - 0.5) * 1.4,
          size,
          rot: Math.random() * 360
        });
      }
      document.addEventListener('mousemove', (e) => {
        this._mouse.x = e.clientX;
        this._mouse.y = e.clientY;
      });
      this._animateIcons();
    },

    _animateIcons() {
      const step = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this._floatIcons.forEach((ic) => {
          ic.x += ic.vx;
          ic.y += ic.vy;
          if (ic.x < -20 || ic.x > w - ic.size + 20) ic.vx *= -1;
          if (ic.y < -20 || ic.y > h - ic.size + 20) ic.vy *= -1;
          // уворачиваемся от курсора
          const dx = ic.x - this._mouse.x;
          const dy = ic.y - this._mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 90 && dist > 0.01) {
            ic.x += (dx / dist) * 5;
            ic.y += (dy / dist) * 5;
          }
          ic.rot += 1.2;
          ic.el.style.transform =
            'translate(' + ic.x + 'px,' + ic.y + 'px) rotate(' + ic.rot + 'deg)';
        });
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },

    /* ---------- Эмодзи-курсор ---------- */
    startCursorEmoji() {
      const el = document.createElement('div');
      el.className = 'cursor-emoji';
      el.textContent = '☕';
      document.body.appendChild(el);
      const emojis = ['☕', '🫘', '🥐', '🎓', '💸', '👀', '🫠'];
      let tx = 0, ty = 0, x = 0, y = 0, lastChange = 0;
      document.addEventListener('mousemove', (e) => {
        tx = e.clientX;
        ty = e.clientY;
      });
      const step = () => {
        x += (tx - x) * 0.25;
        y += (ty - y) * 0.25;
        el.style.transform =
          'translate(' + (x + 20) + 'px,' + (y + 20) + 'px) rotate(' +
          Math.sin(Date.now() / 300) * 20 + 'deg)';
        if (Date.now() - lastChange > 2500) {
          el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
          lastChange = Date.now();
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },

    /* ---------- Случайные подсказки ---------- */
    startRandomTooltips() {
      const phrases = [
        'ты уверен?', 'а может чай?', 'стипендия уже потрачена', 'кофе убежал',
        'это не баг, это фича', 'нажми ещё разок', 'мы тебя видим',
        'сегодня скидка 0%', 'капучино обиделся', 'проверь карман',
        'здесь был ёж', 'кофемашина устала', 'не нажимай сюда', 'а вдруг?'
      ];
      let last = 0;
      document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - last < 700 || Math.random() > 0.25) return;
        last = now;
        const tip = document.createElement('div');
        tip.className = 'bug-tooltip';
        tip.textContent = phrases[Math.floor(Math.random() * phrases.length)];
        tip.style.left = (e.clientX + 14) + 'px';
        tip.style.top = (e.clientY + 14) + 'px';
        document.body.appendChild(tip);
        setTimeout(() => tip.remove(), 1600);
      });
    },

    /* ---------- Случайные поп-апы ---------- */
    startRandomPopups() {
      const popups = [
        { title: 'ВНИМАНИЕ!', text: 'Кофе закончился, но мы работаем' },
        { title: 'Скидка 100%', text: 'на всё, кроме всего' },
        { title: 'Акция!', text: 'При покупке двух кофе третий вы выпиваете сами' },
        { title: 'Новость', text: 'Стипендия повышена на 0 рублей' },
        { title: 'Срочно!', text: 'Бармен ушёл на пару, вернётся к сессии' },
        { title: 'Важно', text: 'Сегодня кофе варит стажёр. Молитесь' },
        { title: 'Розыгрыш', text: 'Каждый десятый кофе — бесплатно. Остальные девять — платно' }
      ];
      const show = () => {
        const p = popups[Math.floor(Math.random() * popups.length)];
        const el = document.createElement('div');
        el.className = 'bug-popup';
        el.innerHTML = '<strong>' + p.title + '!</strong><br>' + p.text;
        el.style.left = (8 + Math.random() * 55) + '%';
        el.style.top = (12 + Math.random() * 55) + '%';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3200);
        setTimeout(show, 5000 + Math.random() * 6000);
      };
      setTimeout(show, 2000);
    },

    /* ---------- Кнопка уворачивается от курсора ---------- */
    makeDodge(el, distance) {
      if (!el) return;
      const dist = distance || 55;
      el.addEventListener('mousemove', (e) => {
        if (!this.isBugMode()) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        if (Math.hypot(dx, dy) < dist) {
          const ang = Math.atan2(dy, dx);
          const tx = Math.cos(ang) * 45;
          const ty = Math.sin(ang) * 45;
          el.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
        } else {
          el.style.transform = '';
        }
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    },

    /* ---------- Случайное число ---------- */
    rand(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  };

  window.BugEngine = BugEngine;
  window.bugMode = function () { return BugEngine.isBugMode(); };

  document.addEventListener('DOMContentLoaded', () => BugEngine.init());
})();