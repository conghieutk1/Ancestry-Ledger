'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GuestGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                router.push('/admin');
            } else {
                setIsGuest(true);
            }
        }
    }, [router]);

    if (!isGuest) {
        return null;
    }

    return <>{children}</>;
}
