// ================================================
// Supabase Configuration
// ================================================
// IMPORTANT: Update these values with your Supabase project credentials
// You can find them in: Supabase Dashboard > Project Settings > API

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ================================================
// Initialize Supabase Client
// ================================================
let supabase;

// Check if we're in a browser environment
if (typeof window !== 'undefined' && typeof supabase === 'undefined') {
    // Initialize Supabase client
    if (SUPABASE_URL.includes('YOUR_SUPABASE')) {
        console.warn('⚠️ Supabase not configured! Please update supabase-config.js with your credentials.');
        console.warn('Running in demo mode - data will not persist.');
    } else {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error);
        }
    }
}

// ================================================
// Helper: Check if Supabase is configured
// ================================================
function isSupabaseConfigured() {
    return supabase && !SUPABASE_URL.includes('YOUR_SUPABASE');
}

// ================================================
// API: Advertisements
// ================================================
const adsAPI = {
    // Get all active ads (public)
    async getActiveAds() {
        if (!isSupabaseConfigured()) return [];

        try {
            const { data, error } = await supabase
                .from('advertisements')
                .select('*')
                .eq('is_active', true)
                .order('priority', { ascending: false });

            if (error) throw error;

            // Filter by date if dates are set
            const now = new Date();
            return (data || []).filter(ad => {
                const startOk = !ad.start_date || new Date(ad.start_date) <= now;
                const endOk = !ad.end_date || new Date(ad.end_date) >= now;
                return startOk && endOk;
            });
        } catch (error) {
            console.error('Error fetching ads:', error);
            return [];
        }
    },

    // Get all ads (admin)
    async getAllAds() {
        if (!isSupabaseConfigured()) return [];

        try {
            const { data, error } = await supabase
                .from('advertisements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching all ads:', error);
            return [];
        }
    },

    // Create ad (admin)
    async createAd(adData) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from('advertisements')
            .insert([adData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update ad (admin)
    async updateAd(id, updates) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from('advertisements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete ad (admin)
    async deleteAd(id) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const { error } = await supabase
            .from('advertisements')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ================================================
// API: Test Servers
// ================================================
const serversAPI = {
    // Get all active servers (public)
    async getActiveServers() {
        if (!isSupabaseConfigured()) return [];

        try {
            const { data, error } = await supabase
                .from('test_servers')
                .select('*')
                .eq('is_active', true)
                .order('is_default', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching servers:', error);
            return [];
        }
    },

    // Get all servers (admin)
    async getAllServers() {
        if (!isSupabaseConfigured()) return [];

        try {
            const { data, error } = await supabase
                .from('test_servers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching all servers:', error);
            return [];
        }
    },

    // Create server (admin)
    async createServer(serverData) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from('test_servers')
            .insert([serverData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update server (admin)
    async updateServer(id, updates) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from('test_servers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete server (admin)
    async deleteServer(id) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const { error } = await supabase
            .from('test_servers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ================================================
// API: Speed Test Results
// ================================================
const resultsAPI = {
    // Save test result (public)
    async saveResult(resultData) {
        if (!isSupabaseConfigured()) {
            console.log('Demo mode: Result not saved to database');
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('speed_test_results')
                .insert([resultData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving result:', error);
            return null;
        }
    },

    // Get all results (admin)
    async getAllResults(limit = 100, offset = 0) {
        if (!isSupabaseConfigured()) return { data: [], count: 0 };

        try {
            const { data, error, count } = await supabase
                .from('speed_test_results')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return { data: data || [], count: count || 0 };
        } catch (error) {
            console.error('Error fetching results:', error);
            return { data: [], count: 0 };
        }
    },

    // Get statistics (admin)
    async getStatistics(days = 30) {
        if (!isSupabaseConfigured()) return null;

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data, error } = await supabase
                .from('speed_test_results')
                .select('download_speed, upload_speed, ping, created_at')
                .gte('created_at', startDate.toISOString());

            if (error) throw error;

            // Calculate statistics
            const results = data || [];
            const stats = {
                totalTests: results.length,
                avgDownload: results.reduce((sum, r) => sum + (parseFloat(r.download_speed) || 0), 0) / results.length || 0,
                avgUpload: results.reduce((sum, r) => sum + (parseFloat(r.upload_speed) || 0), 0) / results.length || 0,
                avgPing: results.reduce((sum, r) => sum + (parseFloat(r.ping) || 0), 0) / results.length || 0,
                maxDownload: Math.max(...results.map(r => parseFloat(r.download_speed) || 0)),
                minPing: Math.min(...results.map(r => parseFloat(r.ping) || 999999))
            };

            return stats;
        } catch (error) {
            console.error('Error fetching statistics:', error);
            return null;
        }
    },

    // Delete result (admin)
    async deleteResult(id) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const { error } = await supabase
            .from('speed_test_results')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ================================================
// API: Authentication
// ================================================
const authAPI = {
    // Sign in
    async signIn(email, password) {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    },

    // Sign out
    async signOut() {
        if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // Get current user
    async getCurrentUser() {
        if (!isSupabaseConfigured()) return null;

        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    // Listen to auth changes
    onAuthStateChange(callback) {
        if (!isSupabaseConfigured()) return () => { };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
        return () => subscription.unsubscribe();
    }
};

// ================================================
// Export for use in other files
// ================================================
if (typeof window !== 'undefined') {
    window.supabaseAPI = {
        ads: adsAPI,
        servers: serversAPI,
        results: resultsAPI,
        auth: authAPI,
        isConfigured: isSupabaseConfigured
    };
}
