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

    const { data, error } = await supabase
        .from('vaults')
        .upsert({
            user_id: user.id,
            ...vaultData,
            updated_at: new Date().toISOString(),
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
