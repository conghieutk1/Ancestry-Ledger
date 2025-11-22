'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUser, updateUser, deleteUser } from '@/lib/api';
import { User, Role } from '@/types';

export default async function UserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <UserDetailPageClient id={id} />;
}

function UserDetailPageClient({ id }: { id: string }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getUser(id);
                setUser(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load user.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            email: formData.get('email') as string,
            displayName: formData.get('displayName') as string,
            role: formData.get('role') as Role,
        };

        try {
            await updateUser(user.id, data);
            router.push('/admin/users');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to update user.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !confirm('Are you sure you want to delete this user?'))
            return;
        setDeleting(true);
        try {
            await deleteUser(user.id);
            router.push('/admin/users');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to delete user.');
            setDeleting(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (!user)
        return (
            <div className="p-6 text-center text-red-500">User not found</div>
        );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/users">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Edit User
                        </h1>
                        <p className="text-sm text-slate-500">ID: {user.id}</p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    {deleting ? 'Deleting...' : 'Delete User'}
                </Button>
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
                                <label className="text-xs font-medium text-slate-700">
                                    Email
                                </label>
                                <Input
                                    name="email"
                                    type="email"
                                    defaultValue={user.email}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Display Name
                                </label>
                                <Input
                                    name="displayName"
                                    defaultValue={user.displayName || ''}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Role
                                </label>
                                <select
                                    name="role"
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-300"
                                    defaultValue={user.role}
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
                                <div className="col-span-2 text-sm text-red-500">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center gap-4 md:col-span-2 pt-4">
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
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
