/* ============================================================
   QIS · front-end
   ============================================================ */
(function () {
    'use strict';

    // ------------------------------------------------------------
    // Hero market chart — live forming candles (ticks + step-left)
    // ------------------------------------------------------------
    (function buildHeroChart() {
        var host = document.getElementById('heroChart');
        if (!host) return;

        var ns = 'http://www.w3.org/2000/svg';
        var W = 1200, H = 420;
        var padTop = 40, padBot = 30;
        var slot = 21;
        var bodyW = slot * 0.56;
        var L = Math.ceil(W / slot) + 2;            // candles held in the series

        // Fixed price band so the view never jumps vertically
        var pMin = 8, pMax = 92, center = 50;
        function y(v) { return padTop + (1 - (v - pMin) / (pMax - pMin)) * (H - padTop - padBot); }

        var price = center;
        function tickPrice() {
            price += (center - price) * 0.02 + (Math.random() - 0.5) * 3.4;
            return Math.max(pMin + 3, Math.min(pMax - 3, price));
        }
        function newCandle() { var o = price; return { o: o, c: o, h: o, l: o }; }

        // Seed the series with some history so it starts full.
        // Some candles get a larger body/wick so the chart has taller spikes.
        var data = [];
        for (var s = 0; s < L; s++) {
            var o = price;
            var big = Math.random() < 0.22 ? (2.2 + Math.random() * 2.0) : 1;
            price += (center - price) * 0.03 + (Math.random() - 0.5) * 3.4 * big;
            price = Math.max(pMin + 3, Math.min(pMax - 3, price));
            var c = price;
            data.push({ o: o, c: c, h: Math.max(o, c) + Math.random() * 3 * big, l: Math.min(o, c) - Math.random() * 3 * big });
        }

        var svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svg.setAttribute('preserveAspectRatio', 'none');
        var g = document.createElementNS(ns, 'g');
        svg.appendChild(g);
        host.appendChild(svg);

        var candleCol = 'rgba(150, 174, 214, 0.32)';
        var els = [];
        for (var i = 0; i < L; i++) {
            var wick = document.createElementNS(ns, 'line');
            wick.setAttribute('class', 'hc-wick');
            wick.setAttribute('stroke', candleCol);
            var body = document.createElementNS(ns, 'rect');
            body.setAttribute('width', bodyW);
            body.setAttribute('fill', candleCol);
            g.appendChild(wick); g.appendChild(body);
            els.push({ wick: wick, body: body });
        }

        // Maize line connecting the candles (drawn over them)
        var line = document.createElementNS(ns, 'polyline');
        line.setAttribute('class', 'hc-line');
        g.appendChild(line);

        function render() {
            var pts = '';
            for (var i = 0; i < L; i++) {
                var k = data[i], e = els[i];
                var cx = i * slot + slot / 2;
                e.wick.setAttribute('x1', cx); e.wick.setAttribute('x2', cx);
                e.wick.setAttribute('y1', y(k.h)); e.wick.setAttribute('y2', y(k.l));
                var top = y(Math.max(k.o, k.c));
                e.body.setAttribute('x', cx - bodyW / 2);
                e.body.setAttribute('y', top);
                e.body.setAttribute('height', Math.max(1.5, y(Math.min(k.o, k.c)) - top));
                pts += (i ? ' ' : '') + cx + ',' + y(k.c);
            }
            line.setAttribute('points', pts);
        }
        render();   // static — rendered once, no animation
    })();

    // ------------------------------------------------------------
    // Header scroll state
    // ------------------------------------------------------------
    var header = document.getElementById('siteHeader');
    var onScroll = function () {
        if (window.scrollY > 40) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ------------------------------------------------------------
    // Mobile nav
    // ------------------------------------------------------------
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = links.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        links.addEventListener('click', function (e) {
            if (e.target.closest('a')) links.classList.remove('is-open');
        });
    }

    // ------------------------------------------------------------
    // Hero meta — local time
    // ------------------------------------------------------------
    var timeEl = document.getElementById('heroTime');
    function updateTime() {
        if (!timeEl) return;
        var d = new Date();
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        var ss = String(d.getSeconds()).padStart(2, '0');
        timeEl.textContent = hh + ':' + mm + ':' + ss + ' ET';
    }
    updateTime();
    setInterval(updateTime, 1000);

    // ------------------------------------------------------------
    // Counting numbers in hero stats
    // ------------------------------------------------------------
    function animateCount(el) {
        var target = parseFloat(el.getAttribute('data-count'));
        if (isNaN(target)) return;
        // Preserve any <span class="unit"> suffix
        var unitEl = el.querySelector('.unit');
        var unitHTML = unitEl ? unitEl.outerHTML : '';
        var dur = 1400;
        var start = performance.now();
        function tick(now) {
            var t = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - t, 3);
            var val = Math.floor(target * eased);
            el.innerHTML = val.toLocaleString('en-US') + unitHTML;
            if (t < 1) requestAnimationFrame(tick);
            else el.innerHTML = target.toLocaleString('en-US') + unitHTML;
        }
        requestAnimationFrame(tick);
    }

    // ------------------------------------------------------------
    // IntersectionObserver — reveal + count-up trigger
    // ------------------------------------------------------------
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('is-in');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

        // count up when hero stats come into view (usually immediately)
        var heroStatEls = document.querySelectorAll('.hero-stat .hs-num');
        if (heroStatEls.length) {
            var seen = false;
            var io2 = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting && !seen) {
                        seen = true;
                        heroStatEls.forEach(animateCount);
                        io2.disconnect();
                    }
                });
            }, { threshold: 0.3 });
            io2.observe(heroStatEls[0]);
        }
    } else {
        // fallback: reveal everything + show final numbers
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    }
})();
