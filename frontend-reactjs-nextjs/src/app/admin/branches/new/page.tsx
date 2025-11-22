'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createBranch } from '@/lib/api';

export default function NewBranchPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
        };

        try {
            await createBranch(data);
            router.push('/admin/branches');
        } catch (err: any) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                    'Failed to create branch. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/branches">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Add Branch
                    </h1>
                    <p className="text-sm text-slate-500">
                        Create a new family branch.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Branch Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleSubmit}
                            className="grid gap-4 md:grid-cols-2"
                        >
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Branch Name
                                </label>
                                <Input
                                    name="name"
                                    placeholder="e.g. Chi 1 (Trưởng)"
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    placeholder="Branch description..."
                                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-300"
                                />
                            </div>

                            {error && (
                                <div className="col-span-2 text-sm text-red-500">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center gap-4 md:col-span-2 pt-4">
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Branch'}
                                </Button>
                                <Button variant="ghost" asChild>
                                    <Link href="/admin/branches">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
