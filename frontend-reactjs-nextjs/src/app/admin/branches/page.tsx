'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBranches } from '@/lib/api';
import { FamilyBranch } from '@/types';
import { DashboardStatsSkeleton } from '@/components/ui/loading-skeletons';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BranchesPage() {
    const { t } = useLanguage();
    const [branches, setBranches] = useState<FamilyBranch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getBranches();
                setBranches(data);
            } catch (error) {
                console.error('Failed to fetch branches:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {t.branches.title}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {t.branches.subtitle}
                    </p>
                </div>
            </div>

            {loading ? (
                <DashboardStatsSkeleton />
            ) : branches.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    {t.branches.noBranches}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    {branches.map((branch) => (
                        <Card key={branch.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">
                                    {branch.name}
                                </CardTitle>
                                <GitBranch className="h-4 w-4 text-slate-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {branch.memberCount || 0}
                                </div>
                                <p className="text-xs text-slate-500">
                                    {t.branches.members}
                                </p>
                                {branch.description && (
                                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                                        {branch.description}
                                    </p>
                                )}
                                <div className="mt-4 flex justify-end">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link
                                            href={`/admin/branches/${branch.id}`}
                                        >
                                            {t.common.edit}
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
