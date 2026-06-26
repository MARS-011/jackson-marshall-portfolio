/* ============================================================================
   PROJECTS PAGE — JAVASCRIPT
   Dynamic loading, expanding cards, and Lenis smooth scroll
   ============================================================================ */

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/* ============================================================================
   LENIS SMOOTH SCROLL SETUP
   Uses GSAP ticker exclusively — no separate requestAnimationFrame loop
   ============================================================================ */

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

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
} else {
    document.documentElement.style.scrollBehavior = 'auto';
}

/* ============================================================================
   DYNAMIC PROJECT LOADING
   ============================================================================ */

function renderProjects() {
    const grid = document.querySelector('.projects-grid');
    if (!grid) return;

    if (typeof DataManager === 'undefined') {
        console.warn('DataManager not found. Projects skipped.');
        return;
    }

    const projects = DataManager.getProjects();
    
    grid.innerHTML = projects.map(project => `
        <div class="project-card-expandable">
            <div class="card-front">
                <h3 class="card-title">${project.name}</h3>
                <p class="card-description">${project.description}</p>
                <div class="card-tags">
                    ${project.stack.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="card-back">
                <h3 class="card-title">${project.name}</h3>
                <p class="card-full-description">${project.fullDescription}</p>
                <div class="card-tags">
                    ${project.stack.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <a href="${project.github}" class="github-link" target="_blank">View on GitHub →</a>
            </div>
        </div>
    `).join('');

    // Re-initialize animations for new elements
    initializeCardAnimations();
}

function initializeCardAnimations() {
    const cards = document.querySelectorAll('.project-card-expandable');
    
    cards.forEach((card, index) => {
        // Initial stagger entrance
        gsap.from(card, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            delay: 0.5 + index * 0.08,
            ease: 'power2.out',
        });

        // Click-to-flip functionality
        card.addEventListener('click', (e) => {
            // If user clicks a link, don't flip
            if (e.target.tagName === 'A') return;

            const isFlipped = card.classList.contains('flipped');
            
            if (isFlipped) {
                card.classList.remove('flipped');
            } else {
                // Close other cards
                cards.forEach((otherCard) => {
                    if (otherCard !== card) {
                        otherCard.classList.remove('flipped');
                    }
                });
                card.classList.add('flipped');
            }
        });

        // Hover state for desktop
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                boxShadow: '0 0 30px rgba(184, 197, 255, 0.1)',
                duration: 0.3,
                overwrite: 'auto',
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                boxShadow: '0 0 0px rgba(184, 197, 255, 0)',
                duration: 0.3,
                overwrite: 'auto',
            });
        });
    });
}

/* ============================================================================
   VIDEO CONTROL
   ============================================================================ */

const bgVideo = document.querySelector('.bg-video');

if (bgVideo) {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            bgVideo.pause();
        } else {
            bgVideo.play().catch(() => {});
        }
    });

    bgVideo.addEventListener('loadedmetadata', () => {
        bgVideo.play().catch(() => {});
    });

    document.addEventListener('click', () => {
        if (bgVideo.paused) {
            bgVideo.play().catch(() => {});
        }
    }, { once: true });
}

/* ============================================================================
   INITIALIZATION
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    
    // Header animation
    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    
    if (pageTitle && pageSubtitle) {
        gsap.from([pageTitle, pageSubtitle], {
            opacity: 0,
            y: 20,
            duration: 0.8,
            delay: 0.3,
            stagger: 0.15,
            ease: 'power2.out',
        });
    }
    
    console.log('Projects Page — Initialized');
});
