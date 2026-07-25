/* ============================================================================
   ADMIN DASHBOARD — JavaScript
   Passcode protection, content editing, data persistence
   ============================================================================ */

// Configuration
// NOTE: this passcode is a soft UX gate only (visible in page source), not real
// security. The actual write-access boundary is the GitHub Personal Access
// Token required below to publish — nothing is written without that.
const ADMIN_PASSCODE = '2024';
const SESSION_KEY = 'admin_session';
const SESSION_DURATION = 3600000; // 1 hour in milliseconds

// DOM Elements
const passcodeScreen = document.getElementById('passcodeScreen');
const adminDashboard = document.getElementById('adminDashboard');
const passcodeForm = document.getElementById('passcodeForm');
const passcodeInput = document.getElementById('passcodeInput');
const passcodeError = document.getElementById('passcodeError');
const logoutButton = document.getElementById('logoutButton');

// Tab elements
const adminTabs = document.querySelectorAll('.admin-tab');
const adminTabContents = document.querySelectorAll('.admin-tab-content');

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

function isSessionValid() {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return false;
    
    const sessionTime = parseInt(session);
    const now = Date.now();
    
    if (now - sessionTime > SESSION_DURATION) {
        sessionStorage.removeItem(SESSION_KEY);
        return false;
    }
    
    return true;
}

function createSession() {
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());
}

function destroySession() {
    sessionStorage.removeItem(SESSION_KEY);
}

// ============================================================================
// PASSCODE VERIFICATION
// ============================================================================

passcodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = passcodeInput.value.trim();
    
    if (input === ADMIN_PASSCODE) {
        passcodeError.textContent = '';
        createSession();
        showDashboard();
    } else {
        passcodeError.textContent = 'Incorrect passcode. Try again.';
        passcodeInput.value = '';
        passcodeInput.focus();
    }
});

logoutButton.addEventListener('click', () => {
    destroySession();
    location.reload();
});

// ============================================================================
// DASHBOARD DISPLAY
// ============================================================================

function showDashboard() {
    gsap.to(passcodeScreen, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.3,
        ease: 'power2.in',
    });

    gsap.to(adminDashboard, {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.4,
        delay: 0.2,
        ease: 'power2.out',
    });

    adminDashboard.style.display = 'block';
    initializeDashboard();
}

function initializeDashboard() {
    setupMediaDropzones();
    renderProjectsEditor();
    renderWritingEditor();
    renderGalleryEditor();
    renderBioEditor();
    renderLinksEditor();
}

// ============================================================================
// TAB NAVIGATION
// ============================================================================

adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        adminTabs.forEach(t => t.classList.remove('active'));
        adminTabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// ============================================================================
// PROJECTS EDITOR
// ============================================================================

