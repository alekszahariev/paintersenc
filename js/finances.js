// Финансови данни
async function showFinances() {
    if (!currentUser) {
        alert('Грешка: Няма данни за потребителя');
        return;
    }

    // Show finances modal
    document.getElementById('financesModal').style.display = 'block';
    document.getElementById('financesLoading').style.display = 'block';
    document.getElementById('financesError').style.display = 'none';
    document.getElementById('financesData').style.display = 'none';
    document.body.style.overflow = 'hidden';

    try {
        // Fetch financial data from webhook (сега вече обединени данни)
        const response = await fetch(CONFIG.FINANCES_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                artist_number: currentUser.artist_number
            })
        });

        document.getElementById('financesLoading').style.display = 'none';

        if (response.ok) {
            const financialData = await response.json();
            displayFinancialData(financialData);
        } else {
            document.getElementById('financesError').style.display = 'block';
        }
    } catch (error) {
        document.getElementById('financesLoading').style.display = 'none';
        document.getElementById('financesError').style.display = 'block';
    }
}

function displayFinancialData(data) {
    // Проверяваме дали данните идват като масив и вземаме първия елемент
    const actualData = Array.isArray(data) ? data[0] : data;
    
    // Извличаме данните от новата структура на n8n
    const summary = actualData.summary || {};
    const paymentsHistory = actualData.payments_history || [];
    
    // Update summary cards с данните от summary обекта
    document.getElementById('totalTasks').textContent = summary.Tasks || 0;
    document.getElementById('totalAmount').textContent = (summary.Amount || 0).toFixed(2) + ' лв.';
    document.getElementById('totalPaid').textContent = (summary.Paid || 0).toFixed(2) + ' лв.';
    document.getElementById('totalToPay').textContent = (summary['To pay now'] || 0).toFixed(2) + ' лв.';

    // Populate financial cards
    const cardsContainer = document.getElementById('financesCardsContainer');
    cardsContainer.innerHTML = '';

    // Създаваме една карта със summary данните
    const card = document.createElement('div');
    card.className = 'finance-card';
    
    // Determine status based on PaidAmou_t field
    let statusClass = 'status-no-records';
    let statusText = 'Няма записи';
    
    const paidAmount = parseInt(summary.PaidAmou_t) || 0;
    
    if (paidAmount > 0) {
        statusClass = 'status-paid';
        statusText = `${paidAmount} Плащания`;
    } else if (parseFloat(summary.Paid) > 0) {
        statusClass = 'status-pending';
        statusText = 'В обработка';
    }

    // Format task count display
    const taskCount = parseInt(summary.Tasks) || 0;
    const tasksText = taskCount === 1 ? `${taskCount} Задание` : `${taskCount} Задания`;

    card.innerHTML = `
        <div class="finance-card-header">
            <div class="tasks-count">${tasksText}</div>
            <div class="status-badge ${statusClass}">${statusText}</div>
        </div>
        
        <div class="finance-amounts">
            <div class="amount-item total">
                <div class="amount-label">Обща стойност</div>
                <div class="amount-value">${(summary.Amount || 0).toFixed(2)} лв.</div>
            </div>
            <div class="amount-item paid">
                <div class="amount-label">Изплатено</div>
                <div class="amount-value">${(summary.Paid || 0).toFixed(2)} лв.</div>
            </div>
            <div class="amount-item to-pay">
                <div class="amount-label">За изплащане</div>
                <div class="amount-value">${(summary['To pay now'] || 0).toFixed(2)} лв.</div>
            </div>
        </div>
    `;
    
    cardsContainer.appendChild(card);

    // Populate payments history с новите данни
    displayPaymentsHistory(paymentsHistory);

    document.getElementById('financesData').style.display = 'block';
}

function displayPaymentsHistory(paymentsData) {
    const paymentsContainer = document.getElementById('paymentsHistoryContainer');
    paymentsContainer.innerHTML = '';

    if (!paymentsData || paymentsData.length === 0) {
        paymentsContainer.innerHTML = `
            <div class="no-payments">
                <div class="no-payments-icon">💳</div>
                <div class="no-payments-text">Няма регистрирани плащания</div>
            </div>
        `;
        return;
    }

    // Sort payments by date (newest first)
    const sortedPayments = paymentsData.sort((a, b) => {
        const dateA = new Date(a.Date || a.CreatedAt);
        const dateB = new Date(b.Date || b.CreatedAt);
        return dateB - dateA;
    });

    sortedPayments.forEach((payment, index) => {
        const paymentCard = document.createElement('div');
        paymentCard.className = 'payment-history-card';
        
        // Format date
        const paymentDate = new Date(payment.Date || payment.CreatedAt);
        const formattedDate = paymentDate.toLocaleDateString('bg-BG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Format amount
        const amount = parseFloat(payment.Amount || 0);
        
        // Get payment notes
        const notes = payment.Notes || 'Няма бележки';
        
        // Get painter name from nested Painters object
        const painterName = payment.Painters ? payment.Painters.Title : 'Неизвестен художник';

        paymentCard.innerHTML = `
            <div class="payment-card-header">
                <div class="payment-date">📅 ${formattedDate}</div>
                <div class="payment-amount">${amount.toFixed(2)} лв.</div>
            </div>
            <div class="payment-details">
                <div class="payment-notes">📝 ${notes}</div>
            </div>
        `;
        
        // Add animation delay
        paymentCard.style.animationDelay = `${index * 0.1}s`;
        paymentsContainer.appendChild(paymentCard);
    });
}

function closeFinances() {
    document.getElementById('financesModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}