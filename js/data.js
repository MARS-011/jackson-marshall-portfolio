/* ============================================================================
   DATA MANAGEMENT — JavaScript
   Content storage, retrieval, and persistence via localStorage
   ============================================================================ */

const DataManager = (() => {
    const STORAGE_KEY = 'jackson_portfolio_data';

    // Default data structure
    const defaultData = {
        projects: [
            {
                id: 1,
                name: 'Polymarket Trading Bot',
                description: 'Algorithmic trading bot for prediction markets with real-time data ingestion.',
                fullDescription: 'A sophisticated trading bot that analyzes market conditions and executes trades on Polymarket. Features include real-time data processing, risk management, and performance analytics.',
                stack: ['Python', 'APIs', 'Machine Learning'],
                github: 'https://github.com/jmarshall',
                links: [],
                photos: []
            },
            {
                id: 2,
                name: 'D&D Toolset',
                description: 'Web-based tools for Dungeons & Dragons campaign management and character creation.',
                fullDescription: 'Comprehensive toolset for D&D players and dungeon masters. Includes character builders, spell databases, encounter generators, and campaign tracking features.',
                stack: ['React', 'JavaScript', 'Firebase'],
                github: 'https://github.com/jmarshall',
                links: [],
                photos: []
            },
            {
                id: 3,
                name: 'Brightspace Scraper',
                description: 'Automated tool for extracting course materials and grades from Brightspace LMS.',
                fullDescription: 'Efficient scraper that automates the collection of course materials, grades, and announcements from Brightspace. Supports batch operations and data export.',
                stack: ['Python', 'Selenium', 'Data Processing'],
                github: 'https://github.com/jmarshall',
                links: [],
                photos: []
            },
            {
                id: 4,
                name: 'ESP32 Greenhouse',
                description: 'IoT greenhouse monitoring system with automated climate control.',
                fullDescription: 'Complete IoT solution for greenhouse management. Features real-time sensor monitoring, automated watering, climate control, and mobile app integration.',
                stack: ['ESP32', 'C++', 'IoT', 'Mobile'],
                github: 'https://github.com/jmarshall',
                links: [],
                photos: []
            },
            {
                id: 5,
                name: 'Hydronic Heating Design',
                description: 'CAD and simulation tools for designing efficient hydronic heating systems.',
                fullDescription: 'Professional-grade design suite for hydronic heating systems. Includes thermal modeling, pipe sizing calculations, and system optimization algorithms.',
                stack: ['CAD', 'Python', 'Thermodynamics'],
                github: 'https://github.com/jmarshall',
                links: [],
                photos: []
            },
            {
                id: 6,
                name: 'Project Dashboard',
                description: 'Real-time project management dashboard with team collaboration features.',
                fullDescription: 'Collaborative project management platform with real-time updates, task tracking, team communication, and progress visualization.',
                stack: ['React', 'Node.js', 'MongoDB'],
                github: 'https://github.com/jmarshall',
                links: [],
                photos: []
            },
            {
                id: 7,
                name: 'Orbis Generative Art',
                description: 'Procedural particle system creating orbital structures and cosmic visualizations.',
                fullDescription: 'Generative art project exploring emergent complexity through particle physics. Creates mesmerizing orbital patterns with mathematical precision.',
                stack: ['Three.js', 'JavaScript', 'WebGL'],
                github: 'https://github.com/jmarshall',
                links: [],
                photos: []
            }
        ],
        writing: [
            {
                id: 1,
                title: 'Generative Systems and Emergent Complexity',
                date: 'June 15, 2024',
                summary: 'Exploring how simple rules and iterative processes create intricate patterns, from particle physics to organizational design.',
                content: '<p class="drop-cap">Generative systems represent one of the most fascinating intersections between mathematics, art, and engineering. At their core, they embody a simple principle: from basic rules and iterative processes emerge intricate, often unpredictable patterns that rival the complexity found in nature itself.</p>\n\n<p>Consider the formation of a snowflake. Each crystal grows according to simple physical laws—temperature, humidity, and molecular bonding. Yet the result is a unique, infinitely complex structure that no two snowflakes share. This is emergence in its purest form.</p>\n\n<p>In my work with generative art and procedural systems, I\'ve come to appreciate how this principle scales across domains. Whether designing particle attractors for visual effects, optimizing manufacturing processes, or modeling organizational behavior, the underlying truth remains: simple rules, applied iteratively, generate emergent complexity.</p>\n\n<p>The Orbis project exemplifies this philosophy. A few parameters—attraction strength, particle mass, damping coefficients—combined with basic physics simulation, produce mesmerizing orbital structures that appear intentionally designed, yet emerge entirely from mathematical principles.</p>\n\n<p>This approach has profound implications for engineering. Rather than attempting to specify every detail of a system, we can define the rules and let emergence do the work. It\'s a shift from top-down design to bottom-up generation, and it opens possibilities we\'re only beginning to explore.</p>'
            },
            {
                id: 2,
                title: 'Engineering Co-op: Lessons in Process Optimization',
                date: 'May 28, 2024',
                summary: 'Reflections from four months in industry: what academic theory doesn\'t teach you about real-world problem-solving and team dynamics.',
                content: '<p class="drop-cap">Four months in industry taught me more about real-world engineering than four years of coursework ever could. Not because the theory was wrong, but because it was incomplete—stripped of context, constraints, and the messy reality of working within existing systems.</p>\n\n<p>My co-op focused on process optimization in a manufacturing environment. The academic version of this involves elegant mathematical models, constraint programming, and optimal solutions. The real version involves legacy systems, political considerations, and the question: "Can we actually implement this by Friday?"</p>\n\n<p>One project stands out. We were tasked with reducing waste in a production line. The textbook approach would be to model the entire system, identify bottlenecks, and propose a comprehensive redesign. Instead, I spent the first two weeks simply observing and talking to operators. They knew where the problems were—they lived with them daily.</p>\n\n<p>The solution wasn\'t elegant. It involved a spreadsheet, three email alerts, and a color-coded printout posted next to each station. It reduced waste by 18% in the first month. It was nothing like what I\'d learned in optimization class, and it worked.</p>\n\n<p>This taught me that engineering isn\'t just about finding the best solution—it\'s about finding the best solution that can actually be implemented, maintained, and improved by real people in real conditions. Theory provides the foundation, but wisdom comes from understanding the gap between the model and the world.</p>'
            },
            {
                id: 3,
                title: 'The Chemistry of Soap: Saponification and Molecular Design',
                date: 'April 10, 2024',
                summary: 'A deep dive into the chemistry of soap production, surfactant behavior, and the surprising elegance of amphiphilic molecules.',
                content: '<p class="drop-cap">Soap is one of humanity\'s oldest and most elegant chemical solutions. For millennia, we\'ve been creating amphiphilic molecules—compounds with both hydrophobic and hydrophilic regions—without fully understanding the molecular choreography that makes them work.</p>\n\n<p>The chemistry is deceptively simple. Saponification is the reaction between a fat or oil (triglyceride) and a strong base (traditionally lye). The base breaks the ester bonds, releasing glycerol and creating fatty acid salts—soap. But the elegance lies in what happens next, at the molecular level.</p>\n\n<p>A soap molecule has a hydrophobic tail (the fatty acid chain) and a hydrophilic head (the carboxylate group). In water, these molecules spontaneously arrange themselves into spheres called micelles, with hydrophobic tails pointing inward and hydrophilic heads facing outward. This structure is the key to soap\'s cleaning power.</p>\n\n<p>When you wash your hands, soap micelles surround oil and dirt particles, with their hydrophobic tails embedding into the contamination and their hydrophilic heads facing the water. The result: oily contaminants become suspended in water and wash away. It\'s molecular-scale engineering.</p>\n\n<p>What fascinates me most is how this ancient craft has been refined through chemistry. Modern soap formulations optimize for hardness, lather, skin compatibility, and environmental impact by carefully selecting different fats and additives. The fundamental chemistry remains unchanged, but the sophistication of application has grown exponentially.</p>\n\n<p>This is a reminder that sometimes the most powerful solutions are those that work with natural principles rather than against them. Soap doesn\'t fight water; it partners with it at the molecular level.</p>'
            }
        ],
        gallery: [
            { id: 1, caption: '', imagePath: '' },
            { id: 2, caption: '', imagePath: '' },
            { id: 3, caption: '', imagePath: '' },
            { id: 4, caption: '', imagePath: '' },
            { id: 5, caption: '', imagePath: '' },
            { id: 6, caption: '', imagePath: '' },
            { id: 7, caption: '', imagePath: '' },
            { id: 8, caption: '', imagePath: '' }
        ],
        links: {
            email: 'jmarshallapplications@gmail.com',
            phone: '437-990-0344',
            github: 'https://github.com/jmarshall',
            linkedin: 'https://linkedin.com/in/jmarshall'
        },
        bio: {
            title: 'About',
            content: '<p>I\'m a chemical engineer focused on process optimization, sustainable systems design, and technical problem-solving. My work spans energy systems, materials science, and environmental engineering.</p>\n\n<p>Currently exploring the intersection of generative systems and engineering design. I\'m interested in how emergent complexity from simple rules can solve real-world problems.</p>\n\n<p>Outside of work, I spend time mountaineering, studying art history, and building tools that make engineering more accessible. You can find my recent projects and writing below.</p>'
        }
    };

    // Initialize data from localStorage or use defaults
    function initialize() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
            return defaultData;
        }
        return JSON.parse(stored);
    }

    // Get all data
    function getAllData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : defaultData;
    }

    // Get projects
    function getProjects() {
        const data = getAllData();
        return data.projects || [];
    }

    // Get writing
    function getWriting() {
        const data = getAllData();
        return data.writing || [];
    }

    // Get gallery
    function getGallery() {
        const data = getAllData();
        return data.gallery || [];
    }

    // Get links
    function getLinks() {
        const data = getAllData();
        return data.links || defaultData.links;
    }

    // Get bio
    function getBio() {
        const data = getAllData();
        return data.bio || defaultData.bio;
    }

    // Save projects
    function saveProjects(projects) {
        const data = getAllData();
        data.projects = projects;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // Save writing
    function saveWriting(writing) {
        const data = getAllData();
        data.writing = writing;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // Save gallery
    function saveGallery(gallery) {
        const data = getAllData();
        data.gallery = gallery;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // Save links
    function saveLinks(links) {
        const data = getAllData();
        data.links = links;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // Save bio
    function saveBio(bio) {
        const data = getAllData();
        data.bio = bio;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // Add project
    function addProject(project) {
        const projects = getProjects();
        project.id = Math.max(...projects.map(p => p.id), 0) + 1;
        projects.push(project);
        saveProjects(projects);
        return project;
    }

    // Update project
    function updateProject(id, updates) {
        const projects = getProjects();
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates };
            saveProjects(projects);
        }
    }

    // Delete project
    function deleteProject(id) {
        const projects = getProjects();
        const filtered = projects.filter(p => p.id !== id);
        saveProjects(filtered);
    }

    // Add article
    function addArticle(article) {
        const writing = getWriting();
        article.id = Math.max(...writing.map(a => a.id), 0) + 1;
        writing.push(article);
        saveWriting(writing);
        return article;
    }

    // Update article
    function updateArticle(id, updates) {
        const writing = getWriting();
        const index = writing.findIndex(a => a.id === id);
        if (index !== -1) {
            writing[index] = { ...writing[index], ...updates };
            saveWriting(writing);
        }
    }

    // Delete article
    function deleteArticle(id) {
        const writing = getWriting();
        const filtered = writing.filter(a => a.id !== id);
        saveWriting(filtered);
    }

    // Export public API
    return {
        initialize,
        getAllData,
        getProjects,
        getWriting,
        getGallery,
        getLinks,
        getBio,
        saveProjects,
        saveWriting,
        saveGallery,
        saveLinks,
        saveBio,
        addProject,
        updateProject,
        deleteProject,
        addArticle,
        updateArticle,
        deleteArticle
    };
})();

// Initialize on load
DataManager.initialize();
