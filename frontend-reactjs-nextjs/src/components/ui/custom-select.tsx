'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Search, ChevronsUpDown } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    className?: string;
    showSearch?: boolean;
    emptyMessage?: string;
}

export const CustomSelect = React.forwardRef<HTMLDivElement, CustomSelectProps>(
    (
        {
            value,
            onChange,
            options,
            placeholder = 'Select option',
            searchPlaceholder = 'Search...',
            disabled = false,
            className,
            showSearch = true,
            emptyMessage = 'No results found',
        },
        ref
    ) => {
        const triggerRef = useRef<HTMLButtonElement>(null);
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const [dropdownPosition, setDropdownPosition] = useState({
            top: 0,
            left: 0,
            width: 0,
        });

        const selectedLabel = options.find((opt) => opt.value === value)?.label;
        const filteredOptions = searchTerm
            ? options.filter((opt) =>
                  opt.label.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : options;

        const handleOpen = () => {
            if (disabled || isOpen) return;

            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width,
                });
            }
            setIsOpen(true);
        };

        const handleClose = () => {
            setIsOpen(false);
            setSearchTerm('');
        };

        const handleSelect = (optionValue: string) => {
            onChange(optionValue);
            handleClose();
        };

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    triggerRef.current &&
                    !triggerRef.current.contains(event.target as Node)
                ) {
                    handleClose();
                }
            };

            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [isOpen]);

        return (
            <div
                ref={ref}
                className={cn(className, disabled && 'cursor-not-allowed')}
            >
                <Button
                    ref={triggerRef}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className={cn(
                        'w-full justify-between',
                        disabled && 'pointer-events-none'
                    )}
                    onClick={handleOpen}
                    disabled={disabled}
                >
                    {selectedLabel || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>

                {isOpen &&
                    createPortal(
                        <>
                            <div
                                className="fixed inset-0"
                                style={{ zIndex: 99998 }}
                                onMouseDown={handleClose}
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
                                {showSearch && (
                                    <div className="flex items-center border-b px-3">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <input
                                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder={searchPlaceholder}
                                            onClick={(e) => e.stopPropagation()}
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            autoFocus
                                        />
                                    </div>
                                )}
                                <div className="max-h-[200px] overflow-y-auto p-1">
                                    {filteredOptions.length === 0 ? (
                                        <div className="py-6 text-center text-sm text-slate-500">
                                            {emptyMessage}
                                        </div>
                                    ) : (
                                        filteredOptions.map((option) => (
                                            <div
                                                key={option.value}
                                                className={cn(
                                                    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 transition-colors',
                                                    value === option.value &&
                                                        'bg-slate-100'
                                                )}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    handleSelect(option.value);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        value === option.value
                                                            ? 'opacity-100'
                                                            : 'opacity-0'
                                                    )}
                                                />
                                                {option.label}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>,
                        document.body
                    )}
            </div>
        );
    }
);

CustomSelect.displayName = 'CustomSelect';
