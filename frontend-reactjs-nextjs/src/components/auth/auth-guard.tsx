'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Check if we are on the client side
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
            } else {
                setAuthorized(true);
            }
        }
    }, [router]);

    if (!authorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
            </div>
        );
    }

    return <>{children}</>;
}
