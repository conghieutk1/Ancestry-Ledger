'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/custom-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { getMembers, getMemberChildren, getBranches } from '@/lib/api';
import { formatToLunarDate, formatDate, getLunarYear } from '@/lib/utils';
import { useCallback } from 'react';
import { Member, Gender, FamilyBranch } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { TableRowsSkeleton } from '@/components/ui/loading-skeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export default function MembersPage() {
    const { t } = useLanguage();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [meta, setMeta] = useState<any>(null);
    const [childrenDialogOpen, setChildrenDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [children, setChildren] = useState<Member[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(false);

    const getGenderText = (gender: Gender | string) => {
        switch (gender) {
            case Gender.MALE:
            case 'MALE':
                return t.common.male;
            case Gender.FEMALE:
            case 'FEMALE':
                return t.common.female;
            case Gender.OTHER:
            case 'OTHER':
                return t.common.other;
            default:
                return t.common.unknown;
        }
    };

    // Filter states
    const [branches, setBranches] = useState<FamilyBranch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedGender, setSelectedGender] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedGeneration, setSelectedGeneration] = useState<string>('');

    // Fetch branches on mount
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const branchesData = await getBranches();
                setBranches(branchesData);
            } catch (error) {
                console.error('Failed to fetch branches:', error);
                toast.error(t.messages.loadBranchesError);
            }
        };
        fetchBranches();
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = {
                page,
                take: pageSize,
                q: search || undefined,
            };

            if (selectedBranch) {
                params.branchId = selectedBranch;
            }

            if (selectedGender) {
                params.gender = selectedGender;
            }

            if (selectedStatus !== '') {
                params.isAlive = selectedStatus === 'alive';
            }

            if (selectedGeneration) {
                params.generation = parseInt(selectedGeneration);
            }

            const response = await getMembers(params);
            setMembers(response.data);
            setMeta(response.meta);
        } catch (error) {
            console.error('Failed to fetch members:', error);
            toast.error(t.messages.loadMembersError);
        } finally {
            setLoading(false);
        }
    }, [
        page,
        pageSize,
        search,
        selectedBranch,
        selectedGender,
        selectedStatus,
        selectedGeneration,
    ]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchData]);

    const clearFilters = () => {
        setSelectedBranch('');
        setSelectedGender('');
        setSelectedStatus('');
        setSelectedGeneration('');
        setSearch('');
        setPage(1);
    };

    const hasActiveFilters =
        selectedBranch ||
        selectedGender ||
        selectedStatus !== '' ||
        selectedGeneration ||
        search;

    const handleChildrenClick = async (member: Member) => {
        if ((member.childrenCount || 0) === 0) return;

        setSelectedMember(member);
        setChildrenDialogOpen(true);
        setLoadingChildren(true);
        setChildren([]);

        try {
            const childrenData = await getMemberChildren(member.id);
            setChildren(childrenData);
        } catch (error) {
            console.error('Failed to fetch children:', error);
            toast.error(t.messages.loadChildrenError);
        } finally {
            setLoadingChildren(false);
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {t.members.title}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {t.members.subtitle}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/members/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t.members.addMember}
                    </Link>
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder={t.common.search + '...'}
                            className="pl-9"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1); // Reset to page 1 on search
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <CustomSelect
                            value={selectedBranch}
                            onChange={(value) => {
                                setSelectedBranch(value);
                                setPage(1);
                            }}
                            options={[
                                {
                                    value: '',
                                    label: t.members.filters.allBranches,
                                },
                                ...branches.map((branch) => ({
                                    value: branch.id,
                                    label: branch.name,
                                })),
                            ]}
                            placeholder={t.members.filters.allBranches}
                            searchPlaceholder={t.common.search}
                            className="w-[200px]"
                        />
                        <CustomSelect
                            value={selectedGender}
                            onChange={(value) => {
                                setSelectedGender(value);
                                setPage(1);
                            }}
                            options={[
                                {
                                    value: '',
                                    label: t.members.filters.allGenders,
                                },
                                { value: 'MALE', label: t.common.male },
                                { value: 'FEMALE', label: t.common.female },
                                { value: 'OTHER', label: t.common.other },
                            ]}
                            placeholder={t.members.filters.allGenders}
                            showSearch={false}
                            className="w-40"
                        />
                        <CustomSelect
                            value={selectedStatus}
                            onChange={(value) => {
                                setSelectedStatus(value);
                                setPage(1);
                            }}
                            options={[
                                {
                                    value: '',
                                    label: t.members.filters.allStatuses,
                                },
                                { value: 'alive', label: t.common.alive },
                                { value: 'deceased', label: t.common.deceased },
                            ]}
                            placeholder={t.members.filters.allStatuses}
                            showSearch={false}
                            className="w-[180px]"
                        />
                        <CustomSelect
                            value={selectedGeneration}
                            onChange={(value) => {
                                setSelectedGeneration(value);
                                setPage(1);
                            }}
                            options={[
                                {
                                    value: '',
                                    label:
                                        t.common.generationIndex ||
                                        'Generation',
                                },
                                ...Array.from({ length: 20 }, (_, i) => ({
                                    value: (i + 1).toString(),
                                    label: `${
                                        t.common.generationPrefix ||
                                        'Generation'
                                    } ${i + 1}`,
                                })),
                            ]}
                            placeholder={
                                t.common.generationIndex || 'Generation'
                            }
                            searchPlaceholder={t.common.search}
                            className="w-40"
                        />
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                {t.members.filters.clear}
                            </Button>
                        )}
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap text-sm text-slate-600">
                        <span>{t.members.filters.activeFilters}:</span>
                        {selectedBranch && (
                            <Badge variant="secondary" className="gap-1">
                                {t.common.branch}:{' '}
                                {
                                    branches.find(
                                        (b) => b.id === selectedBranch
                                    )?.name
                                }
                                <button
                                    onClick={() => setSelectedBranch('')}
                                    className="ml-1 hover:text-slate-900"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {selectedGender && (
                            <Badge variant="secondary" className="gap-1">
                                {t.common.gender}:{' '}
                                {getGenderText(selectedGender)}
                                <button
                                    onClick={() => setSelectedGender('')}
                                    className="ml-1 hover:text-slate-900"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {selectedStatus !== '' && (
                            <Badge variant="secondary" className="gap-1">
                                {t.common.status}:{' '}
                                {selectedStatus === 'alive'
                                    ? t.common.alive
                                    : t.common.deceased}
                                <button
                                    onClick={() => setSelectedStatus('')}
                                    className="ml-1 hover:text-slate-900"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {selectedGeneration && (
                            <Badge variant="secondary" className="gap-1">
                                {t.common.generationIndex}: {selectedGeneration}
                                <button
                                    onClick={() => setSelectedGeneration('')}
                                    className="ml-1 hover:text-slate-900"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {search && (
                            <Badge variant="secondary" className="gap-1">
                                {t.common.search}: {search}
                                <button
                                    onClick={() => setSearch('')}
                                    className="ml-1 hover:text-slate-900"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            <div className="rounded-md border border-slate-200 bg-white overflow-x-auto w-full">
                <Table className="table-auto w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px] text-center"></TableHead>
                            <TableHead className="whitespace-nowrap text-left w-[180px]">
                                {t.members.table.member}
                            </TableHead>
                            <TableHead className="whitespace-nowrap text-left w-[200px]">
                                {t.members.table.parents}
                            </TableHead>
                            <TableHead className="whitespace-nowrap text-left w-[200px]">
                                {t.members.table.spouse}
                            </TableHead>
                            <TableHead className="whitespace-nowrap text-center w-[100px]">
                                {t.members.table.children}
                            </TableHead>
                            <TableHead className="whitespace-nowrap text-center w-[120px]">
                                {t.members.table.branch}
                            </TableHead>
                            <TableHead className="whitespace-nowrap text-center w-[100px]">
                                {t.members.table.gender}
                            </TableHead>
                            <TableHead className="whitespace-nowrap text-center w-[120px]">
                                {t.members.table.birthDate}
                            </TableHead>
                            <TableHead className="whitespace-nowrap text-center w-[120px]">
                                {t.members.table.status}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRowsSkeleton columns={9} rows={10} />
                        ) : members.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="text-center py-8 text-slate-500"
                                >
                                    {t.members.noProfile}
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => {
                                // Format parents
                                const fatherName =
                                    member.father?.fullName || '-';
                                const motherName =
                                    member.mother?.fullName || '-';

                                // Format spouse - check marriages directly if spouse is not loaded
                                let spouseName =
                                    member.spouse?.fullName || null;
                                if (!spouseName) {
                                    // Fallback: check marriages directly
                                    const marriage1 =
                                        member.marriagesAsPartner1?.[0];
                                    const marriage2 =
                                        member.marriagesAsPartner2?.[0];
                                    if (marriage1 && marriage1.partner2) {
                                        spouseName =
                                            marriage1.partner2.fullName || null;
                                    } else if (
                                        marriage2 &&
                                        marriage2.partner1
                                    ) {
                                        spouseName =
                                            marriage2.partner1.fullName || null;
                                    }
                                }
                                const isMarried = !!spouseName;

                                // Format children
                                const childrenCount = member.childrenCount || 0;
                                const childrenText =
                                    childrenCount > 0
                                        ? `${childrenCount} ${t.common.children.toLowerCase()}`
                                        : '-';

                                // Format branch - prioritize branch.name from database
                                const branchText =
                                    member.branch?.name ||
                                    member.branchDisplay ||
                                    '-';

                                // Format ngày sinh
                                const birthDate = formatDate(
                                    member.dateOfBirth
                                );
                                const birthDateDisplay = birthDate || '-';

                                // Format status - chỉ hiển thị "Còn sống" hoặc "Đã chết"
                                const statusText = member.isAlive
                                    ? t.common.alive
                                    : t.common.deceased;

                                // Format ngày mất (nếu có) - Chuyển sang âm lịch
                                const deathDate = member.dateOfDeath
                                    ? formatToLunarDate(member.dateOfDeath)
                                    : null;

                                return (
                                    <TableRow key={member.id}>
                                        <TableCell className="py-4 text-center">
                                            <Avatar className="h-12 w-12">
                                                {member.avatarUrl && (
                                                    <AvatarImage
                                                        src={member.avatarUrl}
                                                        alt={member.fullName}
                                                    />
                                                )}
                                                <AvatarFallback>
                                                    {member.firstName[0]}
                                                    {member.lastName
                                                        ? member.lastName[0]
                                                        : ''}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="py-4 text-left">
                                            <div className="font-medium text-base">
                                                <Link
                                                    href={`/admin/members/${member.id}`}
                                                    className="hover:underline"
                                                >
                                                    {member.fullName}
                                                </Link>
                                            </div>
                                            {member.generationIndex !==
                                                undefined && (
                                                <div className="text-sm text-slate-500 mt-1">
                                                    {t.common.generationPrefix}{' '}
                                                    {member.generationIndex}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm py-4 text-left">
                                            <div>
                                                <span className="text-slate-600">
                                                    {t.common.father}:
                                                </span>{' '}
                                                <span className="font-medium">
                                                    {fatherName}
                                                </span>
                                            </div>
                                            <div className="mt-1">
                                                <span className="text-slate-600">
                                                    {t.common.mother}:
                                                </span>{' '}
                                                <span className="font-medium">
                                                    {motherName}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm py-4 text-left">
                                            {isMarried ? (
                                                <div>
                                                    <span className="font-medium">
                                                        {t.common.married}
                                                    </span>
                                                    {' • '}
                                                    <span className="font-medium">
                                                        {spouseName}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500">
                                                    {t.common.single}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm py-4 text-center">
                                            {childrenCount > 0 ? (
                                                <button
                                                    onClick={() =>
                                                        handleChildrenClick(
                                                            member
                                                        )
                                                    }
                                                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                >
                                                    {childrenText}
                                                </button>
                                            ) : (
                                                <span className="font-medium">
                                                    {childrenText}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm py-4 text-center">
                                            <span className="font-medium">
                                                {branchText}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm py-4 text-center">
                                            <Badge
                                                variant="secondary"
                                                className="font-normal"
                                            >
                                                {getGenderText(member.gender)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm py-4 text-center">
                                            <span className="font-medium">
                                                {birthDateDisplay}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm py-5 text-center">
                                            {member.isAlive ? (
                                                <div className="flex justify-center">
                                                    <Badge
                                                        variant="outline"
                                                        className="border-green-200 bg-green-50 text-green-700 w-fit "
                                                    >
                                                        {statusText}
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1 items-center">
                                                    <TooltipProvider
                                                        delayDuration={0}
                                                    >
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="w-fit whitespace-nowrap cursor-pointer"
                                                                >
                                                                    {statusText}
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-xs">
                                                                    <div>
                                                                        {
                                                                            t
                                                                                .common
                                                                                .solarDate
                                                                        }
                                                                        :{' '}
                                                                        {formatDate(
                                                                            member.dateOfDeath
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        {
                                                                            t
                                                                                .common
                                                                                .lunarDate
                                                                        }
                                                                        :{' '}
                                                                        {
                                                                            deathDate
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    {member.dateOfDeath && (
                                                        <span className="text-[11px] text-center text-slate-500 leading-none">
                                                            {getLunarYear(
                                                                member.dateOfDeath
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {meta && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="text-sm text-slate-500">
                            {t.common.paginationInfo
                                .replace('{page}', meta.page)
                                .replace('{pageCount}', meta.pageCount)
                                .replace('{itemCount}', meta.itemCount)}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">
                                {t.common.rowsPerPage}:
                            </span>
                            <CustomSelect
                                value={pageSize.toString()}
                                onChange={(value) => {
                                    setPageSize(Number(value));
                                    setPage(1);
                                }}
                                options={[
                                    { value: '10', label: '10' },
                                    { value: '20', label: '20' },
                                    { value: '50', label: '50' },
                                    { value: '100', label: '100' },
                                ]}
                                placeholder="50"
                                showSearch={false}
                                className="w-[70px]"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(1)}
                            disabled={!meta.hasPreviousPage || meta.page === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={!meta.hasPreviousPage}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from(
                                { length: Math.min(5, meta.pageCount) },
                                (_, i) => {
                                    let pageNum;
                                    if (meta.pageCount <= 5) {
                                        pageNum = i + 1;
                                    } else if (meta.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (
                                        meta.page >=
                                        meta.pageCount - 2
                                    ) {
                                        pageNum = meta.pageCount - 4 + i;
                                    } else {
                                        pageNum = meta.page - 2 + i;
                                    }

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={
                                                meta.page === pageNum
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            onClick={() => setPage(pageNum)}
                                            className="min-w-10"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                }
                            )}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!meta.hasNextPage}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(meta.pageCount)}
                            disabled={
                                !meta.hasNextPage ||
                                meta.page === meta.pageCount
                            }
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Children Dialog */}
            <Dialog
                open={childrenDialogOpen}
                onOpenChange={setChildrenDialogOpen}
            >
                <DialogContent className="sm:max-w-[600px] sm:w-[600px]">
                    <DialogClose onClose={() => setChildrenDialogOpen(false)} />
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-slate-900 pr-8">
                            {t.members.childrenList} -{' '}
                            {selectedMember?.fullName}
                        </DialogTitle>
                        <DialogDescription className="text-base font-medium text-slate-600">
                            {t.members.totalChildren}: {children.length}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6 h-[500px] flex flex-col">
                        {loadingChildren ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg"
                                    >
                                        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                                        <div className="flex-1">
                                            <Skeleton className="h-5 w-48 mb-2" />
                                            <div className="flex gap-2">
                                                <Skeleton className="h-4 w-16" />
                                                <Skeleton className="h-4 w-16" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : children.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <div className="text-lg mb-2">
                                    {t.members.noChildren}
                                </div>
                                <div className="text-sm">
                                    {t.members.noChildrenDesc}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 h-full overflow-y-auto pr-2">
                                {children.map((child) => (
                                    <div
                                        key={child.id}
                                        className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer group"
                                        onClick={() => {
                                            window.location.href = `/admin/members/${child.id}`;
                                        }}
                                    >
                                        <Avatar className="h-12 w-12 shrink-0">
                                            {child.avatarUrl && (
                                                <AvatarImage
                                                    src={child.avatarUrl}
                                                    alt={child.fullName}
                                                />
                                            )}
                                            <AvatarFallback className="bg-slate-100 text-slate-600">
                                                {child.firstName[0]}
                                                {child.lastName
                                                    ? child.lastName[0]
                                                    : ''}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/admin/members/${child.id}`}
                                                className="font-semibold text-slate-900 hover:text-blue-600 hover:underline block"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {child.fullName}
                                            </Link>
                                            <div className="text-sm text-slate-600 mt-2 space-x-3 flex flex-wrap items-center gap-2">
                                                {child.generationIndex !==
                                                    undefined && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                                        {
                                                            t.common
                                                                .generationPrefix
                                                        }{' '}
                                                        {child.generationIndex}
                                                    </span>
                                                )}
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {getGenderText(
                                                        child.gender
                                                    )}
                                                </Badge>
                                                {child.dateOfBirth && (
                                                    <span className="text-slate-500">
                                                        {t.common.dateOfBirth}:{' '}
                                                        {formatDate(
                                                            child.dateOfBirth
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            {child.isAlive ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-green-200 bg-green-50 text-green-700"
                                                >
                                                    {t.common.alive}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    {t.common.deceased}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
