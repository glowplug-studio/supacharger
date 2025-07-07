"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { toast } from "react-toastify";

import { SC_CONFIG } from "@/supacharger/supacharger-config";
interface LogoutLinkProps {
  className?: string | null;
  children?: React.ReactNode;
}

export default function LogoutLink({
  className,
  children = "Logout",
}: LogoutLinkProps) {
  const t = useTranslations('Toasts');
  const [isRequesting, setIsRequesting] = useState(false);

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isRequesting) return;

    setIsRequesting(true);

    try {
      const response = await fetch("/account/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success(t('logoutSucceeded'), SC_CONFIG.TOAST_CONFIG);
        setTimeout(() => {
          window.location.href = response.url;
        }, 800);
      } else {
        toast.error(t('logoutFailed'));
        setIsRequesting(false); 
      }
    } catch (error) {
      toast.error(t('logoutFailed'));
      setIsRequesting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className || ""}
      disabled={isRequesting}
      style={{
        background: "none",
        border: "none",
        color: "inherit",
        cursor: isRequesting ? "wait" : "pointer",
        padding: 0,
        textDecoration: "none",
      }}
    >
      {children}
    </button>
  );
}
