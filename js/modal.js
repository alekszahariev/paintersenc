// Модални прозорци и изображения
function openModal(imageUrl, assignmentNumber, noteForPainters = '') {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    
    modalImage.src = imageUrl;
    modalImage.alt = `Задание #${assignmentNumber}`;
    modal.style.display = 'block';
    
    modal.dataset.currentUrl = imageUrl;
    modal.dataset.assignmentNumber = assignmentNumber;
    modal.dataset.noteForPainters = noteForPainters;
    
    let existingNote = modal.querySelector('.modal-note');
    if (existingNote) {
        existingNote.remove();
    }
    
    if (noteForPainters && noteForPainters.trim()) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'modal-note';
        noteDiv.innerHTML = `
            <strong>📝 Бележка за художника:</strong><br>
            ${noteForPainters}
        `;
        
        const modalControls = modal.querySelector('.modal-controls');
        modalControls.parentNode.insertBefore(noteDiv, modalControls);
    }
    
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function downloadImage(imageUrl = null, assignmentNumber = null) {
    try {
        const url = imageUrl || document.getElementById('imageModal').dataset.currentUrl;
        const number = assignmentNumber || document.getElementById('imageModal').dataset.assignmentNumber;
        
        if (!url) return;
        
        const response = await fetch(url);
        const blob = await response.blob();
        
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        const urlParts = url.split('.');
        const extension = urlParts[urlParts.length - 1].split('?')[0] || 'png';
        
        link.download = `zadanie_${number}.${extension}`;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('Грешка при сваляне на изображението. Моля опитайте отново.');
    }
}