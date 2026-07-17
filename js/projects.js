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
                    ${project.previewImage ? `
                        <div class="project-card-preview">
                            <img src="${project.previewImage}" alt="${project.name}" loading="lazy" style="object-fit: ${project.previewImageFit || 'cover'}; object-position: ${project.previewImagePosition || 'center center'};">
                        </div>
                    ` : ''}
                    <div class="project-card-content">
                        <h3 class="card-title">${project.name}</h3>
                        <p class="card-description">${project.description}</p>
                        <div class="card-tags">
                            ${project.stack.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
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
                                    ${project.photos.map(photo => `<img src="${photo}" alt="${project.name}" class="project-photo-slide" loading="lazy">`).join('')}
                                </div>
                                ${project.photos.length > 1 ? `
                                    <div class="slider-hint">Scroll for more →</div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}

                    ${project.github ? `<a href="${project.github}" class="github-link" target="_blank">View on GitHub →</a>` : ''}
                </div>
            </div>
        `).join('');
    }

    const cards = document.querySelectorAll('.project-card-expandable');

    if (typeof PortfolioEffects !== 'undefined') {
        PortfolioEffects.initGridReveal(cards);
        PortfolioEffects.initCardTilt3D('.project-card-expandable');
    }

    cards.forEach((card) => {
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
            ${(project.previewImage && String(project.previewImage).trim() !== '') ? `
                <div class="detail-preview-image" style="margin-bottom: 3rem;">
                    <img src="${String(project.previewImage)}" alt="${project.name} Preview" style="width: 100%; max-width: 1000px; border: 1px solid rgba(184, 197, 255, 0.2); display: block; margin: 0 auto;">
                </div>
            ` : ''}
            <div class="detail-description">${DataManager.formatText(project.fullDescription)}</div>
        </div>

        ${project.photos && project.photos.length > 0 ? `
            <div class="detail-photos-large">
                ${project.photos.map(photo => {
                    const isObject = typeof photo === 'object' && photo !== null;
                    const src = isObject ? photo.url : photo;
                    const size = isObject ? photo.size || '100%' : '100%';
                    return `
                        <div class="detail-photo-item" style="width: ${size}; margin: 0 auto;">
                            <img src="${src}" alt="${project.name}" style="width: 100%; display: block;" loading="lazy">
                        </div>
                    `;
                }).join('')}
            </div>
        ` : ''}

        <div class="detail-links-section">
            <h4 class="section-label">Project Assets & Links</h4>
            <div class="detail-links-grid">
                ${project.github ? `
                <a href="${project.github}" class="detail-link-card" target="_blank">
                    <span class="link-label">Source Code</span>
                    <span class="link-url">GitHub Repository →</span>
                </a>` : ''}
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
    overlay.scrollTop = 0; // Reset scroll position
    gsap.to(overlay, { opacity: 1, duration: 0.5, ease: 'power2.out' });

    if (typeof PortfolioEffects !== 'undefined') {
        PortfolioEffects.initMagneticLinks(detailContent);
    }
    
    // Disable body scroll and stop Lenis
    document.body.classList.add('overlay-open');
    if (lenis) lenis.stop();

    // Prevent mouse wheel events from bubbling up to Lenis or other listeners
    overlay.addEventListener('wheel', (e) => {
        // Only stop propagation if we are actually on the overlay
        e.stopPropagation();
    }, { passive: false });

    // Force pointer events on the overlay to ensure it receives wheel events
    overlay.style.pointerEvents = 'auto';
}



function closeProjectDetail() {
    gsap.to(overlay, { 
        opacity: 0, 
        duration: 0.4, 
        ease: 'power2.in',
        onComplete: () => {
            overlay.style.display = 'none';
            detailContent.innerHTML = '';
            document.body.classList.remove('overlay-open');
            if (lenis) lenis.start();
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
        const projects = DataManager.getProjects();
        const project = projects.find(p => p.id === parseInt(projectId));
        if (project) {
            setTimeout(() => openProjectDetail(project), 500);
        }
    }

    const pageTitle    = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    if (pageSubtitle) {
        gsap.from(pageSubtitle, { opacity: 0, y: 20, duration: 0.8, delay: 0.55, ease: 'power2.out' });
    }
    if (pageTitle && typeof PortfolioEffects !== 'undefined') {
        PortfolioEffects.initTextReveal(pageTitle, { mode: 'chars', trigger: 'load', delay: 0.25, stagger: 0.03 });
    }

    console.log('Projects Page — Initialized');
});
