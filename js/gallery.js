/* ============================================================================
   GALLERY PAGE — JAVASCRIPT
   Dynamic loading, masonry grid, lightbox, Lenis smooth scroll
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
   DYNAMIC GALLERY LOADING
   ============================================================================ */

function renderGallery() {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    if (typeof DataManager === 'undefined') {
        console.warn('DataManager not found. Gallery skipped.');
        return;
    }

    const gallery = DataManager.getGallery();
    
    grid.innerHTML = gallery.map((item, index) => `
        <div class="gallery-item" data-render-id="${item.id}">
            ${item.imagePath ? `<img src="${item.imagePath}" alt="Render ${item.id}">` : `<div class="gallery-placeholder">[RENDER_${String(index + 1).padStart(2, '0')}]</div>`}
            <p class="gallery-caption">${item.caption || ''}</p>
        </div>
    `).join('');

    // Re-initialize masonry and handlers
    layoutMasonry();
    initializeGalleryHandlers();
}

function initializeGalleryHandlers() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach((item, index) => {
        // Stagger fade-in
        gsap.from(item, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            delay: 0.5 + index * 0.08,
            ease: 'power2.out',
        });

        // Click handler to open lightbox
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const placeholder = item.querySelector('.gallery-placeholder');
            const caption = item.querySelector('.gallery-caption');
            
            if (img) {
                openLightbox(img.src, caption.textContent);
            } else if (placeholder) {
                openLightbox(placeholder.textContent, caption.textContent, true);
            }
        });

        // Hover effect
        item.addEventListener('mouseenter', () => {
            gsap.to(item, {
                borderColor: 'rgba(184, 197, 255, 0.35)',
                duration: 0.3,
                overwrite: 'auto',
            });
        });

        item.addEventListener('mouseleave', () => {
            gsap.to(item, {
                borderColor: 'rgba(184, 197, 255, 0.15)',
                duration: 0.3,
                overwrite: 'auto',
            });
        });
    });
}

/* ============================================================================
   LIGHTBOX FUNCTIONALITY
   ============================================================================ */

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxCaption = document.querySelector('.lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');

function openLightbox(src, caption, isPlaceholder = false) {
    if (isPlaceholder) {
        lightboxImage.style.display = 'none';
        const placeholderText = document.createElement('div');
        placeholderText.id = 'lightbox-placeholder-text';
        placeholderText.textContent = src;
        placeholderText.style.fontFamily = "'IBM Plex Mono', monospace";
        placeholderText.style.fontSize = "2rem";
        placeholderText.style.color = "#5a6490";
        placeholderText.style.padding = "4rem";
        placeholderText.style.background = "rgba(184, 197, 255, 0.05)";
        placeholderText.style.border = "1px solid rgba(184, 197, 255, 0.15)";
        
        const existingPlaceholder = document.getElementById('lightbox-placeholder-text');
        if (existingPlaceholder) existingPlaceholder.remove();
        
        lightboxImage.parentNode.insertBefore(placeholderText, lightboxImage);
    } else {
        lightboxImage.style.display = 'block';
        const existingPlaceholder = document.getElementById('lightbox-placeholder-text');
        if (existingPlaceholder) existingPlaceholder.remove();
        lightboxImage.src = src;
    }
    
    lightboxCaption.textContent = caption;

    gsap.to(lightbox, {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.3,
        ease: 'power2.out',
    });

    gsap.from(lightbox.querySelector('.lightbox-content'), {
        scale: 0.9,
        opacity: 0,
        duration: 0.4,
        delay: 0.1,
        ease: 'back.out(1.7)',
    });

    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
}

function closeLightbox() {
    gsap.to(lightbox, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.3,
        ease: 'power2.in',
    });

    document.body.style.overflow = 'auto';
    if (lenis) lenis.start();
}

lightboxClose?.addEventListener('click', closeLightbox);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.opacity !== '0') {
        closeLightbox();
    }
});

lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-overlay')) {
        closeLightbox();
    }
});

/* ============================================================================
   ASYMMETRIC MASONRY LAYOUT
   ============================================================================ */

function layoutMasonry() {
    const items = document.querySelectorAll('.gallery-item');
    if (items.length === 0) return;
    
    const patterns = [
        { col: 1, row: 1, width: 1, height: 1 },
        { col: 2, row: 1, width: 1, height: 2 },
        { col: 3, row: 1, width: 1, height: 1 },
        { col: 1, row: 2, width: 1, height: 1 },
        { col: 3, row: 2, width: 1, height: 1 },
        { col: 1, row: 3, width: 2, height: 1 },
        { col: 3, row: 3, width: 1, height: 1 },
        { col: 1, row: 4, width: 1, height: 1 },
    ];

    items.forEach((item, index) => {
        const p = patterns[index % patterns.length];
        item.style.gridColumn = `${p.col} / span ${p.width}`;
        item.style.gridRow = `${Math.floor(index / 3) * 2 + p.row} / span ${p.height}`;
    });
}

window.addEventListener('resize', layoutMasonry);

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
    renderGallery();
    
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
});
