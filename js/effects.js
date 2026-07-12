/* ============================================================================
   SHARED VISUAL EFFECTS — Film grain overlay + custom sparkle cursor
   Included on all public-facing pages (not admin).
   ============================================================================ */

(function () {
    // ------------------------------------------------------------------
    // Film grain overlay
    // ------------------------------------------------------------------
    if (!document.querySelector('.grain-overlay')) {
        const grain = document.createElement('div');
        grain.className = 'grain-overlay';
        document.body.appendChild(grain);
    }

    // ------------------------------------------------------------------
    // Custom sparkle cursor
    // Only runs on devices with a real mouse (fine pointer + hover).
    // ------------------------------------------------------------------
    const supportsCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!supportsCustomCursor) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.innerHTML = '<img src="assets/images/cursor-sparkle.png" alt="" draggable="false">';
    document.body.appendChild(cursor);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = null;
    let rotation = 0;

    if (typeof gsap !== 'undefined') {
        // Smooth trailing follow using GSAP quickTo (cheap, no layout thrash)
        const moveX = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
        const moveY = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });

        document.addEventListener('mousemove', (e) => {
            moveX(e.clientX);
            moveY(e.clientY);
            cursor.classList.add('is-visible');
        });
    } else {
        // Fallback: direct positioning, no easing library available
        document.addEventListener('mousemove', (e) => {
            cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
            cursor.classList.add('is-visible');
        });
    }

    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
    document.addEventListener('mouseenter', () => cursor.classList.add('is-visible'));

    // Slow idle rotation for a bit of life, paused if reduced motion is preferred
    if (!prefersReducedMotion) {
        function spin() {
            rotation = (rotation + 0.15) % 360;
            cursor.style.rotate = `${rotation}deg`;
            rafId = requestAnimationFrame(spin);
        }
        rafId = requestAnimationFrame(spin);
    }

    // Scale up over interactive elements
    const interactiveSelector = 'a, button, .nav-link, .project-card, .project-card-expandable, input, textarea, select, .art-item, [onclick]';

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactiveSelector)) {
            cursor.classList.add('is-hovering');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(interactiveSelector)) {
            cursor.classList.remove('is-hovering');
        }
    });
})();
