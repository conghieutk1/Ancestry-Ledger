'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBranch, updateBranch, deleteBranch } from '@/lib/api';
import { FamilyBranch } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default async function BranchDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <BranchDetailPageClient id={id} />;
}

function BranchDetailPageClient({ id }: { id: string }) {
    const { t } = useLanguage();
    const router = useRouter();
    const [branch, setBranch] = useState<FamilyBranch | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getBranch(id);
                setBranch(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load branch.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!branch) return;
        setSaving(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            branchOrder: parseInt(formData.get('branchOrder') as string),
            description: formData.get('description') as string,
        };

        try {
            await updateBranch(branch.id, data);
            router.push('/admin/branches');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to update branch.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!branch || !confirm('Are you sure you want to delete this branch?'))
            return;
        setDeleting(true);
        try {
            await deleteBranch(branch.id);
            router.push('/admin/branches');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to delete branch.');
            setDeleting(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (!branch)
        return (
            <div className="p-6 text-center text-destructive">
                Branch not found
            </div>
        );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/branches">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Edit Branch
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            ID: {branch.id}
                        </p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    {deleting ? 'Deleting...' : 'Delete Branch'}
                </Button>
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
                                    defaultValue={branch.branchOrder}
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-medium text-foreground">
                                    Description
                                </label>
                                <Textarea
                                    name="description"
                                    defaultValue={branch.description || ''}
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
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
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
