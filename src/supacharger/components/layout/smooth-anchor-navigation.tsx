'use client';

import { useEffect } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getFragmentTarget(hash: string) {
  if (!hash) return null;

  try {
    const name = decodeURIComponent(hash.slice(1));
    return document.getElementById(name) ?? document.getElementsByName(name).item(0);
  } catch {
    return null;
  }
}

export function SmoothAnchorNavigation() {
  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const anchor = event.target.closest('a[href]');
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self') ||
        anchor.dataset.smoothScroll === 'false'
      ) {
        return;
      }

      const rawHref = anchor.getAttribute('href');
      if (!rawHref) return;

      const url = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const isTopLink = rawHref === '#';
      const isSameDocument =
        url.origin === currentUrl.origin &&
        url.pathname === currentUrl.pathname &&
        url.search === currentUrl.search;

      if (!isSameDocument || (!url.hash && !isTopLink)) return;

      const fragmentTarget = getFragmentTarget(url.hash);
      if (url.hash && !fragmentTarget) return;

      event.preventDefault();

      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      const currentRelativeUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
      if (nextUrl !== currentRelativeUrl) {
        window.history.pushState(window.history.state, '', nextUrl);
      }

      const behavior = window.matchMedia(REDUCED_MOTION_QUERY).matches ? 'auto' : 'smooth';
      if (fragmentTarget) {
        fragmentTarget.scrollIntoView({ behavior, block: 'start' });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior });
      }
    }

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => document.removeEventListener('click', handleDocumentClick, { capture: true });
  }, []);

  return null;
}
