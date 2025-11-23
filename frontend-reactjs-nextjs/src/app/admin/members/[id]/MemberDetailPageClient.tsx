'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Trash,
    Plus,
    Check,
    ChevronsUpDown,
    Search,
} from 'lucide-react';
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
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { CustomSelect } from '@/components/ui/custom-select';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import {
    getMember,
    updateMember,
    deleteMember,
    getMembers,
    createMarriage,
} from '@/lib/api';
import { Member, Gender, Visibility } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDetailSkeleton } from '@/components/ui/loading-skeletons';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function MemberDetailPageClient({ id }: { id: string }) {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
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
    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [fatherId, setFatherId] = useState('');
    const [motherId, setMotherId] = useState('');
    const [allMembers, setAllMembers] = useState<Member[]>([]);

    // Dropdown Portal State
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
    });

    const fetchMember = async () => {
        try {
            const data = await getMember(id);
            setMember(data);
            setFatherId(data.father?.id || '');
            setMotherId(data.mother?.id || '');
        } catch (err) {
            console.error(err);
            setError('Failed to load member.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllMembers = async () => {
        try {
            const response = await getMembers({ take: 1000 });
            setAllMembers(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMember();
        fetchAllMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Auto-open marriage modal when ?openMarriage=1 or ?openMarriage=true is present
    useEffect(() => {
        try {
            const openMarriage = searchParams?.get('openMarriage');
            if (openMarriage === '1' || openMarriage === 'true') {
                setShowMarriageModal(true);
            }
        } catch {
            // ignore
        }
    }, [searchParams]);

    // Close dropdown on resize
    useEffect(() => {
        const handleResize = () => setComboboxOpen(false);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchPotentialSpouses = async () => {
        if (!member) return;
        // Use already fetched allMembers if available, otherwise fetch
        let membersList = allMembers;
        if (membersList.length === 0) {
            try {
                const response = await getMembers({ take: 1000 });
                membersList = response.data;
                setAllMembers(membersList);
            } catch (err) {
                console.error(err);
                return;
            }
        }

        // Filter: Opposite gender, not self
        const targetGender =
            member.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE;
        const filtered = membersList.filter(
            (m) => m.id !== member.id && m.gender === targetGender
        );
        setPotentialSpouses(filtered);
    };

    useEffect(() => {
        if (showMarriageModal && marriageStatus !== 'SINGLE') {
            fetchPotentialSpouses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showMarriageModal, marriageStatus]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!member) return;
        setSaving(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        // We need to cast to any because UpdateMemberDto includes fatherId/motherId which might not be in Partial<Member> depending on type definition
        // But our backend accepts it.
        const updates: any = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            middleName: formData.get('middleName') as string,
            gender: member.gender, // Use state value instead of FormData
            dateOfBirth: member.dateOfBirth, // Use state value instead of FormData
            isAlive: member.isAlive, // Use state value instead of FormData
            dateOfDeath: member.dateOfDeath, // Use state value
            placeOfBirth: formData.get('placeOfBirth') as string,
            placeOfDeath: formData.get('placeOfDeath') as string,
            occupation: formData.get('occupation') as string,
            bio: formData.get('bio') as string,
            notes: formData.get('notes') as string,
            avatarUrl: formData.get('avatarUrl') as string,
            generationIndex: formData.get('generationIndex')
                ? parseInt(formData.get('generationIndex') as string)
                : undefined,
            visibility: member.visibility, // Use state value
            fatherId: fatherId || null,
            motherId: motherId || null,
        };

        try {
            await updateMember(member.id, updates);
            toast.success(t.messages.updateSuccess);
            // Refresh
            await fetchMember();
            router.refresh();
        } catch (err) {
            console.error(err);
            toast.error(t.messages.updateError);
            setError(t.messages.updateError);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(t.common.confirmDelete)) return;
        setDeleting(true);
        try {
            await deleteMember(id);
            toast.success(t.messages.deleteSuccess);
            router.push('/admin/members');
        } catch (err) {
            console.error(err);
            toast.error(t.messages.deleteError);
            setDeleting(false);
        }
    };

    const handleCreateMarriage = async () => {
        if (!member) return;
        setSavingMarriage(true);
        try {
            await createMarriage({
                partner1Id: member.id,
                partner2Id: selectedSpouseId || undefined, // undefined if SINGLE
                status: marriageStatus,
                startDate: marriageDate
                    ? new Date(marriageDate).toISOString()
                    : undefined,
            });
            toast.success(t.messages.marriageUpdateSuccess);
            setShowMarriageModal(false);
            setMarriageDate('');
            setSelectedSpouseId('');
            fetchMember(); // Refresh to show new marriage
        } catch (err: any) {
            console.error(err);

            // Check if this is a forbidden marriage error
            const errorData = err.response?.data;
            if (errorData?.error === 'FORBIDDEN_MARRIAGE') {
                // Map relationship key to localized text
                const relationshipKey = errorData.relationshipKey || 'unknown';
                const relationship =
                    (t.relationships as any)[relationshipKey] ||
                    relationshipKey;
                const limit = errorData.limit || 3;

                const msg = t.messages.cannotMarryRelative
                    .replace('{relationship}', relationship)
                    .replace('{limit}', limit.toString());
                toast.error(msg);
            } else if (errorData?.error === 'AGE_REQUIREMENT') {
                // Handle age requirement error
                const gender = errorData.gender;
                const minAge = errorData.minAge;
                const currentAge = errorData.currentAge;

                const msgKey =
                    gender === 'MALE'
                        ? 'ageRequirementMale'
                        : 'ageRequirementFemale';
                const msg = (t.messages as any)[msgKey]
                    .replace('{minAge}', minAge.toString())
                    .replace('{currentAge}', currentAge.toString());
                toast.error(msg);
            } else {
                // Generic error message
                const msg =
                    errorData?.message || t.messages.marriageUpdateError;
                toast.error(msg);
            }
        } finally {
            setSavingMarriage(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'SINGLE':
                return t.common.single;
            case 'MARRIED':
                return t.common.married;
            case 'DIVORCED':
                return t.common.divorced;
            case 'WIDOWED':
                return t.common.widowed;
            default:
                return status;
        }
    };

    if (loading) return <MemberDetailSkeleton />;
    if (!member) return <div>{t.members.noProfile}</div>;

    // Determine current marital status from active marriages or member data
    // This is a simplification; backend should ideally provide a "currentStatus" field
    // For now, we look at the latest active marriage
    const activeMarriage =
        member.marriagesAsPartner1?.find((m) => !m.endDate) ||
        member.marriagesAsPartner2?.find((m) => !m.endDate);

    const currentStatus = activeMarriage ? activeMarriage.status : 'SINGLE';
    const marriages = [
        ...(member.marriagesAsPartner1 || []),
        ...(member.marriagesAsPartner2 || []),
    ].sort(
        (a, b) =>
            new Date(b.startDate || 0).getTime() -
            new Date(a.startDate || 0).getTime()
    );

    const filteredSpouses = potentialSpouses.filter((p) =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/members">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {member.fullName}
                    </h1>
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    {t.common.delete}
                </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Personal Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.members.personalInfo}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-6">
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.form.lastName}
                            </label>
                            <Input
                                name="lastName"
                                defaultValue={member.lastName}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.form.middleName}
                            </label>
                            <Input
                                name="middleName"
                                defaultValue={member.middleName || ''}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.form.firstName}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="firstName"
                                defaultValue={member.firstName}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.gender}
                            </label>
                            <CustomSelect
                                value={member.gender}
                                onChange={(value) => {
                                    setMember((prev) => {
                                        if (!prev) return prev;
                                        return {
                                            ...prev,
                                            gender: value as Gender,
                                        };
                                    });
                                }}
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
                                searchPlaceholder={t.common.search}
                                showSearch={false}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.dateOfBirth}
                            </label>
                            <CustomDatePicker
                                name="dateOfBirth"
                                value={
                                    member.dateOfBirth
                                        ? member.dateOfBirth.split('T')[0]
                                        : ''
                                }
                                onChange={(value) => {
                                    setMember((prev) => {
                                        if (!prev) return prev;
                                        return {
                                            ...prev,
                                            dateOfBirth: value
                                                ? new Date(value).toISOString()
                                                : undefined,
                                        };
                                    });
                                }}
                                placeholder={t.common.dateOfBirth}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.placeOfBirth}
                            </label>
                            <Input
                                name="placeOfBirth"
                                defaultValue={member.placeOfBirth || ''}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.occupation}
                            </label>
                            <Input
                                name="occupation"
                                defaultValue={member.occupation || ''}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.avatarUrl}
                            </label>
                            <Input
                                name="avatarUrl"
                                defaultValue={member.avatarUrl || ''}
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.status}
                            </label>
                            <CustomSelect
                                value={member.isAlive ? 'alive' : 'deceased'}
                                onChange={(value) => {
                                    setMember((prev) => {
                                        if (!prev) return prev;
                                        return {
                                            ...prev,
                                            isAlive: value === 'alive',
                                        };
                                    });
                                }}
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

                        {!member.isAlive && (
                            <>
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-sm font-medium text-slate-700">
                                        {t.common.dateOfDeath}
                                    </label>
                                    <CustomDatePicker
                                        name="dateOfDeath"
                                        value={
                                            member.dateOfDeath
                                                ? member.dateOfDeath.split(
                                                      'T'
                                                  )[0]
                                                : ''
                                        }
                                        onChange={(value) => {
                                            setMember((prev) => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    dateOfDeath: value
                                                        ? new Date(
                                                              value
                                                          ).toISOString()
                                                        : undefined,
                                                };
                                            });
                                        }}
                                        placeholder={t.common.dateOfDeath}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-sm font-medium text-slate-700">
                                        {t.common.placeOfDeath}
                                    </label>
                                    <Input
                                        name="placeOfDeath"
                                        defaultValue={member.placeOfDeath || ''}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Family Connections Card */}
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
                                onChange={(newFatherId) => {
                                    setFatherId(newFatherId);
                                    // Auto-select mother if father is married
                                    if (newFatherId) {
                                        const father = allMembers.find(
                                            (m) => m.id === newFatherId
                                        );
                                        if (father) {
                                            // Check marriages where father is partner1
                                            const w1 =
                                                father.marriagesAsPartner1?.find(
                                                    (m) =>
                                                        m.status === 'MARRIED'
                                                )?.partner2;
                                            // Check marriages where father is partner2
                                            const w2 =
                                                father.marriagesAsPartner2?.find(
                                                    (m) =>
                                                        m.status === 'MARRIED'
                                                )?.partner1;

                                            const wifeId = w1?.id || w2?.id;
                                            if (wifeId) {
                                                setMotherId(wifeId);
                                            }
                                        }
                                    }
                                }}
                                options={allMembers
                                    .filter((m) => {
                                        // Must be Male and not self
                                        if (
                                            m.gender !== Gender.MALE ||
                                            m.id === member.id
                                        )
                                            return false;

                                        // Filter by age: Parent must be older (birth year < member birth year)
                                        // If either date is missing, allow it (to be safe)
                                        if (
                                            !member.dateOfBirth ||
                                            !m.dateOfBirth
                                        )
                                            return true;

                                        const memberYear = new Date(
                                            member.dateOfBirth
                                        ).getFullYear();
                                        const parentYear = new Date(
                                            m.dateOfBirth
                                        ).getFullYear();

                                        return parentYear < memberYear;
                                    })
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
                                onChange={(newMotherId) => {
                                    setMotherId(newMotherId);
                                    // Auto-select father if mother is married
                                    if (newMotherId) {
                                        const mother = allMembers.find(
                                            (m) => m.id === newMotherId
                                        );
                                        if (mother) {
                                            // Check marriages where mother is partner1
                                            const h1 =
                                                mother.marriagesAsPartner1?.find(
                                                    (m) =>
                                                        m.status === 'MARRIED'
                                                )?.partner2;
                                            // Check marriages where mother is partner2
                                            const h2 =
                                                mother.marriagesAsPartner2?.find(
                                                    (m) =>
                                                        m.status === 'MARRIED'
                                                )?.partner1;

                                            const husbandId = h1?.id || h2?.id;
                                            if (husbandId) {
                                                setFatherId(husbandId);
                                            }
                                        }
                                    }
                                }}
                                options={allMembers
                                    .filter((m) => {
                                        // Must be Female and not self
                                        if (
                                            m.gender !== Gender.FEMALE ||
                                            m.id === member.id
                                        )
                                            return false;

                                        // Filter by age: Parent must be older
                                        if (
                                            !member.dateOfBirth ||
                                            !m.dateOfBirth
                                        )
                                            return true;

                                        const memberYear = new Date(
                                            member.dateOfBirth
                                        ).getFullYear();
                                        const parentYear = new Date(
                                            m.dateOfBirth
                                        ).getFullYear();

                                        return parentYear < memberYear;
                                    })
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
                    </CardContent>
                </Card>

                {/* Additional Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.members.additionalInfo}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-6">
                        <div className="md:col-span-3 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.generationIndex}
                            </label>
                            <Input
                                name="generationIndex"
                                type="number"
                                defaultValue={member.generationIndex || ''}
                                disabled
                            />
                        </div>
                        <div className="md:col-span-3 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.visibility}
                            </label>
                            <CustomSelect
                                value={member.visibility}
                                onChange={(value) => {
                                    setMember((prev) => {
                                        if (!prev) return prev;
                                        return {
                                            ...prev,
                                            visibility: value as Visibility,
                                        };
                                    });
                                }}
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
                                defaultValue={member.bio || ''}
                                rows={4}
                            />
                        </div>
                        <div className="md:col-span-6 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.notes}
                            </label>
                            <Textarea
                                name="notes"
                                defaultValue={member.notes || ''}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={saving}>
                        {saving ? t.common.saving : t.common.save}
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href="/admin/members">{t.common.cancel}</Link>
                    </Button>
                </div>
            </form>

            {/* Marital Status Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                        {t.members.maritalStatus}
                        <span className="ml-2 text-sm font-normal text-slate-500">
                            ({getStatusLabel(currentStatus)})
                        </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setMarriageStatus('MARRIED');
                                setShowMarriageModal(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t.members.addMarriage}
                        </Button>
                        <Dialog
                            open={showMarriageModal}
                            onOpenChange={setShowMarriageModal}
                        >
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        {t.members.changeMaritalStatus}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setMarriageStatus('SINGLE');
                                            setShowMarriageModal(true);
                                        }}
                                    >
                                        {t.common.single}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setMarriageStatus('MARRIED');
                                            setShowMarriageModal(true);
                                        }}
                                    >
                                        {t.common.married}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setMarriageStatus('DIVORCED');
                                            setShowMarriageModal(true);
                                        }}
                                    >
                                        {t.common.divorced}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setMarriageStatus('WIDOWED');
                                            setShowMarriageModal(true);
                                        }}
                                    >
                                        {t.common.widowed}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {t.members.updateMaritalStatus}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t.members.addMarriageDescription}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>{t.common.status}</Label>
                                        <CustomSelect
                                            value={marriageStatus}
                                            onChange={(value) => {
                                                setMarriageStatus(value);
                                                // Reset spouse selection when changing status
                                                if (value === 'SINGLE') {
                                                    setSelectedSpouseId('');
                                                }
                                            }}
                                            options={[
                                                {
                                                    value: 'SINGLE',
                                                    label: t.common.single,
                                                },
                                                {
                                                    value: 'MARRIED',
                                                    label: t.common.married,
                                                },
                                                {
                                                    value: 'DIVORCED',
                                                    label: t.common.divorced,
                                                },
                                                {
                                                    value: 'WIDOWED',
                                                    label: t.common.widowed,
                                                },
                                            ]}
                                            placeholder={t.common.status}
                                            showSearch={false}
                                        />
                                    </div>{' '}
                                    {marriageStatus !== 'SINGLE' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>{t.common.spouse}</Label>
                                                <div className="relative">
                                                    <Button
                                                        ref={triggerRef}
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={
                                                            comboboxOpen
                                                        }
                                                        className="w-full justify-between"
                                                        onClick={() => {
                                                            if (
                                                                !comboboxOpen &&
                                                                triggerRef.current
                                                            ) {
                                                                const rect =
                                                                    triggerRef.current.getBoundingClientRect();
                                                                setDropdownPosition(
                                                                    {
                                                                        top:
                                                                            rect.bottom +
                                                                            4,
                                                                        left: rect.left,
                                                                        width: rect.width,
                                                                    }
                                                                );
                                                            }
                                                            setComboboxOpen(
                                                                !comboboxOpen
                                                            );
                                                        }}
                                                    >
                                                        {selectedSpouseId
                                                            ? potentialSpouses.find(
                                                                  (p) =>
                                                                      p.id ===
                                                                      selectedSpouseId
                                                              )?.fullName
                                                            : t.common
                                                                  .selectOption}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                    {comboboxOpen &&
                                                        createPortal(
                                                            <>
                                                                <div
                                                                    className="fixed inset-0"
                                                                    style={{
                                                                        zIndex: 99998,
                                                                    }}
                                                                    onClick={() =>
                                                                        setComboboxOpen(
                                                                            false
                                                                        )
                                                                    }
                                                                />
                                                                <div
                                                                    className="fixed rounded-md border border-slate-200 bg-white shadow-md animate-in fade-in-0 zoom-in-95"
                                                                    style={{
                                                                        zIndex: 99999,
                                                                        top: dropdownPosition.top,
                                                                        left: dropdownPosition.left,
                                                                        width: dropdownPosition.width,
                                                                    }}
                                                                >
                                                                    <div className="flex items-center border-b px-3">
                                                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        <input
                                                                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                                            placeholder={
                                                                                t
                                                                                    .common
                                                                                    .search +
                                                                                '...'
                                                                            }
                                                                            onClick={(
                                                                                e
                                                                            ) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                            value={
                                                                                searchTerm
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                setSearchTerm(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="max-h-[200px] overflow-y-auto p-1">
                                                                        {filteredSpouses.length ===
                                                                        0 ? (
                                                                            <div className="py-6 text-center text-sm text-slate-500">
                                                                                {
                                                                                    t
                                                                                        .members
                                                                                        .noProfile
                                                                                }
                                                                            </div>
                                                                        ) : (
                                                                            filteredSpouses.map(
                                                                                (
                                                                                    p
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            p.id
                                                                                        }
                                                                                        className={cn(
                                                                                            'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900',
                                                                                            selectedSpouseId ===
                                                                                                p.id &&
                                                                                                'bg-slate-100'
                                                                                        )}
                                                                                        onClick={(
                                                                                            e
                                                                                        ) => {
                                                                                            e.stopPropagation();
                                                                                            e.preventDefault();
                                                                                            setSelectedSpouseId(
                                                                                                p.id ===
                                                                                                    selectedSpouseId
                                                                                                    ? ''
                                                                                                    : p.id
                                                                                            );
                                                                                            setComboboxOpen(
                                                                                                false
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <Check
                                                                                            className={cn(
                                                                                                'mr-2 h-4 w-4',
                                                                                                selectedSpouseId ===
                                                                                                    p.id
                                                                                                    ? 'opacity-100'
                                                                                                    : 'opacity-0'
                                                                                            )}
                                                                                        />
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-medium">
                                                                                                {
                                                                                                    p.fullName
                                                                                                }
                                                                                            </span>
                                                                                            <span className="text-xs text-slate-500">
                                                                                                {p.dateOfBirth
                                                                                                    ? new Date(
                                                                                                          p.dateOfBirth
                                                                                                      ).getFullYear()
                                                                                                    : '?'}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>,
                                                            document.body
                                                        )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>
                                                    {t.members.marriageDate}
                                                </Label>
                                                <CustomDatePicker
                                                    value={marriageDate}
                                                    onChange={(value) =>
                                                        setMarriageDate(value)
                                                    }
                                                    placeholder={
                                                        t.members.marriageDate
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
                                        {t.common.cancel}
                                    </Button>
                                    <Button
                                        onClick={handleCreateMarriage}
                                        disabled={
                                            savingMarriage ||
                                            (marriageStatus !== 'SINGLE' &&
                                                !selectedSpouseId)
                                        }
                                    >
                                        {savingMarriage
                                            ? t.common.saving
                                            : t.common.save}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {marriages.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            {t.members.noSpouse}
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
                                                    t.common.unknown}
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
                                                    {t.members.viewProfile}
                                                </Link>
                                            </Button>
                                        ) : (
                                            <span className="text-sm text-slate-500">
                                                {t.members.noProfile}
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
    );
}
