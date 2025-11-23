'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CustomSelect } from '@/components/ui/custom-select';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createMember, getBranches, getMembers } from '@/lib/api';
import { Gender, Visibility, FamilyBranch, Member } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NewMemberPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Data for selects
    const [branches, setBranches] = useState<FamilyBranch[]>([]);
    const [members, setMembers] = useState<Member[]>([]);

    // Form state
    const [gender, setGender] = useState<Gender>(Gender.MALE);
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [isAlive, setIsAlive] = useState(true);
    const [dateOfDeath, setDateOfDeath] = useState('');
    const [fatherId, setFatherId] = useState('');
    const [motherId, setMotherId] = useState('');
    const [branchId, setBranchId] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [branchesData, membersData] = await Promise.all([
                    getBranches(),
                    getMembers({ take: 1000 }),
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

        const getStr = (key: string) => {
            const val = formData.get(key) as string;
            return val && val.trim() !== '' ? val.trim() : undefined;
        };

        const data: any = {
            firstName: getStr('firstName'),
            middleName: getStr('middleName'),
            lastName: getStr('lastName'),
            gender: gender,
            dateOfBirth: dateOfBirth || undefined,
            placeOfBirth: getStr('placeOfBirth'),
            occupation: getStr('occupation'),
            avatarUrl: getStr('avatarUrl'),
            isAlive: isAlive,
            dateOfDeath: isAlive ? undefined : dateOfDeath || undefined,
            placeOfDeath: isAlive ? undefined : getStr('placeOfDeath'),
            fatherId: fatherId || undefined,
            motherId: motherId || undefined,
            branchId: branchId || undefined,
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
                            {t.members.newMember}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {t.members.newMemberSubtitle}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.members.personalInfo}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-6">
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.form.lastName}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="lastName"
                                placeholder="Nguyễn"
                                required
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.form.middleName}
                            </label>
                            <Input name="middleName" placeholder="Văn" />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.form.firstName}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input name="firstName" placeholder="A" required />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.gender}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <CustomSelect
                                value={gender}
                                onChange={(value) => setGender(value as Gender)}
                                options={[
                                    {
                                        value: Gender.MALE,
                                        label: t.common.male,
                                    },
                                    {
                                        value: Gender.FEMALE,
                                        label: t.common.female,
                                    },
                                    {
                                        value: Gender.UNKNOWN,
                                        label: t.common.unknown,
                                    },
                                ]}
                                placeholder={t.common.gender}
                                showSearch={false}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.dateOfBirth}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <CustomDatePicker
                                value={dateOfBirth}
                                onChange={setDateOfBirth}
                                placeholder={t.common.dateOfBirth}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.placeOfBirth}
                            </label>
                            <Input
                                name="placeOfBirth"
                                placeholder="Hà Nội..."
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.occupation}
                            </label>
                            <Input name="occupation" placeholder="Kỹ sư..." />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.avatarUrl}
                            </label>
                            <Input
                                name="avatarUrl"
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.status}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <CustomSelect
                                value={isAlive ? 'alive' : 'deceased'}
                                onChange={(value) =>
                                    setIsAlive(value === 'alive')
                                }
                                options={[
                                    {
                                        value: 'alive',
                                        label: t.common.alive,
                                    },
                                    {
                                        value: 'deceased',
                                        label: t.common.deceased,
                                    },
                                ]}
                                placeholder={t.common.status}
                                showSearch={false}
                            />
                        </div>

                        {!isAlive && (
                            <>
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-sm font-medium text-slate-700">
                                        {t.common.dateOfDeath}
                                    </label>
                                    <CustomDatePicker
                                        value={dateOfDeath}
                                        onChange={setDateOfDeath}
                                        placeholder={t.common.dateOfDeath}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-sm font-medium text-slate-700">
                                        {t.common.placeOfDeath}
                                    </label>
                                    <Input
                                        name="placeOfDeath"
                                        placeholder="Tại gia..."
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Family Connections & Additional Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.members.familyConnections}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-6">
                        <div className="md:col-span-3 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.father}
                            </label>
                            <CustomSelect
                                value={fatherId}
                                onChange={setFatherId}
                                options={members
                                    .filter(
                                        (m) =>
                                            m.gender === Gender.MALE &&
                                            (m.marriagesAsPartner1?.some(
                                                (mar) =>
                                                    mar.status === 'MARRIED'
                                            ) ||
                                                m.marriagesAsPartner2?.some(
                                                    (mar) =>
                                                        mar.status === 'MARRIED'
                                                ))
                                    )
                                    .map((m) => ({
                                        value: m.id,
                                        label: `${m.fullName} • ${
                                            m.dateOfBirth
                                                ? new Date(
                                                      m.dateOfBirth
                                                  ).getFullYear()
                                                : '?'
                                        }`,
                                    }))}
                                placeholder={t.common.selectFather}
                                searchPlaceholder={t.common.search}
                            />
                        </div>

                        <div className="md:col-span-3 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.mother}
                            </label>
                            <CustomSelect
                                value={motherId}
                                onChange={setMotherId}
                                options={members
                                    .filter(
                                        (m) =>
                                            m.gender === Gender.FEMALE &&
                                            (m.marriagesAsPartner1?.some(
                                                (mar) =>
                                                    mar.status === 'MARRIED'
                                            ) ||
                                                m.marriagesAsPartner2?.some(
                                                    (mar) =>
                                                        mar.status === 'MARRIED'
                                                ))
                                    )
                                    .map((m) => ({
                                        value: m.id,
                                        label: `${m.fullName} • ${
                                            m.dateOfBirth
                                                ? new Date(
                                                      m.dateOfBirth
                                                  ).getFullYear()
                                                : '?'
                                        }`,
                                    }))}
                                placeholder={t.common.selectMother}
                                searchPlaceholder={t.common.search}
                            />
                        </div>

                        <div className="md:col-span-6 mt-4">
                            <h3 className="mb-4 text-lg font-medium">
                                {t.members.additionalInfo}
                            </h3>
                        </div>

                        <div className="md:col-span-3 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.branch}
                            </label>
                            <CustomSelect
                                value={branchId}
                                onChange={setBranchId}
                                options={branches.map((b) => ({
                                    value: b.id,
                                    label: b.name,
                                }))}
                                placeholder={t.common.selectBranch}
                                searchPlaceholder={t.common.search}
                            />
                        </div>

                        <div className="md:col-span-3 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.visibility}
                            </label>
                            <CustomSelect
                                value={Visibility.MEMBERS_ONLY}
                                onChange={() => {}}
                                options={[
                                    {
                                        value: Visibility.PUBLIC,
                                        label: 'Public',
                                    },
                                    {
                                        value: Visibility.MEMBERS_ONLY,
                                        label: 'Members Only',
                                    },
                                    {
                                        value: Visibility.PRIVATE,
                                        label: 'Private',
                                    },
                                ]}
                                placeholder={t.common.visibility}
                                showSearch={false}
                            />
                        </div>

                        <div className="md:col-span-6 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.bio}
                            </label>
                            <Textarea
                                name="bio"
                                placeholder="Tiểu sử tóm tắt..."
                                rows={4}
                            />
                        </div>

                        <div className="md:col-span-6 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.notes}
                            </label>
                            <Textarea
                                name="notes"
                                placeholder="Ghi chú thêm..."
                                rows={3}
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
                                <Save className="mr-2 h-4 w-4" />{' '}
                                {t.common.save}
                            </>
                        )}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin/members">{t.common.cancel}</Link>
                    </Button>
                </div>
            </form>
        </div>
    );
}
