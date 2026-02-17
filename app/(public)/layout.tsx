import Link from 'next/link';
import { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Ecclesia
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                            Login
                        </Link>
                    </nav>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
            <footer className="border-t bg-white py-8">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                    <p>© {new Date().getFullYear()} Project Ecclesia. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
