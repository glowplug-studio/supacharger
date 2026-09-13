'use client';

import { useTranslations } from 'next-intl';
import { Check, Eye, EyeOff } from 'lucide-react';
import AnimateHeight from 'react-animate-height';

import PasswordValidationIndicator from '@/supacharger/components/forms/password-validation-indicator';
import { Input } from '@/supacharger/components/primitives/input';

type Props = {
  id: string;
  name: string;
  label: string;
  confirmationId: string;
  confirmationLabel: string;
  password: string;
  confirmation: string;
  visible: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  onVisibilityChange: (visible: boolean) => void;
  onValidationChange: (valid: boolean) => void;
  placeholder?: string;
  confirmationPlaceholder?: string;
  confirmationName: string;
  confirmationInvalid?: boolean;
  confirmationErrorId?: string;
};

export default function NewPasswordFields({
  id, name, label, confirmationId, confirmationLabel, password, confirmation,
  visible, onPasswordChange, onConfirmationChange, onVisibilityChange,
  onValidationChange, placeholder, confirmationPlaceholder, confirmationName,
  confirmationInvalid, confirmationErrorId,
}: Props) {
  const t = useTranslations('AuthJourney');
  const panelId = `${confirmationId}-panel`;

  return (
    <div className='sc-auth-password-create'>
      <label className='sc-auth-label' htmlFor={id}>{label}</label>
      <div className='sc-auth-password-control'>
        <PasswordValidationIndicator
          id={id} name={name} value={password} type={visible ? 'text' : 'password'}
          onChange={(event) => onPasswordChange(event.target.value)}
          onValidationChange={onValidationChange} placeholder={placeholder}
        />
        <button
          type='button' className='sc-auth-password-visibility'
          aria-label={visible ? t('hidePassword') : t('showPassword')}
          aria-expanded={!visible} aria-controls={panelId}
          onClick={() => {
            if (!visible) onConfirmationChange('');
            onVisibilityChange(!visible);
          }}
        >
          {visible ? <EyeOff size={20} aria-hidden='true' /> : <Eye size={20} aria-hidden='true' />}
        </button>
      </div>
      <AnimateHeight id={panelId} duration={260} height={visible ? 0 : 'auto'} animateOpacity>
        <div className='sc-auth-password-confirmation'>
          <label className='sc-auth-label' htmlFor={confirmationId}>{confirmationLabel}</label>
          <div className='sc-auth-password-control'>
            <Input
              id={confirmationId} name={confirmationName} className='sc-auth-input'
              type='password' autoComplete='new-password' maxLength={30}
              value={confirmation} onChange={(event) => onConfirmationChange(event.target.value)}
              placeholder={confirmationPlaceholder} required={!visible} disabled={visible}
              aria-invalid={confirmationInvalid} aria-describedby={confirmationErrorId}
            />
            {confirmation.length > 0 && password === confirmation ? (
              <span className='sc-auth-field-valid'>
                <Check aria-hidden='true' className='sc-auth-field-valid-icon' size={17} strokeWidth={2.5} />
              </span>
            ) : null}
          </div>
        </div>
      </AnimateHeight>
    </div>
  );
}
