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

    // Point the big display's link at a project's URL
    function setFeaturedLink(link) {
        if (featuredDisplay) {
            featuredDisplay.setAttribute('href', link && link.trim() ? link : '#');
        }
    }

    thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function () {
            var full = thumb.getAttribute('data-full');
            var name = thumb.getAttribute('data-name');

            // swap the big featured image
            if (featuredImage) {
                featuredImage.src = full;
                featuredImage.alt = name;
            }

            // point the big image's link at this project
            setFeaturedLink(thumb.getAttribute('data-link'));

            // highlight the active card
            thumbs.forEach(function (t) { t.classList.remove('active'); });
            thumb.classList.add('active');
        });
    });

    // Initialise the link to match whichever project image is shown on load
    if (featuredImage && featuredDisplay) {
        var currentSrc = featuredImage.getAttribute('src');
        thumbs.forEach(function (t) {
            if (t.getAttribute('data-full') === currentSrc) {
                setFeaturedLink(t.getAttribute('data-link'));
            }
        });
    }

    /* ---------------------------------------------------------------------
       6. Form input icons — hide the inner icon when focused or filled
       --------------------------------------------------------------------- */
    var inputWraps = document.querySelectorAll('.input-wrap');
    inputWraps.forEach(function (wrap) {
        var input = wrap.querySelector('input');
        if (!input) return;
        function updateIcon() {
            var active = document.activeElement === input || input.value.trim() !== '';
            wrap.classList.toggle('hide-ico', active);
        }
        input.addEventListener('focus', updateIcon);
        input.addEventListener('blur', updateIcon);
        input.addEventListener('input', updateIcon);
        updateIcon();
    });

    /* ---------------------------------------------------------------------
       7. Form validation + email submission (FormSubmit.co — no backend)
       --------------------------------------------------------------------- */
    var form = document.getElementById('quoteForm');
    var success = document.getElementById('formSuccess');

    // Self-hosted PHP mailer (sends to contact@cozyfeetuk.co.uk).
    // To change the recipient, edit the $TO address in sendmail.php.
    var FORM_ENDPOINT = 'sendmail.php';

    if (form) {
        var submitBtn = form.querySelector('.form-submit');
        var btnDefaultHTML = submitBtn ? submitBtn.innerHTML : '';

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

            if (!valid) return;

            // build the payload
            var payload = {
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                phone: form.phone.value.trim(),
                location: form.location.value.trim(),
                message: form.message.value.trim()
            };

            // loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'SENDING…';
            }

            fetch(FORM_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data && (data.success === true || data.success === 'true')) {
                    success.textContent = 'Thank you! Your request has been sent — we\'ll be in touch within 24 hours.';
                    success.classList.add('show');
                    success.classList.remove('error-msg');
                    form.reset();
                    // bring the input icons back now the fields are empty
                    form.querySelectorAll('.input-wrap').forEach(function (w) {
                        w.classList.remove('hide-ico');
                    });
                    setTimeout(function () { success.classList.remove('show'); }, 6000);
                } else {
                    throw new Error('Mailer rejected the request');
                }
            })
            .catch(function () {
                success.textContent = 'Sorry, something went wrong. Please call us on 07500 941315 or email contact@cozyfeetuk.co.uk.';
                success.classList.add('show', 'error-msg');
                setTimeout(function () { success.classList.remove('show', 'error-msg'); }, 8000);
            })
            .then(function () {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = btnDefaultHTML;
                }
            });
        });

        // clear error state as the user types
        form.querySelectorAll('[required]').forEach(function (field) {
            field.addEventListener('input', function () {
                field.classList.remove('error');
            });
        });
    }

    /* ---------------------------------------------------------------------
       8. FAQ accordion
       --------------------------------------------------------------------- */
    var faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function (item) {
        var btn = item.querySelector('.faq-q');
        var answer = item.querySelector('.faq-a');
        if (!btn || !answer) return;

        btn.addEventListener('click', function () {
            var isOpen = item.classList.contains('open');

            // close any other open item (single-open accordion)
            faqItems.forEach(function (other) {
                if (other !== item && other.classList.contains('open')) {
                    other.classList.remove('open');
                    var oBtn = other.querySelector('.faq-q');
                    var oAns = other.querySelector('.faq-a');
                    if (oBtn) oBtn.setAttribute('aria-expanded', 'false');
                    if (oAns) oAns.style.maxHeight = null;
                }
            });

            if (isOpen) {
                item.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
                answer.style.maxHeight = null;
            } else {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    /* ---------------------------------------------------------------------
       9. Scroll reveal animations + count-up (purely visual, additive)
       --------------------------------------------------------------------- */
    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduceMotion && 'IntersectionObserver' in window) {
        document.body.classList.add('anim-ready');

        // Tag elements with reveal classes (+ optional stagger delay)
        function reveal(selector, type, stagger) {
            var els = document.querySelectorAll(selector);
            els.forEach(function (el, i) {
                el.classList.add('reveal');
                if (type) el.classList.add(type);
                if (stagger) el.style.transitionDelay = ((i % 6) * 90) + 'ms';
            });
        }

        reveal('.about-image', 'reveal-left');
        reveal('.about-panel-inner', 'reveal-right');
        reveal('.section-head');
        reveal('.why-col', null, true);
        reveal('.why-lower-img', 'reveal-left');
        reveal('.why-lower-text', 'reveal-right');
        reveal('.wwd-card', null, true);
        reveal('.reviews-head');
        reveal('.reviews-carousel');
        reveal('.featured-display', 'reveal-zoom');
        reveal('.project-thumb', null, true);
        reveal('.faq-item', null, true);
        reveal('.cta-content');
        reveal('.quote-left', 'reveal-left');
        reveal('.quote-right', 'reveal-right');
        reveal('.git-card', null, true);
        reveal('.bt-item', null, true);
        reveal('.footer-inner');

        var revealObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                el.classList.add('in-view');
                obs.unobserve(el);
                // Once the entrance finishes, strip the reveal classes so the
                // element returns to its original CSS (no leftover delay/transform).
                el.addEventListener('transitionend', function te(ev) {
                    if (ev.propertyName !== 'opacity') return;
                    el.style.transitionDelay = '';
                    el.style.willChange = '';
                    el.classList.remove('reveal', 'reveal-left', 'reveal-right', 'reveal-zoom', 'in-view');
                    el.removeEventListener('transitionend', te);
                });
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.reveal').forEach(function (el) {
            revealObserver.observe(el);
        });

        // Count-up for stat numbers (preserves any prefix/suffix like "+" )
        function countUp(el) {
            var raw = el.textContent.trim();
            var m = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
            if (!m) return; // e.g. "FREE" — leave untouched
            var prefix = m[1], target = parseFloat(m[2]), suffix = m[3];
            var decimals = (m[2].split('.')[1] || '').length;
            var duration = 1400, startTime = null;
            function tick(now) {
                if (startTime === null) startTime = now;
                var p = Math.min((now - startTime) / duration, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
                if (p < 1) {
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = prefix + target.toFixed(decimals) + suffix;
                }
            }
            requestAnimationFrame(tick);
        }

        var statObserver = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                countUp(entry.target);
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.6 });

        document.querySelectorAll('.stat-num').forEach(function (el) {
            statObserver.observe(el);
        });
    }

})();
