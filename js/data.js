/* ============================================================================
   DATA MANAGEMENT — JavaScript
   Content storage, retrieval, and persistence via content.json & GitHub API
   ============================================================================ */

const DataManager = (() => {
    const STORAGE_KEY = 'jackson_portfolio_data_draft';
    const CONTENT_URL = 'data/content.json';
    
    let cachedData = null;

    // Fetch data from content.json
    async function initialize(forceRemote = false) {
        try {
            const response = await fetch(`${CONTENT_URL}?t=${Date.now()}`); // Cache busting
            if (!response.ok) throw new Error('Failed to fetch content.json');
            const remoteData = await response.json();
            
            // Check for local draft
            const draft = localStorage.getItem(STORAGE_KEY);
            if (draft && !forceRemote) {
                cachedData = JSON.parse(draft);
                console.log('Loaded draft from localStorage');
            } else {
                cachedData = remoteData;
                if (forceRemote) {
                    localStorage.removeItem(STORAGE_KEY);
                    console.log('Forced remote data load, draft cleared');
                }
            }
            return cachedData;
        } catch (error) {
            console.error('DataManager initialization failed:', error);
            // Fallback to local storage or empty structure if fetch fails
            const draft = localStorage.getItem(STORAGE_KEY);
            cachedData = draft ? JSON.parse(draft) : { projects: [], writing: [], gallery: [], links: {}, bio: {} };
            return cachedData;
        }
    }

    // Get all data (ensures initialization)
    function getAllData() {
        return cachedData;
    }

    // Save draft to localStorage
    function saveDraft() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedData));
    }

    // Upload an image file to the repo (as its own file) via GitHub Contents API,
    // instead of embedding it as base64 inside content.json. Keeps content.json
    // small and fast to load, and avoids the ~1MB GitHub API single-file limit.
    // Returns the relative path (e.g. "assets/images/uploads/1699999999-photo.jpg")
    // to store in content.json.
    async function uploadImageToGitHub(file, token, repoOwner, repoName, folder = 'assets/images/uploads') {
        if (!token) throw new Error('GitHub Token is required for image upload');

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${folder}/${Date.now()}-${safeName}`;
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;

        const base64Content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // reader.result is "data:image/png;base64,AAAA..." — strip the prefix
                const commaIndex = reader.result.indexOf(',');
                resolve(reader.result.slice(commaIndex + 1));
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const putResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Upload image ${safeName}`,
                content: base64Content,
            })
        });

        if (!putResponse.ok) {
            const errorData = await putResponse.json();
            throw new Error(errorData.message || 'Failed to upload image to GitHub');
        }

        // Relative path works both on GitHub Pages and locally alongside index.html
        return path;
    }

    // GitHub Publishing Logic
    async function publishToGitHub(token, repoOwner, repoName) {
        if (!token) throw new Error('GitHub Token is required for publishing');
        
        const path = 'data/content.json';
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
        
        try {
            // 1. Get current file SHA
            const getResponse = await fetch(url, {
                headers: { 'Authorization': `token ${token}` }
            });
            
            let sha = null;
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }

            // 2. PUT updated content
            const putResponse = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Update content via Admin Dashboard',
                    content: btoa(unescape(encodeURIComponent(JSON.stringify(cachedData, null, 4)))),
                    sha: sha
                })
            });

            if (!putResponse.ok) {
                const errorData = await putResponse.json();
                throw new Error(errorData.message || 'Failed to publish to GitHub');
            }

            // Clear draft on success
            localStorage.removeItem(STORAGE_KEY);
            return await putResponse.json();
        } catch (error) {
            console.error('GitHub Publish Error:', error);
            throw error;
        }
    }

    // Data Accessors
    function getProjects() { return cachedData.projects || []; }
    function getWriting() { return cachedData.writing || []; }
    function getGallery() { return cachedData.gallery || []; }
    function getLinks() { return cachedData.links || {}; }
    function getBio() { return cachedData.bio || {}; }

    // Data Modifiers (Save to cachedData and then to Draft)
    function updateProject(id, updates) {
        const index = cachedData.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            cachedData.projects[index] = { ...cachedData.projects[index], ...updates };
            saveDraft();
        }
    }

    function addProject(project) {
        project.id = Math.max(...cachedData.projects.map(p => p.id), 0) + 1;
        cachedData.projects.push(project);
        saveDraft();
        return project;
    }

    function deleteProject(id) {
        cachedData.projects = cachedData.projects.filter(p => p.id !== id);
        saveDraft();
    }

    function updateArticle(id, updates) {
        const index = cachedData.writing.findIndex(a => a.id === id);
        if (index !== -1) {
            cachedData.writing[index] = { ...cachedData.writing[index], ...updates };
            saveDraft();
        }
    }

    function addArticle(article) {
        article.id = Math.max(...cachedData.writing.map(a => a.id), 0) + 1;
        cachedData.writing.push(article);
        saveDraft();
        return article;
    }

    function deleteArticle(id) {
        cachedData.writing = cachedData.writing.filter(a => a.id !== id);
        saveDraft();
    }

    function saveGallery(gallery) {
        cachedData.gallery = gallery;
        saveDraft();
    }

    function saveLinks(links) {
        cachedData.links = links;
        saveDraft();
    }

    function saveBio(bio) {
        cachedData.bio = bio;
        saveDraft();
    }

    return {
        initialize,
        getAllData,
        publishToGitHub,
        uploadImageToGitHub,
        getProjects,
        getWriting,
        getGallery,
        getLinks,
        getBio,
        updateProject,
        addProject,
        deleteProject,
        updateArticle,
        addArticle,
        deleteArticle,
        saveGallery,
        saveLinks,
        saveBio
    };
})();
