'use client';

import { useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/supacharger/components/ui/select';

import { SCCopyCodeButton } from './sc_copy-code-button';

type ShikiTheme = {
  html: string;
  id: string;
  label: string;
};

export function SCShikiCodePreview({
  code,
  copiedLabel,
  copyLabel,
  description,
  errorLabel,
  selectLabel,
  themes,
  title,
}: {
  code: string;
  copiedLabel: string;
  copyLabel: string;
  description: string;
  errorLabel: string;
  selectLabel: string;
  themes: ShikiTheme[];
  title: string;
}) {
  const [selectedTheme, setSelectedTheme] = useState(themes[0]?.id ?? '');
  const highlightedCode = themes.find((theme) => theme.id === selectedTheme)?.html ?? themes[0]?.html ?? '';

  return (
    <article className='border-border bg-card overflow-hidden rounded-xl border shadow-[0_18px_60px_-45px_rgba(15,23,42,0.45)]'>
      <header className='border-border/70 flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
        <div>
          <h3 className='text-lg font-medium tracking-tight'>{title}</h3>
          <p className='text-muted-foreground mt-1 text-sm leading-6'>{description}</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <label className='sr-only' htmlFor='shiki-theme'>
            {selectLabel}
          </label>
          <Select
            items={themes.map(({ id, label }) => ({ value: id, label }))}
            value={selectedTheme}
            onValueChange={(theme) => {
              if (theme) setSelectedTheme(theme);
            }}
          >
            <SelectTrigger aria-label={selectLabel} className='bg-background w-44' id='shiki-theme'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themes.map((theme) => (
                <SelectItem key={theme.id} value={theme.id}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SCCopyCodeButton code={code} copiedLabel={copiedLabel} copyLabel={copyLabel} errorLabel={errorLabel} />
        </div>
      </header>
      <div
        className='h-[30rem] overflow-hidden [&_.shiki]:h-full [&_.shiki]:overflow-auto [&_.shiki]:p-5 [&_.shiki]:font-mono [&_.shiki]:text-xs [&_.shiki]:leading-5 sm:[&_.shiki]:p-6'
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </article>
  );
}
