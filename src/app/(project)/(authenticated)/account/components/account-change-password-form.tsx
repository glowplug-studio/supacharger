'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SaveButton from '@/supacharger/components/buttons/form-save-button';
import PasswordValidationIndicator from '@/supacharger/components/forms/password-validation-indicator';


export default function AccountChangePasswordForm() {
  const tAuthTerms = useTranslations('AuthTerms');
  const tGlobalUI = useTranslations('GlobalUI');
  const tPassReset = useTranslations('PasswordUpdateFormComponent');
  const tEvaluatePasswordStrengthErrorCodes = useTranslations('evaluatePasswordStrengthErrorCodes');

  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    setIsLoading(true);

    const form = e.currentTarget;
    const oldPassword = (form.elements.namedItem('oldPassword') as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/account/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: oldPassword,
          newPassword: newPassword,
          newPasswordRetype: confirmPassword,
        }),
      });

      const response = await res.json();

      if (!res.ok) {
        setStatus(tEvaluatePasswordStrengthErrorCodes(response.error));
        return;
      }

      if (response.data && response.data.updated) {
        toast.success(tAuthTerms('passwordUpdated'));
        setStatus(null);
        form.reset();
        setNewPassword('');
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 800);
        return;
      }

      setStatus('Unexpected response from server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form ref={formRef} className='max-w-md space-y-4' onSubmit={handleSubmit}>
      <h3 className='text-lg font-medium'>{tPassReset('title')}</h3>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <div className='flex flex-col'>
            <Label htmlFor='oldPassword' className='mb-2'>
              {tAuthTerms('oldPassword')}
            </Label>
            <Input id='oldPassword' name='oldPassword' type='password' maxLength={30} />
          </div>
        </div>

        <PasswordValidationIndicator
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          name='newPassword'
          id='newPassword'
        />

        <div className='space-y-2'>
          <div className='flex flex-col'>
            <Label htmlFor='confirmPassword' className='mb-2'>
              {tAuthTerms('retypeNewPassword')}
            </Label>
            <Input id='confirmPassword' name='confirmPassword' type='password'  maxLength={30} />
          </div>
        </div>
      </div>

      {status && <div className='sc_message-error'>{status}</div>}

      <SaveButton
        isLoading={isLoading}
        isSuccess={isSuccess}
        initialLabel={tGlobalUI('buttonSaveChanges')}
        savingLabel={tGlobalUI('buttonSaving')}
        completeLabel={tGlobalUI('buttonSaved')}
      />
    </form>
  );
}
