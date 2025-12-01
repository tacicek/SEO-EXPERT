import { NextRequest, NextResponse } from 'next/server';
import { technicalSEOService } from '@/lib/services/technical-seo';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { url, site_id } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Analyze URL using Python backend
    const analysis = await technicalSEOService.analyzeUrl(url);
    
    // Generate dashboard data
    const dashboardData = technicalSEOService.getDashboardData(analysis);

    // Save to database if user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Store the analysis result
      await supabase.from('technical_analyses').insert({
        user_id: user.id,
        site_id: site_id || null,
        url,
        score: analysis.score.overall,
        meta_score: dashboardData.site_health.meta_score,
        headings_score: dashboardData.site_health.headings_score,
        images_score: dashboardData.site_health.images_score,
        schema_score: dashboardData.site_health.schema_score,
        content_score: dashboardData.site_health.content_score,
        url_score: dashboardData.site_health.url_score,
        total_issues: dashboardData.site_health.total_issues,
        high_issues: dashboardData.site_health.high_issues,
        medium_issues: dashboardData.site_health.medium_issues,
        low_issues: dashboardData.site_health.low_issues,
        analysis_data: analysis,
      }).select().single();
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        dashboard: dashboardData,
      },
    });
  } catch (error) {
    console.error('Technical analysis API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get latest technical analyses for dashboard
    const { data: analyses, error } = await supabase
      .from('technical_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // Calculate aggregate stats
    const stats = {
      total_analyses: analyses?.length || 0,
      avg_score: analyses?.length 
        ? Math.round(analyses.reduce((sum, a) => sum + (a.score || 0), 0) / analyses.length)
        : 0,
      total_issues: analyses?.reduce((sum, a) => sum + (a.total_issues || 0), 0) || 0,
      high_priority_issues: analyses?.reduce((sum, a) => sum + (a.high_issues || 0), 0) || 0,
    };

    // Get score trends (last 7 analyses)
    const scoreTrend = analyses?.slice(0, 7).reverse().map(a => ({
      date: a.created_at,
      score: a.score || 0,
    })) || [];

    // Aggregate issues by category
    const issuesByCategory = {
      meta: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as any;
        return sum + (data?.meta?.issues?.length || 0);
      }, 0) || 0,
      headings: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as any;
        return sum + (data?.headings?.issues?.length || 0);
      }, 0) || 0,
      images: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as any;
        return sum + (data?.images?.issues?.length || 0);
      }, 0) || 0,
      schema: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as any;
        return sum + (data?.schema_markup?.issues?.length || 0);
      }, 0) || 0,
      content: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as any;
        return sum + (data?.content_quality?.issues?.length || 0);
      }, 0) || 0,
      url: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as any;
        return sum + (data?.url_structure?.issues?.length || 0);
      }, 0) || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
        scoreTrend,
        issuesByCategory,
        recentAnalyses: analyses?.slice(0, 5) || [],
      },
    });
  } catch (error) {
    console.error('Dashboard technical GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      },
      { status: 500 }
    );
  }
}

