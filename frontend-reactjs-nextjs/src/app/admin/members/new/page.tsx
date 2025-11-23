'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, RefreshCw, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CustomSelect } from '@/components/ui/custom-select';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    createMember,
    getBranches,
    getMembers,
    createMarriage,
} from '@/lib/api';
import { Gender, Visibility, FamilyBranch, Member } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NewMemberPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

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
    const [spouseId, setSpouseId] = useState('');
    const [branchId, setBranchId] = useState('');
    const [generationIndex, setGenerationIndex] = useState<number | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const fetchData = async () => {
        setIsFetching(true);
        try {
            const [branchesData, membersData] = await Promise.all([
                getBranches(),
                getMembers({ take: 1000 }),
            ]);
            setBranches(branchesData);
            setMembers(membersData.data);

            // Reset all form state to defaults
            setGender(Gender.MALE);
            setDateOfBirth('');
            setIsAlive(true);
            setDateOfDeath('');
            setFatherId('');
            setMotherId('');
            setSpouseId('');
            setBranchId('');
            setGenerationIndex(null);

            // Reset uncontrolled inputs
            formRef.current?.reset();

            toast.success(t.messages.refreshSuccess, {
                className: 'bg-emerald-500 text-white border-emerald-600',
            });
        } catch (err) {
            console.error('Failed to fetch form data', err);
            toast.error(t.messages.refreshError, {
                className: 'bg-red-500 text-white border-red-600',
            });
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        // Initial fetch without toast
        const initialFetch = async () => {
            try {
                const [branchesData, membersData] = await Promise.all([
                    getBranches(),
                    getMembers({ take: 1000 }),
                ]);
                setBranches(branchesData);
                setMembers(membersData.data);
            } catch (err) {
                console.error('Failed to fetch form data', err);
            } finally {
                setIsFetching(false);
            }
        };
        initialFetch();
    }, []);

    const clearInput = (name: string) => {
        if (formRef.current) {
            const input = formRef.current.elements.namedItem(name) as
                | HTMLInputElement
                | HTMLTextAreaElement;
            if (input) input.value = '';
        }
    };

    const handleClearPersonalInfo = () => {
        setGender(Gender.MALE);
        setDateOfBirth('');
        setIsAlive(true);
        setDateOfDeath('');
        clearInput('lastName');
        clearInput('middleName');
        clearInput('firstName');
        clearInput('placeOfBirth');
        clearInput('occupation');
        clearInput('phoneNumber');
        clearInput('avatarUrl');
        clearInput('placeOfDeath');
    };

    const handleClearFamilyConnections = () => {
        setFatherId('');
        setMotherId('');
        setSpouseId('');
        setBranchId('');
        setGenerationIndex(null);
    };

    const handleClearAdditionalInfo = () => {
        clearInput('bio');
        clearInput('notes');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const lastName = formData.get('lastName') as string;
        const firstName = formData.get('firstName') as string;

        // Validation: Required fields
        if (!lastName || !lastName.trim()) {
            toast.error(`${t.form.lastName} ${t.common.required}`, {
                className: 'bg-red-500 text-white border-red-600',
            });
            setLoading(false);
            return;
        }

        if (!firstName || !firstName.trim()) {
            toast.error(`${t.form.firstName} ${t.common.required}`, {
                className: 'bg-red-500 text-white border-red-600',
            });
            setLoading(false);
            return;
        }

        if (!dateOfBirth) {
            toast.error(`${t.common.dateOfBirth} ${t.common.required}`, {
                className: 'bg-red-500 text-white border-red-600',
            });
            setLoading(false);
            return;
        }

        // Validation: Must have connection to family tree (Parents or Spouse)
        // Exception: If this is the first member in the system
        if (members.length > 0 && !fatherId && !motherId && !spouseId) {
            toast.error(t.messages.validationConnectionRequired, {
                className: 'bg-red-500 text-white border-red-600',
            });
            setLoading(false);
            return;
        }

        // Validation: Marriage Age
        if (spouseId && dateOfBirth) {
            const spouse = members.find((m) => m.id === spouseId);
            if (spouse) {
                const newMemberDate = new Date(dateOfBirth);
                const now = new Date();
                const newMemberAge =
                    now.getFullYear() - newMemberDate.getFullYear();

                const isMale = gender === Gender.MALE;
                const minAge = isMale ? 20 : 18;

                if (newMemberAge < minAge) {
                    toast.error(
                        t.messages.validationAgeNewMember.replace(
                            '{minAge}',
                            minAge.toString()
                        ),
                        {
                            className: 'bg-red-500 text-white border-red-600',
                        }
                    );
                    setLoading(false);
                    return;
                }

                if (spouse.dateOfBirth) {
                    const spouseDate = new Date(spouse.dateOfBirth);
                    const spouseAge =
                        now.getFullYear() - spouseDate.getFullYear();
                    const spouseMinAge =
                        spouse.gender === Gender.MALE ? 20 : 18;

                    if (spouseAge < spouseMinAge) {
                        toast.error(
                            t.messages.validationAgeSpouse.replace(
                                '{minAge}',
                                spouseMinAge.toString()
                            ),
                            {
                                className:
                                    'bg-red-500 text-white border-red-600',
                            }
                        );
                        setLoading(false);
                        return;
                    }
                }
            }
        }

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
            phoneNumber: getStr('phoneNumber'),
            avatarUrl: getStr('avatarUrl'),
            isAlive: isAlive,
            dateOfDeath: isAlive ? undefined : dateOfDeath || undefined,
            placeOfDeath: isAlive ? undefined : getStr('placeOfDeath'),
            fatherId: fatherId || undefined,
            motherId: motherId || undefined,
            branchId: branchId || undefined,
            generationIndex: generationIndex || undefined,
            bio: getStr('bio'),
            notes: getStr('notes'),
            visibility: Visibility.MEMBERS_ONLY,
        };

        try {
            const newMember = await createMember(data);

            // If spouse selected, create marriage
            if (spouseId && newMember && newMember.id) {
                try {
                    const isMale = gender === Gender.MALE;
                    await createMarriage({
                        partner1Id: isMale ? newMember.id : spouseId,
                        partner2Id: isMale ? spouseId : newMember.id,
                        status: 'MARRIED',
                        startDate: new Date().toISOString(),
                    });
                } catch (marriageErr) {
                    console.error('Failed to create marriage', marriageErr);
                    toast.error(t.messages.marriageCreateError, {
                        className: 'bg-red-500 text-white border-red-600',
                    });
                }
            }

            toast.success(t.messages.createSuccess, {
                className: 'bg-emerald-500 text-white border-emerald-600',
            });
            router.push('/admin/members');
        } catch (err) {
            console.error(err);
            toast.error(t.messages.createError, {
                className: 'bg-red-500 text-white border-red-600',
            });
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
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchData}
                    type="button"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>{t.members.personalInfo}</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearPersonalInfo}
                            type="button"
                            className="h-8 px-2 text-slate-500 hover:text-red-600"
                        >
                            <X className="mr-1 h-4 w-4" />
                            {t.common.clear}
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-6">
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.form.lastName}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input name="lastName" placeholder="Đặng" />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.form.middleName}
                            </label>
                            <Input name="middleName" placeholder="Hữu" />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.form.firstName}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input name="firstName" placeholder="" />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.gender}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <CustomSelect
                                value={gender}
                                onChange={(value) => {
                                    setGender(value as Gender);
                                    // Clear ALL family connections when gender changes
                                    setFatherId('');
                                    setMotherId('');
                                    setSpouseId('');
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
                            <Input name="placeOfBirth" placeholder="" />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.occupation}
                            </label>
                            <Input name="occupation" placeholder="" />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.phoneNumber}
                            </label>
                            <Input name="phoneNumber" placeholder="" />
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
                                    <Input name="placeOfDeath" placeholder="" />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Family Connections & Additional Info */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>{t.members.familyConnections}</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFamilyConnections}
                            type="button"
                            className="h-8 px-2 text-slate-500 hover:text-red-600"
                        >
                            <X className="mr-1 h-4 w-4" />
                            {t.common.clear}
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-6">
                        {isFetching ? (
                            <div className="col-span-6 text-center py-8 text-slate-500">
                                {t.common.loading}
                            </div>
                        ) : members.length === 0 ? (
                            <div className="col-span-6 flex flex-col items-center justify-center py-6 text-center space-y-2 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="font-medium text-slate-900">
                                    {t.members.rootMember}
                                </h3>
                                <p className="text-sm text-slate-500 max-w-md">
                                    {t.members.rootMemberDescription}
                                </p>
                            </div>
                        ) : (
                            <>
                                {(gender === Gender.MALE || !spouseId) && (
                                    <>
                                        <div className="md:col-span-3 space-y-3">
                                            <label className="text-sm font-medium text-slate-700">
                                                {t.common.father}
                                            </label>
                                            <CustomSelect
                                                value={fatherId}
                                                onChange={(val) => {
                                                    setFatherId(val);
                                                    // If parent selected, ensure spouse is cleared (though it should be hidden, this is safety)
                                                    if (val) {
                                                        setSpouseId('');
                                                        // Auto-map Mother and Branch
                                                        const father =
                                                            members.find(
                                                                (m) =>
                                                                    m.id === val
                                                            );
                                                        if (father) {
                                                            setBranchId(
                                                                father.branch
                                                                    ?.id || ''
                                                            );
                                                            // Auto-fill generation (child = parent + 1)
                                                            if (
                                                                father.generationIndex
                                                            ) {
                                                                setGenerationIndex(
                                                                    father.generationIndex +
                                                                        1
                                                                );
                                                            } else {
                                                                setGenerationIndex(
                                                                    null
                                                                );
                                                            }

                                                            const marriage =
                                                                father.marriagesAsPartner1?.find(
                                                                    (m) =>
                                                                        m.status ===
                                                                        'MARRIED'
                                                                ) ||
                                                                father.marriagesAsPartner2?.find(
                                                                    (m) =>
                                                                        m.status ===
                                                                        'MARRIED'
                                                                );
                                                            if (marriage) {
                                                                const spouseId =
                                                                    marriage
                                                                        .partner1
                                                                        .id ===
                                                                    father.id
                                                                        ? marriage
                                                                              .partner2
                                                                              .id
                                                                        : marriage
                                                                              .partner1
                                                                              .id;
                                                                if (spouseId)
                                                                    setMotherId(
                                                                        spouseId
                                                                    );
                                                            }
                                                        }
                                                    }
                                                }}
                                                options={members
                                                    .filter(
                                                        (m) =>
                                                            m.gender ===
                                                                Gender.MALE &&
                                                            (m.marriagesAsPartner1?.some(
                                                                (mar) =>
                                                                    mar.status ===
                                                                    'MARRIED'
                                                            ) ||
                                                                m.marriagesAsPartner2?.some(
                                                                    (mar) =>
                                                                        mar.status ===
                                                                        'MARRIED'
                                                                ))
                                                    )
                                                    .map((m) => ({
                                                        value: m.id,
                                                        label: `${
                                                            m.fullName
                                                        } • ${
                                                            m.dateOfBirth
                                                                ? new Date(
                                                                      m.dateOfBirth
                                                                  ).getFullYear()
                                                                : '?'
                                                        }`,
                                                    }))}
                                                placeholder={
                                                    t.common.selectFather
                                                }
                                                searchPlaceholder={
                                                    t.common.search
                                                }
                                            />
                                        </div>

                                        <div className="md:col-span-3 space-y-3">
                                            <label className="text-sm font-medium text-slate-700">
                                                {t.common.mother}
                                            </label>
                                            <CustomSelect
                                                value={motherId}
                                                onChange={(val) => {
                                                    setMotherId(val);
                                                    // If parent selected, ensure spouse is cleared
                                                    if (val) {
                                                        setSpouseId('');
                                                        // Auto-map Father and Branch
                                                        const mother =
                                                            members.find(
                                                                (m) =>
                                                                    m.id === val
                                                            );
                                                        if (mother) {
                                                            let inferredBranchId =
                                                                mother.branch
                                                                    ?.id || '';

                                                            // Auto-fill generation (child = parent + 1)
                                                            if (
                                                                mother.generationIndex
                                                            ) {
                                                                setGenerationIndex(
                                                                    mother.generationIndex +
                                                                        1
                                                                );
                                                            } else {
                                                                setGenerationIndex(
                                                                    null
                                                                );
                                                            }

                                                            const marriage =
                                                                mother.marriagesAsPartner1?.find(
                                                                    (m) =>
                                                                        m.status ===
                                                                        'MARRIED'
                                                                ) ||
                                                                mother.marriagesAsPartner2?.find(
                                                                    (m) =>
                                                                        m.status ===
                                                                        'MARRIED'
                                                                );
                                                            if (marriage) {
                                                                const spouseId =
                                                                    marriage
                                                                        .partner1
                                                                        .id ===
                                                                    mother.id
                                                                        ? marriage
                                                                              .partner2
                                                                              .id
                                                                        : marriage
                                                                              .partner1
                                                                              .id;
                                                                if (spouseId) {
                                                                    setFatherId(
                                                                        spouseId
                                                                    );
                                                                    // If father found, prefer father's branch
                                                                    const father =
                                                                        members.find(
                                                                            (
                                                                                m
                                                                            ) =>
                                                                                m.id ===
                                                                                spouseId
                                                                        );
                                                                    if (
                                                                        father &&
                                                                        father
                                                                            .branch
                                                                            ?.id
                                                                    ) {
                                                                        inferredBranchId =
                                                                            father
                                                                                .branch
                                                                                .id;
                                                                        // Also prefer father's generation if available
                                                                        if (
                                                                            father.generationIndex
                                                                        ) {
                                                                            setGenerationIndex(
                                                                                father.generationIndex +
                                                                                    1
                                                                            );
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            setBranchId(
                                                                inferredBranchId
                                                            );
                                                        }
                                                    }
                                                }}
                                                options={members
                                                    .filter(
                                                        (m) =>
                                                            m.gender ===
                                                                Gender.FEMALE &&
                                                            (m.marriagesAsPartner1?.some(
                                                                (mar) =>
                                                                    mar.status ===
                                                                    'MARRIED'
                                                            ) ||
                                                                m.marriagesAsPartner2?.some(
                                                                    (mar) =>
                                                                        mar.status ===
                                                                        'MARRIED'
                                                                ))
                                                    )
                                                    .map((m) => ({
                                                        value: m.id,
                                                        label: `${
                                                            m.fullName
                                                        } • ${
                                                            m.dateOfBirth
                                                                ? new Date(
                                                                      m.dateOfBirth
                                                                  ).getFullYear()
                                                                : '?'
                                                        }`,
                                                    }))}
                                                placeholder={
                                                    t.common.selectMother
                                                }
                                                searchPlaceholder={
                                                    t.common.search
                                                }
                                            />
                                        </div>
                                    </>
                                )}

                                {gender !== Gender.MALE &&
                                    !fatherId &&
                                    !motherId && (
                                        <div className="md:col-span-6 space-y-3">
                                            <label className="text-sm font-medium text-slate-700">
                                                {t.common.spouse}
                                            </label>
                                            <CustomSelect
                                                value={spouseId}
                                                onChange={(val) => {
                                                    setSpouseId(val);
                                                    // If spouse selected, ensure parents are cleared
                                                    if (val) {
                                                        setFatherId('');
                                                        setMotherId('');
                                                        // Auto-map Branch
                                                        const spouse =
                                                            members.find(
                                                                (m) =>
                                                                    m.id === val
                                                            );
                                                        setBranchId(
                                                            spouse?.branch
                                                                ?.id || ''
                                                        );
                                                        // Auto-fill generation (same as spouse)
                                                        if (
                                                            spouse?.generationIndex
                                                        ) {
                                                            setGenerationIndex(
                                                                spouse.generationIndex
                                                            );
                                                        } else {
                                                            setGenerationIndex(
                                                                null
                                                            );
                                                        }
                                                    }
                                                }}
                                                options={members
                                                    .filter((m) => {
                                                        // If new member is Male, show Females. If Female, show Males.
                                                        const targetGender =
                                                            (gender as Gender) ===
                                                            Gender.MALE
                                                                ? Gender.FEMALE
                                                                : Gender.MALE;

                                                        // Check if member is currently married
                                                        const isMarried =
                                                            m.marriagesAsPartner1?.some(
                                                                (mar) =>
                                                                    mar.status ===
                                                                    'MARRIED'
                                                            ) ||
                                                            m.marriagesAsPartner2?.some(
                                                                (mar) =>
                                                                    mar.status ===
                                                                    'MARRIED'
                                                            );

                                                        return (
                                                            m.gender ===
                                                                targetGender &&
                                                            !isMarried
                                                        );
                                                    })
                                                    .map((m) => ({
                                                        value: m.id,
                                                        label: `${
                                                            m.fullName
                                                        } • ${
                                                            m.dateOfBirth
                                                                ? new Date(
                                                                      m.dateOfBirth
                                                                  ).getFullYear()
                                                                : '?'
                                                        }`,
                                                    }))}
                                                placeholder={
                                                    t.common.selectSpouse
                                                }
                                                searchPlaceholder={
                                                    t.common.search
                                                }
                                            />
                                        </div>
                                    )}

                                <div className="md:col-span-2 space-y-3 ">
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
                                        placeholder={t.common.autoSelect}
                                        searchPlaceholder={t.common.search}
                                        disabled={members.length > 0}
                                        className="bg-slate-50"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-sm font-medium text-slate-700">
                                        {t.common.generationIndex}
                                    </label>
                                    <Input
                                        value={
                                            generationIndex
                                                ? `${t.common.generationPrefix} ${generationIndex}`
                                                : ''
                                        }
                                        disabled
                                        placeholder={t.common.autoSelect}
                                        className="bg-slate-50"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-sm font-medium text-slate-700">
                                        {t.common.visibility}
                                    </label>
                                    <CustomSelect
                                        value={Visibility.MEMBERS_ONLY}
                                        onChange={() => {}}
                                        options={[
                                            {
                                                value: Visibility.PUBLIC,
                                                label: t.common
                                                    .visibilityOptions.public,
                                            },
                                            {
                                                value: Visibility.MEMBERS_ONLY,
                                                label: t.common
                                                    .visibilityOptions
                                                    .membersOnly,
                                            },
                                            {
                                                value: Visibility.PRIVATE,
                                                label: t.common
                                                    .visibilityOptions.private,
                                            },
                                        ]}
                                        placeholder={t.common.visibility}
                                        showSearch={false}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Additional Info */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>{t.members.additionalInfo}</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAdditionalInfo}
                            type="button"
                            className="h-8 px-2 text-slate-500 hover:text-red-600"
                        >
                            <X className="mr-1 h-4 w-4" />
                            {t.common.clear}
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-6">
                        <div className="md:col-span-6 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.bio}
                            </label>
                            <Textarea name="bio" placeholder="" rows={4} />
                        </div>

                        <div className="md:col-span-6 space-y-3">
                            <label className="text-sm font-medium text-slate-700">
                                {t.common.notes}
                            </label>
                            <Textarea name="notes" placeholder="" rows={3} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={loading} className="w-32">
                        {loading ? (
                            t.common.creating
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />{' '}
                                {t.common.create}
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
