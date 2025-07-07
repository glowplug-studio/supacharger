'use client';

import { useEffect, useState } from 'react';
import { Bell, Mail } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/seperator';
import { Switch } from '@/components/ui/switch';

interface NotificationSettings {
  pushEnabled: boolean;
  emailDaily: boolean;
  emailWeekly: boolean;
  emailMarketing: boolean;
}

export default function NotificationsPage() {
  const [isLoading, setIsLoading] = useState(false);

  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: false,
    emailDaily: true,
    emailWeekly: false,
    emailMarketing: false,
  });

  const [initialSettings, setInitialSettings] = useState<NotificationSettings>({
    pushEnabled: false,
    emailDaily: true,
    emailWeekly: false,
    emailMarketing: false,
  });

  // Load initial data
  useEffect(() => {
    const loadSettings = async () => {
      // Simulate API call
      const mockData = {
        pushEnabled: false,
        emailDaily: true,
        emailWeekly: false,
        emailMarketing: false,
      };

      setSettings(mockData);
      setInitialSettings(mockData);
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setInitialSettings(settings);
    setIsLoading(false);

    toast.success('Your notification settings have been saved.');
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Notifications</h2>
        <Separator className='my-4' />
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='space-y-6 rounded-lg bg-card p-6 shadow-sm'>
          {/* Push Notifications */}
          <div>
            <h3 className='mb-4 flex items-center text-lg font-medium'>
              <Bell className='mr-2 h-5 w-5' />
              Push Notifications
            </h3>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Enable Push Notifications</Label>
                  <p className='text-sm text-muted-foreground'>Receive notifications on your device</p>
                </div>
                <Switch
                  checked={settings.pushEnabled}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, pushEnabled: checked }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Notifications */}
          <div>
            <h3 className='mb-4 flex items-center text-lg font-medium'>
              <Mail className='mr-2 h-5 w-5' />
              Email Notifications
            </h3>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Daily Summary</Label>
                  <p className='text-sm text-muted-foreground'>Get a daily digest of your activity</p>
                </div>
                <Switch
                  checked={settings.emailDaily}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailDaily: checked }))}
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Weekly Report</Label>
                  <p className='text-sm text-muted-foreground'>Receive a weekly summary of your stats</p>
                </div>
                <Switch
                  checked={settings.emailWeekly}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailWeekly: checked }))}
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Marketing Emails</Label>
                  <p className='text-sm text-muted-foreground'>Receive updates about new features and promotions</p>
                </div>
                <Switch
                  checked={settings.emailMarketing}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailMarketing: checked }))}
                />
              </div>
            </div>
          </div>

          <div className='pt-4'>
            <Button type='submit' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save Preferences
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
