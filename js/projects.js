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
    const projectsGrid = document.querySelector('.projects-grid');
    const projects = DataManager.getProjects();

    if (projectsGrid) {
        projectsGrid.innerHTML = projects.map(project => `
            <div class="project-card-expandable" data-id="${project.id}">
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
                    
                    ${project.links && project.links.length > 0 ? `
                        <div class="project-links">
                            <h4 class="section-label">Links</h4>
                            <div class="links-list">
                                ${project.links.map(link => `<a href="${link.url}" class="project-link" target="_blank">${link.label} →</a>`).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${project.photos && project.photos.length > 0 ? `
                        <div class="project-photos">
                            <h4 class="section-label">Photos (${project.photos.length})</h4>
                            <div class="photos-slider-container">
                                <div class="photos-slider">
                                    ${project.photos.map(photo => `<img src="${photo}" alt="${project.name}" class="project-photo-slide">`).join('')}
                                </div>
                                ${project.photos.length > 1 ? `
                                    <div class="slider-hint">Scroll for more →</div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <a href="${project.github}" class="github-link" target="_blank">View on GitHub →</a>
                </div>
            </div>
        `).join('');
    }

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
