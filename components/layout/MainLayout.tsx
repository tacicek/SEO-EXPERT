import { Header } from "@/components/layout/Header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 container mx-auto px-4 md:px-6 lg:px-8 py-6 max-w-7xl">
                {children}
            </main>
        </div>
    );
}
