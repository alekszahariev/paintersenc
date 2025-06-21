// events.js - Event listeners и инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Modal event listeners
    document.getElementById('imageModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    document.getElementById('confirmationModal').addEventListener('click', function(e) {
        if (e.target === this) {
            cancelComplete();
        }
    });

    document.getElementById('financesModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeFinances();
        }
    });

    // Keyboard event listeners
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            cancelComplete();
            closeFinances();
        }
    });
    
    // Login form event listeners
    document.getElementById('artistNumber').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('artistPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
});