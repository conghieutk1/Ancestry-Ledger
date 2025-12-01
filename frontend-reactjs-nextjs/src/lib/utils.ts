import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string) {
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
}
import { Solar } from 'lunar-javascript';

export function formatToLunarDate(dateString?: string) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const solar = Solar.fromYmd(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        );
        const lunar = solar.getLunar();

        return `${lunar.getDay()}/${lunar.getMonth()}/${lunar.getYear()} (AL)`;
    } catch {
        return '';
    }
}

export function getLunarYear(dateString?: string) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const solar = Solar.fromYmd(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        );
        const lunar = solar.getLunar();

        return lunar.getYear().toString();
    } catch {
        return '';
    }
}
