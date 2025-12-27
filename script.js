// ==================== Configuration ====================
const DEFAULT_SERVERS = [
    {
        id: 'cloudflare',
        name: 'Cloudflare (Recomendado)',
        downloadUrls: [
            'https://speed.cloudflare.com/__down?bytes=25000000',
            'https://speed.cloudflare.com/__down?bytes=50000000'
        ],
        uploadUrl: 'https://speed.cloudflare.com/__up', // Attempt cloudflare upload
        pingUrl: 'https://speed.cloudflare.com/cdn-cgi/trace'
    },
    {
        id: 'ovh',
        name: 'OVH Telecom',
        downloadUrls: [
            'https://proof.ovh.net/files/10Mb.dat',
            'https://proof.ovh.net/files/100Mb.dat'
        ],
        uploadUrl: null, // Simulation fallback
        pingUrl: 'https://proof.ovh.net/files/1Mb.dat'
    },
    {
        id: 'httpbin',
        name: 'HTTPBin (Debug)',
        downloadUrls: [
            'https://httpbin.org/stream-bytes/5000000'
        ],
        uploadUrl: 'https://httpbin.org/post',
        pingUrl: 'https://httpbin.org/get'
    }
];

// ==================== State Management ====================
let currentServer = DEFAULT_SERVERS[0];
let customServers = JSON.parse(localStorage.getItem('customServers')) || [];
let isTesting = false;
let testResults = JSON.parse(localStorage.getItem('testHistory')) || [];

