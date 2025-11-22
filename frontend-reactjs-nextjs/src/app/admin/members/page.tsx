'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { getMembers, getMember, getMemberChildren, getBranches } from '@/lib/api';
import { Member, Gender, FamilyBranch } from '@/types';

// Helper function to format gender
const getGenderText = (gender: Gender | string) => {
    switch (gender) {
        case Gender.MALE:
        case 'MALE':
            return 'Nam';
        case Gender.FEMALE:
        case 'FEMALE':
            return 'Nữ';
        case Gender.OTHER:
        case 'OTHER':
            return 'Khác';
        default:
            return 'Không rõ';
    }
};

// Helper function to format date to dd/mm/yyyy
const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return '';
    }
};

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);
    const [childrenDialogOpen, setChildrenDialogOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [children, setChildren] = useState<Member[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(false);
    
    // Filter states
    const [branches, setBranches] = useState<FamilyBranch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedGender, setSelectedGender] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    // Fetch branches on mount
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const branchesData = await getBranches();
                setBranches(branchesData);
            } catch (error) {
                console.error('Failed to fetch branches:', error);
            }
        };
        fetchBranches();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {
                page,
                take: 50,
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

            const response = await getMembers(params);
            setMembers(response.data);
            setMeta(response.meta);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [search, page, selectedBranch, selectedGender, selectedStatus]);

    const clearFilters = () => {
        setSelectedBranch('');
        setSelectedGender('');
        setSelectedStatus('');
        setSearch('');
        setPage(1);
    };

    const hasActiveFilters = selectedBranch || selectedGender || selectedStatus !== '' || search;

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
        } finally {
            setLoadingChildren(false);
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Members
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage all family members here.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/members/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Member
                    </Link>
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search members..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1); // Reset to page 1 on search
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Select
                            value={selectedBranch}
                            onChange={(e) => {
                                setSelectedBranch(e.target.value);
                                setPage(1);
                            }}
                            className="w-[180px]"
                        >
                            <option value="">Tất cả chi</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </Select>
                        <Select
                            value={selectedGender}
                            onChange={(e) => {
                                setSelectedGender(e.target.value);
                                setPage(1);
                            }}
                            className="w-[140px]"
                        >
                            <option value="">Tất cả giới tính</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                            <option value="OTHER">Khác</option>
                        </Select>
                        <Select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setPage(1);
                            }}
                            className="w-[140px]"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="alive">Còn sống</option>
                            <option value="deceased">Đã chết</option>
                        </Select>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap text-sm text-slate-600">
                        <span>Active filters:</span>
                        {selectedBranch && (
                            <Badge variant="secondary" className="gap-1">
                                Chi: {branches.find(b => b.id === selectedBranch)?.name}
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
                                Giới tính: {getGenderText(selectedGender)}
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
                                Trạng thái: {selectedStatus === 'alive' ? 'Còn sống' : 'Đã chết'}
                                <button
                                    onClick={() => setSelectedStatus('')}
                                    className="ml-1 hover:text-slate-900"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {search && (
                            <Badge variant="secondary" className="gap-1">
                                Search: {search}
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
                            <TableHead className="w-[80px]"></TableHead>
                            <TableHead className="whitespace-nowrap">Member</TableHead>
                            <TableHead className="whitespace-nowrap">Parents</TableHead>
                            <TableHead className="whitespace-nowrap">Spouse</TableHead>
                            <TableHead className="whitespace-nowrap">Children</TableHead>
                            <TableHead className="whitespace-nowrap">Branch</TableHead>
                            <TableHead className="whitespace-nowrap">Giới tính</TableHead>
                            <TableHead className="whitespace-nowrap">Ngày sinh</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="text-right w-[100px] whitespace-nowrap">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={10}
                                    className="text-center py-8 text-slate-500"
                                >
                                    Loading members...
                                </TableCell>
                            </TableRow>
                        ) : members.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={10}
                                    className="text-center py-8 text-slate-500"
                                >
                                    No members found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => {
                                // Format parents
                                const fatherName = member.father?.fullName || '-';
                                const motherName = member.mother?.fullName || '-';

                                // Format spouse - check marriages directly if spouse is not loaded
                                let spouseName = member.spouse?.fullName || null;
                                if (!spouseName) {
                                    // Fallback: check marriages directly
                                    const marriage1 = member.marriagesAsPartner1?.[0];
                                    const marriage2 = member.marriagesAsPartner2?.[0];
                                    if (marriage1 && marriage1.partner2) {
                                        spouseName = marriage1.partner2.fullName || null;
                                    } else if (marriage2 && marriage2.partner1) {
                                        spouseName = marriage2.partner1.fullName || null;
                                    }
                                }
                                const isMarried = !!spouseName;

                                // Format children
                                const childrenCount = member.childrenCount || 0;
                                const childrenText = childrenCount > 0 ? `${childrenCount} con` : '-';

                                // Format branch - prioritize branch.name from database
                                const branchText = member.branch?.name || member.branchDisplay || '-';

                                // Format ngày sinh
                                const birthDate = formatDate(member.dateOfBirth);
                                const birthDateDisplay = birthDate || '-';

                                // Format status - chỉ hiển thị "Còn sống" hoặc "Đã chết"
                                const statusText = member.isAlive ? 'Còn sống' : 'Đã chết';
                                
                                // Format ngày mất (nếu có)
                                const deathDate = member.dateOfDeath ? formatDate(member.dateOfDeath) : null;

                                return (
                                    <TableRow key={member.id}>
                                        <TableCell className="py-4">
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
                                        <TableCell className="py-4">
                                            <div className="font-medium text-base">
                                                <Link
                                                    href={`/admin/members/${member.id}`}
                                                    className="hover:underline"
                                                >
                                                    {member.fullName}
                                                </Link>
                                            </div>
                                            {member.generation && (
                                                <div className="text-sm text-slate-500 mt-1">
                                                    {member.generation}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm py-4">
                                            <div>
                                                <span className="text-slate-600">Cha:</span>{' '}
                                                <span className="font-medium">{fatherName}</span>
                                            </div>
                                            <div className="mt-1">
                                                <span className="text-slate-600">Mẹ:</span>{' '}
                                                <span className="font-medium">{motherName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm py-4">
                                            {isMarried ? (
                                                <div>
                                                    <span className="font-medium">Married</span>
                                                    {' • '}
                                                    <span className="font-medium">{spouseName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm py-4">
                                            {childrenCount > 0 ? (
                                                <button
                                                    onClick={() => handleChildrenClick(member)}
                                                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                >
                                                    {childrenText}
                                                </button>
                                            ) : (
                                                <span className="font-medium">{childrenText}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm py-4">
                                            <span className="font-medium">{branchText}</span>
                                        </TableCell>
                                        <TableCell className="text-sm py-4">
                                            <Badge variant="secondary" className="font-normal">
                                                {getGenderText(member.gender)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm py-4">
                                            <span className="font-medium">{birthDateDisplay}</span>
                                        </TableCell>
                                        <TableCell className="text-sm py-5">
                                            {member.isAlive ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-green-200 bg-green-50 text-green-700 w-fit"
                                                >
                                                    {statusText}
                                                </Badge>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <Badge 
                                                        variant="secondary" 
                                                        className="w-fit whitespace-nowrap"
                                                    >
                                                        {statusText}
                                                    </Badge>
                                                    {deathDate && (
                                                        <div className="text-xs text-slate-600 mt-1 pl-1 block">
                                                            {deathDate}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/members/${member.id}`}
                                                >
                                                    Edit
                                                </Link>
                                            </Button>
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
                    <div className="text-sm text-slate-500">
                        Page {meta.page} of {meta.pageCount} ({meta.itemCount}{' '}
                        items)
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
                            {Array.from({ length: Math.min(5, meta.pageCount) }, (_, i) => {
                                let pageNum;
                                if (meta.pageCount <= 5) {
                                    pageNum = i + 1;
                                } else if (meta.page <= 3) {
                                    pageNum = i + 1;
                                } else if (meta.page >= meta.pageCount - 2) {
                                    pageNum = meta.pageCount - 4 + i;
                                } else {
                                    pageNum = meta.page - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={meta.page === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(pageNum)}
                                        className="min-w-[40px]"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
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
                            disabled={!meta.hasNextPage || meta.page === meta.pageCount}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Children Dialog */}
            <Dialog open={childrenDialogOpen} onOpenChange={setChildrenDialogOpen}>
                <DialogContent>
                    <DialogClose onClose={() => setChildrenDialogOpen(false)} />
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-slate-900 pr-8">
                            Danh sách con của {selectedMember?.fullName}
                        </DialogTitle>
                        <DialogDescription className="text-base font-medium text-slate-600">
                            Tổng số: {children.length} {children.length === 1 ? 'người con' : 'người con'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6">
                        {loadingChildren ? (
                            <div className="text-center py-12 text-slate-500">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-slate-200 rounded w-32 mx-auto mb-2"></div>
                                    <div className="text-sm">Đang tải danh sách con...</div>
                                </div>
                            </div>
                        ) : children.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <div className="text-lg mb-2">Không có dữ liệu con</div>
                                <div className="text-sm">Người này chưa có con được ghi nhận trong hệ thống.</div>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {children.map((child) => (
                                    <div
                                        key={child.id}
                                        className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer group"
                                        onClick={() => {
                                            window.location.href = `/admin/members/${child.id}`;
                                        }}
                                    >
                                        <Avatar className="h-12 w-12 flex-shrink-0">
                                            {child.avatarUrl && (
                                                <AvatarImage
                                                    src={child.avatarUrl}
                                                    alt={child.fullName}
                                                />
                                            )}
                                            <AvatarFallback className="bg-slate-100 text-slate-600">
                                                {child.firstName[0]}
                                                {child.lastName ? child.lastName[0] : ''}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/admin/members/${child.id}`}
                                                className="font-semibold text-slate-900 hover:text-blue-600 hover:underline block"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {child.fullName}
                                            </Link>
                                            <div className="text-sm text-slate-600 mt-2 space-x-3 flex flex-wrap items-center gap-2">
                                                {child.generation && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                                        {child.generation}
                                                    </span>
                                                )}
                                                <Badge variant="secondary" className="text-xs">
                                                    {getGenderText(child.gender)}
                                                </Badge>
                                                {child.dateOfBirth && (
                                                    <span className="text-slate-500">
                                                        Sinh: {formatDate(child.dateOfBirth)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {child.isAlive ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-green-200 bg-green-50 text-green-700"
                                                >
                                                    Còn sống
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Đã chết
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
