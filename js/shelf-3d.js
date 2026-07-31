/* ============================================================================
   SHELF 3D — Three.js display shelf for the Projects page
   Renders each project as a "book" object standing on a floating shelf.
   Falls back to the classic card grid on WebGL failure or narrow viewports.

   Drop a Mint-exported GLB at assets/models/shelf.glb and this will load it
   automatically in place of the procedural shelf mesh below — no other
   code needs to change.
   ============================================================================ */

const ShelfScene = (() => {

    const SHELF_GLB_PATH = 'assets/models/shelf.glb';

    // Palette pulled straight from css/styles.css custom properties
    const COLORS = {
        navy: 0x0a0e2e,
        shelfBody: 0x141a44,
        trim: 0xb8c5ff,
        ink: 0xe8ecff,
        muted: 0x5a6490
    };

    const BOOK_TINTS = [0xb8c5ff, 0x8892c9, 0xe8ecff, 0x6d78a8, 0x9aa6e0];

    let renderer, scene, camera, controls, raycaster, pointer;
    let shelfGroup, booksGroup;
    let container, onSelectCallback;
    let hovered = null;
    let clock;
    let projectsRef = [];
    let animationId = null;
    let resizeObserver = null;
    let activeBook = null;

    function supportsWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    function makeLabelTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#e8ecff';
        ctx.font = '600 40px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let display = text;
        if (display.length > 26) display = display.slice(0, 24) + '…';
        ctx.fillText(display, 0, 0);
        ctx.restore();

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function buildProceduralShelf() {
        const group = new THREE.Group();

        const plankGeo = new THREE.BoxGeometry(8, 0.16, 1.1);
        const plankMat = new THREE.MeshStandardMaterial({
            color: COLORS.shelfBody,
            roughness: 0.75,
            metalness: 0.15
        });
        const plank = new THREE.Mesh(plankGeo, plankMat);
        plank.position.y = 0;
        group.add(plank);

        // Brushed-metal front edge trim
        const trimGeo = new THREE.BoxGeometry(8.02, 0.05, 0.06);
        const trimMat = new THREE.MeshStandardMaterial({
            color: COLORS.trim,
            roughness: 0.3,
            metalness: 0.65
        });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.set(0, 0.06, 0.55);
        group.add(trim);

        // Two slim wall supports underneath, floating-shelf style
        const supportGeo = new THREE.BoxGeometry(0.14, 0.7, 0.5);
        const supportMat = new THREE.MeshStandardMaterial({
            color: 0x090c26,
            roughness: 0.9,
            metalness: 0.1
        });
        [-2.6, 2.6].forEach((x) => {
            const support = new THREE.Mesh(supportGeo, supportMat);
            support.position.set(x, -0.43, -0.15);
            group.add(support);
        });

        return group;
    }

    function loadShelfModel() {
        return new Promise((resolve) => {
            if (typeof THREE.GLTFLoader === 'undefined') {
                resolve(buildProceduralShelf());
                return;
            }
            const loader = new THREE.GLTFLoader();
            loader.load(
                SHELF_GLB_PATH,
                (gltf) => resolve(gltf.scene),
                undefined,
                () => resolve(buildProceduralShelf()) // no GLB present yet — use procedural fallback
            );
        });
    }

    function buildBooks(projects) {
        const group = new THREE.Group();
        const count = Math.max(projects.length, 1);
        const usableWidth = 6.6;
        const spacing = usableWidth / count;
        const startX = -usableWidth / 2 + spacing / 2;

        projects.forEach((project, i) => {
            const width = 0.5;
            const height = 0.95 + (i % 3) * 0.12;
            const depth = 0.62;

            const bodyMat = new THREE.MeshStandardMaterial({
                color: BOOK_TINTS[i % BOOK_TINTS.length],
                roughness: 0.55,
                metalness: 0.1
            });
            const spineMat = new THREE.MeshStandardMaterial({
                color: COLORS.navy,
                roughness: 0.5,
                metalness: 0.05,
                map: makeLabelTexture(project.name || 'Untitled')
            });

            // materials order: +x, -x, +y, -y, +z(spine/front), -z
            const materials = [bodyMat, bodyMat, bodyMat, bodyMat, spineMat, bodyMat];
            const geo = new THREE.BoxGeometry(width, height, depth);
            const book = new THREE.Mesh(geo, materials);

            const x = startX + i * spacing;
            const tilt = ((i % 2 === 0) ? 1 : -1) * (0.02 + (i % 3) * 0.015);
            book.position.set(x, height / 2 + 0.08, 0.05);
            book.rotation.z = tilt;
            book.userData.project = project;
            book.userData.baseY = book.position.y;
            book.userData.baseRotZ = tilt;
            book.castShadow = false;

            group.add(book);
        });

        return group;
    }

    function onPointerMove(event) {
        const rect = container.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onClick() {
        if (activeBook) return; // one book at a time — ignore clicks mid-presentation
        if (hovered) {
            presentBook(hovered);
        }
    }

    // Springs the clicked book forward off the shelf toward the camera, then
    // opens the detail overlay once it settles — the "pull it forward and
    // inspect it" motion referenced in the shelf hint text.
    function presentBook(mesh) {
        activeBook = mesh;
        hovered = null;
        container.style.cursor = 'default';
        if (controls) controls.enabled = false;

        const target = {
            y: mesh.userData.baseY + 0.55,
            z: mesh.position.z + 1.6,
            rotZ: 0,
            scale: 1.32
        };

        if (typeof gsap !== 'undefined') {
            gsap.to(mesh.position, { y: target.y, z: target.z, duration: 0.55, ease: 'back.out(1.6)' });
            gsap.to(mesh.rotation, { z: target.rotZ, y: mesh.rotation.y + Math.PI * 0.06, duration: 0.55, ease: 'back.out(1.6)' });
            gsap.to(mesh.scale, {
                x: target.scale, y: target.scale, z: target.scale,
                duration: 0.55, ease: 'back.out(1.6)',
                onComplete: () => {
                    if (typeof onSelectCallback === 'function') onSelectCallback(mesh.userData.project);
                }
            });
        } else {
            mesh.position.y = target.y;
            mesh.position.z = target.z;
            mesh.rotation.z = target.rotZ;
            mesh.scale.setScalar(target.scale);
            if (typeof onSelectCallback === 'function') onSelectCallback(mesh.userData.project);
        }
    }

    // Called once the detail overlay closes, to settle the presented book
    // back onto the shelf and re-enable browsing.
    function returnActiveBook() {
        const mesh = activeBook;
        if (!mesh) return;
        activeBook = null;

        const baseZ = 0.05;
        const baseRotZ = mesh.userData.baseRotZ ?? 0;

        if (typeof gsap !== 'undefined') {
            gsap.to(mesh.position, { y: mesh.userData.baseY, z: baseZ, duration: 0.45, ease: 'power2.inOut' });
            gsap.to(mesh.rotation, { z: baseRotZ, y: 0, duration: 0.45, ease: 'power2.inOut' });
            gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'power2.inOut' });
        } else {
            mesh.position.y = mesh.userData.baseY;
            mesh.position.z = baseZ;
            mesh.rotation.z = baseRotZ;
            mesh.scale.setScalar(1);
        }

        if (controls) controls.enabled = true;
    }

    function updateHover() {
        if (!booksGroup || activeBook) return; // don't steal hover from a presented book
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(booksGroup.children);

        const nextHovered = intersects.length > 0 ? intersects[0].object : null;

        if (nextHovered !== hovered) {
            if (hovered) {
                gsapLift(hovered, hovered.userData.baseY);
            }
            hovered = nextHovered;
            if (hovered) {
                gsapLift(hovered, hovered.userData.baseY + 0.18);
            }
            container.style.cursor = hovered ? 'pointer' : 'grab';
        }
    }

    function gsapLift(mesh, targetY) {
        if (typeof gsap !== 'undefined') {
            gsap.to(mesh.position, { y: targetY, duration: 0.35, ease: 'power2.out' });
        } else {
            mesh.position.y = targetY;
        }
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        if (controls) controls.update();
        updateHover();
        renderer.render(scene, camera);
    }

    function handleResize() {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    async function init(containerEl, projects, onSelect) {
        if (!supportsWebGL()) return false;

        container = containerEl;
        onSelectCallback = onSelect;
        projectsRef = projects;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(0, 1.6, 6.2);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);
        container.style.cursor = 'grab';

        scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const key = new THREE.DirectionalLight(0xffffff, 0.9);
        key.position.set(3, 5, 4);
        scene.add(key);
        const rim = new THREE.DirectionalLight(COLORS.trim, 0.5);
        rim.position.set(-4, 2, -3);
        scene.add(rim);

        shelfGroup = await loadShelfModel();
        shelfGroup.position.y = 0;
        scene.add(shelfGroup);

        booksGroup = buildBooks(projects);
        scene.add(booksGroup);

        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.enablePan = false;
            controls.minDistance = 4;
            controls.maxDistance = 9;
            controls.minPolarAngle = Math.PI / 3;
            controls.maxPolarAngle = Math.PI / 1.8;
            controls.minAzimuthAngle = -Math.PI / 5;
            controls.maxAzimuthAngle = Math.PI / 5;
            controls.target.set(0, 0.6, 0);
        }

        raycaster = new THREE.Raycaster();
        pointer = new THREE.Vector2(-10, -10);
        clock = new THREE.Clock();

        container.addEventListener('pointermove', onPointerMove);
        container.addEventListener('click', onClick);

        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(container);
        } else {
            window.addEventListener('resize', handleResize);
        }

        animate();
        return true;
    }

    function destroy() {
        if (animationId) cancelAnimationFrame(animationId);
        if (resizeObserver) resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        if (container) {
            container.removeEventListener('pointermove', onPointerMove);
            container.removeEventListener('click', onClick);
        }
        if (renderer) renderer.dispose();
    }

    return { init, destroy, supportsWebGL, returnActiveBook };
})();
