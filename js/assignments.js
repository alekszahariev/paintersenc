// Показване и управление на задания
function showAssignments(assignments) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('assignmentsScreen').style.display = 'block';
    document.querySelector('.top-buttons').style.display = 'flex';
    
    const assignmentsList = document.getElementById('assignmentsList');
    assignmentsList.innerHTML = '';
    
    assignments.forEach((assignment, index) => {
        const card = document.createElement('div');
        card.className = 'assignment-card';
        
        const dueDate = new Date(assignment.due_date);
        const formattedDate = dueDate.toLocaleDateString('bg-BG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const today = new Date();
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        let dueDateClass = 'due-date';
        let dueDateText = `Краен срок: ${formattedDate}`;
        
        if (daysDiff < 0) {
            dueDateText = `⚠️ Просрочено: ${formattedDate}`;
        } else if (daysDiff <= 3) {
            dueDateText = `🔥 Спешно до: ${formattedDate}`;
        }
        
        const noteForPainters = assignment.note_for_painters ? 
            `<div class="assignment-note">
                <strong>📝 Бележка:</strong><br>
                ${assignment.note_for_painters}
            </div>` : '';

        const escapedUrl = assignment.url.replace(/'/g, "\\'");
        const escapedUrl2 = (assignment.url2 || '').replace(/'/g, "\\'");
        const escapedNote = (assignment.note_for_painters || '').replace(/'/g, "\\'");

        // Add order number display
        const orderNumber = assignment.order_id ? 
            `<div class="order-number">📦 Поръчка: ${assignment.order_id}</div>` : '';

        // Add payment amount display
        const paymentAmount = assignment.painter_salary ? 
            `<div class="payment-amount">💰 Плащане: ${assignment.painter_salary} лв.</div>` : '';

        card.innerHTML = `
            <img src="${assignment.url}" alt="Задание ${index + 1}" class="assignment-image" 
                 onclick="openModal('${escapedUrl}', ${index + 1}, '${escapedNote}')"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEg3NEM2OC40NzcyIDc0IDY0IDc4LjQ3NzIgNjQgODRWMTE2QzY0IDEyMS41MjMgNjguNDc3MiAxMjYgNzQgMTI2SDEyNkMxMzEuNTIzIDEyNiAxMzYgMTIxLjUyMyAxMzYgMTE2VjEwNEgxMjZWMTE2SDc0Vjg0SDg3Vjc0WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTE2IDY0SDEwNFY3NEgxMTZWNjRaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMjYgNzRIMTE2Vjg0SDEyNlY3NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyBvcm9vdD0iIiAvPgo='">
            <div class="assignment-info">
                <div class="${dueDateClass}">${dueDateText}</div>
                <div class="assignment-number">Задание #${index + 1}</div>
                ${orderNumber}
                ${paymentAmount}
                ${noteForPainters}
                <div class="download-actions">
                    <button class="download-btn" onclick="openModal('${escapedUrl}', ${index + 1}, '${escapedNote}')">
                        🔍 Разгледай
                    </button>
                    ${assignment.url2 ? `
                    <button class="download-btn" onclick="openModal('${escapedUrl2}', ${index + 1}, '${escapedNote}')">
                        🖼️ Виж оригинала
                    </button>
                    ` : ''}
                    <button class="complete-btn" onclick="markAsComplete(${index + 1}, '${escapedUrl}')">
                        ✅ ГОТОВА
                    </button>
                </div>
            </div>
        `;
        
        assignmentsList.appendChild(card);
    });
}

function getOrderIdForAssignment(assignmentNumber) {
    const assignmentIndex = assignmentNumber - 1;
    if (assignmentsData[assignmentIndex] && assignmentsData[assignmentIndex].order_id) {
        return assignmentsData[assignmentIndex].order_id;
    }
    return null;
}

function getArtistNameForAssignment(assignmentNumber) {
    const assignmentIndex = assignmentNumber - 1;
    if (assignmentsData[assignmentIndex] && assignmentsData[assignmentIndex].artist_name) {
        return assignmentsData[assignmentIndex].artist_name;
    }
    return 'Неизвестен художник';
}

function markAsComplete(assignmentNumber, assignmentUrl) {
    if (!currentUser) {
        alert('Грешка: Няма данни за потребителя');
        return;
    }
    
    pendingCompleteData = {
        artist_number: currentUser.artist_number,
        artist_name: getArtistNameForAssignment(assignmentNumber),
        assignment_url: assignmentUrl,
        order_id: getOrderIdForAssignment(assignmentNumber)
    };
    
    document.getElementById('confirmationModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

async function confirmComplete() {
    if (!pendingCompleteData) {
        return;
    }
    
    try {
        const response = await fetch(CONFIG.COMPLETE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pendingCompleteData)
        });
        
        if (response.ok) {
            alert('✅ Заданието е отбелязано като завършено! Ще получите потвърждение по имейл.');
            
            const cards = document.querySelectorAll('.assignment-card');
            cards.forEach((card, index) => {
                if (index + 1 === pendingCompleteData.assignment_number) {
                    card.style.opacity = '0.5';
                    card.style.transform = 'scale(0.95)';
                    const completeBtn = card.querySelector('.complete-btn');
                    if (completeBtn) {
                        completeBtn.textContent = '✅ ИЗПРАТЕНО';
                        completeBtn.disabled = true;
                    }
                }
            });
        } else {
            const errorData = await response.json();
            alert('Грешка при изпращането: ' + (errorData.message || 'Моля опитайте отново'));
        }
    } catch (error) {
        console.error('Error marking assignment as complete:', error);
        alert('Грешка при свързването със сървъра. Моля опитайте отново.');
    }
    
    cancelComplete();
}

function cancelComplete() {
    document.getElementById('confirmationModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    pendingCompleteData = null;
}