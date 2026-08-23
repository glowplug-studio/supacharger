"use client";

/** ==========
 *
 * Supacharger - Login with Magic Link Component.
 *
 * ========== */

import { FormEvent, useState } from "react";
import { useTranslations } from 'next-intl';
import { toast } from "react-toastify";

import { signInWithEmail } from "@/lib/supabase/supacharger/supabase-auth";

export function LoginMagicLinkUI() {
  const t = useTranslations('MagicLinkForm');
  const [pending, setPending] = useState(false);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = event.target as HTMLFormElement;
    const email = form["email"].value;

    const response = await signInWithEmail(email);

    if (response?.error) {
      toast.error(t('failed'));
    } else {
      toast.success(t('sent'));
    }

    form.reset();
    setPending(false);
  }

  return (
    <form className='sc-auth-form' onSubmit={handleEmailSubmit}>
      <label className='sc-auth-label' htmlFor='magic-link-email'>
        {t('emailLabel')}
      </label>
      <input
        id='magic-link-email'
        type="email"
        name="email"
        placeholder={t('emailPlaceholder')}
        aria-label={t('emailPlaceholder')}
        autoFocus
        className='sc-auth-input'
      />
      <div className='sc-auth-actions sc-auth-actions-end'>
        <button className='sc-auth-primary-button' type='submit' disabled={pending}>
          {t('submit')}
        </button>
      </div>
    </form>
  );
}
