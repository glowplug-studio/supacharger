'use client';

import { useEffect, useState } from 'react';

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
    const [settings, setSettings] = useState({
        email: '',
        language: 'en',
    });

    // Load initial data (mock)
    useEffect(() => {
        setSettings({
            email: 'user@example.com',
            language: 'fr',
        });
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    Account & Security Settings
                </h2>
                <Separator className="my-4" />
            </div>

            {/* Authentication Provider */}
            <div className="max-w-md space-y-4">
                <h3 className="text-lg font-medium">You Authenticated with</h3>
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
                <h3 className="text-lg font-medium">Email</h3>
                <div className="space-y-2">
                    <div className="flex flex-col">
                        <Label htmlFor="email">Account Email Address</Label>
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
                <Button variant="secondary">Save Changes</Button>
            </div>

            <Separator />

            {/* Password Section */}
            <AccountChangePasswordForm />

            <Separator />

            {/* 2FA Section */}
            <div className="max-w-md space-y-4">
                <h3 className="text-lg font-medium">Two Factor Authentication</h3>
                <p className="text-muted-foreground">No 2FA found.</p>
                <Button variant="secondary">Set up 2FA</Button>
            </div>

            <Separator />

            {/* Language Section */}
            <div className="max-w-md space-y-4">
                <h3 className="text-lg font-medium">Language</h3>
                <div className="space-y-2">
                    <div className="flex flex-col">
                        <Label>Language Preference</Label>
                        <Select
                            value={settings.language}
                            onValueChange={(value) =>
                                setSettings((prev) => ({ ...prev, language: value }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="fr">Français (French)</SelectItem>
                                <SelectItem value="es">Español (Spanish)</SelectItem>
                                <SelectItem value="de">Deutsch (German)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button variant="secondary">Save Changes</Button>
            </div>

            <Separator />

            {/* Cancel Account Section */}
            <div className="max-w-md space-y-4">
                <h3 className="text-lg font-medium">Cancel Account</h3>
                <p className="text-muted-foreground">
                    This is what happens when you cancel your account.
                </p>
                <Button variant="destructive">Cancel Account</Button>
            </div>
        </div>
    );
}
