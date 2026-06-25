/* ============================================================================
   COSMIC PORTFOLIO — JAVASCRIPT
   GSAP ScrollTrigger, Lenis smooth scroll, video control
   ============================================================================ */

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis smooth scroll
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

// Hero title and subtitle are animated via CSS keyframes with 0.8s delay
// This ensures they fade in after the video starts

/* ============================================================================
   SCROLL-TRIGGERED SECTION ANIMATIONS
   ============================================================================ */

// Animate About section
const aboutSection = document.querySelector('.about');
if (aboutSection) {
    gsap.to(aboutSection, {
        scrollTrigger: {
            trigger: aboutSection,
            start: 'top 80%',
            toggleActions: 'play none none none',
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });
}

// Animate Projects section
const projectsSection = document.querySelector('.projects');
if (projectsSection) {
    gsap.to(projectsSection, {
        scrollTrigger: {
            trigger: projectsSection,
            start: 'top 80%',
            toggleActions: 'play none none none',
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });
}

// Animate Contact section
const contactSection = document.querySelector('.contact');
if (contactSection) {
    gsap.to(contactSection, {
        scrollTrigger: {
            trigger: contactSection,
            start: 'top 80%',
            toggleActions: 'play none none none',
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });
}

/* ============================================================================
   PROJECT CARD STAGGER ANIMATION
   ============================================================================ */

const projectCards = document.querySelectorAll('.project-card');
if (projectCards.length > 0) {
    gsap.to(projectCards, {
        scrollTrigger: {
            trigger: projectsSection,
            start: 'top 70%',
            toggleActions: 'play none none none',
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });
}

/* ============================================================================
   HOVER EFFECTS FOR CARDS
   ============================================================================ */

projectCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
        gsap.to(card, {
            borderColor: 'rgba(184, 197, 255, 0.35)',
            duration: 0.3,
            overwrite: 'auto',
        });
    });

    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            borderColor: 'rgba(184, 197, 255, 0.15)',
            duration: 0.3,
            overwrite: 'auto',
        });
    });
});

/* ============================================================================
   VIDEO CONTROL — PAGE VISIBILITY API
   ============================================================================ */

const bgVideo = document.querySelector('.bg-video');

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        bgVideo.pause();
    } else {
        bgVideo.play();
    }
});

// Ensure video plays on load
bgVideo.addEventListener('loadedmetadata', () => {
    bgVideo.play().catch((err) => {
        console.log('Autoplay prevented:', err);
    });
});

/* ============================================================================
   ACCESSIBILITY — REDUCED MOTION CHECK
   ============================================================================ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    // Disable all GSAP animations for users who prefer reduced motion
    gsap.globalTimeline.timeScale(0);
    gsap.globalTimeline.timeScale(1);
    
    // Alternatively, you can set animations to instant
    document.documentElement.style.scrollBehavior = 'auto';
}

/* ============================================================================
   INITIALIZATION COMPLETE
   ============================================================================ */

console.log('Jackson Marshall Portfolio — Initialized');
