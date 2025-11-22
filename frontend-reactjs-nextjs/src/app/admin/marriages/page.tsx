'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { getMarriages, deleteMarriage } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function MarriagesPage() {
    const [marriages, setMarriages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchMarriages = async () => {
        try {
            setLoading(true);
            const data = await getMarriages();
            setMarriages(data);
        } catch (error) {
            console.error('Failed to fetch marriages', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarriages();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteMarriage(deleteId);
            setDeleteId(null);
            fetchMarriages();
        } catch (error) {
            console.error('Failed to delete marriage', error);
        }
    };

    const filteredMarriages = marriages.filter((m) => {
        const searchLower = searchTerm.toLowerCase();
        const partner1Name = m.partner1?.fullName?.toLowerCase() || '';
        const partner2Name = m.partner2?.fullName?.toLowerCase() || '';
        return (
            partner1Name.includes(searchLower) ||
            partner2Name.includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quản lý hôn nhân
                    </h1>
                    <p className="text-sm text-slate-500">
                        Danh sách các cặp vợ chồng trong gia phả.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/marriages/new">
                        <Plus className="mr-2 h-4 w-4" /> Thêm cặp vợ chồng
                    </Link>
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm theo tên..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vợ/Chồng 1</TableHead>
                            <TableHead>Vợ/Chồng 2</TableHead>
                            <TableHead>Ngày cưới</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">
                                Thao tác
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-8"
                                >
                                    Đang tải dữ liệu...
                                </TableCell>
                            </TableRow>
                        ) : filteredMarriages.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center py-8"
                                >
                                    Chưa có dữ liệu hôn nhân.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMarriages.map((marriage) => (
                                <TableRow key={marriage.id}>
                                    <TableCell className="font-medium">
                                        {marriage.partner1?.fullName}
                                    </TableCell>
                                    <TableCell>
                                        {marriage.partner2?.fullName}
                                    </TableCell>
                                    <TableCell>
                                        {marriage.startDate
                                            ? formatDate(marriage.startDate)
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80">
                                            {marriage.status === 'MARRIED'
                                                ? 'Đã kết hôn'
                                                : marriage.status === 'DIVORCED'
                                                ? 'Ly hôn'
                                                : marriage.status === 'WIDOWED'
                                                ? 'Góa'
                                                : marriage.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                        setDeleteId(marriage.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Xác nhận xóa
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Bạn có chắc chắn muốn
                                                        xóa thông tin hôn nhân
                                                        này không? Hành động này
                                                        không thể hoàn tác.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setDeleteId(null)
                                                        }
                                                    >
                                                        Hủy
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={handleDelete}
                                                    >
                                                        Xóa
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
