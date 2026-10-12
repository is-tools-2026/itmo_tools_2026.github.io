/* ============================================================
   Страница «О нас + Место» — логика
   Адрес меняется при наведении, маркер на карте гуляет,
   форма обратной связи сломана (в режиме багов)
   ============================================================ */

(function () {
  'use strict';

  const bug = () => BugEngine.isBugMode();

  document.addEventListener('DOMContentLoaded', () => {
    setupAddressHover();
    setupMapMarker();
    setupContactForm();
    if (bug()) BugEngine.makeDodge(document.getElementById('hero-cta'), 70);
  });

  /* ---------- Адрес меняется при наведении ---------- */
  function setupAddressHover() {
    const addr = document.getElementById('address');
    const hint = document.getElementById('address-hint');
    if (!addr) return;

    const bugAddresses = [
      'ул. Студенческая, д. 13, корпус Б, подвал',
      'ул. Студенческая, д. 13, корпус А, чердак',
      'ул. Студенческая, д. 13, между корпусами, в кустах',
      'ул. Студенческая, д. 13, за углом, где пахнет кофе',
      'ул. Студенческая, д. 13, напротив, но не совсем',
      'ул. Студенческая, д. 13, корпус Г, которого нет на карте'
    ];
    let idx = 0;

    addr.addEventListener('mouseenter', () => {
      if (!bug()) return;
      idx = (idx + 1) % bugAddresses.length;
      addr.textContent = bugAddresses[idx];
      if (hint) hint.textContent = 'Нет, теперь адрес другой. Наведите ещё раз';
    });

    addr.addEventListener('mouseleave', () => {
      if (!bug()) return;
      addr.textContent = addr.dataset.bug;
      if (hint) hint.textContent = 'Наведите на адрес, чтобы уточнить';
    });
  }

  /* ---------- Маркер на карте гуляет ---------- */
  function setupMapMarker() {
    const marker = document.getElementById('map-shop');
    const map = document.getElementById('map');
    if (!marker || !map) return;

    if (!bug()) return;

    const move = () => {
      const w = map.clientWidth;
      const h = map.clientHeight;
      const x = 5 + Math.random() * (w - 90);
      const y = 5 + Math.random() * (h - 70);
      marker.style.left = x + 'px';
      marker.style.top = y + 'px';
      setTimeout(move, 1800 + Math.random() * 2500);
    };
    setTimeout(move, 1500);
  }

  /* ---------- Форма обратной связи ---------- */
  function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const name = document.getElementById('cf-name');
    const email = document.getElementById('cf-email');
    const message = document.getElementById('cf-message');
    const nameErr = document.getElementById('cf-name-error');
    const emailErr = document.getElementById('cf-email-error');
    const msgErr = document.getElementById('cf-message-error');
    const success = document.getElementById('cf-success');
    const submit = document.getElementById('cf-submit');

    if (bug()) {
      BugEngine.makeDodge(submit, 60);
      message.setAttribute('maxlength', '3');
      message.placeholder = 'Максимум 3 символа. Мы экономим';
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      nameErr.textContent = '';
      emailErr.textContent = '';
      msgErr.textContent = '';
      success.style.display = 'none';

      let ok = true;

      if (bug()) {
        // Имя должно содержать цифру
        if (!/\d/.test(name.value)) {
          nameErr.textContent = 'Имя должно содержать цифру (как в паспорте). Пример: Иван2';
          ok = false;
        }
        // Email без собачки
        if (email.value.includes('@')) {
          emailErr.textContent = 'Email без «@». Мы не любим собак';
          ok = false;
        } else if (email.value.trim() === '') {
          emailErr.textContent = 'Email не может быть пустым. Или может? Нет, не может';
          ok = false;
        }
        // Сообщение: ровно 3 символа
        if (message.value.length !== 3) {
          msgErr.textContent = 'Сообщение должно быть ровно из 3 символов. Мы экономим';
          ok = false;
        }
      } else {
        if (name.value.trim().length < 2) {
          nameErr.textContent = 'Введите имя (минимум 2 символа)';
          ok = false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
          emailErr.textContent = 'Введите корректный email';
          ok = false;
        }
        if (message.value.trim().length < 5) {
          msgErr.textContent = 'Сообщение должно быть не короче 5 символов';
          ok = false;
        }
      }

      if (ok) {
        if (bug()) {
          success.textContent = 'Сообщение отправлено в никуда. Мы его не прочитаем, но спасибо!';
        } else {
          success.textContent = 'Спасибо! Ваше сообщение отправлено, мы ответим в течение дня.';
        }
        success.style.display = 'block';
        form.reset();
      }
    });
  }
})();