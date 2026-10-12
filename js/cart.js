/* ============================================================
   Страница «Корзина + Оплата» — логика
   Наценка 100 000 ₽, убегающее окно подтверждения,
   сломанная форма оплаты, корзина, которая сопротивляется
   ============================================================ */

(function () {
  'use strict';

  const bug = () => BugEngine.isBugMode();
  const MARKUP = 100000;

  let jitter = 0;
  let confirmAttempts = 0;
  let payAttempts = 0;

  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    setupDialog();
    setupPayForm();
    if (bug()) {
      startTotalJitter();
      startItemDuplication();
    }
  });

  /* ---------- Утилиты ---------- */
  function displayPrice(normal) {
    return bug() ? normal * 3 : normal;
  }

  function fmt(n) {
    return n.toLocaleString('ru-RU') + ' ₽';
  }

  function calcTotal(cart) {
    const sum = cart.reduce((s, i) => s + displayPrice(i.price) * i.qty, 0);
    return sum + (bug() ? MARKUP : 0) + jitter;
  }

  function showTip(text) {
    const tip = document.createElement('div');
    tip.className = 'bug-tooltip';
    tip.textContent = text;
    tip.style.left = '35%';
    tip.style.top = '25%';
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 2200);
  }

  /* ---------- Рендер корзины ---------- */
  function renderCart() {
    const content = document.getElementById('cart-content');
    if (!content) return;
    const cart = BugEngine.getCart();

    if (cart.length === 0) {
      content.innerHTML =
        '<div class="cart-empty"><span class="big">🫙</span>' +
        'Корзина пуста.<br><a href="menu.html" class="btn" style="margin-top: 14px;">Пойти за кофе</a></div>';
      return;
    }

    let html = '<table class="cart-table"><thead><tr>' +
      '<th>Позиция</th><th>Цена</th><th>Кол-во</th><th>Сумма</th><th></th>' +
      '</tr></thead><tbody>';

    cart.forEach((item) => {
      const price = displayPrice(item.price);
      const sum = price * item.qty;
      html += '<tr data-id="' + item.id + '">';
      html += '<td>' + (bug() ? item.name + ' <small style="color:var(--red)">(с наценкой)</small>' : item.name) + '</td>';
      html += '<td>' + fmt(price) + '</td>';
      html += '<td><div class="qty-controls">' +
        '<button class="qty-btn" data-id="' + item.id + '" data-action="dec">−</button>' +
        '<span>' + item.qty + ' шт</span>' +
        '<button class="qty-btn" data-id="' + item.id + '" data-action="inc">+</button>' +
        '</div></td>';
      html += '<td>' + fmt(sum) + '</td>';
      html += '<td><button class="qty-btn remove-btn" data-id="' + item.id + '" title="Удалить">✕</button></td>';
      html += '</tr>';
    });

    html += '</tbody></table>';

    if (bug()) {
      html += '<div class="markup-line"><span>Наценка за уют (обязательная)</span><span>100 000 ₽</span></div>';
    }

    html += '<div class="cart-total-row"><span>Итого:</span><span id="cart-total-value">' +
      fmt(calcTotal(cart)) + '</span></div>';

    html += '<div class="cart-actions">' +
      '<button class="btn btn-green" id="order-btn">Оформить заказ</button>' +
      '<button class="btn btn-danger" id="clear-cart">Очистить корзину</button>' +
      '</div>';

    content.innerHTML = html;
    bindCartEvents();
  }

  function updateTotal() {
    const el = document.getElementById('cart-total-value');
    if (el) el.textContent = fmt(calcTotal(BugEngine.getCart()));
  }

  /* ---------- События корзины ---------- */
  function bindCartEvents() {
    document.querySelectorAll('.qty-btn[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const cart = BugEngine.getCart();
        const item = cart.find((i) => i.id === id);
        if (!item) return;
        if (action === 'inc') item.qty += bug() ? 2 : 1;
        else item.qty -= bug() ? 3 : 1;
        BugEngine.saveCart(cart);
        renderCart();
        BugEngine.updateCartCounter();
      });
    });

    document.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const cart = BugEngine.getCart();
        const idx = cart.findIndex((i) => i.id === id);
        if (idx === -1) return;
        const removed = cart.splice(idx, 1)[0];
        BugEngine.saveCart(cart);
        renderCart();
        BugEngine.updateCartCounter();
        if (bug() && Math.random() < 0.5) {
          setTimeout(() => {
            const c2 = BugEngine.getCart();
            c2.push(removed);
            BugEngine.saveCart(c2);
            renderCart();
            BugEngine.updateCartCounter();
            showTip('Товар «' + removed.name + '» вернулся. Он скучал');
          }, 2000);
        }
      });
    });

    const clearBtn = document.getElementById('clear-cart');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const prev = BugEngine.getCart();
        BugEngine.saveCart([]);
        renderCart();
        BugEngine.updateCartCounter();
        if (bug()) {
          setTimeout(() => {
            BugEngine.saveCart(prev);
            renderCart();
            BugEngine.updateCartCounter();
            showTip('Корзина сопротивляется очистке');
          }, 1500);
        }
      });
    }

    const orderBtn = document.getElementById('order-btn');
    if (orderBtn) {
      orderBtn.addEventListener('click', () => {
        const overlay = document.getElementById('dialog-overlay');
        const note = document.getElementById('dialog-note');
        if (note) note.textContent = '';
        confirmAttempts = 0;
        overlay.classList.add('show');
      });
    }
  }

  /* ---------- Диалог подтверждения ---------- */
  function setupDialog() {
    const overlay = document.getElementById('dialog-overlay');
    const yes = document.getElementById('dialog-yes');
    const no = document.getElementById('dialog-no');
    const note = document.getElementById('dialog-note');
    if (!overlay || !yes || !no) return;

    if (bug()) {
      BugEngine.makeDodge(yes, 55);
    }

    yes.addEventListener('click', () => {
      if (bug()) {
        confirmAttempts++;
        if (confirmAttempts < 5) {
          note.textContent = 'Вы нажали «Да» ' + confirmAttempts + ' раз. Осталось ' + (5 - confirmAttempts);
          return;
        }
        note.textContent = 'Ладно, уговорили. Заказ оформлен без вашего согласия';
        finishOrder('Заказ оформлен! Деньги списаны. Чек улетел в окно.');
      } else {
        finishOrder('Заказ оформлен! Спасибо, что выбрали нас.');
      }
    });

    no.addEventListener('click', () => {
      if (bug()) {
        finishOrder('Заказ оформлен! (вы нажали «Нет», но мы посчитали это за «Да»)');
      } else {
        overlay.classList.remove('show');
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (bug()) {
          note.textContent = 'Нельзя уйти просто так. Заказ уже почти оформлен';
        } else {
          overlay.classList.remove('show');
        }
      }
    });
  }

  function finishOrder(msg) {
    const overlay = document.getElementById('dialog-overlay');
    overlay.classList.remove('show');
    BugEngine.saveCart([]);
    renderCart();
    BugEngine.updateCartCounter();
    const success = document.getElementById('pay-success');
    success.textContent = msg;
    success.style.display = 'block';
  }

  /* ---------- Форма оплаты ---------- */
  function setupPayForm() {
    const form = document.getElementById('pay-form');
    if (!form) return;

    const card = document.getElementById('pay-card');
    const exp = document.getElementById('pay-exp');
    const cvv = document.getElementById('pay-cvv');
    const name = document.getElementById('pay-name');
    const cardErr = document.getElementById('pay-card-error');
    const expErr = document.getElementById('pay-exp-error');
    const cvvErr = document.getElementById('pay-cvv-error');
    const nameErr = document.getElementById('pay-name-error');
    const success = document.getElementById('pay-success');

    if (bug()) {
      // Номер карты принимает только буквы
      card.addEventListener('input', () => {
        card.value = card.value.replace(/[0-9]/g, '');
      });
      card.placeholder = 'Введите буквы вашей карты';
      exp.placeholder = '13.2099';
      cvv.placeholder = '1';
      name.placeholder = 'ИВАН2';
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      cardErr.textContent = '';
      expErr.textContent = '';
      cvvErr.textContent = '';
      nameErr.textContent = '';
      success.style.display = 'none';
      let ok = true;

      if (bug()) {
        if (!/[a-zA-Zа-яА-Я]/.test(card.value)) {
          cardErr.textContent = 'Введите буквы. Цифры мы не принимаем';
          ok = false;
        }
        if (!/^\d{2}\.\d{4}$/.test(exp.value)) {
          expErr.textContent = 'Срок в формате ГГ.ММММ, например 13.2099';
          ok = false;
        }
        if (!/^\d$/.test(cvv.value)) {
          cvvErr.textContent = 'CVV должен быть из одной цифры. Как наша безопасность';
          ok = false;
        }
        if (!/\d/.test(name.value)) {
          nameErr.textContent = 'Имя должно содержать цифру. Например: ИВАН2';
          ok = false;
        }
      } else {
        if (!/^\d{16}$/.test(card.value.replace(/\s/g, ''))) {
          cardErr.textContent = 'Введите 16 цифр номера карты';
          ok = false;
        }
        if (!/^\d{2}\/\d{2}$/.test(exp.value)) {
          expErr.textContent = 'Формат ММ/ГГ';
          ok = false;
        }
        if (!/^\d{3}$/.test(cvv.value)) {
          cvvErr.textContent = 'CVV — 3 цифры';
          ok = false;
        }
        if (name.value.trim().length < 3) {
          nameErr.textContent = 'Введите имя на карте';
          ok = false;
        }
      }

      if (ok) {
        if (bug()) {
          payAttempts++;
          if (payAttempts < 5) {
            const errors = [
              'Ошибка 404: деньги не найдены',
              'Банк ушёл на обед. Приходите позже',
              'Стипендия ещё не пришла. Попробуйте в следующем месяце',
              'Карта слишком новая. Мы не доверяем новым картам'
            ];
            success.style.background = '#fdecea';
            success.style.borderColor = 'var(--red)';
            success.style.color = 'var(--red)';
            success.textContent = errors[payAttempts - 1] + ' (попытка ' + payAttempts + ' из 5)';
            success.style.display = 'block';
            return;
          }
          success.style.background = '#eaf4e2';
          success.style.borderColor = 'var(--green)';
          success.style.color = '#3d5a2a';
          success.textContent = 'Оплата прошла! Деньги списаны дважды, как и положено. Чек улетел в окно.';
        } else {
          success.textContent = 'Оплата прошла успешно! Заказ уже готовится.';
        }
        success.style.display = 'block';
        form.reset();
      }
    });
  }

  /* ---------- Баги: итог прыгает ---------- */
  function startTotalJitter() {
    setInterval(() => {
      jitter = BugEngine.rand(-500, 500);
      updateTotal();
    }, 2000);
  }

  /* ---------- Баги: товары дублируются ---------- */
  function startItemDuplication() {
    setInterval(() => {
      const cart = BugEngine.getCart();
      if (cart.length === 0) return;
      if (Math.random() < 0.35) {
        const item = cart[Math.floor(Math.random() * cart.length)];
        item.qty += 1;
        BugEngine.saveCart(cart);
        renderCart();
        BugEngine.updateCartCounter();
      }
    }, 4000);
  }
})();