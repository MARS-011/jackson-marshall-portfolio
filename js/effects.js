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
