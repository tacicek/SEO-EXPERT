'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Globe, Calendar, BarChart } from 'lucide-react';
import Link from 'next/link';

interface Site {
  id: string;
  name: string;
  domain: string;
  status: string;
  description?: string;
  total_tracked_urls: number;
  avg_performance_score?: number;
  created_at: string;
  updated_at: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Temporary: Just show project ID until we implement full detail page
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Project Details</h1>
            <p className="text-muted-foreground">
              Project ID: {params.id}
            </p>
          </div>
          <Badge variant="outline" className="h-fit">
            Active
          </Badge>
        </div>
      </div>

      {/* Coming Soon Message */}
      <Card className="mb-8 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">🚧 Under Construction</CardTitle>
          <CardDescription className="text-yellow-700">
            Project detail page is being developed. The following features will be available soon:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-yellow-700">
            <li>✓ Project information and settings</li>
            <li>✓ Discovered sitemaps list</li>
            <li>✓ Tracked URLs inventory</li>
            <li>✓ URL analysis history</li>
            <li>✓ PageSpeed test results</li>
            <li>✓ Quick analysis actions</li>
          </ul>
        </CardContent>
      </Card>

      {/* Placeholder Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Globe className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Site Info</CardTitle>
            <CardDescription>
              Domain and basic information
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <BarChart className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              Performance and SEO scores
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Calendar className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest analyses and updates
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Temporary Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              While the full page is being built, you can:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/projects">
              <Button variant="outline" className="w-full">
                View All Projects
              </Button>
            </Link>
            <Link href="/projects/new">
              <Button variant="outline" className="w-full">
                Create New Project
              </Button>
            </Link>
            <Link href="/test-analyzer">
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Test SEO Analyzer
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
