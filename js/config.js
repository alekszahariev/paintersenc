// Конфигурация и константи
const CONFIG = {
    WEBHOOK_URL: 'https://primary-production-f22c.up.railway.app/webhook/276bc1e6-85fb-4520-b346-5735fe3d9849',
    COMPLETE_WEBHOOK_URL: 'https://primary-production-f22c.up.railway.app/webhook/aa8530a9-c36a-4c8e-9615-d88e4334f0d4',
    FINANCES_WEBHOOK_URL: 'https://primary-production-f22c.up.railway.app/webhook/8508f046-0b6d-43c1-9980-f6bc433a1f65'
};

// Глобални променливи
let currentUser = null;
let pendingCompleteData = null;
let assignmentsData = [];

