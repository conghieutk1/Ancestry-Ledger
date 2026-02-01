'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMember } from '@/lib/api';
import { Member } from '@/types';

export default function MemberProfilePage({
    params,
}: {
    params: { id: string };
}) {
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resolvedParams = await params;
                const data = await getMember(resolvedParams.id);
                setMember(data);
            } catch (error) {
                console.error('Failed to fetch member:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <p className="text-slate-500">Loading profile...</p>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12 text-center">
                <h1 className="text-2xl font-bold text-slate-900">
                    Member Not Found
                </h1>
                <p className="mt-2 text-slate-500">
                    The member you are looking for does not exist or has been
                    removed.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/tree">Back to Tree</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-12">
            <Button variant="ghost" className="mb-6" asChild>
                <Link href="/tree">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tree
                </Link>
            </Button>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Sidebar / Basic Info */}
                <div className="md:col-span-1">
                    <Card>
                        <CardContent className="flex flex-col items-center pt-6">
                            <Avatar className="h-32 w-32">
                                <AvatarImage src={member.avatarUrl || ''} />
                                <AvatarFallback className="text-4xl bg-slate-100 text-slate-400">
                                    {member.firstName[0]}
                                    {member.lastName ? member.lastName[0] : ''}
                                </AvatarFallback>
                            </Avatar>
                            <h1 className="mt-4 text-2xl font-bold text-slate-900 text-center">
                                {member.fullName}
                            </h1>
                            <div className="mt-2 flex gap-2">
                                <Badge variant="secondary">
                                    {member.gender}
                                </Badge>
                                {member.isAlive ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                        Alive
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Deceased</Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="space-y-6 md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>About</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">
                                        Date of Birth
                                    </p>
                                    <p className="mt-1 text-sm text-slate-900">
                                        {member.dateOfBirth
                                            ? new Date(
                                                  member.dateOfBirth
                                              ).toLocaleDateString()
                                            : 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">
                                        Date of Death
                                    </p>
                                    <p className="mt-1 text-sm text-slate-900">
                                        {member.dateOfDeath
                                            ? new Date(
                                                  member.dateOfDeath
                                              ).toLocaleDateString()
                                            : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">
                                        Branch
                                    </p>
                                    <p className="mt-1 text-sm text-slate-900">
                                        {member.branch?.description ||
                                            'Unknown'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Family</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500">
                                Family relationships will be displayed here.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
