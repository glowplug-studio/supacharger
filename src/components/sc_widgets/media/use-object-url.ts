'use client';

import { useEffect, useState } from 'react';

/** Allocates and revokes a fresh object URL for the current Blob. */
export function useObjectUrl(file: Blob | null) {
  const [preview, setPreview] = useState<{ file: Blob; url: string } | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return preview?.file === file ? preview.url : null;
}
