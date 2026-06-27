/* ============================================================================
   WRITING PAGE — JAVASCRIPT
   Dynamic loading, reading view modal, Lenis smooth scroll
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
   DYNAMIC ARTICLE LOADING
   ============================================================================ */

function renderArticles() {
    const list = document.getElementById('articlesList');
    if (!list) return;

    if (typeof DataManager === 'undefined') {
        console.warn('DataManager not found.');
        return;
    }

    const articles = DataManager.getWriting();

    list.innerHTML = articles.map(article => `
        <article class="article-item" data-article-id="${article.id}">
            <div class="article-meta">
                <h3 class="article-title">${article.title}</h3>
                <p class="article-date">${article.date}</p>
            </div>
            <p class="article-summary">${article.summary}</p>
        </article>
    `).join('');

    initializeArticleHandlers();
}

function initializeArticleHandlers() {
    const articleItems = document.querySelectorAll('.article-item');

    articleItems.forEach((item, index) => {
        gsap.from(item, {
            opacity: 0,
            y: 15,
            duration: 0.6,
            delay: 0.4 + index * 0.1,
            ease: 'power2.out',
        });

        item.addEventListener('click', () => {
            openReadingView(item.getAttribute('data-article-id'));
        });

        item.addEventListener('mouseenter', () => {
            gsap.to(item, { borderLeftColor: 'rgba(184, 197, 255, 0.5)', duration: 0.3, overwrite: 'auto' });
        });
        item.addEventListener('mouseleave', () => {
            gsap.to(item, { borderLeftColor: 'rgba(184, 197, 255, 0.15)', duration: 0.3, overwrite: 'auto' });
        });
    });
}

/* ============================================================================
   READING VIEW MODAL
   ============================================================================ */

const readingView   = document.getElementById('readingView');
const readingClose  = document.getElementById('readingClose');
const readingTitle  = document.getElementById('readingTitle');
const readingDate   = document.getElementById('readingDate');
const readingBody   = document.getElementById('readingBody');

function openReadingView(articleId) {
    const article = DataManager.getWriting().find(a => String(a.id) === String(articleId));
    if (!article) return;

    readingTitle.textContent = article.title;
    readingDate.textContent  = article.date;
    readingBody.innerHTML    = article.content;

    readingView.style.pointerEvents = 'auto';
    gsap.to(readingView, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    gsap.from(readingView.querySelector('.reading-content'), {
        y: 20, opacity: 0, duration: 0.4, delay: 0.1, ease: 'power2.out'
    });

    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
}

function closeReadingView() {
    gsap.to(readingView, {
        opacity: 0, duration: 0.3, ease: 'power2.in',
        onComplete: () => { readingView.style.pointerEvents = 'none'; }
    });
    document.body.style.overflow = 'auto';
    if (lenis) lenis.start();
}

readingClose?.addEventListener('click', closeReadingView);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeReadingView();
});
readingView?.addEventListener('click', (e) => {
    if (e.target === readingView) closeReadingView();
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
    renderArticles();

    const pageTitle    = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    if (pageTitle && pageSubtitle) {
        gsap.from([pageTitle, pageSubtitle], {
            opacity: 0, y: 20, duration: 0.8, delay: 0.3, stagger: 0.15, ease: 'power2.out'
        });
    }

    console.log('Writing Page — Initialized');
});
