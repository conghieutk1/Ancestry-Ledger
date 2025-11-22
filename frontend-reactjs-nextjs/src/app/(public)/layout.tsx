import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
                    <Link
                        href="/"
                        className="text-lg font-semibold tracking-tight"
                    >
                        Ancestry Ledger
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link
                            href="/tree"
                            className="text-sm font-medium text-slate-600 hover:text-slate-900"
                        >
                            Family Tree
                        </Link>
                        <Link
                            href="/admin"
                            className="text-sm font-medium text-slate-600 hover:text-slate-900"
                        >
                            Admin
                        </Link>
                        <Button size="sm" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </nav>
                </div>
            </header>
            <main>{children}</main>
            <footer className="border-t border-slate-200 bg-white py-8">
                <div className="mx-auto max-w-5xl px-4 text-center text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} Ancestry Ledger. All
                    rights reserved.
                </div>
            </footer>
        </div>
    );
}
