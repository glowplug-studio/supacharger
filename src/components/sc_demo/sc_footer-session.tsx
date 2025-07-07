'use client';

import Link from "next/link";

import { SC_CONFIG } from "@/supacharger/supacharger-config";

export default function  SCFooterSession() {
    return (
        <footer className="py-6">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col min-[830px]:flex-row items-center justify-between gap-6 pb-4 border-b border-border text-sm font-normal">
          <Link href="/#" className="color: text-gray-400 font-medium">Terms & Conditons</Link>
          <Link href="/#" className="color: text-gray-400  font-medium">Fair Use Policy</Link>
          </div>
          <div className="pt-7 flex flex-col min-[520px]:flex-row items-center justify-between gap-6 text-gray-400 dark:text-gray-600">
            <span className="text-sm font-medium">
              &copy; <Link href="/" className="color: text-gray-500 font-medium">{ SC_CONFIG.SITE_TITLE }</Link>
              {" "}{new Date().getFullYear()}, All rights reserved.
            </span>
            {/* Social Section Removed */}
          </div>
        </div>
      </footer>
    );
 }