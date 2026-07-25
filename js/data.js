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
            // Cache-bust only when the caller explicitly wants a guaranteed-fresh
            // copy (e.g. the admin panel discarding a draft). Public pages should
            // let the browser cache this file normally instead of re-fetching it
            // on every single navigation.
            const url = forceRemote ? `${CONTENT_URL}?t=${Date.now()}` : CONTENT_URL;
            const response = await fetch(url);
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

    function fileToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // reader.result is "data:image/png;base64,AAAA..." — strip the prefix
                resolve(reader.result.slice(reader.result.indexOf(',') + 1));
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    function utf8ToBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    // Publish content.json AND every staged image in ONE commit via the Git
    // Data API (blob -> tree -> commit -> ref update) instead of the old
    // one-commit-per-image-upload flow. `stagedFiles` is the Map returned
    // by StagingManager.getAll() — path -> { blob, originalName, ... }.
    // Creating a blob does not create a commit, so however many images are
    // staged, exactly one commit lands in history.
    async function publishAll(token, repoOwner, repoName, stagedFiles) {
        if (!token) throw new Error('GitHub Token is required for publishing');

        const apiBase = `https://api.github.com/repos/${repoOwner}/${repoName}`;
        const headers = {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json'
        };

        // 1. Resolve default branch (don't assume main vs master)
        const repoRes = await fetch(apiBase, { headers });
        if (!repoRes.ok) throw new Error('Could not read repo info');
        const repoInfo = await repoRes.json();
        const branch = repoInfo.default_branch;

        // 2. Current commit + its tree, to use as the base for our new tree
        const refRes = await fetch(`${apiBase}/git/ref/heads/${branch}`, { headers });
        if (!refRes.ok) throw new Error('Could not read branch ref');
        const refData = await refRes.json();
        const baseCommitSha = refData.object.sha;

        const baseCommitRes = await fetch(`${apiBase}/git/commits/${baseCommitSha}`, { headers });
        if (!baseCommitRes.ok) throw new Error('Could not read base commit');
        const baseCommitData = await baseCommitRes.json();
        const baseTreeSha = baseCommitData.tree.sha;

        // 3. Create a blob per staged image (network calls, but not commits)
        const treeItems = [];
        for (const [path, entry] of stagedFiles.entries()) {
            const base64Content = await fileToBase64(entry.blob);
            const blobRes = await fetch(`${apiBase}/git/blobs`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ content: base64Content, encoding: 'base64' })
            });
            if (!blobRes.ok) {
                const errorData = await blobRes.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to upload ${entry.originalName}`);
            }
            const blobData = await blobRes.json();
            treeItems.push({ path, mode: '100644', type: 'blob', sha: blobData.sha });
        }

        // 4. Blob for content.json itself
        const contentBlobRes = await fetch(`${apiBase}/git/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                content: utf8ToBase64(JSON.stringify(cachedData, null, 4)),
                encoding: 'base64'
            })
        });
        if (!contentBlobRes.ok) throw new Error('Failed to prepare content.json');
        const contentBlobData = await contentBlobRes.json();
        treeItems.push({ path: 'data/content.json', mode: '100644', type: 'blob', sha: contentBlobData.sha });

        // 5. One tree containing every change
        const treeRes = await fetch(`${apiBase}/git/trees`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
        });
        if (!treeRes.ok) throw new Error('Failed to build tree');
        const treeData = await treeRes.json();

        // 6. One commit
        const commitMessage = stagedFiles.size > 0
            ? `Update content + ${stagedFiles.size} image(s) via Admin Dashboard`
            : 'Update content via Admin Dashboard';

        const commitRes = await fetch(`${apiBase}/git/commits`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message: commitMessage, tree: treeData.sha, parents: [baseCommitSha] })
        });
        if (!commitRes.ok) throw new Error('Failed to create commit');
        const commitData = await commitRes.json();

        // 7. Move the branch ref to the new commit
        const updateRefRes = await fetch(`${apiBase}/git/refs/heads/${branch}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ sha: commitData.sha })
        });
        if (!updateRefRes.ok) throw new Error('Failed to update branch ref');

        localStorage.removeItem(STORAGE_KEY);
        return commitData;
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
        publishAll,
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