function renderProjectsEditor() {
    const editor = document.getElementById('projectsEditor');
    const projects = DataManager.getProjects();
    
    editor.innerHTML = projects.map(project => `
        <div class="editor-item">
            <div class="editor-item-header">
                <h3 class="editor-item-title">${project.name}</h3>
                <button class="delete-button" onclick="deleteProject(${project.id})">Delete</button>
            </div>
            
            <div class="form-group">
                <label>Project Name</label>
                <input type="text" value="${project.name}" onchange="updateProjectField(${project.id}, 'name', this.value)">
            </div>
            
            <div class="form-group">
                <label>Short Description</label>
                <textarea onchange="updateProjectField(${project.id}, 'description', this.value)">${project.description}</textarea>
            </div>
            
            <div class="form-group">
                <label>Full Description (Use Enter for new paragraphs)</label>
                <textarea style="height: 200px;" onchange="updateProjectField(${project.id}, 'fullDescription', this.value)">${project.fullDescription}</textarea>
            </div>

            <div class="form-group">
                <label>Preview Image (Appears under description)</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" data-field="previewImage" value="${project.previewImage || ''}" onchange="updateProjectField(${project.id}, 'previewImage', this.value)" placeholder="Paste a URL, or drop a file below">
                </div>
                <div class="media-dropzone" data-project-id="${project.id}" data-target="previewImage">
                    <p>Drop an image here or click to browse — resized &amp; staged locally, nothing uploads until Publish.</p>
                    <input type="file" accept="image/*" class="media-dropzone-input" style="display:none;">
                </div>
                ${project.previewImage ? `
                    <div style="display: flex; gap: 10px; margin-top: 10px; align-items: flex-start;">
                        <div class="preview-image-crop-box" style="width: 160px; height: 90px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); border-radius: 2px; flex-shrink: 0; position: relative;">
                            <img src="${StagingManager.isStaged(project.previewImage) ? StagingManager.getBlobUrl(project.previewImage) : project.previewImage}" style="width: 100%; height: 100%; object-fit: ${project.previewImageFit || 'cover'}; object-position: ${project.previewImagePosition || 'center center'}; display: block;">
                            ${StagingManager.isStaged(project.previewImage) ? '<span class="staged-badge">PENDING</span>' : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="margin: 0;">Fit
                                <select onchange="updateProjectField(${project.id}, 'previewImageFit', this.value)" style="margin-left: 6px;">
                                    <option value="cover" ${(!project.previewImageFit || project.previewImageFit === 'cover') ? 'selected' : ''}>Cover (fill, crop edges)</option>
                                    <option value="contain" ${project.previewImageFit === 'contain' ? 'selected' : ''}>Contain (show whole image)</option>
                                </select>
                            </label>
                            <label style="margin: 0;">Focal Point
                                <select onchange="updateProjectField(${project.id}, 'previewImagePosition', this.value)" style="margin-left: 6px;" ${project.previewImageFit === 'contain' ? 'disabled' : ''}>
                                    ${['center center','top center','bottom center','center left','center right','top left','top right','bottom left','bottom right'].map(pos => `<option value="${pos}" ${(project.previewImagePosition || 'center center') === pos ? 'selected' : ''}>${pos.replace(' ', ' / ')}</option>`).join('')}
                                </select>
                            </label>
                            <p class="form-hint" style="font-size: 0.7rem; color: #5a6490; margin: 0;">Box on the left previews the actual crop as it'll appear on the homepage/projects cards.</p>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="form-group">
                <label>GitHub Link</label>
                <input type="url" value="${project.github}" onchange="updateProjectField(${project.id}, 'github', this.value)">
            </div>
            
	            <div class="form-group">
	                <label>Tech Stack (comma-separated)</label>
	                <input type="text" value="${project.stack.join(', ')}" onchange="updateProjectField(${project.id}, 'stack', this.value.split(',').map(s => s.trim()))">
	            </div>

                <div class="form-group">
                    <label>External Links (format: Label|URL, comma-separated)</label>
                    <input type="text" value="${(project.links || []).map(l => `${l.label}|${l.url}`).join(', ')}" onchange="updateProjectField(${project.id}, 'links', this.value.split(',').filter(s => s.trim()).map(s => { const [label, url] = s.split('|'); return { label: label?.trim(), url: url?.trim() }; }))">
                </div>

                <div class="form-group">
                    <label>Project Photos & Sizes</label>
                    <div class="admin-photo-list" data-project-id="${project.id}">
                        ${(project.photos || []).map((photo, index) => {
                            const isObject = typeof photo === 'object';
                            const url = isObject ? photo.url : photo;
                            const size = isObject ? photo.size || '100%' : '100%';
                            const staged = StagingManager.isStaged(url);
                            const displaySrc = staged ? StagingManager.getBlobUrl(url) : url;
                            return `
                                <div class="admin-photo-item ${staged ? 'is-staged' : ''}" draggable="true" data-index="${index}" data-project-id="${project.id}" style="flex-direction: column; align-items: stretch; gap: 8px;">
                                    <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                                        <span class="drag-handle" title="Drag to reorder">⠿</span>
                                        <img src="${displaySrc}" class="admin-photo-thumb">
                                        <input type="text" value="${url}" style="flex: 1;" ${staged ? 'readonly' : ''} onchange="updateProjectPhoto(${project.id}, ${index}, 'url', this.value)" placeholder="Image URL">
                                        <select style="width: 80px;" onchange="updateProjectPhoto(${project.id}, ${index}, 'size', this.value)">
                                            <option value="100%" ${size === '100%' ? 'selected' : ''}>Full</option>
                                            <option value="75%" ${size === '75%' ? 'selected' : ''}>75%</option>
                                            <option value="50%" ${size === '50%' ? 'selected' : ''}>50%</option>
                                            <option value="25%" ${size === '25%' ? 'selected' : ''}>25%</option>
                                        </select>
                                        ${staged ? '<span class="staged-badge">PENDING</span>' : ''}
                                        <button class="delete-button" style="padding: 2px 8px;" onclick="removeProjectPhoto(${project.id}, ${index})">×</button>
                                    </div>
                                    <div style="padding-left: 34px; width: 100%;">
                                        <input type="text" value="${isObject ? photo.caption || '' : ''}" 
                                            placeholder="Add a caption for this photo..." 
                                            style="width: 100%; font-size: 0.8rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);" 
                                            onchange="updateProjectPhoto(${project.id}, ${index}, 'caption', this.value)">
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="media-dropzone" data-project-id="${project.id}" data-target="photos">
                        <p>Drop images here or click to browse — resized &amp; staged locally, nothing uploads until Publish. Drag items above to reorder.</p>
                        <input type="file" multiple accept="image/*" class="media-dropzone-input" style="display:none;">
                    </div>
                </div>
	        </div>
	    `).join('');
}

function showSyncIndicator() {
    const indicator = document.getElementById('syncIndicator');
    if (indicator) {
        indicator.style.display = 'block';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 2000);
    }
}

function updateProjectField(id, field, value) {
    console.log(`Updating project ${id} field ${field} with value:`, value.substring ? value.substring(0, 50) + '...' : value);
    DataManager.updateProject(id, { [field]: value });
    showSyncIndicator();
    // Re-render to ensure UI reflects the latest state from DataManager
    renderProjectsEditor();
}

// ============================================================================
// MEDIA STAGING UI (drop zones + drag-to-reorder)
// Files are compressed and staged locally (StagingManager) on drop/select.
// Nothing hits GitHub until Publish — see the publishButton handler below.
// ============================================================================

async function handleMediaFiles(zone, files) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const projectId = Number(zone.dataset.projectId);
    const target = zone.dataset.target; // 'previewImage' or 'photos'
    const project = DataManager.getProjects().find(p => p.id === projectId);
    if (!project) return;

    zone.classList.add('is-processing');
    const originalText = zone.querySelector('p').textContent;
    zone.querySelector('p').textContent = 'Processing...';

    try {
        if (target === 'previewImage') {
            const { path } = await StagingManager.stage(imageFiles[0], 'assets/images/uploads');
            DataManager.updateProject(projectId, { previewImage: path });
        } else {
            const newPhotos = [...(project.photos || [])];
            for (const file of imageFiles) {
                const { path } = await StagingManager.stage(file, 'assets/images/projects');
                newPhotos.push({ url: path, size: '100%' });
            }
            DataManager.updateProject(projectId, { photos: newPhotos });
        }
        showSyncIndicator();
    } catch (error) {
        console.error('Error staging file:', error);
        alert(`Couldn't process image: ${error.message}`);
    } finally {
        zone.classList.remove('is-processing');
        if (zone.querySelector('p')) zone.querySelector('p').textContent = originalText;
        renderProjectsEditor();
    }
}

let mediaDropzonesInitialized = false;
let photoDragSource = null;

function setupMediaDropzones() {
    if (mediaDropzonesInitialized) return;
    mediaDropzonesInitialized = true;

    document.addEventListener('click', (e) => {
        const zone = e.target.closest('.media-dropzone');
        if (zone && e.target.tagName !== 'INPUT') {
            zone.querySelector('.media-dropzone-input').click();
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target.matches('.media-dropzone-input')) {
            const zone = e.target.closest('.media-dropzone');
            handleMediaFiles(zone, Array.from(e.target.files));
            e.target.value = '';
        }
    });

    document.addEventListener('dragover', (e) => {
        const zone = e.target.closest('.media-dropzone');
        if (zone) {
            e.preventDefault();
            zone.classList.add('drag-over');
        } else if (e.target.closest('.admin-photo-item')) {
            e.preventDefault();
        }
    });

    document.addEventListener('dragleave', (e) => {
        const zone = e.target.closest('.media-dropzone');
        if (zone) zone.classList.remove('drag-over');
    });

    document.addEventListener('drop', (e) => {
        const zone = e.target.closest('.media-dropzone');
        if (zone) {
            e.preventDefault();
            zone.classList.remove('drag-over');
            handleMediaFiles(zone, Array.from(e.dataTransfer.files || []));
            return;
        }

        const item = e.target.closest('.admin-photo-item');
        if (item && photoDragSource) {
            e.preventDefault();
            const targetProjectId = Number(item.dataset.projectId);
            const targetIndex = Number(item.dataset.index);
            if (targetProjectId === photoDragSource.projectId && targetIndex !== photoDragSource.index) {
                reorderProjectPhotos(photoDragSource.projectId, photoDragSource.index, targetIndex);
            }
        }
        photoDragSource = null;
    });

    document.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.admin-photo-item');
        if (item) {
            photoDragSource = { projectId: Number(item.dataset.projectId), index: Number(item.dataset.index) };
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    document.addEventListener('dragend', () => {
        photoDragSource = null;
    });
}

function reorderProjectPhotos(projectId, fromIndex, toIndex) {
    const project = DataManager.getProjects().find(p => p.id === projectId);
    if (!project) return;

    const newPhotos = [...(project.photos || [])];
    const [moved] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, moved);

    DataManager.updateProject(projectId, { photos: newPhotos });
    renderProjectsEditor();
}

function updateProjectPhoto(projectId, photoIndex, field, value) {
    const projects = DataManager.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newPhotos = [...(project.photos || [])];
    if (typeof newPhotos[photoIndex] !== 'object') {
        newPhotos[photoIndex] = { url: newPhotos[photoIndex], size: '100%' };
    }
    newPhotos[photoIndex][field] = value;
    
    DataManager.updateProject(projectId, { photos: newPhotos });
}

function removeProjectPhoto(projectId, photoIndex) {
    const projects = DataManager.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newPhotos = [...(project.photos || [])];
    const [removed] = newPhotos.splice(photoIndex, 1);
    const url = typeof removed === 'object' ? removed?.url : removed;
    if (url && StagingManager.isStaged(url)) StagingManager.unstage(url);

    DataManager.updateProject(projectId, { photos: newPhotos });
    renderProjectsEditor();
}

function deleteProject(id) {
    if (confirm('Delete this project?')) {
        DataManager.deleteProject(id);
        renderProjectsEditor();
    }
}

document.getElementById('addProjectButton')?.addEventListener('click', () => {
		    const newProject = {
		        name: 'New Project',
		        description: 'Project description',
		        fullDescription: 'Full project description',
                previewImage: '',
                previewImageFit: 'cover',
                previewImagePosition: 'center center',
		        stack: ['Tech1', 'Tech2'],
		        github: '',
	            links: [],
	            photos: []
		    };
    DataManager.addProject(newProject);
    renderProjectsEditor();
});

document.getElementById('saveProjectsButton')?.addEventListener('click', () => {
    alert('Projects saved!');
});

// ============================================================================
// WRITING EDITOR
// ============================================================================

function renderWritingEditor() {
    const editor = document.getElementById('writingEditor');
    const articles = DataManager.getWriting();
    
    editor.innerHTML = articles.map(article => `
        <div class="editor-item">
            <div class="editor-item-header">
                <h3 class="editor-item-title">${article.title}</h3>
                <button class="delete-button" onclick="deleteArticle(${article.id})">Delete</button>
            </div>
            
            <div class="form-group">
                <label>Article Title</label>
                <input type="text" value="${article.title}" onchange="updateArticleField(${article.id}, 'title', this.value)">
            </div>
            
            <div class="form-group">
                <label>Date</label>
                <input type="text" value="${article.date}" onchange="updateArticleField(${article.id}, 'date', this.value)">
            </div>
            
            <div class="form-group">
                <label>Summary</label>
                <textarea onchange="updateArticleField(${article.id}, 'summary', this.value)">${article.summary}</textarea>
            </div>
            
            <div class="form-group">
                <label>Full Content (Use Enter for new paragraphs)</label>
                <textarea style="height: 300px;" onchange="updateArticleField(${article.id}, 'content', this.value)">${article.content}</textarea>
            </div>
        </div>
    `).join('');
}

function updateArticleField(id, field, value) {
    DataManager.updateArticle(id, { [field]: value });
}

function deleteArticle(id) {
    if (confirm('Delete this article?')) {
        DataManager.deleteArticle(id);
        renderWritingEditor();
    }
}

document.getElementById('addArticleButton')?.addEventListener('click', () => {
    const newArticle = {
        title: 'New Article',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        summary: 'Article summary',
        content: '<p>Article content goes here.</p>'
    };
    DataManager.addArticle(newArticle);
    renderWritingEditor();
});

document.getElementById('saveWritingButton')?.addEventListener('click', () => {
    alert('Writing saved!');
});

// ============================================================================
// GALLERY EDITOR
// ============================================================================

function renderGalleryEditor() {
    const editor = document.getElementById('galleryEditor');
    const gallery = DataManager.getGallery();
    
    editor.innerHTML = `
        <div class="gallery-upload-grid">
            ${gallery.map((item, index) => `
                <div class="gallery-upload-item ${item.imagePath && StagingManager.isStaged(item.imagePath) ? 'is-staged' : ''}" onclick="triggerGalleryUpload(${item.id})">
                    ${item.imagePath ? `<img src="${StagingManager.isStaged(item.imagePath) ? StagingManager.getBlobUrl(item.imagePath) : item.imagePath}" alt="Render ${item.id}">` : `<div class="gallery-upload-placeholder">[RENDER_${String(index + 1).padStart(2, '0')}]</div>`}
                    ${item.imagePath && StagingManager.isStaged(item.imagePath) ? '<span class="staged-badge">PENDING</span>' : ''}
                </div>
                <input type="file" id="gallery-input-${item.id}" class="gallery-upload-input" onchange="handleGalleryUpload(${item.id}, event)">
            `).join('')}
        </div>
    `;
}

function triggerGalleryUpload(id) {
    document.getElementById(`gallery-input-${id}`).click();
}

async function handleGalleryUpload(id, event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showSyncIndicator();
        const { path } = await StagingManager.stage(file, 'assets/images/gallery');
        const gallery = DataManager.getGallery();
        const item = gallery.find(g => g.id === id);
        if (item) {
            item.imagePath = path;
            DataManager.saveGallery(gallery);
            renderGalleryEditor();
        }
    } catch (error) {
        console.error('Error staging file:', error);
        alert(`Couldn't process image: ${error.message}`);
    } finally {
        event.target.value = '';
    }
}

document.getElementById('saveGalleryButton')?.addEventListener('click', () => {
    alert('Gallery saved!');
});

// ============================================================================
// BIO EDITOR
// ============================================================================

function renderBioEditor() {
    const bioEditor = document.getElementById('bioEditor');
    const aboutEditor = document.getElementById('aboutTextEditor');
    const certsEditor = document.getElementById('certsEditor');
    const bio = DataManager.getBio();
    
    if (bio) {
        if (bioEditor) {
            bioEditor.value = bio.content || '';
            bioEditor.addEventListener('input', updateBioData);
        }
        if (aboutEditor) {
            aboutEditor.value = bio.aboutText || '';
            aboutEditor.addEventListener('input', updateBioData);
        }
        if (certsEditor) {
            certsEditor.value = (bio.certifications || []).join('\n');
            certsEditor.addEventListener('input', updateBioData);
        }
    }
}

function updateBioData() {
    const bioEditor = document.getElementById('bioEditor');
    const aboutEditor = document.getElementById('aboutTextEditor');
    const certsEditor = document.getElementById('certsEditor');
    
    const bio = DataManager.getBio();
    if (bioEditor) bio.content = bioEditor.value;
    if (aboutEditor) bio.aboutText = aboutEditor.value;
    if (certsEditor) {
        bio.certifications = certsEditor.value
            .split('\n')
            .map(c => c.trim())
            .filter(c => c.length > 0);
    }
    
    DataManager.saveBio(bio);
}

document.getElementById('saveBioButton')?.addEventListener('click', () => {
    alert('Bio saved!');
});

// ============================================================================
// LINKS EDITOR
// ============================================================================

function renderLinksEditor() {
    const editor = document.getElementById('linksEditor');
    const links = DataManager.getLinks();
    
    editor.innerHTML = `
        <div class="editor-item">
            <div class="form-group">
                <label>Email</label>
                <input type="email" value="${links.email}" onchange="updateLink('email', this.value)">
            </div>
            
            <div class="form-group">
                <label>Phone</label>
                <input type="tel" value="${links.phone}" onchange="updateLink('phone', this.value)">
            </div>
            
            <div class="form-group">
                <label>GitHub</label>
                <input type="url" value="${links.github}" onchange="updateLink('github', this.value)">
            </div>
            
            <div class="form-group">
                <label>LinkedIn</label>
                <input type="url" value="${links.linkedin}" onchange="updateLink('linkedin', this.value)">
            </div>
        </div>
    `;
}

function updateLink(field, value) {
    const links = DataManager.getLinks();
    links[field] = value;
    DataManager.saveLinks(links);
}

document.getElementById('saveLinksButton')?.addEventListener('click', () => {
    alert('Links saved!');
});

// ============================================================================
// PUBLISHING
// ============================================================================

const publishButton = document.getElementById('publishButton');
const publishStatus = document.getElementById('publishStatus');
const githubTokenInput = document.getElementById('githubToken');

// Replace this with your actual PAT in the browser, but NEVER commit it!
const GITHUB_TOKEN = ""; 

if (publishButton) {
    publishButton.addEventListener('click', async () => {
        const token = githubTokenInput.value.trim() || GITHUB_TOKEN;
        if (!token) {
            alert('Please enter your GitHub Personal Access Token first.');
            githubTokenInput.focus();
            return;
        }

        publishButton.disabled = true;
        publishButton.textContent = 'PUBLISHING...';
        const pendingCount = StagingManager.count();
        publishStatus.textContent = pendingCount > 0
            ? `Uploading ${pendingCount} image(s) and publishing...`
            : 'Connecting to GitHub...';
        publishStatus.style.color = '#b8c5ff';

        try {
            const repoOwner = 'MARS-011';
            const repoName = 'jackson-marshall-portfolio';
            
            await DataManager.publishAll(token, repoOwner, repoName, StagingManager.getAll());
            StagingManager.clear();
            renderProjectsEditor();
            
            publishStatus.textContent = 'SUCCESS: Content published to GitHub! Site will rebuild in 1-2 minutes.';
            publishStatus.style.color = '#4ade80';
            alert('Changes published successfully! GitHub Pages will rebuild automatically.');
        } catch (error) {
            publishStatus.textContent = `ERROR: ${error.message}`;
            publishStatus.style.color = '#f87171';
            alert(`Publish failed: ${error.message}`);
        } finally {
            publishButton.disabled = false;
            publishButton.textContent = 'PUBLISH TO GITHUB';
        }
    });
}

const importDataBtn = document.getElementById('importDataBtn');
const importDataInput = document.getElementById('importDataInput');

if (importDataBtn) {
    importDataBtn.addEventListener('click', () => {
        const raw = importDataInput.value.trim();
        if (!raw) return;
        
        try {
            const data = JSON.parse(raw);
            // Verify structure
            if (!data.projects || !data.writing) {
                throw new Error('Invalid data structure. Missing projects or writing.');
            }
            
            // Save to draft
            localStorage.setItem('jackson_portfolio_data_draft', raw);
            alert('Data imported to local draft! Refreshing page...');
            window.location.reload();
        } catch (error) {
            alert('Import failed: ' + error.message);
        }
    });
}

const resetDraftButton = document.getElementById('resetDraftButton');
if (resetDraftButton) {
    resetDraftButton.addEventListener('click', async () => {
        if (confirm('This will delete all your unsaved changes and reload data from GitHub. Continue?')) {
            await DataManager.initialize(true); // forceRemote = true
            alert('Draft reset! Data reloaded from GitHub.');
            window.location.reload();
        }
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DataManager
    await DataManager.initialize();

    // Check session on page load
    if (isSessionValid()) {
        showDashboard();
    } else {
        passcodeScreen.style.display = 'block';
        adminDashboard.style.display = 'none';
        passcodeInput.focus();
    }
});

// Prevent back button after logout
window.addEventListener('popstate', () => {
    if (!isSessionValid()) {
        location.reload();
    }
});

console.log('Admin Dashboard — Initialized');
