/* ============================================================================
   SHARED VISUAL EFFECTS — Film grain overlay
   Included on all public-facing pages (not admin).
   ============================================================================ */

(function () {
    // Film grain overlay
    if (!document.querySelector('.grain-overlay')) {
        const grain = document.createElement('div');
        grain.className = 'grain-overlay';
        document.body.appendChild(grain);
    }
})();

/* ----------------------------------------------------------------------
   Smooth page transitions between internal pages (Projects, Writing,
   Gallery, Home). Fades to the navy overlay, navigates, then fades
   back in on the next page.
   ---------------------------------------------------------------------- */
(function () {
    const overlay = document.querySelector('.page-transition-overlay');
    if (!overlay) return;

    const TRANSITION_MS = 500;

    function revealPage() {
        // Double rAF so the browser registers the initial opaque state
        // before we transition it, avoiding a flash of no-transition.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('is-hidden');
            });
        });
    }

    revealPage();
    // Handles back/forward navigation restored from bfcache
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) revealPage();
    });

    function isInternalPageLink(link) {
        if (!link || !link.href) return false;
        if (link.target && link.target !== '' && link.target !== '_self') return false;
        if (link.hasAttribute('download')) return false;
        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin) return false;
        if (url.pathname === window.location.pathname && url.hash) return false; // in-page anchor
        return /\.html?$/.test(url.pathname) || url.pathname === '/' || url.pathname.endsWith('/');
    }

    document.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let modified clicks behave normally

        const link = e.target.closest('a');
        if (!isInternalPageLink(link)) return;

        e.preventDefault();
        overlay.classList.remove('is-hidden');
        setTimeout(() => {
            window.location.href = link.href;
        }, TRANSITION_MS);
    });
})();
