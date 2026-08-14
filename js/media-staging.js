/* ============================================================================
   MEDIA STAGING
   Client-side staging area for project images. Files are compressed/resized
   and given a local preview instantly — nothing is uploaded to GitHub until
   the Publish button is pressed, at which point every staged file goes up
   in ONE commit alongside content.json. This replaces the old flow where
   every file picked created its own immediate commit.
   ============================================================================ */

const StagingManager = (() => {
    // path -> { blob, blobUrl, originalName, originalSize, newSize }
    const staged = new Map();

    function makePath(folder, filename) {
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        return `${folder}/${unique}-${safeName}`;
    }

    // Resize + re-encode an image client-side before it ever touches the
    // network. GIF/SVG are passed through untouched (resizing would break
    // animation/vector data). PNGs stay PNG (transparency); everything else
    // becomes JPEG. Longest edge capped at maxDim.
    async function compressImage(file, maxDim = 1920, quality = 0.85) {
        if (/^image\/(gif|svg\+xml)$/.test(file.type)) {
            return { blob: file, type: file.type };
        }

        let bitmap;
        try {
            bitmap = await createImageBitmap(file);
        } catch (err) {
            // Unsupported/corrupt image — fall back to uploading as-is
            // rather than blocking the whole batch.
            return { blob: file, type: file.type };
        }

        const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close?.();

        const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await new Promise(resolve => canvas.toBlob(resolve, outType, quality));
        return blob ? { blob, type: outType } : { blob: file, type: file.type };
    }

    // Stage a file for later upload. Returns { path, blobUrl } immediately.
    async function stage(file, folder) {
        let blob, type;
        
        if (file.type.startsWith('image/')) {
            const result = await compressImage(file);
            blob = result.blob;
            type = result.type;
        } else {
            // Non-image files (PDFs, etc.) are staged as-is
            blob = file;
            type = file.type;
        }

        const ext = type === 'image/png' ? '.png' : 
                    (type === 'image/jpeg' ? '.jpg' : 
                    (type === 'application/pdf' ? '.pdf' : 
                    ('.' + (file.name.split('.').pop() || 'bin'))));
        
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const path = makePath(folder, baseName + ext);
        const blobUrl = URL.createObjectURL(blob);

        staged.set(path, {
            blob,
            blobUrl,
            originalName: file.name,
            originalSize: file.size,
            newSize: blob.size
        });

        return { path, blobUrl };
    }

    function unstage(path) {
        const entry = staged.get(path);
        if (entry) {
            URL.revokeObjectURL(entry.blobUrl);
            staged.delete(path);
        }
    }

    function isStaged(path) {
        return staged.has(path);
    }

    function getEntry(path) {
        return staged.get(path);
    }

    function getBlobUrl(path) {
        return staged.get(path)?.blobUrl;
    }

    function getAll() {
        return staged;
    }

    function count() {
        return staged.size;
    }

    function clear() {
        for (const { blobUrl } of staged.values()) URL.revokeObjectURL(blobUrl);
        staged.clear();
    }

    return { stage, unstage, isStaged, getEntry, getBlobUrl, getAll, count, clear };
})();
