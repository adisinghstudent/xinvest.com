import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const createSupabaseClient = () => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: typeof window !== 'undefined',
        },
    });
};

export const supabase = createSupabaseClient();

// Google OAuth authentication
export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/vault` : undefined,
        },
    });
    return { data, error };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// Vault operations
export const saveVault = async (vaultData: {
    twitter_handle?: string;
    tickers: string[];
    weights: { [key: string]: number };
    reasoning?: string;
    is_public?: boolean;
}) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Always insert a new vault (don't update existing)
    const { data, error } = await supabase
        .from('vaults')
        .insert({
            user_id: user.id,
            ...vaultData,
        })
        .select()
        .single();

    return { data, error };
};

export const getUserVaults = async () => {
    const user = await getCurrentUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
        .from('vaults')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return { data, error };
};

// Toggle vault public sharing for a specific vault
export const toggleVaultPublic = async (vaultId: string, isPublic: boolean) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('vaults')
        .update({ is_public: isPublic })
        .eq('id', vaultId)
        .eq('user_id', user.id)
        .select()
        .single();

    return { data, error };
};

// Get public leaderboard
export const getPublicLeaderboard = async () => {
    const { data, error } = await supabase
        .from('vaults')
        .select('id, twitter_handle, tickers, weights, pnl_24h, pnl_30d, pnl_all_time, updated_at, created_at')
        .eq('is_public', true)
        .order('pnl_all_time', { ascending: false })
        .limit(50);

    return { data, error };
};
