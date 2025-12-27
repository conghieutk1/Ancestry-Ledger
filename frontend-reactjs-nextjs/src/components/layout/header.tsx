'use client';

import { Bell, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/api';
import { User as UserType } from '@/types';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ModeToggle } from '@/components/mode-toggle';
import { useLanguage } from '@/contexts/LanguageContext';

export function Header() {
    const { t } = useLanguage();
    // Always initialize as null to avoid hydration mismatch
    const [user, setUser] = useState<UserType | null>(null);

    // Load user only after component mounts on client
    useEffect(() => {
        setUser(getCurrentUser());
    }, []);

    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
            <div className="flex items-center gap-4">
                {/* Breadcrumbs could go here */}
                <h1 className="text-sm font-medium text-muted-foreground">
                    {user?.displayName || t.common.adminArea}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <ModeToggle />
                <button className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors text-muted-foreground">
                    <Bell className="h-5 w-5" />
                </button>
                {user && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{user.email}</span>
                    </div>
                )}
            </div>
        </header>
    );
}
