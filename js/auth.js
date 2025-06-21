// Автентификация и login/logout
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
            const data = await response.json();
            
            if (data.message) {
                showError(data.message);
                return;
            }
            
            if (Array.isArray(data) && data.length > 0) {
                currentUser = {
                    artist_number: artistNumber,
                    password: artistPassword
                };
                assignmentsData = data;
                showAssignments(data);
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
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('assignmentsScreen').style.display = 'none';
    document.querySelector('.top-buttons').style.display = 'none';
    document.getElementById('artistNumber').value = '';
    document.getElementById('artistPassword').value = '';
    document.getElementById('errorMessage').style.display = 'none';
    currentUser = null;
    pendingCompleteData = null;
    assignmentsData = [];
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}