/* ============================================================================
   ADMIN DASHBOARD — JavaScript
   Passcode protection, content editing, data persistence
   ============================================================================ */

// Configuration
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
                <label>Full Description</label>
                <textarea onchange="updateProjectField(${project.id}, 'fullDescription', this.value)">${project.fullDescription}</textarea>
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
                    <label>Photos (URLs, comma-separated)</label>
                    <input type="text" id="photoUrls-${project.id}" value="${(project.photos || []).join(', ')}" onchange="updateProjectField(${project.id}, 'photos', this.value.split(',').map(s => s.trim()).filter(s => s))">
                </div>
                
                <div class="form-group">
                    <label>Upload Photos (Add to existing)</label>
                    <input type="file" multiple accept="image/*" onchange="handlePhotoUpload(${project.id}, this)">
                    <p class="form-hint" style="font-size: 0.7rem; color: #5a6490; margin-top: 0.25rem;">Files are converted to Base64 and stored locally.</p>
                </div>
	        </div>
	    `).join('');
}

function updateProjectField(id, field, value) {
    DataManager.updateProject(id, { [field]: value });
}

async function handlePhotoUpload(projectId, input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    const projects = DataManager.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newPhotos = [...(project.photos || [])];

    for (const file of files) {
        try {
            const base64 = await convertToBase64(file);
            newPhotos.push(base64);
        } catch (error) {
            console.error('Error converting file:', error);
        }
    }

    DataManager.updateProject(projectId, { photos: newPhotos });
    
    // Update the UI input field and re-render
    const urlInput = document.getElementById(`photoUrls-${projectId}`);
    if (urlInput) {
        urlInput.value = newPhotos.join(', ');
    }
    
    renderProjectsEditor();
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
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
	        stack: ['Tech1', 'Tech2'],
	        github: 'https://github.com',
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
                <label>Full Content (HTML)</label>
                <textarea onchange="updateArticleField(${article.id}, 'content', this.value)">${article.content}</textarea>
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
                <div class="gallery-upload-item" onclick="triggerGalleryUpload(${item.id})">
                    ${item.imagePath ? `<img src="${item.imagePath}" alt="Render ${item.id}">` : `<div class="gallery-upload-placeholder">[RENDER_${String(index + 1).padStart(2, '0')}]</div>`}
                </div>
                <input type="file" id="gallery-input-${item.id}" class="gallery-upload-input" onchange="handleGalleryUpload(${item.id}, event)">
            `).join('')}
        </div>
    `;
}

function triggerGalleryUpload(id) {
    document.getElementById(`gallery-input-${id}`).click();
}

function handleGalleryUpload(id, event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const gallery = DataManager.getGallery();
            const item = gallery.find(g => g.id === id);
            if (item) {
                item.imagePath = e.target.result;
                DataManager.saveGallery(gallery);
                renderGalleryEditor();
            }
        };
        reader.readAsDataURL(file);
    }
}

document.getElementById('saveGalleryButton')?.addEventListener('click', () => {
    alert('Gallery saved!');
});

// ============================================================================
// BIO EDITOR
// ============================================================================

function renderBioEditor() {
    const editor = document.getElementById('bioEditor');
    const bio = DataManager.getBio();
    
    if (editor && bio) {
        editor.value = bio.content;
        editor.addEventListener('change', (e) => {
            updateBio(e.target.value);
        });
    }
}

function updateBio(content) {
    const bio = DataManager.getBio();
    bio.content = content;
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
        publishStatus.textContent = 'Connecting to GitHub...';
        publishStatus.style.color = '#b8c5ff';

        try {
            const repoOwner = 'MARS-011';
            const repoName = 'jackson-marshall-portfolio';
            
            await DataManager.publishToGitHub(token, repoOwner, repoName);
            
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
            alert('Data imported successfully! The page will now reload to apply changes.');
            location.reload();
        } catch (e) {
            alert('Import failed: ' + e.message);
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
