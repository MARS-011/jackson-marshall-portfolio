/* ============================================================================
   COSMIC PORTFOLIO — JAVASCRIPT
   GSAP ScrollTrigger, Lenis smooth scroll, and dynamic content
   ============================================================================ */

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/* ============================================================================
   LENIS SMOOTH SCROLL SETUP
   Shared implementation lives in effects.js (PortfolioEffects.initLenis)
   ============================================================================ */

let lenis = PortfolioEffects.initLenis();

/* ============================================================================
   DYNAMIC CONTENT LOADING
   ============================================================================ */

function loadDynamicContent() {
    if (typeof DataManager === 'undefined') {
        console.warn('DataManager not found. Dynamic content skipped.');
        return;
    }

    const links = DataManager.getLinks();
    const bio = DataManager.getBio();
    const projects = DataManager.getProjects();
    const gallery = DataManager.getGallery();
    
    // Update bio section
    const bioContent = document.getElementById('bioContent');
    if (bioContent && bio) {
        bioContent.innerHTML = DataManager.formatText(bio.content);
    }

    // Update Projects Grid (Show first 3)
    const projectsGrid = document.getElementById('projectsGrid');
    if (projectsGrid) {
        projectsGrid.innerHTML = projects.slice(0, 3).map(project => `
            <article class="project-card" style="cursor: pointer;" onclick="window.location.href='projects.html?id=${project.id}'">
                ${project.previewImage ? `
                    <div class="project-card-preview">
                        <img src="${project.previewImage}" alt="${project.name}" loading="lazy" style="object-fit: ${project.previewImageFit || 'cover'}; object-position: ${project.previewImagePosition || 'center center'};">
                    </div>
                ` : ''}
                <div class="project-card-content">
                    <h3 class="project-name">${project.name}</h3>
                    <div class="project-tags">
                        ${project.stack.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <p class="project-description">${project.description}</p>
                </div>
            </article>
        `).join('');
    }

    // Update Art Grid (Show first 4 items with images)
    const artGrid = document.getElementById('artGrid');
    if (artGrid) {
        const artItems = gallery.filter(item => item.imagePath).slice(0, 4);
        if (artItems.length > 0) {
            artGrid.innerHTML = artItems.map(item => `
                <div class="art-item">
                    <img src="${item.imagePath}" alt="${item.caption || 'Render'}" loading="lazy">
                    ${item.caption ? `<p class="art-caption">${item.caption}</p>` : ''}
                </div>
            `).join('');
        } else {
            artGrid.innerHTML = `<p style="color: #5a6490; font-family: 'IBM Plex Mono', monospace; font-size: 0.9rem;">[RENDER_PREVIEW_MODE: UPLOAD IN ADMIN]</p>`;
        }
    }
    
    // Update contact section
    const contactEmail = document.getElementById('contactEmail');
    const contactPhone = document.getElementById('contactPhone');
    
    if (contactEmail && links.email) {
        contactEmail.textContent = links.email;
        contactEmail.href = `mailto:${links.email}`;
    }
    if (contactPhone && links.phone) {
        contactPhone.textContent = links.phone;
        contactPhone.href = `tel:${links.phone.replace(/[^0-9+]/g, '')}`;
    }

    // Refresh ScrollTrigger after content loads
    ScrollTrigger.refresh();

    // Staggered scroll-in reveal for the project and art grids
    if (typeof PortfolioEffects !== 'undefined') {
        PortfolioEffects.initGridReveal('#projectsGrid .project-card');
        PortfolioEffects.initGridReveal('#artGrid .art-item');
        PortfolioEffects.initCardTilt3D('#projectsGrid .project-card');
    }
}



/* ============================================================================
   ANIMATIONS
   ============================================================================ */

function initAnimations() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');

    if (heroSubtitle) {
        gsap.from(heroSubtitle, { opacity: 0, y: 20, duration: 0.8, delay: 0.9, ease: 'power2.out' });
    }
    if (heroTitle && typeof PortfolioEffects !== 'undefined') {
        PortfolioEffects.initTextReveal(heroTitle, { mode: 'chars', trigger: 'load', delay: 0.3, stagger: 0.035 });
    }

    if (typeof PortfolioEffects !== 'undefined') {
        document.querySelectorAll('.section-title').forEach((title) => {
            PortfolioEffects.initTextReveal(title, { mode: 'words', trigger: 'scroll', stagger: 0.06 });
        });
    }

    const sections = document.querySelectorAll('section:not(.hero)');
    sections.forEach((section) => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power2.out',
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

document.addEventListener('DOMContentLoaded', async () => {
    await DataManager.initialize();
    loadDynamicContent();
    initAnimations();
    if (typeof PortfolioEffects !== 'undefined') {
        PortfolioEffects.initSparkles(document.querySelector('.hero'));
    }
    console.log('Portfolio — Initialized');
});
