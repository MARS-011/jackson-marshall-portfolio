/* ============================================================================
   PROJECTS PAGE — JAVASCRIPT
   Expandable project cards (click opens a full-detail overlay) and
   Lenis smooth scroll
   ============================================================================ */

gsap.registerPlugin(ScrollTrigger);

// Lenis smooth scroll — shared implementation lives in effects.js (PortfolioEffects.initLenis)
let lenis = PortfolioEffects.initLenis();

/* ============================================================================
   CARD RENDERING & ANIMATIONS
   ============================================================================ */

function renderProjectsGrid(projects) {
    const projectsGrid = document.getElementById('fallbackGrid');
    if (!projectsGrid) return;

    projectsGrid.innerHTML = projects.map(project => `
        <div class="project-card-expandable" data-id="${project.id}">
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
    `).join('');

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

function initializeCardAnimations() {
    const projects = DataManager.getProjects();
    renderProjectsGrid(projects);
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
            <!-- Project Video Aesthetic -->
            <div class="detail-video-wrapper" style="width: 100%; height: 300px; overflow: hidden; margin-bottom: 3rem; border: 1px solid rgba(184, 197, 255, 0.1); border-radius: 4px; position: relative;">
                <video autoplay muted playsinline loop style="width: 100%; height: 100%; object-fit: cover; opacity: 0.5;">
                    <source src="assets/videos/orbis_blueprint.webm" type="video/webm">
                    <source src="assets/videos/orbis_blueprint.mp4" type="video/mp4">
                </video>
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, transparent, rgba(15, 17, 26, 0.8));"></div>
                ${(project.previewImage && String(project.previewImage).trim() !== '') ? `
                    <img src="${String(project.previewImage)}" alt="${project.name} Preview" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); height: 80%; width: auto; max-width: 90%; object-fit: contain; filter: drop-shadow(0 10px 30px rgba(0,0,0,0.5));">
                ` : ''}
            </div>
            <div class="detail-description">${DataManager.formatText(project.fullDescription)}</div>
        </div>

        ${project.photos && project.photos.length > 0 ? `
            <div class="detail-photos-large">
                ${project.photos.map(photo => {
                    const isObject = typeof photo === 'object' && photo !== null;
                    const src = isObject ? photo.url : photo;
                    const size = isObject ? photo.size || '100%' : '100%';
	                    return `
	                        <div class="detail-photo-item" style="width: ${size}; margin: 0 auto; margin-bottom: 2rem;">
	                            <img src="${src}" alt="${project.name}" style="width: 100%; display: block; margin-bottom: 0.75rem;" loading="lazy">
	                            ${isObject && photo.caption ? `<p class="detail-photo-caption" style="font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; color: #5a6490; text-align: center;">${photo.caption}</p>` : ''}
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
    
    // Hide loading screen
    const loadingScreen = document.getElementById('horseLoadingScreen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 300);
    }
    
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

