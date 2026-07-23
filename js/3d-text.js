/* ============================================================================
   3D BAR TEXT EFFECT
   Standalone Three.js component integrated from bar-text-3d.html
   ============================================================================ */

const BarText3D = (function () {
    let renderer, scene, camera, instancedMesh, material, boxGeo;
    let stage, grainCanvas, grainCtx, workCanvas, workCtx;
    let group, dummy;
    let theta = 0.5, phi = 1.35, radius = 24;
    let target = new THREE.Vector3(0, 0, 0);
    let isDragging = false, lastX = 0, lastY = 0;
    let glowFilterString = 'none';
    let brightness = 1, flickerTarget = 1;
    let frameCount = 0;

    // Config (defaults from the original file)
    const config = {
        text: "MARSHALL",
        fontFamily: "'Playfair Display', serif",
        fontWeight: "900",
        barColor: "#ffffff",
        detail: 5,
        depth: 18,
        glow: 16,
        grain: 14,
        flicker: 30,
        autoRotate: true
    };

    function init(containerId) {
        stage = document.getElementById(containerId);
        if (!stage) return;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(42, stage.clientWidth / stage.clientHeight, 0.1, 500);
        
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(stage.clientWidth, stage.clientHeight);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.inset = '0';
        stage.appendChild(renderer.domElement);

        // Grain canvases
        grainCanvas = document.createElement('canvas');
        grainCanvas.style.position = 'absolute';
        grainCanvas.style.inset = '0';
        grainCanvas.style.pointerEvents = 'none';
        grainCanvas.style.mixBlendMode = 'overlay';
        grainCanvas.style.imageRendering = 'pixelated';
        stage.appendChild(grainCanvas);
        grainCtx = grainCanvas.getContext('2d');

        workCanvas = document.createElement('canvas');
        workCtx = workCanvas.getContext('2d', { willReadFrequently: true });

        sizeGrain();

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.95));
        const key = new THREE.DirectionalLight(0xffffff, 0.55);
        key.position.set(6, 10, 8);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 0.35);
        fill.position.set(-8, -4, -6);
        scene.add(fill);

        group = new THREE.Group();
        scene.add(group);

        boxGeo = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 30 });
        
        dummy = new THREE.Object3D();

        updateCamera();
        applyColor();
        buildBars();
        animate();

        // Events
        renderer.domElement.addEventListener('pointerdown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            theta -= dx * 0.006;
            phi -= dy * 0.006;
            phi = Math.max(0.25, Math.min(Math.PI - 0.25, phi));
        });

        window.addEventListener('pointerup', () => { isDragging = false; });
        
        renderer.domElement.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > 0) {
                // Only prevent default if mouse is actually over the canvas to avoid blocking page scroll
                // but since this is a small component, we might want to let page scroll through it.
                // For now, let's just scale radius.
                radius *= (1 + e.deltaY * 0.001);
                radius = Math.max(4, Math.min(80, radius));
            }
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (!stage) return;
            camera.aspect = stage.clientWidth / stage.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(stage.clientWidth, stage.clientHeight);
            sizeGrain();
        });
    }

    function sizeGrain() {
        if (!stage) return;
        grainCanvas.width = stage.clientWidth;
        grainCanvas.height = stage.clientHeight;
        grainCtx.imageSmoothingEnabled = false;
        workCanvas.width = 130;
        workCanvas.height = Math.round(130 * stage.clientHeight / stage.clientWidth);
    }

    function drawGrain() {
        const amt = config.grain;
        if (amt <= 0) {
            grainCtx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
            return;
        }
        const w = workCanvas.width, h = workCanvas.height;
        workCtx.clearRect(0, 0, w, h);
        workCtx.drawImage(renderer.domElement, 0, 0, w, h);
        const frame = workCtx.getImageData(0, 0, w, h);
        const d = frame.data;
        const strength = Math.min(amt / 100, 1);
        for (let i = 0; i < d.length; i += 4) {
            const maskA = d[i + 3];
            if (maskA < 25) {
                d[i + 3] = 0;
            } else {
                const v = Math.random() * 255;
                d[i] = v; d[i + 1] = v; d[i + 2] = v;
                d[i + 3] = Math.random() * 255 * strength;
            }
        }
        workCtx.putImageData(frame, 0, 0);
        grainCtx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
        grainCtx.drawImage(workCanvas, 0, 0, grainCanvas.width, grainCanvas.height);
    }

    function applyGlow() {
        const g = config.glow;
        const c = config.barColor;
        glowFilterString = g <= 0 ? 'none' :
            `drop-shadow(0 0 ${g * 0.3}px ${c}) drop-shadow(0 0 ${g}px ${c})`;
    }

    function applyColor() {
        material.color.set(config.barColor);
        material.emissive = new THREE.Color(config.barColor).multiplyScalar(0.18);
        applyGlow();
    }

    function buildBars() {
        const text = config.text;
        const family = config.fontFamily;
        const weight = config.fontWeight;
        const step = config.detail;
        const depthWorld = config.depth / 10;

        const fontSize = 260;
        const padX = 90;
        const canvasH = Math.round(fontSize * 1.5);

        const measureCanvas = document.createElement('canvas');
        const mctx = measureCanvas.getContext('2d');
        mctx.font = `${weight} ${fontSize}px ${family}`;
        const textW = mctx.measureText(text).width;
        const canvasW = Math.max(200, Math.round(textW + padX * 2));

        const c = document.createElement('canvas');
        c.width = canvasW;
        c.height = canvasH;
        const ctx = c.getContext('2d');
        ctx.font = `${weight} ${fontSize}px ${family}`;
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(text, padX, canvasH / 2);

        const img = ctx.getImageData(0, 0, canvasW, canvasH);
        const data = img.data;

        const segments = [];
        for (let x = 0; x < canvasW; x += step) {
            let runStart = -1;
            for (let y = 0; y < canvasH; y++) {
                const a = data[(y * canvasW + x) * 4 + 3];
                const ink = a > 40;
                if (ink && runStart === -1) {
                    runStart = y;
                } else if (!ink && runStart !== -1) {
                    segments.push([x, runStart, y - 1]);
                    runStart = -1;
                }
            }
            if (runStart !== -1) segments.push([x, runStart, canvasH - 1]);
        }

        if (instancedMesh) group.remove(instancedMesh);
        if (segments.length === 0) {
            instancedMesh = null;
            return;
        }

        const worldWidthTarget = 18;
        const scale = worldWidthTarget / canvasW;
        const barW = Math.max(step * scale * 0.72, 0.03);
        const cx0 = canvasW / 2;
        const cy0 = canvasH / 2;

        instancedMesh = new THREE.InstancedMesh(boxGeo, material, segments.length);
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const sx = seg[0], sy0 = seg[1], sy1 = seg[2];
            const h = Math.max((sy1 - sy0) * scale, 0.04);
            const px = (sx - cx0) * scale;
            const py = (cy0 - (sy0 + sy1) / 2) * scale;
            dummy.position.set(px, py, 0);
            dummy.scale.set(barW, h, depthWorld);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        group.add(instancedMesh);

        const textWorldW = canvasW * scale;
        radius = Math.max(14, textWorldW * 0.85);
    }

    function updateCamera() {
        camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = target.y + radius * Math.cos(phi);
        camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(target);
    }

    function animate() {
        requestAnimationFrame(animate);
        if (!isDragging && config.autoRotate) {
            theta += 0.0035;
        }
        updateCamera();
        renderer.render(scene, camera);
        
        // Flicker
        const amt = config.flicker / 100;
        if (amt > 0) {
            if (Math.random() < 0.06) {
                flickerTarget = 1 - Math.random() * 0.5 * amt;
            }
            brightness += (flickerTarget - brightness) * 0.5;
            const filt = `brightness(${brightness.toFixed(3)})`;
            renderer.domElement.style.filter = glowFilterString === 'none' ? filt : `${filt} ${glowFilterString}`;
        } else {
            renderer.domElement.style.filter = glowFilterString;
        }

        frameCount++;
        if (frameCount % 2 === 0) drawGrain();
    }

    return {
        init
    };
})();
