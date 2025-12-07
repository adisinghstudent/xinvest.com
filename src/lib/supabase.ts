import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Google OAuth authentication
export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/vault`,
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
}) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Check if vault exists
    const { data: existing } = await supabase
        .from('vaults')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    if (existing) {
        // Update existing vault
        const { data, error } = await supabase
            .from('vaults')
            .update({
                ...vaultData,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .select()
            .single();

        return { data, error };
    } else {
        // Insert new vault
        const { data, error } = await supabase
            .from('vaults')
            .insert({
                user_id: user.id,
                ...vaultData,
            })
            .select()
            .single();

        return { data, error };
    }
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

// Toggle vault public sharing
export const toggleVaultPublic = async (isPublic: boolean) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Update all vaults for this user
    const { data, error } = await supabase
        .from('vaults')
        .update({ is_public: isPublic })
        .eq('user_id', user.id)
        .select();

    return { data: data?.[0], error };
};

// Get public leaderboard
export const getPublicLeaderboard = async () => {
    const { data, error } = await supabase
        .from('vaults')
        .select('twitter_handle, pnl_24h, pnl_30d, pnl_all_time, updated_at')
        .eq('is_public', true)
        .order('pnl_all_time', { ascending: false })
        .limit(50);

    return { data, error };
};
