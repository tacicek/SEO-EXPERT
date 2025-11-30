'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, User, LogOut, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/providers/auth-provider";

export function Header() {
    const { user, signOut, loading } = useAuth();

    const getInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    };

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <img src="/seomind-logo.png" alt="Seomind Logo" className="h-8 w-8 object-contain" />
                        <span className="text-primary">Seomind</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
                            Dashboard
                        </Link>
                        {user && (
                            <>
                                <Link href="/projects" className="transition-colors hover:text-foreground/80 text-muted-foreground">
                                    Projects
                                </Link>
                                <Link href="/analyses" className="transition-colors hover:text-foreground/80 text-muted-foreground">
                                    Analyses
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    {!loading && (
                        <>
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {getInitials(user.email || 'U')}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {user.user_metadata?.full_name || 'User'}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/" className="cursor-pointer">
                                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                                Dashboard
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/analyses" className="cursor-pointer">
                                                <Settings className="mr-2 h-4 w-4" />
                                                My Analyses
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                            onClick={() => signOut()}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href="/auth/login">
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Sign In
                                        </Link>
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link href="/auth/register">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Sign Up
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
