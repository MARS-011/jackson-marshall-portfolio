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
       Covers the viewport with vertical strips, opens on load, closes
       before navigating to another internal page.
       ------------------------------------------------------------------ */
    function initPageTransitions() {
        const overlay = document.querySelector('.page-transition-overlay');
        if (!overlay || typeof gsap === 'undefined') return;

        const STRIP_COUNT = 10;
        const DURATION = prefersReducedMotion ? 0.01 : 0.5;
        const STAGGER = prefersReducedMotion ? 0 : 0.035;

        let strips = overlay.querySelectorAll('.pt-strip');
        if (!strips.length) {
            const frag = document.createDocumentFragment();
            for (let i = 0; i < STRIP_COUNT; i++) {
                const strip = document.createElement('div');
                strip.className = 'pt-strip';
                strip.style.transformOrigin = i % 2 === 0 ? 'top' : 'bottom';
                frag.appendChild(strip);
            }
            overlay.appendChild(frag);
            strips = overlay.querySelectorAll('.pt-strip');
        }

        function revealPage() {
            gsap.set(strips, { scaleY: 1 });
            gsap.to(strips, {
                scaleY: 0,
                duration: DURATION,
                stagger: STAGGER,
                ease: 'power3.inOut',
                overwrite: true,
            });
        }

        function coverPage(onComplete) {
            gsap.to(strips, {
                scaleY: 1,
                duration: DURATION,
                stagger: STAGGER,
                ease: 'power3.inOut',
                overwrite: true,
                onComplete,
            });
        }

        revealPage();
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) revealPage();
        });

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
            coverPage(() => {
                window.location.href = link.href;
            });
        });
    }

    /* ------------------------------------------------------------------
       Magnetic links — nudges links toward the cursor within their own
       bounding box, springs back on leave. Desktop-only (fine pointer).
       ------------------------------------------------------------------ */
    const MAGNETIC_SELECTOR = '.nav-link, .view-all-link, .github-link, .project-link, .detail-link-card';
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

    document.addEventListener('DOMContentLoaded', () => {
        initGrain();
        initPageTransitions();
        initMagneticLinks();
    });

    return { initMagneticLinks, initGridReveal, initScrollTilt };
})();
