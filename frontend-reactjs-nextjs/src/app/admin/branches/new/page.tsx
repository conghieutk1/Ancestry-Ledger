'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createBranch } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NewBranchPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            branchOrder: parseInt(formData.get('branchOrder') as string),
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
                    <h1 className="text-2xl font-semibold text-foreground">
                        Add Branch
                    </h1>
                    <p className="text-sm text-muted-foreground">
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
                                <label className="text-xs font-medium text-foreground">
                                    {t.common.branch} Order
                                </label>
                                <Input
                                    name="branchOrder"
                                    type="number"
                                    placeholder="1"
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-medium text-foreground">
                                    Description
                                </label>
                                <Textarea
                                    name="description"
                                    placeholder="Branch description..."
                                    className="min-h-[80px]"
                                />
                            </div>

                            {error && (
                                <div className="col-span-2 text-sm text-destructive">
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
