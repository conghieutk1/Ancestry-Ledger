'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GitBranch, UserCog } from 'lucide-react';
import { getStats } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardStatsSkeleton } from '@/components/ui/loading-skeletons';

export default function AdminDashboard() {
    const { t } = useLanguage();
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalBranches: 0,
        totalUsers: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    {t.dashboard.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {t.dashboard.subtitle}
                </p>
            </div>

            {loading ? (
                <DashboardStatsSkeleton />
            ) : (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t.dashboard.totalMembers}
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalMembers}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t.dashboard.registeredMembers}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t.dashboard.totalBranches}
                            </CardTitle>
                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalBranches}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t.dashboard.activeBranches}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t.dashboard.totalUsers}
                            </CardTitle>
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalUsers}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t.dashboard.adminsAndMembers}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>{t.dashboard.recentActivity}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {t.dashboard.noActivity}
                        </p>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{t.dashboard.quickActions}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {t.dashboard.shortcuts}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
