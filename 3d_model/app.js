(function() {
    const imageFileInput = document.getElementById('imageFile');
    const filePreview = document.getElementById('filePreview');
    const positiveEl = document.getElementById('positive');
    const negativeEl = document.getElementById('negative');
    const numEl = document.getElementById('num');
    const generateBtn = document.getElementById('generate');
    const clearBtn = document.getElementById('clear');
    const errorEl = document.getElementById('error');
    const loadingEl = document.getElementById('loading');
    const resultsEl = document.getElementById('results');

    // Initialize defaults
    numEl.value = RUNWARE_DEFAULT_RESULTS;

    // Preset buttons
    document.querySelectorAll('.preset').forEach(btn => {
        btn.addEventListener('click', () => {
            positiveEl.value = btn.dataset.prompt;
        });
    });
    const presetsWrap = document.querySelector('.presets');
    if (presetsWrap) {
        presetsWrap.addEventListener('click', (e) => {
            const btn = e.target.closest('.preset');
            if (btn) {
                positiveEl.value = btn.dataset.prompt || '';
            }
        });
    }

    // Local preview for upload
    imageFileInput.addEventListener('change', () => {
        const file = imageFileInput.files && imageFileInput.files[0];
        if (!file) { filePreview.style.display = 'none'; filePreview.innerHTML=''; return; }
        const url = URL.createObjectURL(file);
        filePreview.style.display = 'block';
        filePreview.innerHTML = `<img src="${url}" alt="preview" />`;
    });

    // Load from session
    const sessionKey = 'runwareResults';
    try {
        const saved = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
        saved.forEach(addResultCard);
    } catch {}

    generateBtn.addEventListener('click', async () => {
        errorEl.style.display = 'none';
        loadingEl.style.display = 'block';

        // Read uploaded image as base64 Data URL
        const file = imageFileInput.files && imageFileInput.files[0];
        if (!file) { showError('Please upload a reference image.'); return; }
        let dataUrl;
        try {
            dataUrl = await readFileAsDataURL(file);
        } catch (e) {
            showError('Could not read the uploaded image.');
            return;
        }
        const refImages = [dataUrl];

        const positive = (positiveEl.value || '').trim();
        const negative = (negativeEl.value || '').trim();
        const width = RUNWARE_DEFAULT_WIDTH;
        const height = RUNWARE_DEFAULT_HEIGHT;
        const numberResults = Math.min(4, Math.max(1, parseInt(numEl.value, 10) || RUNWARE_DEFAULT_RESULTS));

        try {
            const apiKey = (window.RUNWARE_API_KEY || RUNWARE_API_KEY || '').trim();
            if (!apiKey) {
                showError('Missing API key. Set RUNWARE_API_KEY in config.js.');
                return;
            }

            const body = [
                // Header auth alternative: include here (both supported by docs)
                // { taskType: 'authentication', apiKey },
                {
                    taskType: 'imageInference',
                    taskUUID: crypto.randomUUID(),
                    positivePrompt: buildPrompt(positive),
                    negativePrompt: negative || undefined,
                    outputFormat: 'JPEG',
                    includeCost: true,
                    outputType: ['URL'],
                    referenceImages: refImages,
                    model: RUNWARE_DEFAULT_MODEL,
                    numberResults
                }
            ];

            const res = await fetch(RUNWARE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();

            const dataArr = json && (json.data || []);
            const images = dataArr.filter(x => x.imageURL).map(x => x.imageURL);
            if (!images.length) throw new Error('No results.');

            images.forEach(url => {
                addResultCard(url);
                persistResult(url);
            });
        } catch (e) {
            showError(e.message || 'Generation error.');
        } finally {
            loadingEl.style.display = 'none';
        }
    });

    clearBtn.addEventListener('click', () => {
        resultsEl.innerHTML = '';
        sessionStorage.removeItem(sessionKey);
    });

    function buildPrompt(base) {
        return base || 'back view of the object, consistent style, match materials';
    }

    function addResultCard(url) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <img class="result-img" src="${url}" alt="result" />
            <div class="result-actions">
                <button data-action="download">Download</button>
            </div>
        `;
        const copyBtn = card.querySelector('[data-action="copy"]');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try { await navigator.clipboard.writeText(url); } catch {}
            });
        }
        const downloadBtn = card.querySelector('[data-action="download"]');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                try {
                    const resp = await fetch(url);
                    const blob = await resp.blob();
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `runware_result_${Date.now()}.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        URL.revokeObjectURL(a.href);
                        a.remove();
                    }, 0);
                } catch {}
            });
        }
        resultsEl.prepend(card);
    }

    function persistResult(url) {
        try {
            const arr = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
            arr.unshift(url);
            sessionStorage.setItem(sessionKey, JSON.stringify(arr.slice(0, 50)));
        } catch {}
    }

    function showError(msg) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.textContent = msg;
    }
})();

// Helpers
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('read error'));
        reader.readAsDataURL(file);
    });
}

