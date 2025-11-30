import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check database connection (optional)
    let databaseStatus = 'unknown';
    try {
      const { supabase } = await import('@/lib/db/supabase');
      const { error } = await supabase.from('sites').select('id').limit(1);
      databaseStatus = error ? 'unhealthy' : 'healthy';
    } catch (err) {
      databaseStatus = 'unhealthy';
    }

    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'SEO Expert AI',
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: databaseStatus,
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}
