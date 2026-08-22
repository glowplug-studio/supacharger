'use client';

import Link from "next/link";
import { useTranslations } from 'next-intl';

import { SC_CONFIG } from "@/supacharger/supacharger-config";

export default function  SCFooterSession() {
    const t = useTranslations('SessionFooter');
    return (
        <footer className="py-6">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col min-[830px]:flex-row items-center justify-between gap-6 pb-4 border-b border-border text-sm font-normal">
          <Link href="/legal" className="color: text-gray-400 font-medium">{t('terms')}</Link>
          <Link href="/legal" className="color: text-gray-400  font-medium">{t('fairUse')}</Link>
          </div>
          <div className="pt-7 flex flex-col min-[520px]:flex-row items-center justify-between gap-6 text-gray-400 dark:text-gray-600">
            <span className="text-sm font-medium">
              &copy; <Link href="/" className="color: text-gray-500 font-medium">{ SC_CONFIG.SITE_TITLE }</Link>
              {" "}{new Date().getFullYear()}, {t('allRightsReserved')}
            </span>
            {/* Social Section Removed */}
          </div>
        </div>
      </footer>
    );
 }
