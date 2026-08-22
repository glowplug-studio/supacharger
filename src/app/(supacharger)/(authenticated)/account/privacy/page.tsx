'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingSpinner as Loader2 } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/seperator';
import { Switch } from '@/components/ui/switch';

interface PrivacySettings {
  profileVisible: boolean;
  activityVisible: boolean;
  searchable: boolean;
}

export default function PrivacyPage() {
  const t = useTranslations('AccountPages.privacy');
  //const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisible: true,
    activityVisible: false,
    searchable: true,
  });

  const [initialSettings, setInitialSettings] = useState<PrivacySettings>({
    profileVisible: true,
    activityVisible: false,
    searchable: true,
  });

  // Load initial data
  useEffect(() => {
    const loadSettings = async () => {
      // Simulate API call
      const mockData = {
        profileVisible: true,
        activityVisible: false,
        searchable: true,
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
          <h3 className='mb-4 text-lg font-medium'>{t('preferences')}</h3>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-base'>{t('profileLabel')}</Label>
                <p className='text-sm text-muted-foreground'>{t('profileDescription')}</p>
              </div>
              <Switch
                checked={settings.profileVisible}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, profileVisible: checked }))}
              />
            </div>

            <Separator />

            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-base'>{t('activityLabel')}</Label>
                <p className='text-sm text-muted-foreground'>{t('activityDescription')}</p>
              </div>
              <Switch
                checked={settings.activityVisible}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, activityVisible: checked }))}
              />
            </div>

            <Separator />

            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-base'>{t('searchLabel')}</Label>
                <p className='text-sm text-muted-foreground'>{t('searchDescription')}</p>
              </div>
              <Switch
                checked={settings.searchable}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, searchable: checked }))}
              />
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
