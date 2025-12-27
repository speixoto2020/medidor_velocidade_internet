// admin.js

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const tableBody = document.getElementById('messages-body');

    // Buttons
    const btnLogin = document.getElementById('btn-login');
    const btnRefresh = document.getElementById('btn-refresh');
    const btnLogout = document.getElementById('btn-logout');

    // Inputs
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');

    // Check Session on Load
    checkSession();

    async function checkSession() {
        if (!window.supabaseAPI) {
            setTimeout(checkSession, 100); // Wait for config to load
            return;
        }

        const { data: { session } } = await window.supabaseAPI.auth.getSession();
        if (session) {
            showDashboard();
        } else {
            showLogin();
        }
    }

    function showLogin() {
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    }

    function showDashboard() {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loadMessages();
    }

    // Login Action
    btnLogin.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passInput.value;

        btnLogin.textContent = 'Autenticando...';
        btnLogin.disabled = true;

        try {
            const { error } = await window.supabaseAPI.auth.signIn(email, password);
            if (error) throw error;
            showDashboard();
        } catch (error) {
            alert('Erro no login: ' + error.message);
        } finally {
            btnLogin.textContent = 'Entrar';
            btnLogin.disabled = false;
        }
    });

    // Logout Action
    btnLogout.addEventListener('click', async () => {
        await window.supabaseAPI.auth.signOut();
        showLogin();
    });

    // Refresh Action
    btnRefresh.addEventListener('click', loadMessages);

    async function loadMessages() {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center">Carregando...</td></tr>';

        const { data, error } = await window.supabaseAPI.admin.getMessages();

        if (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: #ff8a80;">Erro ao carregar: ${error.message || error}</td></tr>`;
            return;
        }

        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center">Nenhuma mensagem encontrada.</td></tr>';
            return;
        }

        tableBody.innerHTML = data.map(msg => `
            <tr>
                <td>${new Date(msg.created_at).toLocaleString()}</td>
                <td style="white-space: pre-wrap;">${escapeHtml(msg.sender_message)}</td>
                <td>
                    <span class="status-badge ${msg.status === 'sent' ? 'status-sent' : 'status-failed'}">
                        ${msg.status}
                    </span>
                </td>
                <td>${msg.user_ip || 'N/A'}</td>
            </tr>
        `).join('');
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
