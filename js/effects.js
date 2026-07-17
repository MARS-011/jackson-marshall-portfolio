/* ============================================================================
   SHARED VISUAL EFFECTS
   Grain overlay, blinds page transitions, magnetic links, and reusable
   scroll-reveal / 3D-tilt helpers used across the public-facing pages.
   ============================================================================ */

const PortfolioEffects = (function () {
    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------------------------
       Film grain overlay
       ------------------------------------------------------------------ */
    function initGrain() {
        if (!document.querySelector('.grain-overlay')) {
            const grain = document.createElement('div');
            grain.className = 'grain-overlay';
            document.body.appendChild(grain);
        }
    }

    /* ------------------------------------------------------------------
       Blinds-style page transition
       Opening is handled entirely by CSS (see styles.css) so it can
       never get stuck if a script fails. This just builds the strips
       and handles the closing animation before navigating away.
       ------------------------------------------------------------------ */
    function initPageTransitions() {
        const overlay = document.querySelector('.page-transition-overlay');
        if (!overlay) return;

        const STRIP_COUNT = 10;
        const CLOSE_DURATION_MS = prefersReducedMotion ? 10 : 450;
        const CLOSE_STAGGER_MS = prefersReducedMotion ? 0 : 30;

        let strips = overlay.querySelectorAll('.pt-strip');
        if (!strips.length) {
            const frag = document.createDocumentFragment();
            for (let i = 0; i < STRIP_COUNT; i++) {
                const strip = document.createElement('div');
                strip.className = 'pt-strip';
                strip.style.setProperty('--pt-i', i);
                frag.appendChild(strip);
            }
            overlay.appendChild(frag);
            strips = overlay.querySelectorAll('.pt-strip');
        }

        // Safety net: if the overlay is ever still covering the screen a
        // couple seconds after load (e.g. the CSS animation somehow didn't
        // fire), force it out of the way rather than leave the page stuck.
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 2500);

        // Back/forward cache can restore the page mid-close (still covered).
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                strips.forEach((strip) => {
                    strip.style.transition = 'none';
                    strip.style.transform = '';
                    strip.style.animation = 'none';
                });
                overlay.style.display = 'none';
            }
        });

        function closeThenNavigate(href) {
            strips.forEach((strip, i) => {
                strip.style.animation = 'none';
                strip.style.transition = `transform ${CLOSE_DURATION_MS}ms cubic-bezier(0.65, 0, 0.35, 1) ${i * CLOSE_STAGGER_MS}ms`;
                strip.style.transform = 'scaleY(1)';
            });
            const totalWait = CLOSE_DURATION_MS + (strips.length - 1) * CLOSE_STAGGER_MS + 60;
            setTimeout(() => {
                window.location.href = href;
            }, totalWait);
        }

        function isInternalPageLink(link) {
            if (!link || !link.href) return false;
            if (link.target && link.target !== '' && link.target !== '_self') return false;
            if (link.hasAttribute('download')) return false;
            let url;
            try {
                url = new URL(link.href, window.location.href);
            } catch (err) {
                return false;
            }
            if (url.origin !== window.location.origin) return false;
            if (url.pathname === window.location.pathname && url.hash) return false; // in-page anchor
            return /\.html?$/.test(url.pathname) || url.pathname === '/' || url.pathname.endsWith('/');
        }

        document.addEventListener('click', (e) => {
            if (e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            const link = e.target.closest('a');
            if (!isInternalPageLink(link)) return;

            e.preventDefault();
            overlay.style.display = 'flex';
            closeThenNavigate(link.href);
        });
    }

    /* ------------------------------------------------------------------
       Magnetic links — nudges links toward the cursor within their own
       bounding box, springs back on leave. Desktop-only (fine pointer).
       ------------------------------------------------------------------ */
    const MAGNETIC_SELECTOR = '.nav-link, .view-all-link, .detail-link-card';
    const MAGNETIC_STRENGTH = 0.35;

    function initMagneticLinks(root) {
        if (!supportsFinePointer || prefersReducedMotion || typeof gsap === 'undefined') return;

        const scope = root || document;
        const elements = scope.querySelectorAll(MAGNETIC_SELECTOR);

        elements.forEach((el) => {
            if (el.dataset.magneticBound) return;
            el.dataset.magneticBound = 'true';
            el.classList.add('js-magnetic');

            const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
            const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });

            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const relX = e.clientX - (rect.left + rect.width / 2);
                const relY = e.clientY - (rect.top + rect.height / 2);
                xTo(relX * MAGNETIC_STRENGTH);
                yTo(relY * MAGNETIC_STRENGTH);
            });

            el.addEventListener('mouseleave', () => {
                xTo(0);
                yTo(0);
            });
        });
    }

    /* ------------------------------------------------------------------
       Grid reveal — staggered scale/opacity entrance for a set of items
       as their container scrolls into view. Used for card grids.
       ------------------------------------------------------------------ */
    function initGridReveal(items) {
        const els = gsap.utils.toArray(items);
        if (!els.length || typeof ScrollTrigger === 'undefined') return;

        if (prefersReducedMotion) {
            gsap.set(els, { opacity: 1, y: 0, scale: 1 });
            return;
        }

        gsap.set(els, { opacity: 0, y: 44, scale: 0.94 });

        ScrollTrigger.batch(els, {
            start: 'top 88%',
            once: true,
            onEnter: (batch) => gsap.to(batch, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.7,
                stagger: 0.08,
                ease: 'power3.out',
                overwrite: true,
            }),
        });

        // Safety net: force items visible after a few seconds regardless,
        // in case ScrollTrigger never fires for them (e.g. layout edge case).
        setTimeout(() => {
            gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: 0.4, overwrite: 'auto' });
        }, 4000);
    }

    /* ------------------------------------------------------------------
       Scroll tilt — subtle 3D rotation as each item travels through
       the viewport. Requires a `perspective` on the item's container.
       ------------------------------------------------------------------ */
    function initScrollTilt(items, options) {
        const els = gsap.utils.toArray(items);
        if (!els.length || typeof ScrollTrigger === 'undefined' || prefersReducedMotion) return;

        const opts = Object.assign({ rotateX: 10, translateZ: -60 }, options);

        els.forEach((el) => {
            gsap.fromTo(el,
                { rotateX: opts.rotateX, z: opts.translateZ, transformPerspective: 1400 },
                {
                    rotateX: 0,
                    z: 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top bottom',
                        end: 'top 55%',
                        scrub: 0.6,
                    },
                }
            );
        });
    }

    /* ------------------------------------------------------------------
       Text reveal — splits a heading into characters or words, then
       animates them in with a blur/opacity/rise. Fires immediately for
       page-load headings ('load') or the first time it scrolls into
       view ('scroll'). Screen readers get the original text via
       aria-label; the split spans are hidden from them.
       ------------------------------------------------------------------ */
    function splitIntoUnits(el, mode) {
        const text = el.textContent;
        el.setAttribute('aria-label', text);
        el.textContent = '';

        const frag = document.createDocumentFragment();
        const units = [];

        text.split(/(\s+)/).forEach((token) => {
            if (/^\s+$/.test(token)) {
                frag.appendChild(document.createTextNode(token));
                return;
            }
            if (!token.length) return;

            if (mode === 'words') {
                const span = document.createElement('span');
                span.className = 'tg-word';
                span.textContent = token;
                span.setAttribute('aria-hidden', 'true');
                frag.appendChild(span);
                units.push(span);
                return;
            }

            // Character mode: each word's letters are grouped inside a
            // single inline-block wrapper so the browser can only break
            // lines at real word boundaries — otherwise every individual
            // letter span becomes its own breakable box and words like
            // "MARSHALL" can wrap mid-word (e.g. a trailing "LL" dropping
            // to its own line).
            const wordWrap = document.createElement('span');
            wordWrap.className = 'tg-word-wrap';
            token.split('').forEach((ch) => {
                const span = document.createElement('span');
                span.className = 'tg-char';
                span.textContent = ch;
                span.setAttribute('aria-hidden', 'true');
                wordWrap.appendChild(span);
                units.push(span);
            });
            frag.appendChild(wordWrap);
        });

        el.appendChild(frag);
        return units;
    }

    function initTextReveal(el, options) {
        if (!el || typeof gsap === 'undefined') return;
        if (prefersReducedMotion) return; // leave the plain text intact, no split needed

        const opts = Object.assign({ mode: 'chars', trigger: 'load', delay: 0, stagger: 0.032 }, options);
        const units = splitIntoUnits(el, opts.mode);
        if (!units.length) return;

        gsap.set(units, { opacity: 0, y: '0.55em', filter: 'blur(6px)' });

        const reveal = () => {
            gsap.to(units, {
                opacity: 1,
                y: '0em',
                filter: 'blur(0px)',
                duration: 0.9,
                delay: opts.delay,
                stagger: opts.stagger,
                ease: 'power3.out',
                overwrite: true,
            });
        };

        if (opts.trigger === 'scroll' && typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: reveal });
        } else {
            reveal();
        }

        // Safety net: if a trigger somehow never fires, don't leave the
        // heading permanently invisible.
        setTimeout(() => {
            gsap.to(units, { opacity: 1, y: '0em', filter: 'blur(0px)', duration: 0.4, overwrite: 'auto' });
        }, 5000);
    }

    /* ------------------------------------------------------------------
       3D card tilt — mouse-tracked perspective tilt with a cursor-lit
       glare. Desktop / fine-pointer only; the parent grid needs
       `perspective` set in CSS for the tilt to read as 3D.
       ------------------------------------------------------------------ */
    function initCardTilt3D(selector, options) {
        if (!supportsFinePointer || prefersReducedMotion || typeof gsap === 'undefined') return;

        const cards = gsap.utils.toArray(selector);
        if (!cards.length) return;

        const opts = Object.assign({ maxTilt: 9, liftScale: 1.015 }, options);

        cards.forEach((card) => {
            if (card.dataset.tiltBound) return;
            card.dataset.tiltBound = 'true';
            card.classList.add('js-tilt-card');

            const glare = document.createElement('div');
            glare.className = 'card-glare';
            glare.setAttribute('aria-hidden', 'true');
            card.appendChild(glare);

            const rotateXTo = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: 'power3.out' });
            const rotateYTo = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: 'power3.out' });
            const scaleTo = gsap.quickTo(card, 'scale', { duration: 0.5, ease: 'power3.out' });

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const px = (e.clientX - rect.left) / rect.width;
                const py = (e.clientY - rect.top) / rect.height;

                rotateXTo((0.5 - py) * opts.maxTilt);
                rotateYTo((px - 0.5) * opts.maxTilt);
                scaleTo(opts.liftScale);

                glare.style.setProperty('--mx', `${px * 100}%`);
                glare.style.setProperty('--my', `${py * 100}%`);
                glare.style.opacity = '1';
            });

            card.addEventListener('mouseleave', () => {
                rotateXTo(0);
                rotateYTo(0);
                scaleTo(1);
                glare.style.opacity = '0';
            });
        });
    }

    /* ------------------------------------------------------------------
       Sparkles — a quiet, ambient canvas starfield confined to a single
       container (the hero). Drifts and twinkles slowly; pauses when
       off-screen or the tab is hidden so it never costs anything the
       viewer isn't looking at.
       ------------------------------------------------------------------ */
    function initSparkles(container, options) {
        if (!container || prefersReducedMotion) return;

        const opts = Object.assign({ density: 60, color: '184, 197, 255' }, options);
        const canvas = document.createElement('canvas');
        canvas.className = 'sparkles-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        let width = 0, height = 0, dpr = 1, particles = [], running = false, rafId = null;

        function makeParticle() {
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 1.1 + 0.3,
                baseAlpha: Math.random() * 0.5 + 0.15,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.12 + 0.03,
                drift: (Math.random() - 0.5) * 0.05,
            };
        }

        function seed() {
            const area = width * height;
            const count = Math.max(20, Math.min(opts.density, Math.round(area / 14000)));
            particles = new Array(count).fill(0).map(makeParticle);
        }

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = container.clientWidth;
            height = container.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            seed();
        }

        function tick(t) {
            if (!running) return;
            ctx.clearRect(0, 0, width, height);
            particles.forEach((p) => {
                p.y -= p.speed;
                p.x += p.drift;
                if (p.y < -4) { p.y = height + 4; p.x = Math.random() * width; }
                if (p.x < -4) p.x = width + 4;
                if (p.x > width + 4) p.x = -4;

                const twinkle = (Math.sin(t * 0.0016 + p.phase) + 1) / 2;
                const alpha = p.baseAlpha * (0.35 + 0.65 * twinkle);

                ctx.beginPath();
                ctx.fillStyle = `rgba(${opts.color}, ${alpha.toFixed(3)})`;
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            rafId = requestAnimationFrame(tick);
        }

        function start() {
            if (running) return;
            running = true;
            rafId = requestAnimationFrame(tick);
        }

        function stop() {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
        }

        resize();
        start();

        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', () => {
            document.hidden ? stop() : start();
        });

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
            }, { threshold: 0 });
            io.observe(container);
        }

        return { start, stop, resize };
    }

    document.addEventListener('DOMContentLoaded', () => {
        initGrain();
        initPageTransitions();
        initMagneticLinks();
    });

    return { initMagneticLinks, initGridReveal, initScrollTilt, initTextReveal, initCardTilt3D, initSparkles };
})();
