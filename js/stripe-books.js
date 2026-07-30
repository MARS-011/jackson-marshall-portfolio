/* ============================================================================
   STRIPE PRESS STYLE BOOKS — JavaScript
   Inspired by press.stripe.com
   ============================================================================ */

const StripeBooks = (() => {
    let container, projects, onSelect;

    function init(containerEl, projectsData, onSelectCallback) {
        container = containerEl;
        projects = projectsData;
        onSelect = onSelectCallback;
        render();
    }

    function render() {
        if (!container) return;

        container.classList.add('stripe-press-container');
        container.innerHTML = `
            <div class="books-wrapper">
                ${projects.map((project, index) => `
                    <div class="book-item" style="--delay: ${index * 0.1}s" data-id="${project.id}">
                        <div class="book-visual">
                            <div class="book-3d">
                                <div class="book-front">
                                    <img src="${project.previewImage || 'assets/images/noise.png'}" alt="${project.name}">
                                    <div class="book-overlay"></div>
                                </div>
                                <div class="book-spine">
                                    <div class="spine-text">${project.name}</div>
                                </div>
                                <div class="book-top"></div>
                            </div>
                        </div>
                        <div class="book-info">
                            <h3 class="book-title">${project.name}</h3>
                            <p class="book-author">${project.stack.join(' · ')}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners
        const items = container.querySelectorAll('.book-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.getAttribute('data-id'));
                const project = projects.find(p => p.id === id);
                if (project && onSelect) {
                    onSelect(project);
                }
            });
        });
    }

    return { init };
})();
