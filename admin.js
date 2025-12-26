// ================================================
// Admin Panel JavaScript
// ================================================

let currentUser = null;
let currentSection = 'dashboard';
let currentAdId = null;
let currentServerId = null;

// ================================================
// Authentication
// ================================================
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    try {
        errorEl.textContent = '';
        const data = await window.supabaseAPI.auth.signIn(email, password);
        currentUser = data.user;
        showDashboard();
    } catch (error) {
        errorEl.textContent = error.message || 'Erro ao fazer login';
        console.error('Login error:', error);
    }
}

async function handleLogout() {
    try {
        await window.supabaseAPI.auth.signOut();
        showLogin();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
    currentUser = null;
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'grid';
    document.getElementById('user-email').textContent = currentUser.email;
    loadSection('dashboard');
}

// ================================================
// Navigation
// ================================================
function loadSection(section) {
    currentSection = section;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });

    // Update content
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `section-${section}`);
    });

    // Update title and actions
    const titles = {
        dashboard: 'Dashboard',
        ads: 'Gerenciar Anúncios',
        servers: 'Gerenciar Servidores',
        results: 'Resultados dos Testes'
    };

    document.getElementById('section-title').textContent = titles[section] || section;

    // Update header actions
    const actionsHTML = {
        ads: '<button class="btn-primary" onclick="openAdModal()">+ Novo Anúncio</button>',
        servers: '<button class="btn-primary" onclick="openServerModal()">+ Novo Servidor</button>',
        results: ''
    };

    document.getElementById('header-actions').innerHTML = actionsHTML[section] || '';

    // Load section data
    loadSectionData(section);
}

async function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            await loadDashboardStats();
            break;
        case 'ads':
            await loadAds();
            break;
        case 'servers':
            await loadServers();
            break;
        case 'results':
            await loadResults();
            break;
    }
}

// ================================================
// Dashboard
// ================================================
async function loadDashboardStats() {
    try {
        const statsData = await window.supabaseAPI.results.getStatistics(30);

        if (statsData) {
            const { stats, results } = statsData;

            document.getElementById('stat-total-tests').textContent = stats.totalTests || 0;
            document.getElementById('stat-avg-download').textContent = (stats.avgDownload || 0).toFixed(2) + ' Mbps';
            document.getElementById('stat-avg-upload').textContent = (stats.avgUpload || 0).toFixed(2) + ' Mbps';
            document.getElementById('stat-avg-ping').textContent = (stats.avgPing || 0).toFixed(0) + ' ms';

            // Render Charts
            renderCharts(results);
        }

        // Load recent tests
        const { data } = await window.supabaseAPI.results.getAllResults(10, 0);
        renderRecentTests(data);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

let charts = {}; // Store chart instances

function renderCharts(results) {
    if (!results || results.length === 0) return;

    // Process data for charts (group by day)
    const dailyData = {};
    results.forEach(r => {
        const day = new Date(r.created_at).toLocaleDateString('pt-BR');
        if (!dailyData[day]) {
            dailyData[day] = { count: 0, download: 0, upload: 0, ping: 0 };
        }
        dailyData[day].count++;
        dailyData[day].download += parseFloat(r.download_speed) || 0;
        dailyData[day].upload += parseFloat(r.upload_speed) || 0;
    });

    // Sort dates
    const labels = Object.keys(dailyData).sort((a, b) => {
        const [da, ma, ya] = a.split('/');
        const [db, mb, yb] = b.split('/');
        return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });

    const testCounts = labels.map(day => dailyData[day].count);
    const avgDownloads = labels.map(day => (dailyData[day].download / dailyData[day].count).toFixed(2));
    const avgUploads = labels.map(day => (dailyData[day].upload / dailyData[day].count).toFixed(2));

    // Destroy existing charts if any
    if (charts.testsPerDay) charts.testsPerDay.destroy();
    if (charts.avgSpeeds) charts.avgSpeeds.destroy();

    // Chart 1: Tests per Day
    const ctx1 = document.getElementById('chart-tests-per-day').getContext('2d');
    charts.testsPerDay = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Testes Realizados',
                data: testCounts,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Testes nos últimos 30 dias', color: '#a0aec0' }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0aec0' } },
                x: { grid: { display: false }, ticks: { color: '#a0aec0' } }
            }
        }
    });

    // Chart 2: Average Speeds
    const ctx2 = document.getElementById('chart-avg-speeds').getContext('2d');
    charts.avgSpeeds = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Download (Mbps)',
                    data: avgDownloads,
                    borderColor: '#4fd1c5',
                    backgroundColor: 'rgba(79, 209, 197, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Upload (Mbps)',
                    data: avgUploads,
                    borderColor: '#9f7aea',
                    backgroundColor: 'rgba(159, 122, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#a0aec0' } },
                title: { display: true, text: 'Velocidade Média Diária', color: '#a0aec0' }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#a0aec0' } },
                x: { grid: { display: false }, ticks: { color: '#a0aec0' } }
            }
        }
    });
}

