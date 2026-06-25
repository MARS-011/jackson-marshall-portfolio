/* ============================================================================
   COSMIC PORTFOLIO — JAVASCRIPT
   GSAP ScrollTrigger, Lenis smooth scroll, video control
   ============================================================================ */

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis smooth scroll with optimized settings
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Sync Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

/* ============================================================================
   HERO ANIMATIONS
   ============================================================================ */

// Hero title and subtitle fade in with stagger
const heroTitle = document.querySelector('.hero-title');
const heroSubtitle = document.querySelector('.hero-subtitle');

if (heroTitle && heroSubtitle) {
    gsap.from([heroTitle, heroSubtitle], {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
    });
}

/* ============================================================================
   SCROLL-TRIGGERED SECTION ANIMATIONS
   ============================================================================ */

// Animate About section on scroll
const aboutSection = document.querySelector('.about');
if (aboutSection) {
    gsap.from(aboutSection, {
        scrollTrigger: {
            trigger: aboutSection,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true,
        },
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
    });
}

// Animate Projects section on scroll
const projectsSection = document.querySelector('.projects');
if (projectsSection) {
    gsap.from(projectsSection, {
        scrollTrigger: {
            trigger: projectsSection,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true,
        },
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
    });
}

// Animate Contact section on scroll
const contactSection = document.querySelector('.contact');
if (contactSection) {
    gsap.from(contactSection, {
        scrollTrigger: {
            trigger: contactSection,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true,
        },
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
    });
}

/* ============================================================================
   PROJECT CARD STAGGER ANIMATION
   ============================================================================ */

const projectCards = document.querySelectorAll('.project-card');
if (projectCards.length > 0) {
    gsap.from(projectCards, {
        scrollTrigger: {
            trigger: projectsSection,
            start: 'top 75%',
            toggleActions: 'play none none none',
            once: true,
        },
        opacity: 0,
        y: 15,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
    });
}

/* ============================================================================
   HOVER EFFECTS FOR CARDS
   ============================================================================ */

projectCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
        gsap.to(card, {
            borderColor: 'rgba(184, 197, 255, 0.35)',
            duration: 0.2,
            overwrite: 'auto',
        });
    });

    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            borderColor: 'rgba(184, 197, 255, 0.15)',
            duration: 0.2,
            overwrite: 'auto',
        });
    });
});

/* ============================================================================
   VIDEO CONTROL — PAGE VISIBILITY API
   ============================================================================ */

const bgVideo = document.querySelector('.bg-video');

if (bgVideo) {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            bgVideo.pause();
        } else {
            bgVideo.play().catch((err) => {
                console.log('Autoplay prevented:', err);
            });
        }
    });

    // Ensure video plays on load
    bgVideo.addEventListener('loadedmetadata', () => {
        bgVideo.play().catch((err) => {
            console.log('Autoplay prevented:', err);
        });
    });

    // Fallback: try to play on first user interaction
    document.addEventListener('click', () => {
        if (bgVideo.paused) {
            bgVideo.play().catch((err) => {
                console.log('Autoplay prevented:', err);
            });
        }
    }, { once: true });
}

/* ============================================================================
   ACCESSIBILITY — REDUCED MOTION CHECK
   ============================================================================ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    // Disable smooth scroll for users who prefer reduced motion
    lenis.destroy();
    document.documentElement.style.scrollBehavior = 'auto';
}

/* ============================================================================
   SMOOTH SCROLL OPTIMIZATION
   ============================================================================ */

// Disable smooth scroll on mobile for better performance
const isMobile = window.innerWidth < 768;
if (isMobile) {
    lenis.destroy();
}

/* ============================================================================
   INITIALIZATION COMPLETE
   ============================================================================ */

console.log('Jackson Marshall Portfolio — Initialized');
