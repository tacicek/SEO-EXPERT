'use client';

import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Plus, TrendingUp, FileText, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SitesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - in a real app this would come from a database
  const sites = [
    {
      id: '1',
      domain: 'example.com',
      name: 'Example Blog',
      totalPages: 45,
      avgScore: 82,
      lastAnalyzed: '2024-11-29',
      status: 'active' as const,
    },
    {
      id: '2',
      domain: 'mybusiness.com',
      name: 'My Business Site',
      totalPages: 23,
      avgScore: 76,
      lastAnalyzed: '2024-11-28',
      status: 'active' as const,
    },
    {
      id: '3',
      domain: 'techblog.io',
      name: 'Tech Blog',
      totalPages: 67,
      avgScore: 88,
      lastAnalyzed: '2024-11-27',
      status: 'active' as const,
    },
  ];

  const filteredSites = sites.filter(site =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Sites</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all your websites in one place
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sites.length}</div>
              <p className="text-xs text-muted-foreground">
                All actively monitored
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sites.reduce((acc, site) => acc + site.totalPages, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all sites
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Site Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(sites.reduce((acc, site) => acc + site.avgScore, 0) / sites.length)}
              </div>
              <p className="text-xs text-muted-foreground">
                +3% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sites..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Sites List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Sites</h2>
          {filteredSites.length === 0 && searchQuery ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No sites found</p>
                <p className="text-muted-foreground">
                  Try adjusting your search query
                </p>
              </CardContent>
            </Card>
          ) : filteredSites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No sites yet</p>
                <p className="text-muted-foreground mb-4">
                  Add your first site to start monitoring
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Site
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSites.map((site) => (
                <Card key={site.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          {site.name}
                        </CardTitle>
                        <CardDescription>{site.domain}</CardDescription>
                      </div>
                      <Badge variant={getScoreBadge(site.avgScore)}>
                        Avg: {site.avgScore}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pages Analyzed:</span>
                        <span className="font-medium">{site.totalPages}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Analyzed:</span>
                        <span className="font-medium">
                          {new Date(site.lastAnalyzed).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          View Analytics
                        </Button>
                        <Link href="/" className="flex-1">
                          <Button size="sm" className="w-full">
                            Analyze Page
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
