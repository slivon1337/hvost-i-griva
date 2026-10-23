/* ============================================================
   Хвост и Грива — лендинг
   Фоновая пыль, анимация листа, появление блоков, меню
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ----------------------------------------------------------
     1. Пыль в воздухе
     ---------------------------------------------------------- */
  var dust = document.getElementById('dust');

  if (dust) {
    var ctx = dust.getContext('2d');
    var DPR = 1;
    var W = 0;
    var H = 0;
    var particles = [];
    var PALETTE = [
      [244, 237, 221], // крем
      [201, 168, 106], // золото
      [150, 196, 164]  // шалфей
    ];
    var sprites = [];

    function makeSprite(rgb) {
      var size = 48;
      var c = document.createElement('canvas');
      c.width = c.height = size;
      var g = c.getContext('2d');
      var grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',1)');
      grad.addColorStop(0.35, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',.45)');
      grad.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      return c;
    }

    PALETTE.forEach(function (rgb) { sprites.push(makeSprite(rgb)); });

    function spawn(initial) {
      var tone = Math.random();
      return {
        x: Math.random() * W,
        y: initial ? Math.random() * H : H + 20,
        r: 0.55 + Math.random() * 2.1,
        vy: 5 + Math.random() * 13,
        sw: 0.5 + Math.random() * 3.4,
        tw: 0.2 + Math.random() * 0.7,
        ph: Math.random() * Math.PI * 2,
        a: 0.08 + Math.random() * 0.42,
        s: tone > 0.75 ? 2 : (tone > 0.45 ? 1 : 0)
      };
    }

    function resizeDust() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      dust.width = Math.round(W * DPR);
      dust.height = Math.round(H * DPR);
      dust.style.width = W + 'px';
      dust.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      var count = Math.min(96, Math.max(22, Math.round((W * H) / 24000)));
      particles = [];
      for (var i = 0; i < count; i++) particles.push(spawn(true));
    }

    var lastT = 0;

    function drawDust(t) {
      if (!lastT) lastT = t;
      var dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.vy * dt;
        p.x += Math.sin(t * 0.00035 * p.tw * 3 + p.ph) * p.sw * dt * 8;

        if (p.y < -30) {
          particles[i] = spawn(false);
          continue;
        }
        if (p.x < -30) p.x = W + 30;
        if (p.x > W + 30) p.x = -30;

        var sprite = sprites[p.s];
        var d = p.r * 7;
        ctx.globalAlpha = p.a;
        ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    resizeDust();
    window.addEventListener('resize', resizeDust);

    if (!reduceMotion) {
      (function dustLoop(t) {
        if (!document.hidden) drawDust(t);
        requestAnimationFrame(dustLoop);
      })(0);
    } else {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      particles.forEach(function (p) {
        var sprite = sprites[p.s];
        var d = p.r * 7;
        ctx.globalAlpha = p.a;
        ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* ----------------------------------------------------------
     2. Шапка, прогресс прокрутки
     ---------------------------------------------------------- */
  var header = document.getElementById('header');
  var progressBar = document.getElementById('progressBar');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('is-stuck', y > 24);

    if (progressBar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  onScroll();

  /* ----------------------------------------------------------
     4. Появление блоков
     ---------------------------------------------------------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (reveals.length) {
    reveals.forEach(function (el) {
      var siblings = el.parentNode ? el.parentNode.querySelectorAll(':scope > .reveal') : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      if (index > 0) el.style.setProperty('--d', Math.min(index * 80, 400) + 'ms');
    });

    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

      reveals.forEach(function (el) { revealObserver.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ----------------------------------------------------------
     5. Лёгкий параллакс в первом экране
     ---------------------------------------------------------- */
  var hero = document.querySelector('.hero');
  var heroInner = document.querySelector('.hero__inner');
  var heroLeaf = document.querySelector('.hero__ornament--right .leaf-img');
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  if (hero && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });

    hero.addEventListener('mouseleave', function () {
      pointer.tx = 0;
      pointer.ty = 0;
    });

    (function parallaxLoop() {
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      if (heroInner) {
        heroInner.style.transform =
          'translate3d(' + (pointer.x * 9).toFixed(2) + 'px,' + (pointer.y * 7).toFixed(2) + 'px,0)';
      }
      if (heroLeaf) {
        heroLeaf.style.transform =
          'translate3d(' + (pointer.x * -26).toFixed(2) + 'px,' + (pointer.y * -20).toFixed(2) + 'px,0)';
      }

      requestAnimationFrame(parallaxLoop);
    })();
  }

  /* ----------------------------------------------------------
     7. Год в подвале
     ---------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

})();
