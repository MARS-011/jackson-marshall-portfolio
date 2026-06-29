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
            
            const projectId = parseInt(card.getAttribute('data-id'));
            const project = projects.find(p => p.id === projectId);
            if (project) {
                openProjectDetail(project);
            }
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

const overlay = document.getElementById('projectDetailOverlay');
const detailContent = document.getElementById('detailContent');
const closeBtn = document.getElementById('closeDetail');

function openProjectDetail(project) {
    // Populate content
    detailContent.innerHTML = `
        <header class="detail-header">
            <h1 class="page-title">${project.name}</h1>
            <div class="detail-tags">
                ${project.stack.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </header>

        <div class="detail-body">
            <p class="detail-description">${project.fullDescription}</p>
        </div>

        ${project.photos && project.photos.length > 0 ? `
            <div class="detail-photos-large">
                ${project.photos.map(photo => `
                    <div class="detail-photo-item">
                        <img src="${photo}" alt="${project.name}">
                    </div>
                `).join('')}
            </div>
        ` : ''}

        <div class="detail-links-section">
            <h4 class="section-label">Project Assets & Links</h4>
            <div class="detail-links-grid">
                <a href="${project.github}" class="detail-link-card" target="_blank">
                    <span class="link-label">Source Code</span>
                    <span class="link-url">GitHub Repository →</span>
                </a>
                ${(project.links || []).map(link => `
                    <a href="${link.url}" class="detail-link-card" target="_blank">
                        <span class="link-label">External Resource</span>
                        <span class="link-url">${link.label} →</span>
                    </a>
                `).join('')}
            </div>
        </div>
    `;

    // Show overlay
    overlay.style.display = 'block';
    gsap.to(overlay, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
}

function closeProjectDetail() {
    gsap.to(overlay, { 
        opacity: 0, 
        duration: 0.4, 
        ease: 'power2.in',
        onComplete: () => {
            overlay.style.display = 'none';
            detailContent.innerHTML = '';
            document.body.style.overflow = '';
        }
    });
}

closeBtn.addEventListener('click', closeProjectDetail);

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'block') {
        closeProjectDetail();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    await DataManager.initialize();
    initializeCardAnimations();
    
    // Check for project ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (projectId) {
        const project = projects.find(p => p.id === parseInt(projectId));
        if (project) {
            setTimeout(() => openProjectDetail(project), 500);
        }
    }

    const pageTitle    = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    if (pageTitle && pageSubtitle) {
        gsap.from([pageTitle, pageSubtitle], {
            opacity: 0, y: 20, duration: 0.8, delay: 0.3, stagger: 0.15, ease: 'power2.out'
        });
    }

    console.log('Projects Page — Initialized');
});
