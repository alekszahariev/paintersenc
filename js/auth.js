async function login() {
    const artistNumber = document.getElementById('artistNumber').value.trim();
    const artistPassword = document.getElementById('artistPassword').value.trim();
    const errorMessage = document.getElementById('errorMessage');
    const loading = document.getElementById('loading');
    const loginBtn = document.querySelector('.login-btn');
    
    if (!artistNumber) {
        showError('Моля въведете вашия номер');
        return;
    }
    
    if (!artistPassword) {
        showError('Моля въведете вашата парола');
        return;
    }
    
    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    loginBtn.disabled = true;
    
    try {
        const response = await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                artist_number: artistNumber,
                password: artistPassword
            })
        });
        
        loading.style.display = 'none';
        loginBtn.disabled = false;
        
        if (response.ok) {
            const raw = await response.json();

            // Normalize n8n-style [{ json: {...} }] or direct object/array
            const payload = Array.isArray(raw)
                ? (raw[0]?.json ?? raw[0])
                : (raw?.json ?? raw);

            if (payload && payload.message) {
                showError(payload.message);
                return;
            }

            // Prefer payload.orders (new format). Fallback to raw array (old format).
            let orders = Array.isArray(payload?.orders) ? payload.orders : [];
            if (!orders.length && Array.isArray(raw) && raw.length && !raw[0]?.json) {
                orders = raw;
            }

            // Extract contract URL (new format: payload.contract is array with { url })
            let contractUrl = null;
            if (Array.isArray(payload?.contract) && payload.contract.length > 0) {
                contractUrl = payload.contract[0]?.url || null;
            } else if (typeof payload?.contract === 'string' && payload.contract.startsWith('http')) {
                contractUrl = payload.contract;
            }

            // Always set currentUser
            currentUser = {
                artist_number: artistNumber,
                password: artistPassword,
                artist_name: payload?.artist_name || null,
                contract: payload?.contract ?? null,
                contractUrl: contractUrl
            };

            // Map assignments if any
            assignmentsData = (orders || []).map(o => ({
                url: o?.url || o?.url2 || '',
                url2: o?.url2 || null,
                due_date: o?.due_date || '',
                note_for_painters: o?.note_for_painters || '',
                order_id: o?.order_id || null,
                painter_salary: o?.painter_salary || null,
                artist_name: payload?.artist_name || null
            }));

            // If contract URL is missing, start the contract wizard
            const contractMissing = !currentUser.contractUrl;
            if (contractMissing) {
                showContractWizard();
                return;
            }

            if (assignmentsData.length > 0) {
                showAssignments(assignmentsData);
            } else {
                showError('Няма налични задания за този номер');
            }
        } else {
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    showError(errorData.message);
                } else {
                    showError('Грешка при заявката. Моля опитайте отново.');
                }
            } catch (parseError) {
                if (response.status === 401) {
                    showError('Невалиден номер или парола');
                } else if (response.status === 404) {
                    showError('Потребителят не е намерен');
                } else {
                    showError('Грешка при заявката. Моля опитайте отново.');
                }
            }
        }
        
    } catch (error) {
        console.error('Error fetching assignments:', error);
        loading.style.display = 'none';
        loginBtn.disabled = false;
        showError('Грешка при свързването със сървъра. Моля опитайте отново.');
    }
}

function logout() {
    try {
        // Reset UI screens
        document.getElementById('loginScreen').style.display = 'block';
        const assignments = document.getElementById('assignmentsScreen');
        if (assignments) assignments.style.display = 'none';
        const topButtons = document.querySelector('.top-buttons');
        if (topButtons) topButtons.style.display = 'none';
        const wizard = document.getElementById('contractWizard');
        if (wizard) wizard.style.display = 'none';

        // Close modals if open
        const imageModal = document.getElementById('imageModal');
        if (imageModal) imageModal.style.display = 'none';
        const confirmModal = document.getElementById('confirmationModal');
        if (confirmModal) confirmModal.style.display = 'none';
        const financesModal = document.getElementById('financesModal');
        if (financesModal) financesModal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Clear inputs and state
        const artistNumber = document.getElementById('artistNumber');
        const artistPassword = document.getElementById('artistPassword');
        if (artistNumber) artistNumber.value = '';
        if (artistPassword) artistPassword.value = '';
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) errorMessage.style.display = 'none';
        currentUser = null;
        pendingCompleteData = null;
        assignmentsData = [];
        const list = document.getElementById('assignmentsList');
        if (list) list.innerHTML = '';
    } catch (e) {
        // no-op
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}