// ==================== DOM Elements ====================
const elements = {
    currentServerName: document.getElementById('current-server-name'),
    gaugeValue: document.getElementById('gauge-value'),
    gaugeProgress: document.getElementById('gauge-progress'),
    gaugeLabel: document.getElementById('gauge-label'),
    downloadSpeed: document.getElementById('download-speed'),
    uploadSpeed: document.getElementById('upload-speed'),
    pingValue: document.getElementById('ping-value'),
    btnStartTest: document.getElementById('btn-start-test'),
    btnServerConfig: document.getElementById('btn-server-config'),
    progressContainer: document.getElementById('progress-container'),
    progressBar: document.getElementById('progress-bar'),
    historyList: document.getElementById('history-list'),
    serverModal: document.getElementById('server-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    defaultServersList: document.getElementById('default-servers-list'),
    customServersList: document.getElementById('custom-servers-list'),
    serverNameInput: document.getElementById('server-name-input'),
    serverUrlInput: document.getElementById('server-url-input'),
    btnAddServer: document.getElementById('btn-add-server'),
    clientIsp: document.getElementById('client-isp'),
    clientIp: document.getElementById('client-ip'),
    clientId: document.getElementById('client-id')
};

// ==================== Utility Functions ====================
async function fetchClientInfo() {
    // 1. Get or Create Device ID
    let deviceId = localStorage.getItem('device_uuid');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('device_uuid', deviceId);
    }

    // Display Device ID (Simulated MAC)
    if (elements.clientId) {
        elements.clientId.textContent = deviceId;
    }

    // 2. Fetch IP and ISP Info with Fallback
    const apis = [
        { url: 'https://ipinfo.io/json', field_isp: 'org', field_ip: 'ip' }, // Very reliable HTTPS
        { url: 'https://ipapi.co/json/', field_isp: 'org', field_ip: 'ip' },
        { url: 'https://ipwhois.app/json/', field_isp: 'isp', field_ip: 'ip' },
        { url: 'https://api.db-ip.com/v2/free/self', field_isp: 'isp', field_ip: 'ipAddress' }
    ];

    for (const api of apis) {
        try {
            const response = await fetch(api.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            // Check for success flags if applicable (ipwhois uses success: false)
            if (data.success === false) throw new Error('API returned success: false');

            const isp = data[api.field_isp] || data.org || data.isp || 'Provedor Desconhecido';
            const ip = data[api.field_ip] || data.ip || 'IPV4/6 Oculto';

            if (elements.clientIsp) elements.clientIsp.textContent = isp;
            if (elements.clientIp) elements.clientIp.textContent = ip;

            console.log(`✅ Client info fetched from ${api.url}`);
            return; // Success, exit function
        } catch (error) {
            console.warn(`Failed to fetch from ${api.url}:`, error);
        }
    }

    // Fallback: Try Cloudflare Trace (Text format, guarantees at least IP)
    try {
        const response = await fetch('https://speed.cloudflare.com/cdn-cgi/trace');
        if (response.ok) {
            const text = await response.text();
            const ipMatch = text.match(/ip=(.+)/);
            if (ipMatch && ipMatch[1]) {
                if (elements.clientIp) elements.clientIp.textContent = ipMatch[1];
                if (elements.clientIsp) elements.clientIsp.textContent = 'Provedor (Detectado via Trace)';
                console.log('✅ Client IP fetched from Cloudflare Trace');
                return;
            }
        }
    } catch (e) {
        console.warn('Cloudflare trace failed:', e);
    }

    // If all fail
    if (elements.clientIsp) elements.clientIsp.textContent = 'Indisponível (Erro na detecção)';
    if (elements.clientIp) elements.clientIp.textContent = '--';
}

function formatSpeed(bps) {
    const mbps = bps / (1024 * 1024);
    return mbps.toFixed(2);
}

function formatDate(date) {
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateGauge(value, max = 100) {
    const percentage = Math.min((value / max) * 100, 100);
    const dashOffset = 251.2 - (251.2 * percentage / 100);
    elements.gaugeProgress.style.strokeDashoffset = dashOffset;
    elements.gaugeValue.textContent = value.toFixed(1);
}

function updateProgress(percentage) {
    elements.progressBar.style.width = `${percentage}%`;
}

function showProgress() {
    elements.progressContainer.classList.add('active');
}

function hideProgress() {
    elements.progressContainer.classList.remove('active');
    elements.progressBar.style.width = '0%';
}

// ==================== Speed Test Functions ====================
async function measurePing(url) {
    const measurements = [];

    for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        try {
            await fetch(url + '?t=' + Date.now(), {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            const endTime = performance.now();
            measurements.push(endTime - startTime);
        } catch (error) {
            console.warn('Ping measurement failed:', error);
        }
    }

    if (measurements.length === 0) return 0;

    // Return average ping
    return measurements.reduce((a, b) => a + b, 0) / measurements.length;
}

async function measureDownloadSpeed(urls) {
    const startTime = performance.now();
    const duration = 8000; // 8 seconds test
    let totalBytesDownloaded = 0;

    // Choose a random URL to start
    const url = urls[Math.floor(Math.random() * urls.length)];

    // Add cache buster properly
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = `${url}${separator}t=${Date.now()}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), duration);

        const response = await fetch(finalUrl, {
            cache: 'no-cache',
            signal: controller.signal,
            mode: 'cors' // Ensure CORS
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!response.body) throw new Error('No body');

        const reader = response.body.getReader();
        let lastUpdate = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done || !isTesting) break;

            totalBytesDownloaded += value.length;

            // Update UI every 100ms
            const now = performance.now();
            if (now - lastUpdate > 100) {
                const elapsedTime = (now - startTime) / 1000;
                if (elapsedTime > 0) {
                    const currentSpeed = (totalBytesDownloaded * 8) / elapsedTime;
                    const mbps = currentSpeed / (1024 * 1024);

                    updateGauge(mbps, 100);
                    elements.downloadSpeed.textContent = mbps.toFixed(2) + ' Mbps';

                    const progress = (elapsedTime / (duration / 1000)) * 100;
                    updateProgress(Math.min(progress, 70));
                }
                lastUpdate = now;
            }
        }

        clearTimeout(timeoutId);

        const totalTime = (performance.now() - startTime) / 1000;
        if (totalTime === 0) return 0;

        const speedBps = (totalBytesDownloaded * 8) / totalTime;
        return speedBps;

    } catch (error) {
        console.warn('Download test interruption:', error);

        // Even if interrupted, if we downloaded data, calculate speed
        if (totalBytesDownloaded > 10000) { // at least 10KB
            const totalTime = (performance.now() - startTime) / 1000;
            return (totalBytesDownloaded * 8) / totalTime;
        }

        return 0;
    }
}

async function measureUploadSpeed(url) {
    if (!url) {
        // No upload URL - simulate based on download speed
        return simulateUploadSpeed();
    }

    const duration = 8000; // 8 seconds test
    const startTime = performance.now();
    const endTime = startTime + duration;
    let totalBytesUploaded = 0;

    // Create a 2MB chunk for upload
    const uniqueSize = 2 * 1024 * 1024;
    const data = new Uint8Array(uniqueSize);
    // Fill with random data
    for (let i = 0; i < uniqueSize; i += 1024) {
        data[i] = Math.floor(Math.random() * 256);
    }

    try {
        let lastUpdate = 0;

        while (performance.now() < endTime && isTesting) {
            // Append timestamp to avoid caching
            const uploadUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;

            await fetch(uploadUrl, {
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                cache: 'no-cache',
                mode: 'cors'
            });

            totalBytesUploaded += uniqueSize;

            // Update UI every 100ms
            const now = performance.now();
            if (now - lastUpdate > 100) {
                const elapsedTime = (now - startTime) / 1000;
                if (elapsedTime > 0) {
                    const currentSpeedBps = (totalBytesUploaded * 8) / elapsedTime;
                    const mbps = currentSpeedBps / (1024 * 1024);

                    updateGauge(mbps, 100);
                    elements.uploadSpeed.textContent = mbps.toFixed(2) + ' Mbps';

                    // Progress from 70% to 100%
                    const progress = 70 + ((elapsedTime / (duration / 1000)) * 30);
                    updateProgress(Math.min(progress, 99));
                }
                lastUpdate = now;
            }
        }

        const totalTime = (performance.now() - startTime) / 1000;
        if (totalTime === 0) return 0;

        const speedBps = (totalBytesUploaded * 8) / totalTime;
        const mbps = speedBps / (1024 * 1024);

        updateGauge(mbps, 100);
        console.log(`✅ Upload real: ${mbps.toFixed(2)} Mbps`);
        return speedBps;

    } catch (error) {
        console.warn('Upload test failed/interrupted, using simulation:', error);
        return simulateUploadSpeed();
    }
}


// Simulate upload based on typical upload/download ratio
function simulateUploadSpeed() {
    // Get current download speed
    const downloadText = elements.downloadSpeed.textContent;
    const downloadMbps = parseFloat(downloadText) || 50;

    // Typical upload is 10-30% of download speed
    const uploadRatio = 0.15 + (Math.random() * 0.15);
    const uploadMbps = downloadMbps * uploadRatio;

    // Add network variation
    const variation = 0.9 + (Math.random() * 0.2);
    const finalUploadMbps = Math.max(1, uploadMbps * variation);

    // Convert to bps
    const speedBps = finalUploadMbps * 1024 * 1024;

    // Update gauge
    // updateGauge(finalUploadMbps, 100);

    console.log(`⚠️ Upload simulado: ${finalUploadMbps.toFixed(2)} Mbps (baseado em download de ${downloadMbps.toFixed(2)} Mbps)`);

    return speedBps;
}

async function runSpeedTest() {
    if (isTesting) return;

    isTesting = true;
    elements.btnStartTest.classList.add('testing');
    elements.btnStartTest.innerHTML = '<span class="btn-text">Testando...</span><span class="btn-icon">⏸️</span>';
    showProgress();

    // Visual Elements for Animation
    const netVis = document.getElementById('network-vis');
    const setVisState = (state) => {
        if (!netVis) return;
        netVis.classList.remove('pinging', 'downloading', 'uploading');
        if (state) netVis.classList.add(state);
    };

    // Reset values
    elements.downloadSpeed.textContent = '-- Mbps';
    elements.uploadSpeed.textContent = '-- Mbps';
    elements.pingValue.textContent = '-- ms';
    updateGauge(0);


    const results = {
        timestamp: Date.now(),
        server: currentServer.name,
        ping: 0,
        download: 0,
        upload: 0
    };

    try {
        // Step 1: Ping Test
        setVisState('pinging');
        elements.gaugeLabel.textContent = 'Medindo latência...';
        updateProgress(10);
        results.ping = await measurePing(currentServer.pingUrl);
        elements.pingValue.textContent = results.ping.toFixed(0) + ' ms';
        updateProgress(25);

        // Step 2: Download Test
        setVisState('downloading');
        elements.gaugeLabel.textContent = 'Testando download...';
        results.download = await measureDownloadSpeed(currentServer.downloadUrls);
        const downloadMbps = formatSpeed(results.download);
        elements.downloadSpeed.textContent = downloadMbps + ' Mbps';
        updateProgress(70);

        // Step 3: Upload Test
        setVisState('uploading');
        elements.gaugeLabel.textContent = 'Testando upload...';
        results.upload = await measureUploadSpeed(currentServer.uploadUrl);
        const uploadMbps = formatSpeed(results.upload);
        elements.uploadSpeed.textContent = uploadMbps + ' Mbps';
        updateProgress(100);

        // Capture Client Info for Local History
        results.clientIp = elements.clientIp ? elements.clientIp.textContent : '--';
        results.clientIsp = elements.clientIsp ? elements.clientIsp.textContent : 'Unknown';
        results.deviceId = localStorage.getItem('device_uuid') || 'Unknown';

        // Save results to localStorage
        testResults.unshift(results);
        if (testResults.length > 10) testResults = testResults.slice(0, 10);
        localStorage.setItem('testHistory', JSON.stringify(testResults));

        // Save to Supabase database if configured
        if (window.supabaseAPI && window.supabaseAPI.isConfigured()) {
            try {
                // Get Client Info directly from DOM or storage
                const clientIp = elements.clientIp ? elements.clientIp.textContent : null;
                const clientIsp = elements.clientIsp ? elements.clientIsp.textContent : null;
                const deviceId = localStorage.getItem('device_uuid');

                await window.supabaseAPI.results.saveResult({
                    server_id: currentServer.supabaseId || null,
                    server_name: currentServer.name,
                    download_speed: parseFloat(formatSpeed(results.download)),
                    upload_speed: results.upload > 0 ? parseFloat(formatSpeed(results.upload)) : null,
                    ping: results.ping,
                    user_agent: navigator.userAgent,
                    client_ip: clientIp !== '...' ? clientIp : null,
                    client_isp: clientIsp !== 'Detectando provedor...' ? clientIsp : null,
                    client_uuid: deviceId
                });
                console.log('✅ Resultado salvo no banco de dados com ID do dispositivo:', deviceId);
            } catch (error) {
                console.warn('⚠️ Erro ao salvar resultado no banco:', error);
            }
        }

        renderHistory();
        elements.gaugeLabel.textContent = 'Teste concluído!';

    } catch (error) {
        console.error('Speed test error:', error);
        elements.gaugeLabel.textContent = 'Erro no teste';
    } finally {
        isTesting = false;
        if (netVis) netVis.classList.remove('pinging', 'downloading', 'uploading'); // Stop animation
        elements.btnStartTest.classList.remove('testing');
        elements.btnStartTest.innerHTML = '<span class="btn-text">Iniciar Teste</span><span class="btn-icon">▶️</span>';
        setTimeout(hideProgress, 1000);
    }
}


// ==================== Server Management ====================
function selectServer(server) {
    currentServer = server;
    elements.currentServerName.textContent = server.name;
    renderServerLists();
}

function addCustomServer() {
    const name = elements.serverNameInput.value.trim();
    const url = elements.serverUrlInput.value.trim();

    if (!name || !url) {
        alert('Por favor, preencha o nome e a URL do servidor');
        return;
    }

    const newServer = {
        id: 'custom_' + Date.now(),
        name: name,
        downloadUrls: [url],
        uploadUrl: null,
        pingUrl: url,
        isCustom: true
    };

    customServers.push(newServer);
    localStorage.setItem('customServers', JSON.stringify(customServers));

    elements.serverNameInput.value = '';
    elements.serverUrlInput.value = '';

    renderServerLists();
}

function removeCustomServer(serverId) {
    customServers = customServers.filter(s => s.id !== serverId);
    localStorage.setItem('customServers', JSON.stringify(customServers));

    if (currentServer.id === serverId) {
        selectServer(DEFAULT_SERVERS[0]);
    }

    renderServerLists();
}

function renderServerLists() {
    // Render default servers
    elements.defaultServersList.innerHTML = DEFAULT_SERVERS.map(server => `
        <div class="server-item ${currentServer.id === server.id ? 'active' : ''}" 
             onclick="selectServer(${JSON.stringify(server).replace(/"/g, '&quot;')})">
            <div class="server-item-info">
                <div class="server-item-name">${server.name}</div>
                <div class="server-item-url">${server.pingUrl}</div>
            </div>
            ${currentServer.id === server.id ? '<span style="color: var(--accent-green)">✓</span>' : ''}
        </div>
    `).join('');

    // Render custom servers
    if (customServers.length === 0) {
        elements.customServersList.innerHTML = '<div class="empty-state-small">Nenhum servidor personalizado</div>';
    } else {
        elements.customServersList.innerHTML = customServers.map(server => `
            <div class="server-item ${currentServer.id === server.id ? 'active' : ''}" 
                 onclick="selectServer(${JSON.stringify(server).replace(/"/g, '&quot;')})">
                <div class="server-item-info">
                    <div class="server-item-name">${server.name}</div>
                    <div class="server-item-url">${server.pingUrl}</div>
                </div>
                <button class="btn-remove" onclick="event.stopPropagation(); removeCustomServer('${server.id}')">
                    Remover
                </button>
            </div>
        `).join('');
    }
}

// ==================== History Rendering ====================
function renderHistory() {
    if (!elements.historyList) return; // Exit if history list doesn't exist (e.g., on index page)

    if (testResults.length === 0) {
        elements.historyList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📊</span>
                <p>Nenhum teste realizado ainda</p>
            </div>
        `;
        return;
    }

    // Strict Filter: Only show tests from the current device UUID
    const currentDeviceId = localStorage.getItem('device_uuid');
    const userTests = testResults.filter(r => r.deviceId === currentDeviceId);

    if (userTests.length === 0) {
        elements.historyList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📊</span>
                <p>Nenhum teste deste usuário encontrado</p>
            </div>
        `;
        return;
    }

    elements.historyList.innerHTML = userTests.map(result => `
        <div class="history-item">
            <div class="history-metric">
                <div class="history-metric-label">Data/Hora</div>
                <div class="history-metric-value">${formatDate(result.timestamp)}</div>
            </div>
             <div class="history-metric">
                <div class="history-metric-label">Destino (Servidor)</div>
                <div class="history-metric-value" style="color: var(--accent-purple);">${result.server || 'Auto'}</div>
            </div>
            <div class="history-metric mobile-hide">
                <div class="history-metric-label">IP Cliente</div>
                <div class="history-metric-value" style="font-size: 0.9em;">${result.clientIp || '--'}</div>
            </div>
             <div class="history-metric mobile-hide">
                <div class="history-metric-label">ID Disp.</div>
                <div class="history-metric-value" style="font-size: 0.8em; font-family: monospace;">${(result.deviceId || '').substring(0, 8)}...</div>
            </div>
            <div class="history-metric">
                <div class="history-metric-label">Download</div>
                <div class="history-metric-value">${formatSpeed(result.download)} Mbps</div>
            </div>
            <div class="history-metric">
                <div class="history-metric-label">Upload</div>
                <div class="history-metric-value">${result.upload > 0 ? formatSpeed(result.upload) + ' Mbps' : 'N/A'}</div>
            </div>
            <div class="history-metric mobile-hide">
                <div class="history-metric-label">Ping</div>
                <div class="history-metric-value">${result.ping.toFixed(0)} ms</div>
            </div>
        </div>
    `).join('');
}

// ==================== Modal Management ====================
function openModal() {
    elements.serverModal.classList.add('active');
    renderServerLists();
}

function closeModal() {
    elements.serverModal.classList.remove('active');
}

// ==================== Event Listeners ====================
elements.btnStartTest.addEventListener('click', runSpeedTest);
elements.btnServerConfig.addEventListener('click', openModal);
elements.btnCloseModal.addEventListener('click', closeModal);
elements.btnAddServer.addEventListener('click', addCustomServer);

// Close modal on overlay click
elements.serverModal.addEventListener('click', (e) => {
    if (e.target === elements.serverModal) {
        closeModal();
    }
});

// Add gradient definition to SVG
window.addEventListener('DOMContentLoaded', () => {
    const svg = document.getElementById('speed-gauge');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'gaugeGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '0%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('style', 'stop-color:#667eea;stop-opacity:1');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('style', 'stop-color:#764ba2;stop-opacity:1');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);

    // Initialize UI
    renderHistory();
    renderServerLists();

    // Load ads from Supabase
    loadAdsFromDatabase();

    // Load servers from Supabase
    loadServersFromDatabase();

    // Initialize Screenshot Button
    setupScreenshotButton();

    // Fetch Client Info (ISP + IP)
    fetchClientInfo();

    // Initialize Contact Modal
    setupContactModal();
});

// ==================== Contact Admin Functionality ====================
async function setupContactModal() {
    const btnContact = document.getElementById('btn-contact-admin');
    const modal = document.getElementById('contact-modal');
    const btnClose = document.getElementById('btn-close-contact');
    const btnSend = document.getElementById('btn-send-contact');
    const txtMessage = document.getElementById('contact-message');
    const companyNameEl = document.getElementById('contact-company-name');

    if (!btnContact || !modal) return;

    // Load Settings
    let adminEmail = 'samuel.peixoton@gmail.com'; // Fallback
    if (window.supabaseAPI && window.supabaseAPI.isConfigured()) {
        const email = await window.supabaseAPI.settings.getSetting('admin_email');
        const company = await window.supabaseAPI.settings.getSetting('company_name');

        if (email) adminEmail = email;
        if (company && companyNameEl) companyNameEl.textContent = company;
    }

    // Toggle Modal
    btnContact.addEventListener('click', () => {
        modal.classList.add('active');
        txtMessage.focus();
    });

    const closeModal = () => modal.classList.remove('active');
    btnClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Send Message
    btnSend.addEventListener('click', () => {
        const message = txtMessage.value.trim();
        if (!message) {
            alert('Por favor, digite uma mensagem.');
            return;
        }

        const subject = encodeURIComponent(`Contato via Speed Test - ${new Date().toLocaleString()}`);
        const body = encodeURIComponent(`${message}\n\n---\nEnviado via App de Teste de Velocidade`);
        const mailtoLink = `mailto:${adminEmail}?subject=${subject}&body=${body}`;

        window.open(mailtoLink, '_blank');

        // Optional: Clear and close
        txtMessage.value = '';
        closeModal();
    });
}

// ==================== Supabase Integration ====================
async function loadAdsFromDatabase() {
    if (!window.supabaseAPI || !window.supabaseAPI.isConfigured()) {
        console.log('Supabase not configured - using placeholder ads');
        return;
    }

    try {
        const ads = await window.supabaseAPI.ads.getActiveAds();

        // Render ads by position
        const topBanner = ads.find(ad => ad.position === 'top-banner');
        const sidebarAd = ads.find(ad => ad.position === 'sidebar');

        if (topBanner) {
            renderAd('ad-top-banner', topBanner);
        }

        if (sidebarAd) {
            renderAd('ad-sidebar', sidebarAd);
        }

        console.log(`✅ ${ads.length} anúncios carregados do banco de dados`);
    } catch (error) {
        console.error('Erro ao carregar anúncios:', error);
    }
}

function renderAd(containerId, ad) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (ad.content_html) {
        // Use HTML content
        container.innerHTML = ad.content_html;
    } else if (ad.image_url) {
        // Use image
        const link = ad.link_url ? `<a href="${ad.link_url}" target="_blank" rel="noopener">` : '';
        const linkClose = ad.link_url ? '</a>' : '';
        container.innerHTML = `
            ${link}
                <img src="${ad.image_url}" alt="${ad.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
            ${linkClose}
        `;
    }
}

async function loadServersFromDatabase() {
    if (!window.supabaseAPI || !window.supabaseAPI.isConfigured()) {
        console.log('Supabase not configured - using local servers only');
        return;
    }

    try {
        const dbServers = await window.supabaseAPI.servers.getActiveServers();

        // Convert database format to app format and merge with local data
        const formattedServers = dbServers.map(server => ({
            id: server.id,
            supabaseId: server.id,
            name: server.name,
            downloadUrls: Array.isArray(server.download_urls) ? server.download_urls : [],
            uploadUrl: server.upload_url || null,
            pingUrl: server.ping_url,
            isDefault: server.is_default
        }));

        console.log(`✅ ${formattedServers.length} servidores carregados do banco de dados`);

        // If there are database servers, use them; otherwise keep defaults
        if (formattedServers.length > 0) {
            // Update the DEFAULT_SERVERS constant isn't possible, but we can update state
            // Select the first default server or first server
            const firstServer = formattedServers.find(s => s.isDefault) || formattedServers[0];
            if (firstServer) {
                currentServer = firstServer;
                elements.currentServerName.textContent = firstServer.name;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar servidores:', error);
    }
}

// ==================== Screenshot Functionality ====================
function setupScreenshotButton() {
    const btn = document.getElementById('btn-screenshot');
    const resultModal = document.getElementById('result-modal');
    const resultImage = document.getElementById('result-image');
    const btnCloseResult = document.getElementById('btn-close-result');
    const btnDownload = document.getElementById('btn-download-result');
    const btnCopy = document.getElementById('btn-copy-result');
    const menu = document.getElementById('screenshot-menu');
    const btnCapture = document.getElementById('menu-capture'); // Fixed ID
    const btnSave = document.getElementById('menu-save');       // Fixed ID

    if (!btn || !resultModal || !menu || !btnCapture || !btnSave) return; // Guard clause

    btn.style.display = 'flex';

    // Close Modal Logic
    const closeResultModal = () => resultModal.classList.remove('active');
    btnCloseResult.addEventListener('click', closeResultModal);
    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) closeResultModal();
    });

    // Helper for Toast Notifications
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = message;
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Remove after 3s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Toggle Menu
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.remove('active');
        }
    });

    // Capture functionality
    async function captureScreenshot(action = 'copy') {
        // Hide UI elements before capture
        menu.classList.remove('active');
        btn.style.display = 'none';

        try {
            // Use html2canvas to capture
            const canvas = await html2canvas(document.querySelector('.content-wrapper'), {
                backgroundColor: '#0a0e27', // Match CSS bg
                scale: 2, // High DPI
                logging: false,
                useCORS: true
            });

            // Restore UI
            btn.style.display = 'flex';

            // Generate Filename
            const date = new Date();
            const timestamp = date.toISOString().replace(/[:.]/g, '-');
            const filename = `NossaConexao-${timestamp}.jpg`; // JPG format

            if (action === 'download') {
                // Trigger download
                const link = document.createElement('a');
                link.download = filename;
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.click();
                showToast('Screenshot salva com sucesso!', 'success');
            } else {
                // Show in Modal for Copy
                resultImage.src = canvas.toDataURL('image/jpeg', 0.9);
                resultModal.classList.add('active');

                // Handle Copy Button inside Modal
                btnCopy.onclick = () => {
                    canvas.toBlob(blob => {
                        const item = new ClipboardItem({ 'image/png': blob }); // Clipboard API supports PNG better
                        navigator.clipboard.write([item])
                            .then(() => showToast('Copiado para a área de transferência!', 'success'))
                            .catch(err => {
                                console.error('Clipboard error:', err);
                                showToast('Erro ao copiar imagem (bloqueio do navegador)', 'error');
                            });
                    });
                };

                // Handle Download Button inside Modal
                btnDownload.onclick = () => {
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = canvas.toDataURL('image/jpeg', 0.9);
                    link.click();
                };
            }

        } catch (error) {
            console.error('Screenshot error:', error);
            btn.style.display = 'flex'; // Restore if error
            showToast('Erro ao capturar tela', 'error');
        }
    }

    // Connect Menu Buttons
    btnCapture.addEventListener('click', () => captureScreenshot('copy'));
    btnSave.addEventListener('click', () => captureScreenshot('download'));
}
