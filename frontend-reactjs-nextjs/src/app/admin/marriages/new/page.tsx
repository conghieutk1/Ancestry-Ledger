'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { createMarriage, getMembers } from '@/lib/api';
import { Member } from '@/types';

export default function NewMarriagePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const membersData = await getMembers({ take: 1000 });
                setMembers(membersData.data);
            } catch (err) {
                console.error('Failed to fetch members', err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const partner1Id = formData.get('partner1Id') as string;
        const partner2Id = formData.get('partner2Id') as string;

        if (partner1Id === partner2Id) {
            setError('Vợ và chồng không thể là cùng một người.');
            setLoading(false);
            return;
        }

        const data = {
            partner1Id,
            partner2Id,
            startDate: formData.get('startDate') || undefined,
            status: formData.get('status'),
            notes: formData.get('notes') || undefined,
        };

        try {
            await createMarriage(data);
            router.push('/admin/marriages');
        } catch (err: any) {
            console.error(err);
            setError(
                err.response?.data?.message || 'Failed to create marriage.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/marriages">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Thêm cặp vợ chồng
                        </h1>
                        <p className="text-sm text-slate-500">
                            Ghi nhận mối quan hệ hôn nhân mới.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin hôn nhân</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="partner1Id">Vợ/Chồng 1 *</Label>
                                <Select name="partner1Id" required>
                                    <option value="">
                                        -- Chọn người thứ nhất --
                                    </option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.fullName} (
                                            {m.gender === 'MALE' ? 'Nam' : 'Nữ'}{' '}
                                            -{' '}
                                            {m.dateOfBirth
                                                ? new Date(
                                                      m.dateOfBirth
                                                  ).getFullYear()
                                                : '?'}
                                            )
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="partner2Id">Vợ/Chồng 2 *</Label>
                                <Select name="partner2Id" required>
                                    <option value="">
                                        -- Chọn người thứ hai --
                                    </option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.fullName} (
                                            {m.gender === 'MALE' ? 'Nam' : 'Nữ'}{' '}
                                            -{' '}
                                            {m.dateOfBirth
                                                ? new Date(
                                                      m.dateOfBirth
                                                  ).getFullYear()
                                                : '?'}
                                            )
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Ngày cưới</Label>
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Trạng thái</Label>
                                <Select name="status" defaultValue="MARRIED">
                                    <option value="MARRIED">Đã kết hôn</option>
                                    <option value="DIVORCED">Ly hôn</option>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Ghi chú</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Ghi chú thêm..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={loading} className="w-32">
                        {loading ? (
                            'Đang lưu...'
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Lưu
                            </>
                        )}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin/marriages">Hủy bỏ</Link>
                    </Button>
                </div>
            </form>
        </div>
    );
}
