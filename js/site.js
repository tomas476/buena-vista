/* Buena Vista Park Villas, every page. No dependencies. */
(() => {
  const d = document, root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const store = box => ({ get: k => { try { return box().getItem(k); } catch { return null; } }, set: (k, v) => { try { box().setItem(k, v); } catch {} } });
  const local = store(() => localStorage), session = store(() => sessionStorage);
  const track = (event, data = {}) => { (window.dataLayer = window.dataLayer || []).push({ event, ...data }); };
  const still = () => root.classList.contains('still');
  const bar = $('#bar'), dock = $('#dock'), hero = $('.hero');

  /* the bar turns to frosted limestone once the page moves; the dock waits until the film is behind you */
  const onScroll = () => {
    const y = scrollY;
    bar.classList.toggle('solid', y > 40);
    if (dock && hero) dock.classList.toggle('top', y < hero.offsetHeight * .55);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  addEventListener('resize', () => root.style.setProperty('--u', innerHeight / 100 + 'px'));

  /* reduce motion switch in the footer */
  const sb = $('#stillBtn');
  const setStill = on => { root.classList.toggle('still', on); sb && sb.setAttribute('aria-pressed', on); local.set('still', on ? '1' : '0'); $$('video.hv').forEach(v => on ? v.pause() : v.classList.contains('on') && v.play().catch(() => {})); };
  if (sb) { sb.setAttribute('aria-pressed', still()); sb.addEventListener('click', () => setStill(!still())); }

  /* hero film: after the page has loaded, the right cut for the screen, by its real width */
  if (hero) {
    const start = () => {
      const tall = matchMedia('(max-aspect-ratio: 4/5)').matches, v = $(tall ? 'video.hv-tall' : 'video.hv-wide'); if (!v || v.dataset.on) return;
      const need = innerWidth * Math.min(devicePixelRatio || 1, 2);
      const list = v.dataset.srcs.split(',').map(s => { const [u, w] = s.trim().split(' '); return { u, w: +w }; });
      const pick = list.find(x => x.w >= need * (tall ? .6 : .9)) || list[list.length - 1];
      v.dataset.on = 1; v.src = pick.u; v.load();
      v.addEventListener('playing', () => v.classList.add('on'), { once: true });
      if (!still()) v.play().catch(() => {});
    };
    const go = () => setTimeout(start, 250);
    if (d.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
    addEventListener('pointerdown', start, { once: true });
    new IntersectionObserver(es => es.forEach(e => $$('video.hv.on').forEach(v => e.isIntersecting && !still() ? v.play().catch(() => {}) : v.pause()))).observe(hero);
  }

  /* scenes that draw themselves once, when they come into view */
  const once = (el, cls = 'drawn', th = .25) => el && new IntersectionObserver((es, io) => es.forEach(e => { if (e.isIntersecting) { el.classList.add(cls); io.disconnect(); } }), { threshold: th }).observe(el);
  once($('.made'), 'drawn', .3); once($('.gib'), 'drawn', .25);

  /* scroll-linked: the villa on the drawing board traces itself, the view to Africa settles */
  const board = $('.board-villa'), films = $('.films'), view = $('.view');
  const tick = () => {
    if (board && films) { const r = films.getBoundingClientRect(), k = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * .5))); board.style.setProperty('--draw', still() ? 1 : k.toFixed(3)); }
    if (view) { const r = view.getBoundingClientRect(), k = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height))); view.style.setProperty('--v', still() ? 1 : k.toFixed(3)); }
  };
  addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true }); tick();

  /* the homes index: the row under the pointer (or in focus) shows its render */
  const ixs = $$('.ix'), frames = $$('.ixf');
  const pickIx = i => { ixs.forEach((x, k) => x.classList.toggle('is-on', k === i)); frames.forEach((f, k) => f.classList.toggle('is-on', k === i)); };
  ixs.forEach((x, i) => { x.addEventListener('pointerenter', () => pickIx(i)); x.addEventListener('focusin', () => pickIx(i)); });

  /* menu */
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', open);
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('open')); bar.classList.add('over-menu'); }
    else { menu.classList.remove('open'); bar.classList.remove('over-menu'); setTimeout(() => { if (!menu.classList.contains('open')) menu.hidden = true; }, 600); }
    d.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

  /* drawings open large */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  if (lb && lb.showModal) {
    $$('a.doc').forEach(a => a.addEventListener('click', e => { e.preventDefault(); lbImg.src = a.getAttribute('href'); lbImg.alt = a.dataset.cap; lbCap.textContent = a.dataset.cap; lb.showModal(); track('drawing_open', { drawing: a.getAttribute('href') }); }));
    $('#lbClose').addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  }

  /* lead source travels with the visitor to the form */
  const params = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(k => { const v = params.get(k); if (v) session.set(k, v); });
  $$('[data-cta]').forEach(a => a.addEventListener('click', () => { const id = a.dataset.cta; track('cta_click', { cta: id, page: location.pathname }); if (id !== 'form-send') session.set('cta', id); }));

  /* the dock leaves when the form is on screen */
  const ask = $('#viewing');
  if (ask && dock) new IntersectionObserver(es => es.forEach(e => dock.classList.toggle('away', e.isIntersecting)), { threshold: .12 }).observe(ask);
  if (d.body.classList.contains('form-page') && dock) dock.style.display = 'none';

  /* the viewing request: home, day, you. The ticket fills in as you choose */
  const form = $('#viewForm');
  if (form) {
    const source = $('#leadSource'), steps = $$('.step', form), back = $('#stepBack'), next = $('#stepNext'), send = $('#stepSend'), count = $('#stepCount'), done = $('#formDone'), dots = $$('.steps-dots li', form);
    const tHome = $('#tHome'), tWhen = $('#tWhen'), ticket = $('.ticket'), dayIn = $('#viewDay');
    const origin = () => [session.get('utm_source') && 'utm_source=' + session.get('utm_source'), session.get('utm_medium') && 'utm_medium=' + session.get('utm_medium'), session.get('utm_campaign') && 'utm_campaign=' + session.get('utm_campaign'), session.get('cta') && 'cta=' + session.get('cta'), 'page=' + location.pathname].filter(Boolean).join(' / ');
    source.value = origin();
    // fourteen days from tomorrow
    const box = $('#dayChips'), fmt = (o, dt) => new Intl.DateTimeFormat('en-GB', o).format(dt);
    for (let i = 1; i <= 14; i++) {
      const dt = new Date(Date.now() + i * 864e5), b = d.createElement('button');
      b.type = 'button'; b.className = 'day'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.dataset.v = dt.toISOString().slice(0, 10); b.dataset.t = fmt({ weekday: 'short', day: 'numeric', month: 'short' }, dt);
      b.innerHTML = `<span>${fmt({ weekday: 'short' }, dt)}</span><b>${dt.getDate()}</b><i>${fmt({ month: 'short' }, dt)}</i>`;
      b.addEventListener('click', () => { $$('.day', box).forEach(x => x.setAttribute('aria-checked', x === b)); dayIn.value = b.dataset.v; paint(); });
      box.appendChild(b);
    }
    const paint = () => {
      const h = $('input[name="home"]:checked', form), t = $('input[name="time"]:checked', form), day = $('.day[aria-checked="true"]', box);
      const nh = h ? h.value : 'Choose a home'; if (tHome.textContent !== nh) { tHome.textContent = nh; ticket.classList.remove('pop'); void ticket.offsetWidth; ticket.classList.add('pop'); }
      tWhen.textContent = [day ? day.dataset.t : 'Any day', t ? t.value.toLowerCase() : ''].filter(Boolean).join(', ');
    };
    form.addEventListener('change', paint);
    let cur = 0;
    const show = i => {
      cur = i; steps.forEach((s, k) => s.classList.toggle('is-on', k === i)); dots.forEach((s, k) => s.classList.toggle('on', k <= i));
      back.hidden = i === 0; next.hidden = i === steps.length - 1; send.hidden = i !== steps.length - 1;
      count.textContent = `Step ${i + 1} of ${steps.length}`;
    };
    const valid = i => {
      let ok = true;
      $$('input[required]', steps[i]).forEach(f => {
        const good = f.type === 'radio' ? !!$(`input[name="${f.name}"]:checked`, form) : f.type === 'email' ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value.trim()) : f.value.trim().length > 1;
        f.classList.toggle('bad', !good); if (!good) { if (ok && f.type !== 'radio') f.focus(); ok = false; }
      });
      return ok;
    };
    show(0);
    const want = params.get('home');
    if (want) { const r = $$('input[name="home"]', form).find(x => x.value === want); if (r) { r.checked = true; show(1); } }
    paint();
    next.addEventListener('click', () => { if (valid(cur)) { show(cur + 1); track('form_step', { step: cur + 1 }); } });
    back.addEventListener('click', () => show(cur - 1));
    $$('input[name="home"]', form).forEach(r => r.addEventListener('change', () => setTimeout(() => { if (cur === 0) next.click(); }, 420)));
    form.addEventListener('submit', e => {
      e.preventDefault(); if (!valid(cur)) return;
      source.value = origin();
      const v = Object.fromEntries(new FormData(form));
      track('lead', { home: v.home, source: v.source });
      const body = `Private viewing request\n\nHome: ${v.home}\nPreferred day: ${v.day || 'any'}\nTime: ${v.time || 'any'}\n\nName: ${v.name}\nEmail: ${v.email}\nPhone: ${v.phone || ''}\n\nSource: ${v.source}`;
      done.hidden = false; done.focus();
      location.href = `mailto:barry@bvhomes.gi?subject=${encodeURIComponent('Private viewing: ' + v.home)}&body=${encodeURIComponent(body)}`;
    });
  }
})();

