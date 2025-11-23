'use client';

import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        const inputRef = useRef<HTMLInputElement>(null);

        const displayValue = value || defaultValue || '';

        const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
        };

        const openPicker = () => {
            const el = inputRef.current;
            if (!el) return;
            // Prefer showPicker where available
            // @ts-ignore
            if (typeof el.showPicker === 'function') {
                // Some browsers implement showPicker
                // @ts-ignore
                el.showPicker();
                return;
            }
            // Fallback to focus + click
            el.focus();
            el.click();
        };

        return (
            <div
                ref={ref}
                className={cn('relative cursor-pointer', className)}
                onClick={() => {
                    if (!disabled) openPicker();
                }}
            >
                {/* Styled input as date picker */}
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="date"
                        name={name}
                        value={displayValue}
                        onChange={handleDateChange}
                        disabled={disabled}
                        onClick={(e) => {
                            // Prevent parent double-invocation when clicking the native input
                            e.stopPropagation();
                            // Try to open the native picker explicitly
                            if (!disabled) openPicker();
                        }}
                        className={cn(
                            'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
                            'placeholder:text-slate-500',
                            'focus:outline-none focus:ring-0 focus:border-slate-400 transition-colors',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            'appearance-none', // Remove default styling
                            'cursor-pointer',
                            'pr-10' // space for icon
                        )}
                        style={{ outline: 'none', boxShadow: 'none' }}
                        placeholder={placeholder}
                    />

                    {/* Calendar Icon on the right (visual only) */}
                    <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
                </div>
            </div>
        );
    }
);

CustomDatePicker.displayName = 'CustomDatePicker';
