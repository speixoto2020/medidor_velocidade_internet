// admin.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loginSection = document.getElementById('login-section');
    const btnLogin = document.getElementById('btn-login');
    const inputEmail = document.getElementById('email');
    const inputPass = document.getElementById('password');
    const btnLogout = document.getElementById('btn-logout');

    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Settings Elements
    const confCompany = document.getElementById('conf-company-name');
    const confEmail = document.getElementById('conf-admin-email');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const btnTestEmail = document.getElementById('btn-test-email');

    // Tables
    const messagesBody = document.getElementById('messages-body');
    const serversBody = document.getElementById('servers-body');
    const adsBody = document.getElementById('ads-body');
    const btnRefreshMsgs = document.getElementById('btn-refresh-messages');

    // --- Config & Init ---
    // Wait for Supabase to be ready
    const initInterval = setInterval(() => {
        if (window.supabaseAPI) {
            clearInterval(initInterval);
            checkSession();
        }
    }, 100);

    // --- Navigation ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Show active tab
            const tabId = item.dataset.tab;
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `tab-${tabId}`) pane.classList.add('active');
            });

            // Load data for the specific tab
            if (tabId === 'messages') loadMessages();
            if (tabId === 'settings') loadSettings();
            if (tabId === 'servers') loadServers();
            if (tabId === 'ads') loadAds();
        });
    });

    // --- Auth ---
    async function checkSession() {
        if (!window.supabaseAPI.isConfigured()) {
            console.warn('Supabase not configured');
            return;
        }

        const { data: { session } } = await window.supabaseAPI.auth.getSession();
        if (session) {
            loginSection.style.display = 'none';
            // Load initial data (messages default)
            loadMessages();
        } else {
            loginSection.style.display = 'flex';
        }
    }

    btnLogin.addEventListener('click', async () => {
        const email = inputEmail.value;
        const pass = inputPass.value;
        btnLogin.textContent = '...';

        try {
            const { error } = await window.supabaseAPI.auth.signIn(email, pass);
            if (error) throw error;
            loginSection.style.display = 'none';
            loadMessages();
        } catch (e) {
            alert('Erro: ' + e.message);
        } finally {
            btnLogin.textContent = 'Entrar';
        }
    });

    btnLogout.addEventListener('click', async () => {
        await window.supabaseAPI.auth.signOut();
        checkSession();
    });

    // --- Messages Logic ---
    if (btnRefreshMsgs) btnRefreshMsgs.onclick = loadMessages;

    async function loadMessages() {
        messagesBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
        const { data, error } = await window.supabaseAPI.admin.getMessages();
        if (error) {
            messagesBody.innerHTML = `<tr><td colspan="4">Erro: ${error.message || error}</td></tr>`;
            return;
        }
        if (!data || !data.length) {
            messagesBody.innerHTML = '<tr><td colspan="4">Nenhuma mensagem.</td></tr>';
            return;
        }
        messagesBody.innerHTML = data.map(msg => `
            <tr>
                <td>${new Date(msg.created_at).toLocaleString()}</td>
                <td style="max-width: 300px; white-space: pre-wrap;">${escapeHtml(msg.sender_message)}</td>
                <td><span class="status-badge ${msg.status === 'sent' ? 'status-sent' : 'status-failed'}">${msg.status}</span></td>
                <td>${msg.user_ip || '-'}</td>
            </tr>
        `).join('');
    }

    // --- Settings Logic ---
    async function loadSettings() {
        confCompany.value = 'Carregando...';
        confEmail.value = 'Carregando...';

        const company = await window.supabaseAPI.settings.getSetting('company_name');
        const email = await window.supabaseAPI.settings.getSetting('admin_email');

        confCompany.value = company || '';
        confEmail.value = email || '';
    }

    btnSaveSettings.addEventListener('click', async () => {
        const originalText = btnSaveSettings.textContent;
        btnSaveSettings.textContent = 'Salvando...';
        try {
            await window.supabaseAPI.settings.updateSetting('company_name', confCompany.value);
            await window.supabaseAPI.settings.updateSetting('admin_email', confEmail.value);
            alert('Configurações salvas!');
        } catch (e) {
            alert('Erro ao salvar: ' + e.message);
        } finally {
            btnSaveSettings.textContent = originalText;
        }
    });

    btnTestEmail.addEventListener('click', async () => {
        const originalText = btnTestEmail.textContent;
        btnTestEmail.textContent = 'Enviando...';
        try {
            const { error } = await window.supabaseAPI.functions.invoke('send-contact-email', {
                body: { message: 'TESTE DE EMAIL - Admin Panel', clientInfo: { ip: 'AdminTest', isp: 'Admin' } }
            });
            if (error) throw error;
            alert('Email de teste enviado! Verifique sua caixa de entrada.');
        } catch (e) {
            alert('Erro no envio: ' + e.message);
        } finally {
            btnTestEmail.textContent = originalText;
        }
    });

    // --- Servers Logic (Basic Listing) ---
    async function loadServers() {
        serversBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
        const servers = await window.supabaseAPI.servers.getAllServers(); // Needs implementation in supabase-config first, assuming I added active/all support
        // Note: loadServersFromDatabase uses getActiveServers (public), admin wants ALL.
        // Assuming getAllServers exists or I use getActiveServers for now.
        // Falling back to getActiveServers if getAllServers isn't ready.
        const list = servers && servers.length ? servers : await window.supabaseAPI.servers.getActiveServers();

        if (!list || !list.length) {
            serversBody.innerHTML = '<tr><td colspan="4">Nenhum servidor.</td></tr>';
            return;
        }

        serversBody.innerHTML = list.map(s => `
            <tr>
                <td>${escapeHtml(s.name)}</td>
                <td>${s.id}</td>
                <td>${s.is_default ? 'Sim' : 'Não'}</td>
                <td>
                    <button class="btn-danger" style="padding: 4px 8px; font-size: 0.8rem;" onclick="deleteServer('${s.id}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    }

    // --- Ads Logic (Basic Listing) ---
    async function loadAds() {
        adsBody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
        const ads = await window.supabaseAPI.ads.getActiveAds();

        if (!ads || !ads.length) {
            adsBody.innerHTML = '<tr><td colspan="4">Nenhum anúncio ativo.</td></tr>';
            return;
        }

        adsBody.innerHTML = ads.map(ad => `
            <tr>
                <td>${escapeHtml(ad.title)}</td>
                <td>${ad.position}</td>
                <td><a href="${ad.target_url}" target="_blank" style="color:#a6b1e1">Link</a></td>
                <td>
                    <button class="btn-danger" style="padding: 4px 8px; font-size: 0.8rem;">Remover</button>
                </td>
            </tr>
        `).join('');
    }

    // Utils
    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});
