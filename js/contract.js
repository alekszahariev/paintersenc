// Contract Wizard Logic and Signature Capture
let signaturePadCtx = null;
let isDrawingSignature = false;

function showContractWizard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('assignmentsScreen').style.display = 'none';
    document.querySelector('.top-buttons').style.display = 'none';
    document.getElementById('contractWizard').style.display = 'block';
}

function backToContractForm() {
    document.getElementById('contractStep2').style.display = 'none';
    document.getElementById('contractStep1').style.display = 'block';
}

function backToContractPreview() {
    document.getElementById('contractStep3').style.display = 'none';
    document.getElementById('contractStep2').style.display = 'block';
}

function goToContractPreview() {
    const fullName = document.getElementById('contractFullName').value.trim();
    const address = document.getElementById('contractAddress').value.trim();
    const egn = document.getElementById('contractEGN').value.trim();
    const idNumber = document.getElementById('contractIdNumber').value.trim();
    const idIssueDate = document.getElementById('contractIdIssueDate').value;
    const idIssuer = document.getElementById('contractIdIssuer').value.trim();
    const selfEmployed = document.getElementById('contractSelfEmployed').value;

    if (!fullName || !address || !idNumber || !egn) {
        alert('Моля попълнете задължителните полета: Имена, ЕГН, Адрес и Номер на лична карта.');
        return;
    }

    const preview = document.getElementById('contractPreview');

    // Load contract template and replace placeholders
    fetch('templates/contract.html', { cache: 'no-store' })
        .then(r => r.text())
        .then(html => {
            const today = new Date().toLocaleDateString('bg-BG');
            let filled = html
                .replaceAll('{{CURRENT_DATE}}', today)
                .replaceAll('{{FULL_NAME}}', escapeHtml(fullName))
                .replaceAll('{{EGN}}', escapeHtml(egn))
                .replaceAll('{{ADDRESS}}', escapeHtml(address))
                .replaceAll('{{ID_NUMBER}}', escapeHtml(idNumber))
                .replaceAll('{{ID_ISSUE_DATE}}', escapeHtml(idIssueDate || ''))
                .replaceAll('{{ID_ISSUER}}', escapeHtml(idIssuer || ''))
                .replaceAll('{{SELF_EMPLOYED}}', selfEmployed === 'yes' ? 'Да' : 'Не');

            preview.innerHTML = filled;
            document.getElementById('contractStep1').style.display = 'none';
            document.getElementById('contractStep2').style.display = 'block';

            // Persist data to currentUser for submission
            if (!currentUser) currentUser = {};
            currentUser.contractDraft = { fullName, egn, address, idNumber, idIssueDate, idIssuer, selfEmployed, filledHtml: filled };
        })
        .catch(() => {
            alert('Грешка при зареждане на шаблона на договора.');
        });
}

function goToContractSign() {
    document.getElementById('contractStep2').style.display = 'none';
    document.getElementById('contractStep3').style.display = 'block';

    const canvas = document.getElementById('signaturePad');
    const ctx = canvas.getContext('2d');
    signaturePadCtx = ctx;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;

    canvas.onmousedown = (e) => {
        isDrawingSignature = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    };
    canvas.onmousemove = (e) => {
        if (!isDrawingSignature) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    };
    canvas.onmouseup = () => { isDrawingSignature = false; };
    canvas.onmouseleave = () => { isDrawingSignature = false; };

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        isDrawingSignature = true;
        ctx.beginPath();
        ctx.moveTo(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawingSignature) return;
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        ctx.lineTo(t.clientX - rect.left, t.clientY - rect.top);
        ctx.stroke();
    }, { passive: false });
    canvas.addEventListener('touchend', () => { isDrawingSignature = false; }, { passive: false });
}

function clearSignature() {
    const canvas = document.getElementById('signaturePad');
    signaturePadCtx.clearRect(0, 0, canvas.width, canvas.height);
}

async function submitContract() {
    try {
        const status = document.getElementById('contractSubmitStatus');
        status.style.display = 'block';
        status.textContent = 'Изпращане...';

        const canvas = document.getElementById('signaturePad');
        const signatureDataUrl = canvas.toDataURL('image/png');

        const draft = currentUser?.contractDraft || {};

        // Build a combined HTML (original contract HTML + embedded signature image at the bottom)
        const combinedHtml = (draft.filledHtml || '') + `\n\n<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#111827;">Подпис на изпълнителя: ${escapeHtml(draft.fullName || '')}</div>
            <img alt="Подпис" src="${signatureDataUrl}" style="margin-top:8px;max-width:320px;border:1px solid #e5e7eb;border-radius:6px;"/>
        </div>`;

        const payload = {
            artist_number: currentUser?.artist_number || null,
            artist_name: currentUser?.artist_name || draft.fullName || null,
            contract_fields: {
                full_name: draft.fullName || null,
                egn: draft.egn || null,
                address: draft.address || null,
                id_number: draft.idNumber || null,
                id_issue_date: draft.idIssueDate || null,
                id_issuer: draft.idIssuer || null,
                self_employed: draft.selfEmployed || null
            },
            contract_html: draft.filledHtml || null,
            contract_html_with_signature: combinedHtml,
            signature_png_base64: signatureDataUrl,
        };

        const resp = await fetch(CONFIG.CONTRACT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!resp.ok) {
            let msg = 'Грешка при изпращането на договора.';
            try { const e = await resp.json(); if (e.message) msg = e.message; } catch {}
            status.textContent = '❌ ' + msg;
            return;
        }

        status.textContent = '✅ Договорът е изпратен успешно!';

        // Mark contract as signed locally and continue to assignments if loaded in response
        currentUser.contract = 'signed';
        document.getElementById('contractWizard').style.display = 'none';
        document.querySelector('.top-buttons').style.display = 'flex';
        if (Array.isArray(assignmentsData) && assignmentsData.length) {
            showAssignments(assignmentsData);
        }
    } catch (e) {
        const status = document.getElementById('contractSubmitStatus');
        status.style.display = 'block';
        status.textContent = '❌ Възникна грешка. Моля опитайте отново.';
    }
}

function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

