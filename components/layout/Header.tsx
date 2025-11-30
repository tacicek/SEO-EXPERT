import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Settings, User } from "lucide-react";

export function Header() {
    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <span className="text-primary">SEO</span> Expert AI
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
                            Dashboard
                        </Link>
                        <Link href="/analyses" className="transition-colors hover:text-foreground/80 text-muted-foreground">
                            Analyses
                        </Link>
                        <Link href="/sites" className="transition-colors hover:text-foreground/80 text-muted-foreground">
                            Sites
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
