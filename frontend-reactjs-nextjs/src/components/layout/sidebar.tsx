'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    GitBranch,
    UserCog,
    LogOut,
    Network,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout, getCurrentUser } from '@/lib/api';
import { User } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export function Sidebar() {
    const { t } = useLanguage();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    // Always initialize as null to avoid hydration mismatch
    const [user, setUser] = useState<User | null>(null);

    const navItems = [
        {
            title: t.sidebar.dashboard,
            href: '/admin',
            icon: LayoutDashboard,
        },
        {
            title: t.sidebar.members,
            href: '/admin/members',
            icon: Users,
        },
        {
            title: t.sidebar.users,
            href: '/admin/users',
            icon: UserCog,
        },
        {
            title: t.sidebar.branches,
            href: '/admin/branches',
            icon: GitBranch,
        },
        {
            title: t.sidebar.treeView,
            href: '/tree',
            icon: Network,
        },
    ];

    // Load user only after component mounts on client
    useEffect(() => {
        setUser(getCurrentUser());
    }, []);

    const getActiveState = (href: string) => {
        // Exact match for /admin
        if (href === '/admin') {
            return pathname === '/admin';
        }
        // Prefix match for other routes
        return pathname.startsWith(href);
    };

    return (
        <div
            className={cn(
                'flex h-screen flex-col border-r border-slate-200 bg-slate-50 transition-all duration-300',
                isCollapsed ? 'w-16' : 'w-60'
            )}
        >
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 gap-2">
                {!isCollapsed && (
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 font-semibold truncate flex-1"
                    >
                        <span className="text-lg">Ancestry Ledger</span>
                    </Link>
                )}
                <button
                    className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-slate-200 transition-colors text-slate-600"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2">
                    {navItems.map((item, index) => {
                        const isActive = getActiveState(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isCollapsed && 'justify-center px-2',
                                    isActive
                                        ? 'bg-slate-200 text-slate-900'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                )}
                                title={isCollapsed ? item.title : undefined}
                            >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                {!isCollapsed && <span>{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t border-slate-200 p-4 space-y-3">
                <div
                    className={cn(
                        'flex items-center gap-3',
                        isCollapsed && 'flex-col'
                    )}
                >
                    <div className="h-8 w-8 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-slate-700">
                        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    {!isCollapsed && (
                        <div className="text-sm flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                                {user?.displayName || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {user?.email || 'user@example.com'}
                            </p>
                        </div>
                    )}
                </div>
                <button
                    className={cn(
                        'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-50 text-slate-600',
                        isCollapsed ? 'w-full h-9' : 'w-full'
                    )}
                    onClick={logout}
                    title={isCollapsed ? t.sidebar.logout : undefined}
                >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && t.sidebar.logout}
                </button>
            </div>
        </div>
    );
}
