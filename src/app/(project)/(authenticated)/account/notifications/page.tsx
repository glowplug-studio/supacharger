'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Mail } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingSpinner as Loader2 } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/seperator';
import { Switch } from '@/components/ui/switch';

interface NotificationSettings {
  pushEnabled: boolean;
  emailDaily: boolean;
  emailWeekly: boolean;
  emailMarketing: boolean;
}

export default function NotificationsPage() {
  const t = useTranslations('AccountPages.notifications');
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

    toast.success(t('saved'));
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>{t('title')}</h2>
        <Separator className='my-4' />
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='space-y-6 rounded-lg bg-card p-6 shadow-sm'>
          {/* Push Notifications */}
          <div>
            <h3 className='mb-4 flex items-center text-lg font-medium'>
              <Bell className='mr-2 h-5 w-5' />
              {t('pushTitle')}
            </h3>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>{t('pushLabel')}</Label>
                  <p className='text-sm text-muted-foreground'>{t('pushDescription')}</p>
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
              {t('emailTitle')}
            </h3>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>{t('dailyLabel')}</Label>
                  <p className='text-sm text-muted-foreground'>{t('dailyDescription')}</p>
                </div>
                <Switch
                  checked={settings.emailDaily}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailDaily: checked }))}
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>{t('weeklyLabel')}</Label>
                  <p className='text-sm text-muted-foreground'>{t('weeklyDescription')}</p>
                </div>
                <Switch
                  checked={settings.emailWeekly}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailWeekly: checked }))}
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>{t('marketingLabel')}</Label>
                  <p className='text-sm text-muted-foreground'>{t('marketingDescription')}</p>
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
              {isLoading && <Loader2 className='mr-2 h-4 w-4' />}
              {t('save')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
