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
        const dropdownRef = useRef<HTMLDivElement | null>(null);
        const optionsContainerRef = useRef<HTMLDivElement | null>(null);
        const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const [dropdownPosition, setDropdownPosition] = useState<{
            top?: number | string;
            bottom?: number | string;
            left: number;
            width: number;
        }>({
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

        const scrollToSelected = React.useCallback(() => {
            const selectedEl = optionRefs.current[value];
            const container = optionsContainerRef.current;
            if (selectedEl && container) {
                const containerHeight = container.clientHeight;
                const elTop = selectedEl.offsetTop;
                const elHeight = selectedEl.clientHeight;
                const scrollTo = elTop - containerHeight / 2 + elHeight / 2;
                container.scrollTop = Math.max(0, scrollTo);
            }
        }, [value]);

        const handleOpen = () => {
            if (disabled || isOpen) return;

            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const minHeightNeeded = 220; // Max height (200) + search/padding

                let newPosition: any = {
                    left: rect.left,
                    width: rect.width,
                };

                if (spaceBelow < minHeightNeeded && rect.top > spaceBelow) {
                    // Open upwards
                    newPosition.bottom = window.innerHeight - rect.top + 4;
                    newPosition.top = 'auto';
                } else {
                    // Open downwards
                    newPosition.top = rect.bottom + 4;
                    newPosition.bottom = 'auto';
                }

                setDropdownPosition(newPosition);
            }
            setIsOpen(true);
            // run after render to ensure option elements exist
            setTimeout(scrollToSelected, 0);
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
                const target = event.target as Node | null;
                const clickedInsideTrigger =
                    triggerRef.current &&
                    target &&
                    triggerRef.current.contains(target);
                const clickedInsideDropdown =
                    dropdownRef.current &&
                    target &&
                    dropdownRef.current.contains(target);
                if (!clickedInsideTrigger && !clickedInsideDropdown) {
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

        // Scroll to selected whenever open state or filtered options change
        useEffect(() => {
            if (isOpen) {
                const raf = requestAnimationFrame(scrollToSelected);
                return () => cancelAnimationFrame(raf);
            }
        }, [isOpen, filteredOptions, scrollToSelected]);

        return (
            <div
                ref={ref}
                className={cn(
                    'relative w-full',
                    disabled && 'cursor-not-allowed'
                )}
            >
                <Button
                    ref={triggerRef}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className={cn(
                        'w-full justify-between',
                        disabled && 'pointer-events-none',
                        className
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
                                ref={dropdownRef}
                                className="fixed rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                                style={{
                                    zIndex: 99999,
                                    top: dropdownPosition.top,
                                    bottom: dropdownPosition.bottom,
                                    left: dropdownPosition.left,
                                    width: dropdownPosition.width,
                                }}
                            >
                                {showSearch && (
                                    <div className="flex items-center border-b border-border px-3">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <input
                                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
                                <div
                                    className="max-h-[200px] overflow-y-auto p-1"
                                    ref={optionsContainerRef}
                                >
                                    {filteredOptions.length === 0 ? (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            {emptyMessage}
                                        </div>
                                    ) : (
                                        filteredOptions.map((option) => (
                                            <div
                                                key={option.value}
                                                className={cn(
                                                    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors',
                                                    value === option.value &&
                                                        'bg-accent text-accent-foreground'
                                                )}
                                                ref={(el) => {
                                                    optionRefs.current[
                                                        option.value
                                                    ] = el;
                                                }}
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
