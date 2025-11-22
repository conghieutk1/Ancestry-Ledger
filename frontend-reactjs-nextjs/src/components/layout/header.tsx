'use client';

import { Bell, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/api';
import { User as UserType } from '@/types';

export function Header() {
    // Always initialize as null to avoid hydration mismatch
    const [user, setUser] = useState<UserType | null>(null);

    // Load user only after component mounts on client
    useEffect(() => {
        setUser(getCurrentUser());
    }, []);

    return (
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div className="flex items-center gap-4">
                {/* Breadcrumbs could go here */}
                <h1 className="text-sm font-medium text-slate-500">
                    {user?.displayName || 'Admin Area'}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <button className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-500">
                    <Bell className="h-5 w-5" />
                </button>
                {user && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="h-4 w-4" />
                        <span>{user.email}</span>
                    </div>
                )}
            </div>
        </header>
    );
}
