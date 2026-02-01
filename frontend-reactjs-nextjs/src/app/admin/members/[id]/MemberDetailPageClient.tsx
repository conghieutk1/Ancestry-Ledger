'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Trash,
    Plus,
    Check,
    ChevronsUpDown,
    Search,
    RefreshCw,
    X,
    Edit,
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
    getMemberChildren,
    updateMember,
    deleteMember,
    getMembers,
    createMarriage,
    updateMarriage,
    getBranches,
} from '@/lib/api';
import { Member, Gender, Visibility, FamilyBranch } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDetailSkeleton } from '@/components/ui/loading-skeletons';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function MemberDetailPageClient({ id }: { id: string }) {
    const { t, locale } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [member, setMember] = useState<Member | null>(null);
    const [originalMember, setOriginalMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<any>(null);

    // Marriage Modal State
    const [showMarriageModal, setShowMarriageModal] = useState(false);
    const [potentialSpouses, setPotentialSpouses] = useState<Member[]>([]);
    const [selectedSpouseId, setSelectedSpouseId] = useState('');
    const [marriageDate, setMarriageDate] = useState('');
    const [marriageStatus, setMarriageStatus] = useState('MARRIED');
    const [savingMarriage, setSavingMarriage] = useState(false);
    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Divorce Modal State
    const [showDivorceDialog, setShowDivorceDialog] = useState(false);
    const [divorceDate, setDivorceDate] = useState('');
    const [processingDivorce, setProcessingDivorce] = useState(false);

    // Widow Modal State
    const [showWidowDialog, setShowWidowDialog] = useState(false);
    const [widowDate, setWidowDate] = useState('');
    const [processingWidow, setProcessingWidow] = useState(false);

    const [fatherId, setFatherId] = useState('');
    const [motherId, setMotherId] = useState('');
    const [initialFatherId, setInitialFatherId] = useState(''); // To track parent changes
    const [initialMotherId, setInitialMotherId] = useState(''); // To track parent changes
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [children, setChildren] = useState<Member[]>([]);
    const [branches, setBranches] = useState<FamilyBranch[]>([]);

    // Edit Marriage Modal State
    const [showEditMarriageModal, setShowEditMarriageModal] = useState(false);
    const [editMarriageId, setEditMarriageId] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editField, setEditField] = useState<'START' | 'END'>('START');
    const [isUpdatingMarriage, setIsUpdatingMarriage] = useState(false);

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
            setOriginalMember(JSON.parse(JSON.stringify(data))); // Deep copy for safety
            setFatherId(data.father?.id || '');
            setMotherId(data.mother?.id || '');
            setInitialFatherId(data.father?.id || '');
            setInitialMotherId(data.mother?.id || '');

            // Fetch children separately
            const childrenData = await getMemberChildren(id);
            setChildren(childrenData);
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

    const fetchBranches = async () => {
        try {
            const data = await getBranches();
            setBranches(data);
        } catch (err) {
            console.error(err);
        }
    };

    const hasChanged = (key: keyof Member) => {
        if (!member || !originalMember) return false;
        let cur = member[key];
        let orig = originalMember[key];

        // Normalize null/undefined/empty string
        if (cur === null || cur === undefined) cur = '';
        if (orig === null || orig === undefined) orig = '';

        // Handle Branch object comparison specifically
        if (key === 'branch') {
            const curId = (member.branch as FamilyBranch)?.id || '';
            const origId = (originalMember.branch as FamilyBranch)?.id || '';
            return curId !== origId;
        }

        return cur != orig;
    };

    useEffect(() => {
        fetchMember();
        fetchAllMembers();
        fetchBranches();
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
            (m) => m.id !== member.id && m.gender === targetGender,
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
            phoneNumber: formData.get('phoneNumber') as string,
            bio: formData.get('bio') as string,
            notes: formData.get('notes') as string,
            avatarUrl: formData.get('avatarUrl') as string,
            generationIndex: member.generationIndex,
            visibility: member.visibility, // Use state value
            fatherId: fatherId || null,
            motherId: motherId || null,
            branchId: member.branch?.id || null,
        };

        setPendingFormData(updates);
        setShowSaveDialog(true);
    };

    const confirmSave = async () => {
        if (!member || !pendingFormData) return;
        setSaving(true);
        setError('');

        try {
            await updateMember(member.id, pendingFormData);
            toast.success(t.messages.updateSuccess, {
                className: 'bg-emerald-500 text-white border-emerald-600',
            });
            // Refresh
            await fetchMember();
            router.refresh();
            setShowSaveDialog(false);
        } catch (err) {
            console.error(err);
            toast.error(t.messages.updateError, {
                className: 'bg-red-500 text-white border-red-600',
            });
            setError(t.messages.updateError);
        } finally {
            setSaving(false);
            setPendingFormData(null);
        }
    };

    const handleDelete = () => {
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await deleteMember(id);
            toast.success(t.messages.deleteSuccess, {
                className: 'bg-emerald-500 text-white border-emerald-600',
            });
            router.push('/admin/members');
        } catch (err) {
            console.error(err);
            toast.error(t.messages.deleteError, {
                className: 'bg-red-500 text-white border-red-600',
            });
            setDeleting(false);
            setShowDeleteDialog(false);
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
            toast.success(t.messages.marriageUpdateSuccess, {
                className: 'bg-emerald-500 text-white border-emerald-600',
            });
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
                toast.error(msg, {
                    className: 'bg-red-500 text-white border-red-600',
                });
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
                toast.error(msg, {
                    className: 'bg-red-500 text-white border-red-600',
                });
            } else {
                // Generic error message
                const msg =
                    errorData?.message || t.messages.marriageUpdateError;
                toast.error(msg, {
                    className: 'bg-red-500 text-white border-red-600',
                });
            }
        } finally {
            setSavingMarriage(false);
        }
    };

    const handleDivorce = async () => {
        if (!member) return;

        const activeMarriage =
            member.marriagesAsPartner1?.find((m) => m.status !== 'DIVORCED') ||
            member.marriagesAsPartner2?.find((m) => m.status !== 'DIVORCED');

        if (!activeMarriage) {
            toast.error('No active marriage found to divorce.');
            return;
        }

        const spouseId =
            activeMarriage.partner1.id === member.id
                ? activeMarriage.partner2.id
                : activeMarriage.partner1.id;

        setProcessingDivorce(true);
        try {
            await createMarriage({
                partner1Id: member.id,
                partner2Id: spouseId,
                status: 'DIVORCED',
                startDate: divorceDate
                    ? new Date(divorceDate).toISOString()
                    : new Date().toISOString(),
            });

            toast.success(t.messages.marriageUpdateSuccess, {
                className: 'bg-emerald-500 text-white border-emerald-600',
            });
            setShowDivorceDialog(false);
            setDivorceDate('');
            fetchMember();
        } catch (err: any) {
            console.error(err);
            const msg =
                err.response?.data?.message || t.messages.marriageUpdateError;
            toast.error(msg, {
                className: 'bg-red-500 text-white border-red-600',
            });
        } finally {
            setProcessingDivorce(false);
        }
    };

    const handleWidow = async () => {
        // Deprecated per user request. WIDOWED status removed.
        return;
    };
    const handleUpdateMarriageLogs = async () => {
        if (!editMarriageId) return;
        setIsUpdatingMarriage(true);
        try {
            const payload: any = {};
            if (editField === 'START') {
                // Updating Marriage Date
                payload.startDate = editStartDate
                    ? new Date(editStartDate).toISOString()
                    : undefined;
            } else if (editField === 'END') {
                // Updating Divorce/Widow Date (End Date)
                payload.endDate = editEndDate
                    ? new Date(editEndDate).toISOString()
                    : null;
            }

            // IMPORTANT: We do NOT send 'status' here, so the backend should preserve the existing status.
            // The issue reported "automatically switching to married" suggests the backend might be defaulting status
            // if not provided, OR the frontend was weirdly causing it.
            // In the backend update method I reviewed, it only updates status if provided.
            // So this payload is correct. It only sends startDate OR endDate.

            await updateMarriage(editMarriageId, payload);

            toast.success(t.messages.updateSuccess, {
                className: 'bg-emerald-500 text-white border-emerald-600',
            });
            setShowEditMarriageModal(false);

            // Force a small delay to ensure DB propagation if necessary, though await should suffice
            // setTimeout(() => fetchMember(), 100);
            await fetchMember();
        } catch (err) {
            console.error(err);
            toast.error(t.messages.updateError, {
                className: 'bg-red-500 text-white border-red-600',
            });
        } finally {
            setIsUpdatingMarriage(false);
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
            default:
                return status;
        }
    };

    if (loading) return <MemberDetailSkeleton />;
    if (!member) return <div>{t.members.noProfile}</div>;

    // Determine current marital status from active marriages or member data
    // Sort all marriages by date descending first to get the latest status
    const marriages = [
        ...(member.marriagesAsPartner1 || []),
        ...(member.marriagesAsPartner2 || []),
    ].sort(
        (a, b) =>
            new Date(b.startDate || 0).getTime() -
            new Date(a.startDate || 0).getTime(),
    );

    // Find the latest record that doesn't have an endDate or is explicitly MARRIED
    // Find the latest record that is not DIVORCED
    const activeMarriage = marriages.find((m) => m.status !== 'DIVORCED');
    const currentStatus = activeMarriage ? activeMarriage.status : 'SINGLE';

    // Check if member has children - if yes, disable changing parents
    const hasChildren = children.length > 0;

    const filteredSpouses = potentialSpouses.filter((p) =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
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
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            fetchMember();
                            fetchAllMembers();
                            toast.success('Đã làm mới dữ liệu');
                        }}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Personal Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.members.personalInfo}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-6">
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.form.lastName}
                            </label>
                            <Input
                                name="lastName"
                                value={member.lastName || ''}
                                onChange={(e) =>
                                    setMember((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  lastName: e.target.value,
                                              }
                                            : null,
                                    )
                                }
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('lastName') &&
                                        'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                                )}
                                placeholder="Đặng"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.form.middleName}
                            </label>
                            <Input
                                name="middleName"
                                value={member.middleName || ''}
                                onChange={(e) =>
                                    setMember((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  middleName: e.target.value,
                                              }
                                            : null,
                                    )
                                }
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('middleName') &&
                                        'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                                )}
                                placeholder="Hữu"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.form.firstName}{' '}
                                <span className="text-destructive">*</span>
                            </label>
                            <Input
                                name="firstName"
                                value={member.firstName || ''}
                                onChange={(e) =>
                                    setMember((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  firstName: e.target.value,
                                              }
                                            : null,
                                    )
                                }
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('firstName') &&
                                        'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                                )}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.gender}
                            </label>
                            <CustomSelect
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('gender') &&
                                        'border-amber-500 rounded-md bg-amber-50 dark:bg-amber-950/20',
                                )}
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
                            <label className="text-sm font-medium text-foreground">
                                {t.common.dateOfBirth}{' '}
                                <span className="text-destructive">*</span>
                            </label>
                            <CustomDatePicker
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('dateOfBirth') &&
                                        'border-amber-500 rounded-md bg-amber-50 dark:bg-amber-950/20',
                                )}
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
                                                ? `${value}T00:00:00.000Z`
                                                : undefined,
                                        };
                                    });
                                }}
                                placeholder={t.common.dateOfBirth}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.placeOfBirth}
                            </label>
                            <Input
                                name="placeOfBirth"
                                value={member.placeOfBirth || ''}
                                onChange={(e) =>
                                    setMember((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  placeOfBirth: e.target.value,
                                              }
                                            : null,
                                    )
                                }
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('placeOfBirth') &&
                                        'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                                )}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.occupation}
                            </label>
                            <Input
                                name="occupation"
                                value={member.occupation || ''}
                                onChange={(e) =>
                                    setMember((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  occupation: e.target.value,
                                              }
                                            : null,
                                    )
                                }
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('occupation') &&
                                        'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                                )}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.phoneNumber}
                            </label>
                            <Input
                                name="phoneNumber"
                                value={member.phoneNumber || ''}
                                onChange={(e) => {
                                    setMember((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  phoneNumber: e.target.value,
                                              }
                                            : prev,
                                    );
                                }}
                                placeholder=""
                                disabled={!member.isAlive}
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('phoneNumber') &&
                                        'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                                )}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.avatarUrl}
                            </label>
                            <Input
                                name="avatarUrl"
                                value={member.avatarUrl || ''}
                                onChange={(e) =>
                                    setMember((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  avatarUrl: e.target.value,
                                              }
                                            : null,
                                    )
                                }
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('avatarUrl') &&
                                        'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                                )}
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.status}
                            </label>
                            <CustomSelect
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('isAlive') &&
                                        'border-amber-500 rounded-md bg-amber-50 dark:bg-amber-950/20',
                                )}
                                value={member.isAlive ? 'alive' : 'deceased'}
                                onChange={(value) => {
                                    setMember((prev) => {
                                        if (!prev) return prev;
                                        const isAlive = value === 'alive';
                                        return {
                                            ...prev,
                                            isAlive,
                                            phoneNumber: !isAlive
                                                ? ''
                                                : prev.phoneNumber,
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
                                    <label className="text-sm font-medium text-foreground">
                                        {t.common.dateOfDeath}
                                    </label>
                                    <CustomDatePicker
                                        className={cn(
                                            'focus-visible:ring-0 focus-visible:ring-offset-0',
                                            hasChanged('dateOfDeath') &&
                                                'border-amber-500 rounded-md bg-amber-50 dark:bg-amber-950/20',
                                        )}
                                        value={
                                            member.dateOfDeath
                                                ? member.dateOfDeath.split(
                                                      'T',
                                                  )[0]
                                                : ''
                                        }
                                        onChange={(value) => {
                                            setMember((prev) => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    dateOfDeath: value
                                                        ? `${value}T00:00:00.000Z`
                                                        : undefined,
                                                };
                                            });
                                        }}
                                        placeholder={t.common.dateOfDeath}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-sm font-medium text-foreground">
                                        {t.common.placeOfDeath}
                                    </label>
                                    <Input
                                        name="placeOfDeath"
                                        value={member.placeOfDeath || ''}
                                        onChange={(e) =>
                                            setMember((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          placeOfDeath:
                                                              e.target.value,
                                                      }
                                                    : null,
                                            )
                                        }
                                        className={cn(
                                            'focus-visible:ring-0 focus-visible:ring-offset-0',
                                            hasChanged('placeOfDeath') &&
                                                'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                                        )}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Family Connections Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>{t.members.familyConnections}</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setFatherId('');
                                setMotherId('');
                            }}
                            type="button"
                            disabled={hasChildren}
                            className="h-8 px-2 text-muted-foreground hover:text-destructive"
                        >
                            <X className="mr-1 h-4 w-4" />
                            {t.common.clear}
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-6">
                        <div className="md:col-span-3 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.father}
                            </label>
                            <CustomSelect
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    fatherId !== initialFatherId &&
                                        'border-amber-500 rounded-md bg-amber-50 dark:bg-amber-950/20',
                                )}
                                value={fatherId}
                                onChange={(newFatherId) => {
                                    setFatherId(newFatherId);
                                    if (newFatherId) {
                                        const father = allMembers.find(
                                            (m) => m.id === newFatherId,
                                        );
                                        if (father) {
                                            // Auto-update Branch and Generation
                                            setMember((prev) => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    branch:
                                                        father.branch ||
                                                        prev.branch,
                                                    generationIndex:
                                                        father.generationIndex
                                                            ? father.generationIndex +
                                                              1
                                                            : prev.generationIndex,
                                                };
                                            });

                                            // Auto-select mother if father is married
                                            // Auto-select mother if father has spouse
                                            let spouseId = father.spouse?.id;
                                            if (!spouseId) {
                                                const activeMarriage =
                                                    father.marriagesAsPartner1?.find(
                                                        (m) =>
                                                            m.status !==
                                                            'DIVORCED',
                                                    ) ||
                                                    father.marriagesAsPartner2?.find(
                                                        (m) =>
                                                            m.status !==
                                                            'DIVORCED',
                                                    );
                                                if (activeMarriage) {
                                                    spouseId =
                                                        activeMarriage.partner1
                                                            .id === father.id
                                                            ? activeMarriage
                                                                  .partner2.id
                                                            : activeMarriage
                                                                  .partner1.id;
                                                }
                                            }
                                            if (spouseId) setMotherId(spouseId);
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

                                        // Must have been married at least once
                                        // Must have been married at least once (MARRIED or DIVORCED)
                                        const isValidStatus =
                                            m.marriageStatus === 'MARRIED' ||
                                            m.marriageStatus === 'DIVORCED';
                                        if (!isValidStatus) return false;

                                        // Filter by age: Parent must be older
                                        if (
                                            !member.dateOfBirth ||
                                            !m.dateOfBirth
                                        )
                                            return true;

                                        const memberYear = new Date(
                                            member.dateOfBirth,
                                        ).getFullYear();
                                        const parentYear = new Date(
                                            m.dateOfBirth,
                                        ).getFullYear();

                                        return parentYear < memberYear;
                                    })
                                    .map((m) => ({
                                        value: m.id,
                                        label: `${m.fullName} • ${
                                            m.dateOfBirth
                                                ? new Date(
                                                      m.dateOfBirth,
                                                  ).getFullYear()
                                                : '?'
                                        }`,
                                    }))}
                                placeholder={t.common.selectFather}
                                searchPlaceholder={t.common.search}
                                disabled={hasChildren}
                            />
                        </div>
                        <div className="md:col-span-3 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.mother}
                            </label>
                            <CustomSelect
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    motherId !== initialMotherId &&
                                        'border-amber-500 rounded-md bg-amber-50 dark:bg-amber-950/20',
                                )}
                                value={motherId}
                                onChange={(newMotherId) => {
                                    setMotherId(newMotherId);
                                    if (newMotherId) {
                                        const mother = allMembers.find(
                                            (m) => m.id === newMotherId,
                                        );
                                        if (mother) {
                                            // Auto-update Branch and Generation
                                            setMember((prev) => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    branch:
                                                        mother.branch ||
                                                        prev.branch,
                                                    generationIndex:
                                                        mother.generationIndex
                                                            ? mother.generationIndex +
                                                              1
                                                            : prev.generationIndex,
                                                };
                                            });

                                            // Auto-select father if mother is married
                                            // Auto-select father if mother has spouse
                                            let spouseId = mother.spouse?.id;
                                            if (!spouseId) {
                                                const activeMarriage =
                                                    mother.marriagesAsPartner1?.find(
                                                        (m) =>
                                                            m.status !==
                                                            'DIVORCED',
                                                    ) ||
                                                    mother.marriagesAsPartner2?.find(
                                                        (m) =>
                                                            m.status !==
                                                            'DIVORCED',
                                                    );
                                                if (activeMarriage) {
                                                    spouseId =
                                                        activeMarriage.partner1
                                                            .id === mother.id
                                                            ? activeMarriage
                                                                  .partner2.id
                                                            : activeMarriage
                                                                  .partner1.id;
                                                }
                                            }
                                            if (spouseId) setFatherId(spouseId);
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

                                        // Must have been married at least once
                                        // Must have been married at least once (MARRIED or DIVORCED)
                                        const isValidStatus =
                                            m.marriageStatus === 'MARRIED' ||
                                            m.marriageStatus === 'DIVORCED';
                                        if (!isValidStatus) return false;

                                        // Filter by age: Parent must be older
                                        if (
                                            !member.dateOfBirth ||
                                            !m.dateOfBirth
                                        )
                                            return true;

                                        const memberYear = new Date(
                                            member.dateOfBirth,
                                        ).getFullYear();
                                        const parentYear = new Date(
                                            m.dateOfBirth,
                                        ).getFullYear();

                                        return parentYear < memberYear;
                                    })
                                    .map((m) => ({
                                        value: m.id,
                                        label: `${m.fullName} • ${
                                            m.dateOfBirth
                                                ? new Date(
                                                      m.dateOfBirth,
                                                  ).getFullYear()
                                                : '?'
                                        }`,
                                    }))}
                                placeholder={t.common.selectMother}
                                searchPlaceholder={t.common.search}
                                disabled={hasChildren}
                            />
                        </div>

                        {/* Spouse Selection - Visual Only for now as Marital Status card handles logic */}
                        <div className="md:col-span-6 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.spouse}
                            </label>
                            <CustomSelect
                                value={
                                    marriages.find((m) => !m.endDate)
                                        ? marriages.find((m) => !m.endDate)!
                                              .partner1.id === member.id
                                            ? marriages.find((m) => !m.endDate)!
                                                  .partner2.id
                                            : marriages.find((m) => !m.endDate)!
                                                  .partner1.id
                                        : ''
                                }
                                onChange={() => {
                                    toast.info(
                                        t.members.useMaritalStatusCard ||
                                            'Please use the Marital Status section below to manage spouses.',
                                    );
                                }}
                                options={allMembers
                                    .filter(
                                        (m) =>
                                            m.id !== member.id &&
                                            m.gender !== member.gender,
                                    )
                                    .map((m) => ({
                                        value: m.id,
                                        label: `${m.fullName} • ${
                                            m.dateOfBirth
                                                ? new Date(
                                                      m.dateOfBirth,
                                                  ).getFullYear()
                                                : '?'
                                        }`,
                                    }))}
                                placeholder={t.common.selectSpouse}
                                disabled={true} // Disabled to force use of Marital Status card for complex logic
                                className="opacity-70"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.branch}
                            </label>
                            <CustomSelect
                                value={member.branch?.id || ''}
                                onChange={(value) => {
                                    const selectedBranch = branches.find(
                                        (b) => b.id === value,
                                    );
                                    setMember((prev) => {
                                        if (!prev) return prev;
                                        return {
                                            ...prev,
                                            branch: selectedBranch,
                                        };
                                    });
                                }}
                                options={branches.map((b) => ({
                                    value: b.id,
                                    label: t.common.branchNumber.replace(
                                        '{number}',
                                        b.branchOrder?.toString() || '?',
                                    ),
                                }))}
                                placeholder={t.common.autoSelect}
                                searchPlaceholder={t.common.search}
                                className="bg-muted/50"
                                disabled
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.generationIndex}
                            </label>
                            <CustomSelect
                                value={
                                    member.generationIndex
                                        ? member.generationIndex.toString()
                                        : ''
                                }
                                onChange={(val) => {
                                    setMember((prev) => {
                                        if (!prev) return prev;
                                        return {
                                            ...prev,
                                            generationIndex: val
                                                ? parseInt(val)
                                                : undefined,
                                        };
                                    });
                                }}
                                options={Array.from(
                                    { length: 50 },
                                    (_, i) => i + 1,
                                ).map((gen) => ({
                                    value: gen.toString(),
                                    label: `${t.common.generationPrefix} ${gen}`,
                                }))}
                                placeholder={t.common.autoSelect}
                                searchPlaceholder={t.common.search}
                                className="bg-muted/50"
                                disabled
                            />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.visibility}
                            </label>
                            <CustomSelect
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('visibility') &&
                                        'border-amber-500 rounded-md bg-amber-50 dark:bg-amber-950/20',
                                )}
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
                                        label: t.common.visibilityOptions
                                            .public,
                                    },
                                    {
                                        value: Visibility.MEMBERS_ONLY,
                                        label: t.common.visibilityOptions
                                            .membersOnly,
                                    },
                                    {
                                        value: Visibility.PRIVATE,
                                        label: t.common.visibilityOptions
                                            .private,
                                    },
                                ]}
                                placeholder={t.common.visibility}
                                showSearch={false}
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
                        <div className="md:col-span-6 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.bio}
                            </label>
                            <Textarea
                                name="bio"
                                value={member.bio || ''}
                                onChange={(e) =>
                                    setMember((prev) =>
                                        prev
                                            ? { ...prev, bio: e.target.value }
                                            : null,
                                    )
                                }
                                rows={4}
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('bio') &&
                                        'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                                )}
                            />
                        </div>
                        <div className="md:col-span-6 space-y-3">
                            <label className="text-sm font-medium text-foreground">
                                {t.common.notes}
                            </label>
                            <Textarea
                                name="notes"
                                value={member.notes || ''}
                                onChange={(e) =>
                                    setMember((prev) =>
                                        prev
                                            ? { ...prev, notes: e.target.value }
                                            : null,
                                    )
                                }
                                rows={3}
                                className={cn(
                                    'focus-visible:ring-0 focus-visible:ring-offset-0',
                                    hasChanged('notes') &&
                                        'border-amber-500 bg-amber-50 dark:bg-amber-950/20',
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
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
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({getStatusLabel(currentStatus)})
                        </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {currentStatus === 'MARRIED' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setDivorceDate('');
                                    setShowDivorceDialog(true);
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                {t.common.divorced}
                            </Button>
                        )}

                        <Dialog
                            open={showMarriageModal}
                            onOpenChange={setShowMarriageModal}
                        >
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
                                                                    },
                                                                );
                                                            }
                                                            setComboboxOpen(
                                                                !comboboxOpen,
                                                            );
                                                        }}
                                                    >
                                                        {selectedSpouseId
                                                            ? potentialSpouses.find(
                                                                  (p) =>
                                                                      p.id ===
                                                                      selectedSpouseId,
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
                                                                            false,
                                                                        )
                                                                    }
                                                                />
                                                                <div
                                                                    className="fixed rounded-md border border-border bg-popover shadow-md animate-in fade-in-0 zoom-in-95"
                                                                    style={{
                                                                        zIndex: 99999,
                                                                        top: dropdownPosition.top,
                                                                        left: dropdownPosition.left,
                                                                        width: dropdownPosition.width,
                                                                    }}
                                                                >
                                                                    <div className="flex items-center border-b border-border px-3">
                                                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        <input
                                                                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                                            placeholder={
                                                                                t
                                                                                    .common
                                                                                    .search +
                                                                                '...'
                                                                            }
                                                                            onClick={(
                                                                                e,
                                                                            ) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                            value={
                                                                                searchTerm
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                setSearchTerm(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="max-h-[200px] overflow-y-auto p-1">
                                                                        {filteredSpouses.length ===
                                                                        0 ? (
                                                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                                                {
                                                                                    t
                                                                                        .members
                                                                                        .noProfile
                                                                                }
                                                                            </div>
                                                                        ) : (
                                                                            filteredSpouses.map(
                                                                                (
                                                                                    p,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            p.id
                                                                                        }
                                                                                        title={
                                                                                            p.fullName
                                                                                        }
                                                                                        className={cn(
                                                                                            'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                                                                                            selectedSpouseId ===
                                                                                                p.id &&
                                                                                                'bg-accent text-accent-foreground',
                                                                                        )}
                                                                                        onClick={(
                                                                                            e,
                                                                                        ) => {
                                                                                            e.stopPropagation();
                                                                                            e.preventDefault();
                                                                                            setSelectedSpouseId(
                                                                                                p.id ===
                                                                                                    selectedSpouseId
                                                                                                    ? ''
                                                                                                    : p.id,
                                                                                            );
                                                                                            setComboboxOpen(
                                                                                                false,
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <Check
                                                                                            className={cn(
                                                                                                'mr-2 h-4 w-4',
                                                                                                selectedSpouseId ===
                                                                                                    p.id
                                                                                                    ? 'opacity-100'
                                                                                                    : 'opacity-0',
                                                                                            )}
                                                                                        />
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-medium">
                                                                                                {
                                                                                                    p.fullName
                                                                                                }
                                                                                            </span>
                                                                                            <span className="text-xs text-muted-foreground">
                                                                                                {p.dateOfBirth
                                                                                                    ? new Date(
                                                                                                          p.dateOfBirth,
                                                                                                      ).getFullYear()
                                                                                                    : '?'}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                ),
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>,
                                                            document.body,
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
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">
                                {t.members.noSpouse}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {marriages.map((m) => {
                                const statusColors = {
                                    MARRIED:
                                        'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
                                    SINGLE: 'bg-muted text-muted-foreground border-border',
                                    DIVORCED:
                                        'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
                                };
                                const spouse =
                                    m.partner1?.id === member.id
                                        ? m.partner2
                                        : m.partner1;

                                return (
                                    <div
                                        key={m.id}
                                        className="group relative flex items-center gap-4 p-4 border border-border rounded-xl hover:border-sidebar-accent hover:shadow-sm transition-all duration-200 bg-card"
                                    >
                                        {/* Avatar Circle */}
                                        <div className="shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-linear-to-br from-muted to-muted/80 flex items-center justify-center text-muted-foreground font-semibold text-lg border-2 border-background shadow-sm">
                                                {spouse?.fullName
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || '?'}
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                                                    {spouse?.id ? (
                                                        <Link
                                                            href={`/admin/members/${spouse.id}`}
                                                        >
                                                            {spouse.fullName ||
                                                                t.common
                                                                    .unknown}
                                                        </Link>
                                                    ) : (
                                                        spouse?.fullName ||
                                                        t.common.unknown
                                                    )}
                                                </h4>
                                                <span
                                                    className={cn(
                                                        'px-2 py-0.5 text-xs font-medium rounded-md border',
                                                        statusColors[
                                                            m.status as keyof typeof statusColors
                                                        ] ||
                                                            statusColors.SINGLE,
                                                    )}
                                                >
                                                    {getStatusLabel(m.status)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-24 font-medium">
                                                            {
                                                                t.members
                                                                    .marriageDate
                                                            }
                                                            :
                                                        </span>
                                                        <span>
                                                            {m.startDate
                                                                ? new Date(
                                                                      m.startDate,
                                                                  ).toLocaleDateString(
                                                                      locale ===
                                                                          'vi'
                                                                          ? 'vi-VN'
                                                                          : 'en-US',
                                                                  )
                                                                : '?'}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 ml-1 text-muted-foreground hover:text-primary"
                                                            onClick={() => {
                                                                setEditMarriageId(
                                                                    m.id,
                                                                );
                                                                setEditStartDate(
                                                                    m.startDate ||
                                                                        '',
                                                                );
                                                                setEditField(
                                                                    'START',
                                                                );
                                                                setShowEditMarriageModal(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    {m.status ===
                                                        'DIVORCED' && (
                                                        <div className="flex items-center gap-2 text-destructive/80">
                                                            <span className="w-24 font-medium">
                                                                {
                                                                    t.common
                                                                        .divorced
                                                                }
                                                                : :
                                                            </span>
                                                            <span>
                                                                {m.endDate
                                                                    ? new Date(
                                                                          m.endDate,
                                                                      ).toLocaleDateString(
                                                                          locale ===
                                                                              'vi'
                                                                              ? 'vi-VN'
                                                                              : 'en-US',
                                                                      )
                                                                    : '?'}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5 ml-1 text-muted-foreground hover:text-primary"
                                                                onClick={() => {
                                                                    setEditMarriageId(
                                                                        m.id,
                                                                    );
                                                                    setEditEndDate(
                                                                        m.endDate ||
                                                                            '',
                                                                    );
                                                                    setEditField(
                                                                        'END',
                                                                    );
                                                                    setShowEditMarriageModal(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button - Removed generic edit */}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Section */}
            <Card>
                <CardContent className="flex items-center justify-between p-6">
                    <div>
                        <h4 className="font-medium text-foreground">
                            {t.common.deleteMember}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {t.common.deleteWarning}
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        {t.common.delete}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.common.deleteMember}</DialogTitle>
                        <DialogDescription>
                            {t.common.deleteWarning}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={deleting}
                        >
                            {t.common.cancel}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? t.common.deleting : t.common.delete}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.common.confirmSave}</DialogTitle>
                        <DialogDescription>
                            {t.common.confirmSaveMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowSaveDialog(false)}
                            disabled={saving}
                        >
                            {t.common.cancel}
                        </Button>
                        <Button onClick={confirmSave} disabled={saving}>
                            {saving ? t.common.saving : t.common.save}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showDivorceDialog}
                onOpenChange={setShowDivorceDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {(t.common as any).confirmDivorce ||
                                'Confirm Divorce'}
                        </DialogTitle>
                        <DialogDescription>
                            {(t.common as any).confirmDivorceMessage ||
                                'Are you sure you want to register a divorce? This will end the current marriage.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label>
                            {(t.members as any).divorceDate || 'Divorce Date'}
                        </Label>
                        <CustomDatePicker
                            value={divorceDate}
                            onChange={(value) => setDivorceDate(value)}
                            placeholder={t.common.date}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDivorceDialog(false)}
                            disabled={processingDivorce}
                        >
                            {t.common.cancel}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDivorce}
                            disabled={processingDivorce}
                        >
                            {processingDivorce
                                ? t.common.saving
                                : (t.common as any).confirm || 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showWidowDialog} onOpenChange={setShowWidowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {(t.common as any).confirmWidow || 'Confirm Widow'}
                        </DialogTitle>
                        <DialogDescription>
                            {(t.common as any).confirmWidowMessage ||
                                'Are you sure you want to register a widowed status? This will end the current marriage.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Label>
                            {(t.members as any).deathDate || 'Date of Death'}
                        </Label>
                        <CustomDatePicker
                            value={widowDate}
                            onChange={(value) => setWidowDate(value)}
                            placeholder={t.common.date}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowWidowDialog(false)}
                            disabled={processingWidow}
                        >
                            {t.common.cancel}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleWidow}
                            disabled={processingWidow}
                        >
                            {processingWidow
                                ? t.common.saving
                                : (t.common as any).confirm || 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showEditMarriageModal}
                onOpenChange={setShowEditMarriageModal}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editField === 'START'
                                ? (t.members as any).editMarriage ||
                                  'Edit Marriage Date'
                                : (t.members as any).editEndDate ||
                                  'Edit End Date'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {editField === 'START' && (
                            <div className="space-y-2">
                                <Label>{t.members.marriageDate}</Label>
                                <CustomDatePicker
                                    value={editStartDate}
                                    onChange={setEditStartDate}
                                    placeholder={t.common.date}
                                />
                            </div>
                        )}
                        {editField === 'END' && (
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <CustomDatePicker
                                    value={editEndDate}
                                    onChange={setEditEndDate}
                                    placeholder={t.common.date}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowEditMarriageModal(false)}
                        >
                            {t.common.cancel}
                        </Button>
                        <Button
                            onClick={handleUpdateMarriageLogs}
                            disabled={isUpdatingMarriage}
                        >
                            {isUpdatingMarriage
                                ? t.common.saving
                                : t.common.save}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
