'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { CustomSelect } from '@/components/ui/custom-select';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    return (
        <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-500" />
            <CustomSelect
                value={locale}
                onChange={(value) => setLocale(value as 'en' | 'vi')}
                options={[
                    { value: 'vi', label: 'Tiếng Việt' },
                    { value: 'en', label: 'English' },
                ]}
                className="w-[130px]"
                showSearch={false}
            />
        </div>
    );
}
