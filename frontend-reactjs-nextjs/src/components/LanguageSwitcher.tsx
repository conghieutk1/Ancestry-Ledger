'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    return (
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <Button
                variant={locale === 'vi' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLocale('vi')}
                className="h-7 px-3 text-xs font-medium"
            >
                VI
            </Button>
            <Button
                variant={locale === 'en' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLocale('en')}
                className="h-7 px-3 text-xs font-medium"
            >
                EN
            </Button>
        </div>
    );
}
