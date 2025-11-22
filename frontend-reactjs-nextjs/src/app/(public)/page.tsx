import Link from 'next/link';
import { Search, Users, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
    return (
        <div className="space-y-12 pb-12">
            {/* Hero Section */}
            <section className="bg-white px-4 py-20 text-center">
                <div className="mx-auto max-w-3xl space-y-6">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Preserving Family History, <br />
                        <span className="text-blue-600">
                            One Generation at a Time.
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600">
                        A modern, collaborative platform to document and explore
                        your family's lineage. Secure, private, and easy to use.
                    </p>
                    <div className="mx-auto flex max-w-md items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search for a family member..."
                                className="h-12 pl-10 text-base"
                            />
                        </div>
                        <Button size="lg" className="h-12 px-8">
                            Search
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features / Stats */}
            <section className="mx-auto max-w-5xl px-4">
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border-none bg-slate-100/50 shadow-none">
                        <CardHeader>
                            <Users className="h-8 w-8 text-blue-600" />
                            <CardTitle className="mt-4">
                                Family Members
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">
                                Document detailed profiles for every family
                                member, including photos, dates, and stories.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-slate-100/50 shadow-none">
                        <CardHeader>
                            <GitBranch className="h-8 w-8 text-blue-600" />
                            <CardTitle className="mt-4">
                                Interactive Tree
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">
                                Visualize your ancestry with a dynamic,
                                interactive family tree that spans generations.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-slate-100/50 shadow-none">
                        <CardHeader>
                            <Users className="h-8 w-8 text-blue-600" />
                            <CardTitle className="mt-4">
                                Collaboration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">
                                Invite family members to contribute, edit, and
                                grow the family history together.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
