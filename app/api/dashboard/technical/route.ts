import { NextRequest, NextResponse } from 'next/server';
import { technicalSEOService } from '@/lib/services/technical-seo';
import { supabase } from '@/lib/db/supabase';

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

    // Try to get user from auth header
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Save to database if user is authenticated
    if (userId) {
      await supabase.from('technical_analyses').insert({
        user_id: userId,
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
      });
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
    // Try to get user from auth header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      // Return empty data for unauthenticated users
      return NextResponse.json({
        success: true,
        data: {
          stats: { total_analyses: 0, avg_score: 0, total_issues: 0, high_priority_issues: 0 },
          scoreTrend: [],
          issuesByCategory: { meta: 0, headings: 0, images: 0, schema: 0, content: 0, url: 0 },
          recentAnalyses: [],
        },
      });
    }

    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          stats: { total_analyses: 0, avg_score: 0, total_issues: 0, high_priority_issues: 0 },
          scoreTrend: [],
          issuesByCategory: { meta: 0, headings: 0, images: 0, schema: 0, content: 0, url: 0 },
          recentAnalyses: [],
        },
      });
    }

    // Get latest technical analyses for dashboard
    const { data: analyses, error } = await supabase
      .from('technical_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Database error:', error);
      // Return empty data on error instead of throwing
      return NextResponse.json({
        success: true,
        data: {
          stats: { total_analyses: 0, avg_score: 0, total_issues: 0, high_priority_issues: 0 },
          scoreTrend: [],
          issuesByCategory: { meta: 0, headings: 0, images: 0, schema: 0, content: 0, url: 0 },
          recentAnalyses: [],
        },
      });
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
        const data = a.analysis_data as Record<string, unknown>;
        const meta = data?.meta as Record<string, unknown> | undefined;
        const issues = meta?.issues as unknown[] | undefined;
        return sum + (issues?.length || 0);
      }, 0) || 0,
      headings: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as Record<string, unknown>;
        const headings = data?.headings as Record<string, unknown> | undefined;
        const issues = headings?.issues as unknown[] | undefined;
        return sum + (issues?.length || 0);
      }, 0) || 0,
      images: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as Record<string, unknown>;
        const images = data?.images as Record<string, unknown> | undefined;
        const issues = images?.issues as unknown[] | undefined;
        return sum + (issues?.length || 0);
      }, 0) || 0,
      schema: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as Record<string, unknown>;
        const schema = data?.schema_markup as Record<string, unknown> | undefined;
        const issues = schema?.issues as unknown[] | undefined;
        return sum + (issues?.length || 0);
      }, 0) || 0,
      content: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as Record<string, unknown>;
        const content = data?.content_quality as Record<string, unknown> | undefined;
        const issues = content?.issues as unknown[] | undefined;
        return sum + (issues?.length || 0);
      }, 0) || 0,
      url: analyses?.reduce((sum, a) => {
        const data = a.analysis_data as Record<string, unknown>;
        const urlData = data?.url_structure as Record<string, unknown> | undefined;
        const issues = urlData?.issues as unknown[] | undefined;
        return sum + (issues?.length || 0);
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
