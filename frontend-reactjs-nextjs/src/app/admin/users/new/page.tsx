'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createUser } from '@/lib/api';
import { Role } from '@/types';

export default function NewUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            displayName: formData.get('displayName') as string,
            role: formData.get('role') as Role,
        };

        try {
            await createUser(data);
            router.push('/admin/users');
        } catch (err: any) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                    'Failed to create user. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/users">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Add User
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create a new system user account.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleSubmit}
                            className="grid gap-4 md:grid-cols-2"
                        >
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">
                                    Email
                                </label>
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">
                                    Display Name
                                </label>
                                <Input
                                    name="displayName"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">
                                    Password
                                </label>
                                <Input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">
                                    Role
                                </label>
                                <select
                                    name="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-input"
                                    required
                                >
                                    <option value={Role.MEMBER}>Member</option>
                                    <option value={Role.COLLABORATOR}>
                                        Collaborator
                                    </option>
                                    <option value={Role.ADMIN}>Admin</option>
                                </select>
                            </div>

                            {error && (
                                <div className="col-span-2 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center gap-4 md:col-span-2 pt-4">
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create User'}
                                </Button>
                                <Button variant="ghost" asChild>
                                    <Link href="/admin/users">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