/* films: a 3D deck of 9:16 cards on the drawing board. The front film plays muted once the deck is on screen;
   the sound button (or a tap on the front card) turns the sound on. Arrows, keys and swipe move one film at a time. */
(() => {
  const box = document.querySelector('[data-reels]'); if (!box) return;
  const stage = box.querySelector('[data-reels-stage]'), num = box.querySelector('[data-reels-num]'), snd = box.querySelector('[data-reels-sound]');
  const films = JSON.parse(document.getElementById('reels-data').textContent), N = films.length;
  const list = [...document.querySelectorAll('[data-reel-go]')];
  let cur = 0, seen = false, sound = false;
  const cards = films.map((f, i) => {
    const li = document.createElement('li'); li.className = 'deck-card';
    li.innerHTML = `<video playsinline loop muted preload="none" poster="${f.poster}" aria-label="Film ${f.n}: ${f.t}"></video><figcaption>${f.t}</figcaption>`;
    li.addEventListener('click', () => { if (i !== cur) go(i); else setSound(!sound); });
    stage.appendChild(li); return li;
  });
  const vid = i => cards[i].querySelector('video');
  const place = () => {
    const w = innerWidth < 700;
    cards.forEach((c, i) => {
      let o = i - cur; if (o > N / 2) o -= N; if (o < -N / 2) o += N;
      const a = Math.abs(o);
      c.classList.toggle('front', o === 0);
      c.style.zIndex = 10 - a;
      c.style.transform = `translate(-50%, -50%) translateX(${o * (w ? 46 : 58)}%) translateZ(${-a * 160}px) rotateY(${-o * 16}deg) scale(${1 - a * .08})`;
      c.style.filter = a ? 'brightness(.62) saturate(.8)' : 'none';
      c.setAttribute('aria-hidden', o !== 0);
    });
    num.textContent = `0${cur + 1} / 0${N}`;
    list.forEach((b, k) => b.toggleAttribute('aria-current', k === cur));
  };
  const play = () => {
    cards.forEach((c, i) => { const v = vid(i); if (i !== cur) { v.pause(); } });
    if (!seen || document.documentElement.classList.contains('still')) return;
    const v = vid(cur); if (!v.src) v.src = films[cur].src;
    v.muted = !sound; v.play().catch(() => { v.muted = true; sound = false; snd.setAttribute('aria-pressed', 'false'); snd.textContent = 'Sound off'; v.play().catch(() => {}); });
  };
  const setSound = on => { sound = on; snd.setAttribute('aria-pressed', on); snd.textContent = on ? 'Sound on' : 'Sound off'; if (on) { const v = vid(cur); v.currentTime = 0; } seen = true; play(); };
  const go = i => { cur = (i + N) % N; place(); play(); };
  box.querySelector('[data-reels-prev]').addEventListener('click', () => go(cur - 1));
  box.querySelector('[data-reels-next]').addEventListener('click', () => go(cur + 1));
  snd.addEventListener('click', () => setSound(!sound));
  list.forEach((b, k) => b.addEventListener('click', () => go(k)));
  box.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
  let x0 = null; box.addEventListener('pointerdown', e => { x0 = e.clientX; }); box.addEventListener('pointerup', e => { if (x0 !== null && Math.abs(e.clientX - x0) > 40) go(cur + (e.clientX < x0 ? 1 : -1)); x0 = null; });
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { seen = true; play(); } else { cards.forEach((c, i) => vid(i).pause()); } }), { threshold: .4 }).observe(box);
  addEventListener('resize', place); place();
})();

/* the logo opening: the Rock draws itself over the film, the name rises, then the mark flies to the bar */
(() => {
  const root = document.documentElement, intro = document.getElementById('intro');
  if (!intro || !root.classList.contains('intro-on')) return;
  const svg = intro.querySelector('svg'), dest = document.querySelector('#bar .logo .logo-svg');
  const done = () => { root.classList.remove('intro-on'); intro.remove(); };
  setTimeout(() => {
    if (!dest || scrollY > 40) { intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' }).onfinish = done; return; }
    const a = svg.getBoundingClientRect(), b = dest.getBoundingClientRect();
    const k = b.width / a.width;
    const fly = svg.animate([{ transform: 'none' }, { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${k})` }],
      { duration: 1100, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
    fly.onfinish = () => { dest.closest('.logo').style.opacity = 1; done(); dest.closest('.logo').style.opacity = ''; };
  }, 2500);
  setTimeout(() => root.classList.contains('intro-on') && done(), 6000);
})();
