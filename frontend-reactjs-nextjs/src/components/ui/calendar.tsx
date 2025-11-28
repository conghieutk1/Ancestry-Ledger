'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { enUS, vi as viLocale } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    const { locale: appLocale } = useLanguage();
    const localeObject = appLocale === 'vi' ? viLocale : enUS;
    return (
        <DayPicker
            locale={localeObject}
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium',
                nav: 'space-x-1 flex items-center',
                nav_button: cn(
                    buttonVariants({ variant: 'outline' }),
                    'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
                ),
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse',
                head_row: 'flex',
                head_cell:
                    'text-slate-500 w-9 font-normal text-[0.8rem] dark:text-slate-400',
                row: 'flex w-full mt-2',
                // Simplify cell and day styling so selected date is a clean circle
                cell: 'h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center',
                day: cn(
                    buttonVariants({ variant: 'ghost' }),
                    'h-9 w-9 p-0 font-normal rounded-full flex items-center justify-center'
                ),
                day_range_end: 'day-range-end',
                day_selected:
                    'bg-slate-900 text-white hover:bg-slate-900 hover:text-white focus:bg-slate-900 focus:text-white rounded-full',
                // make today neutral so it doesn't compete with selected
                day_today: 'text-slate-600 dark:text-slate-400',
                day_outside: 'text-slate-400 opacity-50',
                day_disabled: 'text-slate-400 opacity-40',
                day_range_middle:
                    'aria-selected:bg-slate-100 aria-selected:text-slate-900',
                day_hidden: 'invisible',
            }}
            components={{
                IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
            {...props}
        />
    );
}
Calendar.displayName = 'Calendar';

export { Calendar };
