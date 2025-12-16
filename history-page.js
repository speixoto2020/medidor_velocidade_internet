
// DOM Elements
const historyList = document.getElementById('full-history-list');
const btnClear = document.getElementById('btn-clear-history');

// Formatters (Copied from script.js for consistency)
function formatSpeed(bps) {
    const mbps = bps / (1024 * 1024);
    return mbps.toFixed(2);
}

function formatDate(date) {
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderHistory() {
    const testResults = JSON.parse(localStorage.getItem('testHistory')) || [];
    const currentDeviceId = localStorage.getItem('device_uuid');

    // Filter by device
    const userTests = testResults.filter(r => r.deviceId === currentDeviceId);

    if (userTests.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📊</span>
                <p>Nenhum teste encontrado neste dispositivo.</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = userTests.map(result => `
        <div class="history-item">
            <div class="history-metric">
                <div class="history-metric-label">Data</div>
                <div class="history-metric-value" style="font-size: 0.9em;">${formatDate(result.timestamp)}</div>
            </div>
             <div class="history-metric">
                <div class="history-metric-label">Servidor</div>
                <div class="history-metric-value" style="color: var(--accent-purple); font-size: 0.9em;">${result.server || 'Auto'}</div>
            </div>
            <div class="history-metric">
                <div class="history-metric-label">Download</div>
                <div class="history-metric-value" style="color: var(--accent-cyan);">${formatSpeed(result.download)}</div>
                <div class="history-metric-label" style="font-size: 0.6em;">Mbps</div>
            </div>
            <div class="history-metric">
                <div class="history-metric-label">Upload</div>
                <div class="history-metric-value" style="color: var(--accent-pink);">${result.upload > 0 ? formatSpeed(result.upload) : '--'}</div>
                <div class="history-metric-label" style="font-size: 0.6em;">Mbps</div>
            </div>
            <div class="history-metric">
                <div class="history-metric-label">Ping</div>
                <div class="history-metric-value">${result.ping.toFixed(0)}</div>
                <div class="history-metric-label" style="font-size: 0.6em;">ms</div>
            </div>
             <div class="history-metric mobile-hide">
                <div class="history-metric-label">IP</div>
                <div class="history-metric-value" style="font-size: 0.8em;">${result.clientIp || '--'}</div>
            </div>
             <div class="history-metric mobile-hide">
                <div class="history-metric-label">ISP</div>
                <div class="history-metric-value" style="font-size: 0.8em;">${result.clientIsp || '--'}</div>
            </div>
        </div>
    `).join('');
}

function clearHistory() {
    if (confirm('Tem certeza que deseja apagar todo o histórico deste dispositivo?')) {
        // We need to be careful to only remove THIS device's history if we were storing multiple,
        // but currently local storage structure implies a simple list. 
        // However, to be safe and consistent with "Filter by device", we should filter OUT this device's tests.

        let testResults = JSON.parse(localStorage.getItem('testHistory')) || [];
        const currentDeviceId = localStorage.getItem('device_uuid');

        // Keep only tests that do NOT match this device ID (if any exist from other contexts, though usually LS is local)
        // In a pure local context, this just clears relevant items.
        const otherTests = testResults.filter(r => r.deviceId !== currentDeviceId);

        localStorage.setItem('testHistory', JSON.stringify(otherTests));
        renderHistory();
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
    if (btnClear) btnClear.addEventListener('click', clearHistory);
});
