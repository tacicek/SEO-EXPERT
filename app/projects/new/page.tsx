'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/providers/auth-provider';
import { siteService } from '@/lib/db/services';
import { sitemapService } from '@/lib/services/sitemap';

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'discovering' | 'success'>('form');
  
  const [formData, setFormData] = useState({
    domain: '',
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Validate domain
      const domain = formData.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Create project
      const project = await siteService.create({
        domain,
        name: formData.name || domain,
        userId: user.id,
      });

      // Update with description if provided (using raw Supabase call)
      if (formData.description) {
        const { supabase } = await import('@/lib/db/supabase');
        await supabase
          .from('sites')
          .update({ description: formData.description })
          .eq('id', project.id);
      }

      // Discover sitemaps in background
      setStep('discovering');
      
      try {
        await sitemapService.discoverAndCreate(project.id, domain);
      } catch (err) {
        console.error('Sitemap discovery failed:', err);
        // Don't fail the whole process if sitemap discovery fails
      }

      setStep('success');
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/projects/${project.id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Project creation error:', err);
      setError(err.message || 'Failed to create project');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'discovering') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Discovering Sitemaps</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Analyzing robots.txt and discovering sitemap URLs...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (step === 'success') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Project Created!</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sitemaps discovered. Redirecting to project dashboard...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-muted-foreground mt-2">
            Add a new website to track its SEO performance and content quality
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Enter your website information. We'll automatically discover sitemaps and start tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="domain">
                  Website Domain <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="example.com or https://example.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your website domain. Protocol (https://) is optional.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="My Awesome Website"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  A friendly name to identify this project
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="E-commerce site for outdoor gear..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Brief description of the website or project goals
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• We'll fetch and analyze your robots.txt file</li>
                  <li>• Discover all sitemap URLs automatically</li>
                  <li>• Extract and catalog all URLs from sitemaps</li>
                  <li>• You can then analyze individual pages or run bulk analyses</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/projects')}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.domain || !formData.name}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
