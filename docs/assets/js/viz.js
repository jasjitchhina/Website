/* ============================================================
   QIS · random walk → normal distribution (untitled panel)
   Stochastic paths fan from the left; their terminal values build
   a Gaussian histogram on the right. Vanilla canvas.
   ============================================================ */
(function () {
    'use strict';

    var canvas = document.getElementById('vizCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var BG    = '#14171f';            // --surface panel bg
    var MAIZE = [255, 203, 5];
    var WHITE = [186, 198, 214];

    var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    var W = 0, H = 0;
    var plotEnd = 0, histW = 0, dx = 0, sigma = 0;
    var STEPS = 230;
    var paths = [];
    var bins = [], NBINS = 46;
    var maxActive = 30;
    var frame = 0;
    var running = false;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
        var rect = canvas.getBoundingClientRect();
        W = rect.width; H = rect.height;
        if (W <= 0 || H <= 0) return;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        histW = Math.max(54, Math.min(92, W * 0.17));
        plotEnd = W - histW;
        dx = plotEnd / STEPS;
        sigma = H * 0.011;
        ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
        drawAxis();
    }

    function gauss() {
        return (Math.random() + Math.random() + Math.random() +
                Math.random() + Math.random() + Math.random() - 3) / 1.732;
    }
    function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

    function spawn() {
        paths.push({ x: 0, y: H / 2, px: 0, py: H / 2, maize: Math.random() < 0.33 });
    }

    function drawAxis() {
        ctx.save();
        // mean line
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(0, H / 2 + 0.5);
        ctx.lineTo(plotEnd, H / 2 + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
        // divider
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.moveTo(plotEnd + 0.5, 8);
        ctx.lineTo(plotEnd + 0.5, H - 8);
        ctx.stroke();
        ctx.restore();
    }

    function drawHistogram() {
        ctx.fillStyle = BG;
        ctx.fillRect(plotEnd + 1, 0, histW + 2, H);

        var maxB = 1, i;
        for (i = 0; i < NBINS; i++) if (bins[i] > maxB) maxB = bins[i];
        var binH = H / NBINS, pad = 4;
        for (i = 0; i < NBINS; i++) {
            if (bins[i] <= 0) continue;
            var frac = bins[i] / maxB;
            var len = frac * (histW - pad - 6);
            var a = 0.18 + frac * 0.62;
            ctx.fillStyle = rgba(MAIZE, a);
            ctx.fillRect(plotEnd + pad, i * binH + 1, len, Math.max(1, binH - 1.5));
        }
    }

    function tick() {
        if (!running) return;
        frame++;

        // fade trails over the plot region only
        ctx.fillStyle = 'rgba(20,23,31,0.045)';
        ctx.fillRect(0, 0, plotEnd + 1, H);
        if (frame % 4 === 0) drawAxis();

        if (paths.length < maxActive && frame % 8 === 0) spawn();
        if (paths.length < 6) spawn();

        for (var k = paths.length - 1; k >= 0; k--) {
            var p = paths[k];
            p.px = p.x; p.py = p.y;
            p.x += dx;
            p.y += gauss() * sigma;
            if (p.y < 3) p.y = 3;
            if (p.y > H - 3) p.y = H - 3;

            ctx.strokeStyle = rgba(p.maize ? MAIZE : WHITE, p.maize ? 0.55 : 0.4);
            ctx.lineWidth = p.maize ? 1.15 : 1;
            ctx.beginPath();
            ctx.moveTo(p.px, p.py);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();

            if (p.x >= plotEnd) {
                var idx = Math.floor((p.y / H) * NBINS);
                if (idx < 0) idx = 0; if (idx >= NBINS) idx = NBINS - 1;
                bins[idx] += 1;
                ctx.fillStyle = rgba(MAIZE, 0.6);
                ctx.beginPath(); ctx.arc(plotEnd, p.y, 1.3, 0, Math.PI * 2); ctx.fill();
                paths.splice(k, 1);
            }
        }

        if (frame % 8 === 0) for (var b = 0; b < NBINS; b++) bins[b] *= 0.992;

        drawHistogram();
        requestAnimationFrame(tick);
    }

    function staticRender() {
        ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
        drawAxis();
        for (var n = 0; n < 70; n++) {
            var y = H / 2, x = 0;
            ctx.strokeStyle = rgba(n % 3 === 0 ? MAIZE : WHITE, 0.28);
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, H / 2);
            for (var s = 0; s < STEPS; s++) {
                x += dx; y += gauss() * sigma;
                y = Math.max(3, Math.min(H - 3, y));
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            var idx = Math.floor((y / H) * NBINS);
            if (idx < 0) idx = 0; if (idx >= NBINS) idx = NBINS - 1;
            bins[idx] += 1;
        }
        drawHistogram();
    }

    function init() {
        for (var i = 0; i < NBINS; i++) bins[i] = 0;
        resize();
        if (W <= 0) { setTimeout(init, 120); return; }
        if (reduce) { staticRender(); return; }
        running = true;
        requestAnimationFrame(tick);

        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        if (!running) { running = true; requestAnimationFrame(tick); }
                    } else { running = false; }
                });
            }, { threshold: 0 });
            io.observe(canvas);
        }
    }

    var rt;
    window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () {
            var was = running; running = false;
            paths = [];
            for (var i = 0; i < NBINS; i++) bins[i] = 0;
            resize();
            if (reduce) { staticRender(); return; }
            if (was) { running = true; requestAnimationFrame(tick); }
        }, 180);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
