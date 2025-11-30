import { supabase } from '@/lib/db/supabase';
import { Database } from '@/lib/db/supabase';

export type Analysis = Database['public']['Tables']['analyses']['Row'];
export type Site = Database['public']['Tables']['sites']['Row'];

export interface DashboardStats {
    totalAnalyses: number;
    averageScore: number;
    creditsUsed: number; // Placeholder for now
    creditsTotal: number; // Placeholder
}

export async function getRecentAnalyses(userId: string, limit = 5) {
    const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as Analysis[];
}

export async function getSites(userId: string) {
    const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Site[];
}

export async function getUserStats(userId: string): Promise<DashboardStats> {
    // Get total analyses count
    const { count, error: countError } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (countError) throw countError;

    // Get average score
    const { data: scoreData, error: scoreError } = await supabase
        .from('analyses')
        .select('overall_score')
        .eq('user_id', userId)
        .not('overall_score', 'is', null);

    if (scoreError) throw scoreError;

    const totalScore = scoreData.reduce((acc, curr) => acc + (curr.overall_score || 0), 0);
    const averageScore = scoreData.length > 0 ? Math.round(totalScore / scoreData.length) : 0;

    return {
        totalAnalyses: count || 0,
        averageScore,
        creditsUsed: count || 0, // Assuming 1 credit per analysis for now
        creditsTotal: 100, // Hardcoded limit for now
    };
}
