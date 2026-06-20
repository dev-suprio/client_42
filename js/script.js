/* =========================================================================
   CozyFeet — Interactive behaviours
   ========================================================================= */
(function () {
    'use strict';

    /* ---------------------------------------------------------------------
       1. Sticky header on scroll
       --------------------------------------------------------------------- */
    var header = document.getElementById('siteHeader');
    function onScroll() {
        if (window.scrollY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------------------------------------------------------------------
       2. Mobile hamburger menu
       --------------------------------------------------------------------- */
    var hamburger = document.getElementById('hamburger');
    var mainNav = document.getElementById('mainNav');

    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('open');
        mainNav.classList.toggle('open');
    });

    /* ---------------------------------------------------------------------
       3. Smooth scroll for nav anchor links + active link + close menu
       --------------------------------------------------------------------- */
    var navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            var targetId = link.getAttribute('href');
            if (targetId.length > 1) {
                var target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    var offset = 80;
                    var top = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                    // close mobile menu
                    hamburger.classList.remove('open');
                    mainNav.classList.remove('open');
                }
            }
        });
    });

    // Highlight active nav link based on scroll position
    var sections = document.querySelectorAll('section[id]');
    var menuLinks = document.querySelectorAll('.main-nav a');
    function setActiveLink() {
        var pos = window.scrollY + 120;
        var current = '';
        sections.forEach(function (sec) {
            if (pos >= sec.offsetTop) { current = sec.id; }
        });
        menuLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', setActiveLink, { passive: true });

    /* ---------------------------------------------------------------------
       4. Reviews carousel (prev/next + dots + auto-slide)
       --------------------------------------------------------------------- */
    var track = document.getElementById('reviewsTrack');
    var prevBtn = document.getElementById('reviewPrev');
    var nextBtn = document.getElementById('reviewNext');
    var dotsWrap = document.getElementById('reviewDots');
    var cards = track ? track.querySelectorAll('.review-card') : [];
    var index = 0;
    var autoTimer = null;

    function perView() {
        if (window.innerWidth <= 600) return 1;
        if (window.innerWidth <= 992) return 2;
        return 3;
    }

    function maxIndex() {
        return Math.max(0, cards.length - perView());
    }

    function buildDots() {
        if (!dotsWrap) return;
        dotsWrap.innerHTML = '';
        var count = maxIndex() + 1;
        for (var i = 0; i < count; i++) {
            var b = document.createElement('button');
            b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            (function (n) {
                b.addEventListener('click', function () { goTo(n); });
            })(i);
            dotsWrap.appendChild(b);
        }
    }

    function updateCarousel() {
        if (!track || cards.length === 0) return;
        var card = cards[0];
        var style = window.getComputedStyle(track);
        var gap = parseFloat(style.columnGap || style.gap || 24) || 24;
        var step = card.getBoundingClientRect().width + gap;
        track.style.transform = 'translateX(' + (-index * step) + 'px)';
        // dots
        var dots = dotsWrap ? dotsWrap.querySelectorAll('button') : [];
        dots.forEach(function (d, i) {
            d.classList.toggle('active', i === index);
        });
    }

    function goTo(n) {
        index = Math.max(0, Math.min(n, maxIndex()));
        updateCarousel();
    }
    function next() { index = index >= maxIndex() ? 0 : index + 1; updateCarousel(); }
    function prev() { index = index <= 0 ? maxIndex() : index - 1; updateCarousel(); }

    function startAuto() {
        stopAuto();
        autoTimer = setInterval(next, 5000);
    }
    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    if (track && cards.length) {
        nextBtn.addEventListener('click', function () { next(); startAuto(); });
        prevBtn.addEventListener('click', function () { prev(); startAuto(); });

        var carousel = document.querySelector('.reviews-carousel');
        carousel.addEventListener('mouseenter', stopAuto);
        carousel.addEventListener('mouseleave', startAuto);

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (index > maxIndex()) index = maxIndex();
                buildDots();
                updateCarousel();
            }, 150);
        });

        buildDots();
        updateCarousel();
        startAuto();
    }

    /* ---------------------------------------------------------------------
       5. Featured projects — card selector swaps the big display image
       --------------------------------------------------------------------- */
    var featuredImage = document.getElementById('featuredImage');
    var featuredDisplay = document.getElementById('featuredDisplay');
    var thumbs = document.querySelectorAll('.project-thumb');

    thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function () {
            var full = thumb.getAttribute('data-full');
            var name = thumb.getAttribute('data-name');

            // swap the big featured image + its link
            if (featuredImage) {
                featuredImage.src = full;
                featuredImage.alt = name;
            }
            if (featuredDisplay) {
                featuredDisplay.setAttribute('href', full);
            }

            // highlight the active card
            thumbs.forEach(function (t) { t.classList.remove('active'); });
            thumb.classList.add('active');
        });
    });

    /* ---------------------------------------------------------------------
       6. Form validation (no backend)
       --------------------------------------------------------------------- */
    var form = document.getElementById('quoteForm');
    var success = document.getElementById('formSuccess');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var required = form.querySelectorAll('[required]');
            var valid = true;

            required.forEach(function (field) {
                var val = field.value.trim();
                var ok = val !== '';
                if (ok && field.type === 'email') {
                    ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
                }
                field.classList.toggle('error', !ok);
                if (!ok) valid = false;
            });

            if (valid) {
                success.classList.add('show');
                form.reset();
                setTimeout(function () { success.classList.remove('show'); }, 6000);
            }
        });

        // clear error state as the user types
        form.querySelectorAll('[required]').forEach(function (field) {
            field.addEventListener('input', function () {
                field.classList.remove('error');
            });
        });
    }

})();
