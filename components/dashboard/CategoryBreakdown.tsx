'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileText, Heading, Image, Link2, Code, BookOpen } from "lucide-react";

interface CategoryBreakdownProps {
  meta: number;
  headings: number;
  images: number;
  url: number;
  schema: number;
  content: number;
}

export function CategoryBreakdown({ meta, headings, images, url, schema, content }: CategoryBreakdownProps) {
  const categories = [
    { 
      label: 'Meta Tags', 
      count: meta, 
      icon: FileText,
      color: 'bg-violet-500',
      description: 'Title, description, OG tags'
    },
    { 
      label: 'Headings', 
      count: headings, 
      icon: Heading,
      color: 'bg-blue-500',
      description: 'H1-H6 structure'
    },
    { 
      label: 'Images', 
      count: images, 
      icon: Image,
      color: 'bg-emerald-500',
      description: 'Alt text, optimization'
    },
    { 
      label: 'URL', 
      count: url, 
      icon: Link2,
      color: 'bg-amber-500',
      description: 'URL structure, HTTPS'
    },
    { 
      label: 'Schema', 
      count: schema, 
      icon: Code,
      color: 'bg-rose-500',
      description: 'Structured data'
    },
    { 
      label: 'Content', 
      count: content, 
      icon: BookOpen,
      color: 'bg-cyan-500',
      description: 'Readability, word count'
    },
  ];

  const total = meta + headings + images + url + schema + content;
  const maxCount = Math.max(meta, headings, images, url, schema, content, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues by Category</CardTitle>
        <CardDescription>Distribution of issues across SEO categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.label} className="group">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("p-1.5 rounded-md", category.color, "bg-opacity-20")}>
                  <category.icon className={cn("h-4 w-4", category.color.replace('bg-', 'text-'))} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{category.label}</span>
                    <span className="text-sm font-bold ml-2">{category.count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{category.description}</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden ml-9">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", category.color)}
                  style={{ width: `${(category.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {total === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No issues found. Great job! 🎉
          </div>
        )}
      </CardContent>
    </Card>
  );
}

