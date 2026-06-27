/* ============================================================================
   ADMIN IMAGES & LAYOUT MANAGEMENT
   Handles image uploads and dynamic layout customization
   ============================================================================ */

// Initialize image management when admin dashboard loads
document.addEventListener('DOMContentLoaded', () => {
    initializeImageManagement();
});

function initializeImageManagement() {
    // ASCII Border Upload
    const asciiBorderBtn = document.getElementById('updateAsciiBorderButton');
    if (asciiBorderBtn) {
        asciiBorderBtn.addEventListener('click', handleAsciiBorderUpload);
    }

    // Banner Uploads
    const bannerLeftBtn = document.getElementById('updateBannerLeftButton');
    const bannerRightBtn = document.getElementById('updateBannerRightButton');
    if (bannerLeftBtn) bannerLeftBtn.addEventListener('click', () => handleBannerUpload('left'));
    if (bannerRightBtn) bannerRightBtn.addEventListener('click', () => handleBannerUpload('right'));

    // Layout Settings
    const layoutBtn = document.getElementById('saveLayoutButton');
    if (layoutBtn) {
        layoutBtn.addEventListener('click', saveLayoutSettings);
        loadLayoutSettings();
    }
}

function handleAsciiBorderUpload() {
    const fileInput = document.getElementById('asciiBorderUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        // Store the image data as a data URL in localStorage
        const imageData = e.target.result;
        localStorage.setItem('asciiBorderImage', imageData);
        
        // Update the CSS to use the new image
        updateAsciiBorderCSS(imageData);
        
        alert('ASCII border updated! Refresh the page to see changes.');
        fileInput.value = '';
    };
    reader.readAsDataURL(file);
}

function handleBannerUpload(side) {
    const fileInput = document.getElementById(`banner${side === 'left' ? 'Left' : 'Right'}Upload`);
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;
        const key = `banner${side === 'left' ? 'Left' : 'Right'}Image`;
        localStorage.setItem(key, imageData);
        
        // Update the CSS to use the new image
        updateBannerCSS(side, imageData);
        
        alert(`${side === 'left' ? 'Left' : 'Right'} banner updated! Refresh the page to see changes.`);
        fileInput.value = '';
    };
    reader.readAsDataURL(file);
}

function updateAsciiBorderCSS(imageData) {
    // Create or update a style tag with the new background image
    let styleTag = document.getElementById('ascii-border-dynamic-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'ascii-border-dynamic-style';
        document.head.appendChild(styleTag);
    }
    
    styleTag.textContent = `
        .ascii-border-left,
        .ascii-border-right {
            background-image: url('${imageData}') !important;
        }
    `;
}

function updateBannerCSS(side, imageData) {
    let styleTag = document.getElementById(`banner-${side}-dynamic-style`);
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = `banner-${side}-dynamic-style`;
        document.head.appendChild(styleTag);
    }
    
    const className = side === 'left' ? '.image-banner-left' : '.image-banner-right';
    styleTag.textContent = `
        ${className} {
            background-image: url('${imageData}') !important;
        }
    `;
}

function saveLayoutSettings() {
    const borderWidth = document.getElementById('borderWidthInput').value;
    const borderOpacity = document.getElementById('borderOpacityInput').value;
    
    // Store settings in localStorage
    localStorage.setItem('layoutSettings', JSON.stringify({
        borderWidth: parseInt(borderWidth),
        borderOpacity: parseFloat(borderOpacity),
    }));
    
    // Apply settings immediately
    applyLayoutSettings(borderWidth, borderOpacity);
    
    alert('Layout settings saved!');
}

function loadLayoutSettings() {
    const settings = JSON.parse(localStorage.getItem('layoutSettings') || '{}');
    
    if (settings.borderWidth) {
        document.getElementById('borderWidthInput').value = settings.borderWidth;
    }
    if (settings.borderOpacity !== undefined) {
        document.getElementById('borderOpacityInput').value = settings.borderOpacity;
    }
    
    // Apply settings on page load
    if (settings.borderWidth || settings.borderOpacity !== undefined) {
        applyLayoutSettings(settings.borderWidth || 140, settings.borderOpacity !== undefined ? settings.borderOpacity : 1);
    }
}

function applyLayoutSettings(width, opacity) {
    let styleTag = document.getElementById('layout-dynamic-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'layout-dynamic-style';
        document.head.appendChild(styleTag);
    }
    
    styleTag.textContent = `
        .ascii-border-left,
        .ascii-border-right {
            width: ${width}px !important;
            opacity: ${opacity} !important;
        }
    `;
}

// Load custom images on page load
window.addEventListener('load', () => {
    // Load ASCII border if stored
    const storedAsciiBorder = localStorage.getItem('asciiBorderImage');
    if (storedAsciiBorder) {
        updateAsciiBorderCSS(storedAsciiBorder);
    }
    
    // Load banners if stored
    const storedBannerLeft = localStorage.getItem('bannerLeftImage');
    if (storedBannerLeft) {
        updateBannerCSS('left', storedBannerLeft);
    }
    
    const storedBannerRight = localStorage.getItem('bannerRightImage');
    if (storedBannerRight) {
        updateBannerCSS('right', storedBannerRight);
    }
    
    // Load layout settings
    loadLayoutSettings();
});
