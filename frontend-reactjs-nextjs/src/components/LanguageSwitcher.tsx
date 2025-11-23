'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Select } from '@/components/ui/select';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    return (
        <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-500" />
            <Select
                value={locale}
                onChange={(e) => setLocale(e.target.value as 'en' | 'vi')}
                className="w-[120px] h-8 text-xs"
            >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
            </Select>
        </div>
    );
}
