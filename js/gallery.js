/* ============================================================================
   GALLERY PAGE — JAVASCRIPT
   Dynamic loading, grid layout, lightbox, Lenis smooth scroll
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
   DYNAMIC GALLERY LOADING
   ============================================================================ */

function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    if (typeof DataManager === 'undefined') {
        console.warn('DataManager not found.');
        return;
    }

    const gallery = DataManager.getGallery();

    grid.innerHTML = gallery.map((item, index) => `
        <div class="gallery-item" data-render-id="${item.id}">
            ${item.imagePath
                ? `<img src="${item.imagePath}" alt="Render ${item.id}" loading="lazy">`
                : `<div class="gallery-placeholder">[RENDER_${String(index + 1).padStart(2, '0')}]</div>`
            }
            ${item.caption ? `<p class="gallery-caption">${item.caption}</p>` : ''}
        </div>
    `).join('');

    applyMasonrySpans();
    initializeGalleryHandlers();
}

/* Asymmetric spans on a 3-column CSS grid */
function applyMasonrySpans() {
    const spans = [
        { col: 'span 1', row: 'span 2' }, // tall
        { col: 'span 1', row: 'span 1' },
        { col: 'span 1', row: 'span 1' },
        { col: 'span 2', row: 'span 1' }, // wide
        { col: 'span 1', row: 'span 1' },
        { col: 'span 1', row: 'span 2' }, // tall
        { col: 'span 2', row: 'span 1' }, // wide
        { col: 'span 1', row: 'span 1' },
    ];

    const items = document.querySelectorAll('.gallery-item');
    items.forEach((item, i) => {
        const s = spans[i % spans.length];
        item.style.gridColumn = s.col;
        item.style.gridRow    = s.row;
    });
}

function initializeGalleryHandlers() {
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach((item, index) => {
        gsap.from(item, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            delay: 0.4 + index * 0.07,
            ease: 'power2.out',
        });

        item.addEventListener('click', () => {
            const img         = item.querySelector('img');
            const caption     = item.querySelector('.gallery-caption');
            const captionText = caption ? caption.textContent : '';

            if (img) {
                openLightbox(img.src, captionText);
            }
        });

        item.addEventListener('mouseenter', () => {
            gsap.to(item, { borderColor: 'rgba(184, 197, 255, 0.35)', duration: 0.3, overwrite: 'auto' });
        });
        item.addEventListener('mouseleave', () => {
            gsap.to(item, { borderColor: 'rgba(184, 197, 255, 0.1)', duration: 0.3, overwrite: 'auto' });
        });
    });
}

/* ============================================================================
   LIGHTBOX
   ============================================================================ */

const lightbox        = document.getElementById('lightbox');
const lightboxImage   = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose   = document.getElementById('lightboxClose');

function openLightbox(src, caption) {
    lightboxImage.src       = src;
    lightboxCaption.textContent = caption;

    lightbox.style.pointerEvents = 'auto';
    gsap.to(lightbox, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    gsap.from(lightbox.querySelector('.lightbox-content'), {
        scale: 0.92, opacity: 0, duration: 0.4, delay: 0.05, ease: 'back.out(1.7)'
    });

    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
}

function closeLightbox() {
    gsap.to(lightbox, {
        opacity: 0, duration: 0.3, ease: 'power2.in',
        onComplete: () => { lightbox.style.pointerEvents = 'none'; }
    });
    document.body.style.overflow = 'auto';
    if (lenis) lenis.start();
}

lightboxClose?.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
});
lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-overlay')) closeLightbox();
});

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
    renderGallery();

    const pageTitle    = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    if (pageTitle && pageSubtitle) {
        gsap.from([pageTitle, pageSubtitle], {
            opacity: 0, y: 20, duration: 0.8, delay: 0.3, stagger: 0.15, ease: 'power2.out'
        });
    }

    console.log('Gallery Page — Initialized');
});
