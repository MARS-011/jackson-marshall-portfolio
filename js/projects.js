/* ============================================================================
   PROJECTS PAGE — JAVASCRIPT
   Expandable flip cards and Lenis smooth scroll
   ============================================================================ */

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth < 768;
let lenis = null;

if (!prefersReducedMotion && !isMobile) {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
} else {
    document.documentElement.style.scrollBehavior = 'auto';
}

/* ============================================================================
   CARD ANIMATIONS & FLIP
   ============================================================================ */

function initializeCardAnimations() {
    const cards = document.querySelectorAll('.project-card-expandable');

    cards.forEach((card, index) => {
        gsap.from(card, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            delay: 0.4 + index * 0.07,
            ease: 'power2.out',
        });

        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') return;

            const isFlipped = card.classList.contains('flipped');
            // Close all others
            cards.forEach(c => c !== card && c.classList.remove('flipped'));
            card.classList.toggle('flipped', !isFlipped);
        });

        card.addEventListener('mouseenter', () => {
            gsap.to(card, { boxShadow: '0 0 30px rgba(184, 197, 255, 0.08)', duration: 0.3, overwrite: 'auto' });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, { boxShadow: 'none', duration: 0.3, overwrite: 'auto' });
        });
    });
}

/* ============================================================================
   VIDEO CONTROL
   ============================================================================ */

const bgVideo = document.querySelector('.bg-video');
if (bgVideo) {
    document.addEventListener('visibilitychange', () => {
        document.hidden ? bgVideo.pause() : bgVideo.play().catch(() => {});
    });
    bgVideo.addEventListener('loadedmetadata', () => bgVideo.play().catch(() => {}));
    document.addEventListener('click', () => {
        if (bgVideo.paused) bgVideo.play().catch(() => {});
    }, { once: true });
}

/* ============================================================================
   INITIALIZATION
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    initializeCardAnimations();

    const pageTitle    = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    if (pageTitle && pageSubtitle) {
        gsap.from([pageTitle, pageSubtitle], {
            opacity: 0, y: 20, duration: 0.8, delay: 0.3, stagger: 0.15, ease: 'power2.out'
        });
    }

    console.log('Projects Page — Initialized');
});
