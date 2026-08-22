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
    <form onSubmit={handleEmailSubmit}>
      <input
        type="email"
        name="email"
        placeholder={t('emailPlaceholder')}
        aria-label={t('emailPlaceholder')}
        autoFocus
        className="input"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn bg-primary" type="submit" disabled={pending}>
          {t('submit')}
        </button>
      </div>
    </form>
  );
}
