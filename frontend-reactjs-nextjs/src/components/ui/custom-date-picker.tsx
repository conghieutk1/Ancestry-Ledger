'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { enUS, vi as viLocale } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CustomSelect } from '@/components/ui/custom-select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface CustomDatePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    name?: string;
    defaultValue?: string;
}

export const CustomDatePicker = React.forwardRef<
    HTMLDivElement,
    CustomDatePickerProps
>(
    (
        {
            value,
            onChange,
            placeholder = 'Select date',
            disabled = false,
            className,
            name,
            defaultValue,
        },
        ref
    ) => {
        const [open, setOpen] = React.useState(false);
        const [monthYear, setMonthYear] = React.useState<Date | null>(null);

        const displayValue = value || defaultValue || '';

        // Parse YYYY-MM-DD string to Date object (local time)
        const date = React.useMemo(() => {
            if (!displayValue) return undefined;
            const parts = displayValue.split('-');
            if (parts.length !== 3) return undefined;
            const [y, m, d] = parts.map(Number);
            return new Date(y, m - 1, d);
        }, [displayValue]);

        // Initialize monthYear on open
        React.useEffect(() => {
            if (open && !monthYear) {
                setMonthYear(date || new Date());
            }
        }, [open, monthYear, date]);

        const currentYear =
            monthYear?.getFullYear() ?? new Date().getFullYear();
        const currentMonth = monthYear?.getMonth() ?? new Date().getMonth();

        // Generate year options (current year ± 100 years) and clamp range
        const now = new Date().getFullYear();
        const minYear = now - 100;
        const maxYear = now + 10;

        const yearOptions = React.useMemo(() => {
            const years: number[] = [];
            // descending from recent to older so recent years show at the top by default
            for (let y = maxYear; y >= minYear; y--) {
                years.push(y);
            }
            return years;
        }, [minYear, maxYear]);

        const { locale: appLocale, t } = useLanguage();

        const localeObject = appLocale === 'vi' ? viLocale : enUS;

        const months = React.useMemo(() => {
            // For Vietnamese, prefer numeric-month labels such as 'Tháng 1' instead of spelled out 'Tháng Một'
            if (appLocale === 'vi') {
                return Array.from(
                    { length: 12 },
                    (_, idx) => `Tháng ${idx + 1}`
                );
            }
            // For English (and others) use localized full month names
            return Array.from({ length: 12 }, (_, idx) =>
                format(new Date(2020, idx, 1), 'LLLL', { locale: localeObject })
            );
        }, [localeObject, appLocale]);

        const handleYearChange = (value: string) => {
            let newYear = parseInt(value);
            if (newYear < minYear) newYear = minYear;
            if (newYear > maxYear) newYear = maxYear;
            const newDate = new Date(monthYear || new Date());
            newDate.setFullYear(newYear);
            setMonthYear(newDate);
        };

        const handleMonthChange = (value: string) => {
            // Parse month index and clamp to allowable year range
            const newMonth = parseInt(value);
            const newDate = new Date(monthYear || new Date());
            newDate.setMonth(newMonth);
            // Clamp year if needed
            if (newDate.getFullYear() < minYear) newDate.setFullYear(minYear);
            if (newDate.getFullYear() > maxYear) newDate.setFullYear(maxYear);
            setMonthYear(newDate);
        };

        const monthOptions = React.useMemo(() => {
            return months.map((m, idx) => ({ value: String(idx), label: m }));
        }, [months]);

        const yearOptionsString = React.useMemo(() => {
            return yearOptions.map((y) => ({
                value: String(y),
                label: String(y),
            }));
        }, [yearOptions]);

        const handleSelect = (selectedDate: Date | undefined) => {
            if (selectedDate) {
                // Build YYYY-MM-DD using local date components to avoid timezone shifts
                const y = selectedDate.getFullYear();
                const m = selectedDate.getMonth() + 1;
                const d = selectedDate.getDate();
                const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                const formatted = `${y}-${pad(m)}-${pad(d)}`;
                onChange(formatted);
            } else {
                onChange('');
            }
            setOpen(false);
        };

        return (
            <div ref={ref} className={cn('relative', className)}>
                {/* Hidden input for form submission */}
                <input type="hidden" name={name} value={displayValue} />

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant={'outline'}
                            disabled={disabled}
                            className={cn(
                                'w-full justify-start text-left font-normal',
                                !date && 'text-slate-500'
                                // Remove any width classes from className to avoid conflicts if needed,
                                // but usually className overrides.
                                // We keep className at the end.
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? (
                                appLocale === 'vi' ? (
                                    format(date, 'dd/MM/yyyy')
                                ) : (
                                    format(date, 'MM/dd/yyyy')
                                )
                            ) : (
                                <span>{placeholder}</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        {/* Year/Month Selector */}
                        <div className="flex gap-2 p-3 border-b border-slate-200">
                            <div className="flex-[2]">
                                <CustomSelect
                                    value={String(currentMonth)}
                                    onChange={handleMonthChange}
                                    options={monthOptions}
                                    placeholder={t.common.month}
                                    showSearch={false}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex-1">
                                <CustomSelect
                                    value={String(currentYear)}
                                    onChange={handleYearChange}
                                    options={yearOptionsString}
                                    placeholder={t.common.year}
                                    showSearch={true}
                                    searchPlaceholder={t.common.search}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Calendar */}
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => {
                                handleSelect(d);
                                if (d) setMonthYear(d);
                            }}
                            month={monthYear || date}
                            onMonthChange={(m: Date) => {
                                // clamp monthYear change into min/max range
                                const clamped = new Date(m);
                                if (clamped.getFullYear() < minYear)
                                    clamped.setFullYear(minYear);
                                if (clamped.getFullYear() > maxYear)
                                    clamped.setFullYear(maxYear);
                                setMonthYear(clamped);
                            }}
                            fromDate={new Date(minYear, 0, 1)}
                            toDate={new Date(maxYear, 11, 31)}
                            initialFocus
                            formatters={{
                                formatCaption: (date, options) => {
                                    if (appLocale === 'vi') {
                                        return `Tháng ${
                                            date.getMonth() + 1
                                        } ${date.getFullYear()}`;
                                    }
                                    return format(date, 'LLLL yyyy', options);
                                },
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        );
    }
);

CustomDatePicker.displayName = 'CustomDatePicker';
