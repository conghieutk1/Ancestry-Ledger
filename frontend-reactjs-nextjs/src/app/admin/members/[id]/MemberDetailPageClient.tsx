'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    getMember,
    updateMember,
    deleteMember,
    getMembers,
    createMarriage,
} from '@/lib/api';
import { Member, Gender, Visibility } from '@/types';

export function MemberDetailPageClient({ id }: { id: string }) {
    const router = useRouter();
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    // Marriage Modal State
    const [showMarriageModal, setShowMarriageModal] = useState(false);
    const [potentialSpouses, setPotentialSpouses] = useState<Member[]>([]);
    const [selectedSpouseId, setSelectedSpouseId] = useState('');
    const [marriageDate, setMarriageDate] = useState('');
    const [marriageStatus, setMarriageStatus] = useState('MARRIED');
    const [savingMarriage, setSavingMarriage] = useState(false);

    const fetchMember = async () => {
        try {
            const data = await getMember(id);
            setMember(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load member.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMember();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchPotentialSpouses = async () => {
        if (!member) return;
        try {
            const response = await getMembers({
                take: 1000,
                gender:
                    member.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE,
            });
            // Filter out existing spouses
            const existingSpouseIds = [
                ...(member.marriagesAsPartner1
                    ?.map((m) => m.partner2?.id)
                    .filter(Boolean) || []),
                ...(member.marriagesAsPartner2
                    ?.map((m) => m.partner1?.id)
                    .filter(Boolean) || []),
            ];

            setPotentialSpouses(
                response.data.filter(
                    (m) =>
                        !existingSpouseIds.includes(m.id) && m.id !== member.id
                )
            );
        } catch (err) {
            console.error('Failed to fetch potential spouses', err);
        }
    };

    useEffect(() => {
        if (showMarriageModal) {
            fetchPotentialSpouses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMarriageModal]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!member) return;
        setSaving(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const dateOfBirth = formData.get('dateOfBirth') as string;

        const data: Partial<Member> = {
            firstName: formData.get('firstName') as string,
            middleName: formData.get('middleName') as string,
            lastName: formData.get('lastName') as string,
            gender: formData.get('gender') as Gender,
            isAlive: formData.get('status') === 'alive',
            visibility: Visibility.MEMBERS_ONLY,
        };

        if (dateOfBirth && dateOfBirth.trim() !== '') {
            data.dateOfBirth = dateOfBirth;
        }

        try {
            await updateMember(member.id, data);
            router.push('/admin/members');
        } catch (err) {
            console.error(err);
            setError('Failed to update member.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!member || !confirm('Are you sure you want to delete this member?'))
            return;
        setDeleting(true);
        setError('');
        try {
            await deleteMember(member.id);
            router.push('/admin/members');
        } catch (err: unknown) {
            console.error(err);
            const errorMessage =
                (err as { response?: { data?: { message?: string } } }).response
                    ?.data?.message || 'Failed to delete member.';
            setError(errorMessage);
            setDeleting(false);
        }
    };

    const handleCreateMarriage = async () => {
        if (!member) return;

        // Only require spouse for MARRIED status
        if (marriageStatus === 'MARRIED' && !selectedSpouseId) {
            alert('Vui lòng chọn vợ/chồng');
            return;
        }

        setSavingMarriage(true);
        try {
            const marriageData: {
                partner1Id: string;
                status: string;
                partner2Id?: string;
                startDate?: string;
            } = {
                partner1Id: member.id,
                status: marriageStatus,
            };

            // Only add partner2 and date if status is MARRIED
            if (marriageStatus === 'MARRIED') {
                marriageData.partner2Id = selectedSpouseId;
                if (marriageDate) {
                    marriageData.startDate = marriageDate;
                }
            }

            await createMarriage(marriageData);
            setShowMarriageModal(false);
            fetchMember(); // Refresh member data
            setSelectedSpouseId('');
            setMarriageDate('');
            setMarriageStatus('MARRIED');
        } catch (err: unknown) {
            console.error('Failed to create marriage', err);
            alert(
                (err as { response?: { data?: { message?: string } } }).response
                    ?.data?.message || 'Failed to create marriage'
            );
        } finally {
            setSavingMarriage(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (!member)
        return (
            <div className="p-6 text-center text-red-500">Member not found</div>
        );

    const marriages = [
        ...(member.marriagesAsPartner1 || []),
        ...(member.marriagesAsPartner2 || []),
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/members">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Edit Member
                        </h1>
                        <p className="text-sm text-slate-500">
                            ID: {member.id}
                        </p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    {deleting ? 'Deleting...' : 'Delete Member'}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleSubmit}
                            className="grid gap-4 md:grid-cols-2"
                        >
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">
                                    First Name
                                </label>
                                <Input
                                    name="firstName"
                                    defaultValue={member.firstName}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Middle Name
                                </label>
                                <Input
                                    name="middleName"
                                    defaultValue={member.middleName || ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Last Name
                                </label>
                                <Input
                                    name="lastName"
                                    defaultValue={member.lastName || ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Gender
                                </label>
                                <select
                                    name="gender"
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-300"
                                    defaultValue={member.gender}
                                >
                                    <option value={Gender.MALE}>Male</option>
                                    <option value={Gender.FEMALE}>
                                        Female
                                    </option>
                                    <option value={Gender.OTHER}>Other</option>
                                    <option value={Gender.UNKNOWN}>
                                        Unknown
                                    </option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Date of Birth
                                </label>
                                <Input
                                    name="dateOfBirth"
                                    type="date"
                                    defaultValue={
                                        member.dateOfBirth
                                            ? member.dateOfBirth.split('T')[0]
                                            : ''
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-700">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-300"
                                    defaultValue={
                                        member.isAlive ? 'alive' : 'deceased'
                                    }
                                >
                                    <option value="alive">Alive</option>
                                    <option value="deceased">Deceased</option>
                                </select>
                            </div>

                            {error && (
                                <div className="col-span-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center gap-4 md:col-span-2 pt-4">
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button variant="ghost" asChild>
                                    <Link href="/admin/members">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Marital Status Card */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Marital Status</CardTitle>
                        <Dialog
                            open={showMarriageModal}
                            onOpenChange={setShowMarriageModal}
                        >
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Thay đổi tình trạng hôn nhân
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Cập nhật tình trạng hôn nhân
                                    </DialogTitle>
                                    <DialogDescription>
                                        Thêm mối quan hệ hôn nhân mới cho thành
                                        viên này.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Tình trạng</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                            value={marriageStatus}
                                            onChange={(e) =>
                                                setMarriageStatus(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="MARRIED">
                                                Đã kết hôn
                                            </option>
                                            <option value="DIVORCED">
                                                Ly hôn
                                            </option>
                                            <option value="WIDOWED">Góa</option>
                                        </select>
                                    </div>

                                    {marriageStatus === 'MARRIED' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Chọn vợ/chồng</Label>
                                                <select
                                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                                    value={selectedSpouseId}
                                                    onChange={(e) =>
                                                        setSelectedSpouseId(
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        -- Chọn người --
                                                    </option>
                                                    {potentialSpouses.map(
                                                        (p) => (
                                                            <option
                                                                key={p.id}
                                                                value={p.id}
                                                            >
                                                                {p.fullName} (
                                                                {p.dateOfBirth
                                                                    ? new Date(
                                                                          p.dateOfBirth
                                                                      ).getFullYear()
                                                                    : '?'}
                                                                )
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Ngày cưới</Label>
                                                <Input
                                                    type="date"
                                                    value={marriageDate}
                                                    onChange={(e) =>
                                                        setMarriageDate(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setShowMarriageModal(false)
                                        }
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={handleCreateMarriage}
                                        disabled={
                                            savingMarriage ||
                                            (marriageStatus === 'MARRIED' &&
                                                !selectedSpouseId)
                                        }
                                    >
                                        {savingMarriage ? 'Đang lưu...' : 'Lưu'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {marriages.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Chưa có thông tin hôn nhân (Độc thân).
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {marriages.map((m) => {
                                    const spouse =
                                        m.partner1?.id === member.id
                                            ? m.partner2
                                            : m.partner1;

                                    return (
                                        <div
                                            key={m.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {spouse?.fullName ||
                                                        'Unknown'}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {m.status} •{' '}
                                                    {m.startDate
                                                        ? new Date(
                                                              m.startDate
                                                          ).getFullYear()
                                                        : '?'}
                                                </p>
                                            </div>
                                            {spouse?.id ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={`/admin/members/${spouse.id}`}
                                                    >
                                                        Xem hồ sơ
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <span className="text-sm text-slate-500">
                                                    No profile
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
