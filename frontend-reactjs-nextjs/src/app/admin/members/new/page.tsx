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
import { createMember, getBranches, getMembers } from '@/lib/api';
import { Gender, Visibility, FamilyBranch, Member } from '@/types';

export default function NewMemberPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Data for selects
    const [branches, setBranches] = useState<FamilyBranch[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [isAlive, setIsAlive] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [branchesData, membersData] = await Promise.all([
                    getBranches(),
                    getMembers({ take: 1000 }), // Fetch all for selection
                ]);
                setBranches(branchesData);
                setMembers(membersData.data);
            } catch (err) {
                console.error('Failed to fetch form data', err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);

        // Helper to get string or undefined
        const getStr = (key: string) => {
            const val = formData.get(key) as string;
            return val && val.trim() !== '' ? val.trim() : undefined;
        };

        const data: any = {
            firstName: getStr('firstName'),
            middleName: getStr('middleName'),
            lastName: getStr('lastName'),
            gender: formData.get('gender') as Gender,
            dateOfBirth: getStr('dateOfBirth'),
            placeOfBirth: getStr('placeOfBirth'),
            occupation: getStr('occupation'),
            isAlive: isAlive,
            dateOfDeath: isAlive ? undefined : getStr('dateOfDeath'),
            placeOfDeath: isAlive ? undefined : getStr('placeOfDeath'),
            fatherId: getStr('fatherId'),
            motherId: getStr('motherId'),
            branchId: getStr('branchId'),
            bio: getStr('bio'),
            notes: getStr('notes'),
            visibility: Visibility.MEMBERS_ONLY,
        };

        try {
            await createMember(data);
            router.push('/admin/members');
        } catch (err) {
            console.error(err);
            setError(
                'Failed to create member. Please check your input and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/members">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Thêm thành viên mới
                        </h1>
                        <p className="text-sm text-slate-500">
                            Tạo hồ sơ thành viên mới trong gia phả.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin cá nhân</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Họ *</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                placeholder="Nguyễn"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="middleName">Tên đệm</Label>
                            <Input
                                id="middleName"
                                name="middleName"
                                placeholder="Văn"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Tên *</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                placeholder="A"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">Giới tính *</Label>
                            <Select
                                name="gender"
                                defaultValue={Gender.MALE}
                                required
                            >
                                <option value={Gender.MALE}>Nam</option>
                                <option value={Gender.FEMALE}>Nữ</option>
                                <option value={Gender.OTHER}>Khác</option>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                            <Input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="placeOfBirth">Nơi sinh</Label>
                            <Input
                                id="placeOfBirth"
                                name="placeOfBirth"
                                placeholder="Hà Nội..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="occupation">Nghề nghiệp</Label>
                            <Input
                                id="occupation"
                                name="occupation"
                                placeholder="Kỹ sư..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Trạng thái</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="status">Trạng thái sống *</Label>
                            <Select
                                name="status"
                                value={isAlive ? 'alive' : 'deceased'}
                                onChange={(e) =>
                                    setIsAlive(e.target.value === 'alive')
                                }
                            >
                                <option value="alive">Còn sống</option>
                                <option value="deceased">Đã mất</option>
                            </Select>
                        </div>

                        {!isAlive && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="dateOfDeath">
                                        Ngày mất
                                    </Label>
                                    <Input
                                        id="dateOfDeath"
                                        name="dateOfDeath"
                                        type="date"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="placeOfDeath">
                                        Nơi mất
                                    </Label>
                                    <Input
                                        id="placeOfDeath"
                                        name="placeOfDeath"
                                        placeholder="Tại gia..."
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Family Connections */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quan hệ gia đình</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fatherId">Cha *</Label>
                            <Select name="fatherId" required>
                                <option value="">-- Chọn cha --</option>
                                {members &&
                                    members.length > 0 &&
                                    members
                                        .filter((m) => m.gender === Gender.MALE)
                                        .map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.fullName} (
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
                            <Label htmlFor="motherId">Mẹ *</Label>
                            <Select name="motherId" required>
                                <option value="">-- Chọn mẹ --</option>
                                {members &&
                                    members.length > 0 &&
                                    members
                                        .filter(
                                            (m) => m.gender === Gender.FEMALE
                                        )
                                        .map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.fullName} (
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

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="branchId">Thuộc Chi/Nhánh *</Label>
                            <Select name="branchId" required>
                                <option value="">-- Chọn chi/nhánh --</option>
                                {branches &&
                                    branches.length > 0 &&
                                    branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin bổ sung</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bio">Tiểu sử</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                placeholder="Tiểu sử tóm tắt..."
                                className="min-h-[100px]"
                            />
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
                        <Link href="/admin/members">Hủy bỏ</Link>
                    </Button>
                </div>
            </form>
        </div>
    );
}
