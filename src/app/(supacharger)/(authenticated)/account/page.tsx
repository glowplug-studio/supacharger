'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import AccountChangePasswordForm from '@/app/(supacharger)/(authenticated)/account/components/account-change-password-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/seperator';

export default function AccountPage() {
    const t = useTranslations('AccountPages.account');
    const [settings, setSettings] = useState({
        email: '',
        language: 'en',
    });

    // Load initial data (mock)
    useEffect(() => {
        setSettings({
            email: 'user@example.com',
            language: 'es',
        });
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    {t('title')}
                </h2>
                <Separator className="my-4" />
            </div>

            {/* Authentication Provider */}
            <div className="max-w-md space-y-4">
                <h3 className="text-lg font-medium">{t('authenticatedWith')}</h3>
                <div className="flex items-center justify-between">
                    <span>Google</span>
                    <img
                        src="https://www.google.com/favicon.ico"
                        alt="Google"
                        className="h-5 w-5"
                    />
                </div>
            </div>

            <Separator />

            {/* Email Section */}
            <div className="max-w-md space-y-4">
                <h3 className="text-lg font-medium">{t('email')}</h3>
                <div className="space-y-2">
                    <div className="flex flex-col">
                        <Label htmlFor="email">{t('emailAddress')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={settings.email}
                            className="w-full"
                            onChange={(e) =>
                                setSettings((prev) => ({ ...prev, email: e.target.value }))
                            }
                        />
                    </div>
                </div>
                <Button variant="secondary">{t('save')}</Button>
            </div>

            <Separator />

            {/* Password Section */}
            <AccountChangePasswordForm />

            <Separator />

            {/* 2FA Section */}
            <div className="max-w-md space-y-4">
                <h3 className="text-lg font-medium">{t('twoFactor')}</h3>
                <p className="text-muted-foreground">{t('noTwoFactor')}</p>
                <Button variant="secondary">{t('setupTwoFactor')}</Button>
            </div>

            <Separator />

            {/* Language Section */}
            <div className="max-w-md space-y-4">
                <h3 className="text-lg font-medium">{t('language')}</h3>
                <div className="space-y-2">
                    <div className="flex flex-col">
                        <Label>{t('languagePreference')}</Label>
                        <Select
                            value={settings.language}
                            onValueChange={(value) =>
                                setSettings((prev) => ({ ...prev, language: value }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('selectLanguage')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">🇬🇧 {t('english')}</SelectItem>
                                <SelectItem value="es">🇪🇸 {t('spanish')}</SelectItem>
                                <SelectItem value="zh">🇨🇳 {t('chinese')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button variant="secondary">{t('save')}</Button>
            </div>

            <Separator />

            {/* Cancel Account Section */}
            <div className="max-w-md space-y-4">
                <h3 className="text-lg font-medium">{t('cancelAccount')}</h3>
                <p className="text-muted-foreground">
                    {t('cancelDescription')}
                </p>
                <Button variant="destructive">{t('cancelAccount')}</Button>
            </div>
        </div>
    );
}