function renderRecentTests(tests) {
    const tbody = document.getElementById('recent-tests-body');
    if (!tbody) return;

    if (tests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Nenhum teste registrado</td></tr>';
        return;
    }

    tbody.innerHTML = tests.map(test => `
        <tr>
            <td>${new Date(test.created_at).toLocaleString('pt-BR')}</td>
            <td>${test.server_name || 'N/A'}</td>
            <td>${(test.download_speed || 0).toFixed(2)} Mbps</td>
            <td>${test.upload_speed ? (test.upload_speed).toFixed(2) + ' Mbps' : 'N/A'}</td>
            <td>${(test.ping || 0).toFixed(0)} ms</td>
        </tr>
    `).join('');
}

// ================================================
// Ads Management
// ================================================
async function loadAds() {
    try {
        const ads = await window.supabaseAPI.ads.getAllAds();
        renderAdsTable(ads);
    } catch (error) {
        console.error('Error loading ads:', error);
        document.getElementById('ads-table-body').innerHTML =
            '<tr><td colspan="5" class="loading">Erro ao carregar anúncios</td></tr>';
    }
}

function renderAdsTable(ads) {
    const tbody = document.getElementById('ads-table-body');

    if (ads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Nenhum anúncio cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = ads.map(ad => `
        <tr>
            <td>${ad.title}</td>
            <td><span class="badge">${ad.position === 'top-banner' ? 'Banner Topo' : 'Sidebar'}</span></td>
            <td><span class="badge ${ad.is_active ? 'badge-active' : 'badge-inactive'}">${ad.is_active ? 'Ativo' : 'Inativo'}</span></td>
            <td>${ad.priority}</td>
            <td class="table-actions">
                <button class="btn-icon" onclick="editAd('${ad.id}')" title="Editar">✏️</button>
                <button class="btn-icon" onclick="toggleAdActive('${ad.id}', ${!ad.is_active})" title="${ad.is_active ? 'Desativar' : 'Ativar'}">
                    ${ad.is_active ? '👁️' : '🚫'}
                </button>
                <button class="btn-icon delete" onclick="deleteAd('${ad.id}')" title="Excluir">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function openAdModal(adId = null) {
    currentAdId = adId;
    const modal = document.getElementById('ad-modal');
    const title = document.getElementById('ad-modal-title');

    if (adId) {
        title.textContent = 'Editar Anúncio';
        loadAdData(adId);
    } else {
        title.textContent = 'Novo Anúncio';
        document.getElementById('ad-form').reset();
        document.getElementById('ad-id').value = '';
    }

    modal.classList.add('active');
}

function closeAdModal() {
    document.getElementById('ad-modal').classList.remove('active');
    currentAdId = null;
}

async function loadAdData(adId) {
    try {
        const ads = await window.supabaseAPI.ads.getAllAds();
        const ad = ads.find(a => a.id === adId);

        if (ad) {
            document.getElementById('ad-id').value = ad.id;
            document.getElementById('ad-title').value = ad.title;
            document.getElementById('ad-position').value = ad.position;
            document.getElementById('ad-priority').value = ad.priority || 0;
            document.getElementById('ad-content-html').value = ad.content_html || '';
            document.getElementById('ad-image-url').value = ad.image_url || '';
            document.getElementById('ad-link-url').value = ad.link_url || '';
            document.getElementById('ad-is-active').checked = ad.is_active;

            if (ad.start_date) {
                document.getElementById('ad-start-date').value = new Date(ad.start_date).toISOString().slice(0, 16);
            }
            if (ad.end_date) {
                document.getElementById('ad-end-date').value = new Date(ad.end_date).toISOString().slice(0, 16);
            }
        }
    } catch (error) {
        console.error('Error loading ad data:', error);
    }
}

async function handleAdSubmit(e) {
    e.preventDefault();

    const adData = {
        title: document.getElementById('ad-title').value,
        position: document.getElementById('ad-position').value,
        priority: parseInt(document.getElementById('ad-priority').value) || 0,
        content_html: document.getElementById('ad-content-html').value || null,
        image_url: document.getElementById('ad-image-url').value || null,
        link_url: document.getElementById('ad-link-url').value || null,
        is_active: document.getElementById('ad-is-active').checked,
        start_date: document.getElementById('ad-start-date').value || null,
        end_date: document.getElementById('ad-end-date').value || null
    };

    try {
        const adId = document.getElementById('ad-id').value;

        if (adId) {
            await window.supabaseAPI.ads.updateAd(adId, adData);
        } else {
            await window.supabaseAPI.ads.createAd(adData);
        }

        closeAdModal();
        loadAds();
    } catch (error) {
        alert('Erro ao salvar anúncio: ' + error.message);
        console.error('Error saving ad:', error);
    }
}

async function toggleAdActive(adId, newState) {
    try {
        await window.supabaseAPI.ads.updateAd(adId, { is_active: newState });
        loadAds();
    } catch (error) {
        alert('Erro ao atualizar anúncio: ' + error.message);
        console.error('Error updating ad:', error);
    }
}

async function deleteAd(adId) {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;

    try {
        await window.supabaseAPI.ads.deleteAd(adId);
        loadAds();
    } catch (error) {
        alert('Erro ao excluir anúncio: ' + error.message);
        console.error('Error deleting ad:', error);
    }
}

function editAd(adId) {
    openAdModal(adId);
}

// ================================================
// Servers Management
// ================================================
async function loadServers() {
    try {
        const servers = await window.supabaseAPI.servers.getAllServers();
        renderServersTable(servers);
    } catch (error) {
        console.error('Error loading servers:', error);
        document.getElementById('servers-table-body').innerHTML =
            '<tr><td colspan="5" class="loading">Erro ao carregar servidores</td></tr>';
    }
}

function renderServersTable(servers) {
    const tbody = document.getElementById('servers-table-body');

    if (servers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">Nenhum servidor cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = servers.map(server => `
        <tr>
            <td>${server.name}</td>
            <td>${server.ping_url}</td>
            <td>${server.is_default ? '<span class="badge badge-default">Padrão</span>' : ''}</td>
            <td><span class="badge ${server.is_active ? 'badge-active' : 'badge-inactive'}">${server.is_active ? 'Ativo' : 'Inativo'}</span></td>
            <td class="table-actions">
                <button class="btn-icon" onclick="editServer('${server.id}')" title="Editar">✏️</button>
                <button class="btn-icon" onclick="toggleServerActive('${server.id}', ${!server.is_active})" title="${server.is_active ? 'Desativar' : 'Ativar'}">
                    ${server.is_active ? '👁️' : '🚫'}
                </button>
                ${!server.is_default ? `<button class="btn-icon delete" onclick="deleteServer('${server.id}')" title="Excluir">🗑️</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function openServerModal(serverId = null) {
    currentServerId = serverId;
    const modal = document.getElementById('server-modal-admin');
    const title = document.getElementById('server-modal-title');

    if (serverId) {
        title.textContent = 'Editar Servidor';
        loadServerData(serverId);
    } else {
        title.textContent = 'Novo Servidor';
        document.getElementById('server-form').reset();
        document.getElementById('server-id').value = '';
    }

    modal.classList.add('active');
}

function closeServerModal() {
    document.getElementById('server-modal-admin').classList.remove('active');
    currentServerId = null;
}

async function loadServerData(serverId) {
    try {
        const servers = await window.supabaseAPI.servers.getAllServers();
        const server = servers.find(s => s.id === serverId);

        if (server) {
            document.getElementById('server-id').value = server.id;
            document.getElementById('server-name-admin').value = server.name;
            document.getElementById('server-download-urls').value = JSON.stringify(server.download_urls, null, 2);
            document.getElementById('server-upload-url-admin').value = server.upload_url || '';
            document.getElementById('server-ping-url-admin').value = server.ping_url;
            document.getElementById('server-is-default').checked = server.is_default;
            document.getElementById('server-is-active').checked = server.is_active;
        }
    } catch (error) {
        console.error('Error loading server data:', error);
    }
}

async function handleServerSubmit(e) {
    e.preventDefault();

    let downloadUrls;
    try {
        downloadUrls = JSON.parse(document.getElementById('server-download-urls').value);
        if (!Array.isArray(downloadUrls)) throw new Error('URLs devem ser um array');
    } catch (error) {
        alert('Erro no formato das URLs de download. Use um array JSON válido.');
        return;
    }

    const serverData = {
        name: document.getElementById('server-name-admin').value,
        download_urls: downloadUrls,
        upload_url: document.getElementById('server-upload-url-admin').value || null,
        ping_url: document.getElementById('server-ping-url-admin').value,
        is_default: document.getElementById('server-is-default').checked,
        is_active: document.getElementById('server-is-active').checked
    };

    try {
        const serverId = document.getElementById('server-id').value;

        if (serverId) {
            await window.supabaseAPI.servers.updateServer(serverId, serverData);
        } else {
            await window.supabaseAPI.servers.createServer(serverData);
        }

        closeServerModal();
        loadServers();
    } catch (error) {
        alert('Erro ao salvar servidor: ' + error.message);
        console.error('Error saving server:', error);
    }
}

async function toggleServerActive(serverId, newState) {
    try {
        await window.supabaseAPI.servers.updateServer(serverId, { is_active: newState });
        loadServers();
    } catch (error) {
        alert('Erro ao atualizar servidor: ' + error.message);
        console.error('Error updating server:', error);
    }
}

async function deleteServer(serverId) {
    if (!confirm('Tem certeza que deseja excluir este servidor?')) return;

    try {
        await window.supabaseAPI.servers.deleteServer(serverId);
        loadServers();
    } catch (error) {
        alert('Erro ao excluir servidor: ' + error.message);
        console.error('Error deleting server:', error);
    }
}

function editServer(serverId) {
    openServerModal(serverId);
}

// ================================================
// Results Management
// ================================================
async function loadResults() {
    try {
        const { data } = await window.supabaseAPI.results.getAllResults(100, 0);
        renderResultsTable(data);
    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('results-table-body').innerHTML =
            '<tr><td colspan="6" class="loading">Erro ao carregar resultados</td></tr>';
    }
}

function renderResultsTable(results) {
    const tbody = document.getElementById('results-table-body');

    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Nenhum resultado registrado</td></tr>';
        return;
    }

    tbody.innerHTML = results.map(result => `
        <tr>
            <td>${new Date(result.created_at).toLocaleString('pt-BR')}</td>
            <td>${result.server_name || 'N/A'}</td>
            <td>${(result.download_speed || 0).toFixed(2)}</td>
            <td>${result.upload_speed ? (result.upload_speed).toFixed(2) : 'N/A'}</td>
            <td>${(result.ping || 0).toFixed(0)}</td>
            <td class="table-actions">
                <button class="btn-icon delete" onclick="deleteResult('${result.id}')" title="Excluir">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function deleteResult(resultId) {
    if (!confirm('Tem certeza que deseja excluir este resultado?')) return;

    try {
        await window.supabaseAPI.results.deleteResult(resultId);
        loadResults();
        loadDashboardStats(); // Update stats
    } catch (error) {
        alert('Erro ao excluir resultado: ' + error.message);
        console.error('Error deleting result:', error);
    }
}

function exportResultsToCSV() {
    // TODO: Implement CSV export
    alert('Função de exportação CSV será implementada em breve');
}

// ================================================
// Event Listeners
// ================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in
    try {
        const user = await window.supabaseAPI.auth.getCurrentUser();
        if (user) {
            currentUser = user;
            showDashboard();
        } else {
            showLogin();
        }
    } catch (error) {
        showLogin();
    }

    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Logout button
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => loadSection(item.dataset.section));
    });

    // Ad Modal
    document.getElementById('btn-close-ad-modal').addEventListener('click', closeAdModal);
    document.getElementById('btn-cancel-ad').addEventListener('click', closeAdModal);
    document.getElementById('ad-form').addEventListener('submit', handleAdSubmit);

    // Server Modal
    document.getElementById('btn-close-server-modal').addEventListener('click', closeServerModal);
    document.getElementById('btn-cancel-server').addEventListener('click', closeServerModal);
    document.getElementById('server-form').addEventListener('submit', handleServerSubmit);

    // Results export
    document.getElementById('btn-export-csv').addEventListener('click', exportResultsToCSV);

    // Close modals on overlay click
    document.getElementById('ad-modal').addEventListener('click', (e) => {
        if (e.target.id === 'ad-modal') closeAdModal();
    });
    document.getElementById('server-modal-admin').addEventListener('click', (e) => {
        if (e.target.id === 'server-modal-admin') closeServerModal();
    });
});
