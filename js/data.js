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

    // Global utility for text formatting (line breaks to paragraphs)
    function formatText(text) {
        if (!text) return '';
        if (text.includes('<p>') || text.includes('<div')) return text; // Already HTML
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => `<p>${line}</p>`)
            .join('');
    }

    return {
        formatText,
        initialize,
        getAllData,
        publishToGitHub,
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
