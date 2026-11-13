'use client';

import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';

import { Button } from '@/supacharger/components/ui/button';
import { Input } from '@/supacharger/components/ui/input';
import { Progress } from '@/supacharger/components/ui/progress';
import { cn } from '@/utils/cn';

export type ExistingUploadFile = {
  id: string;
  label: string;
};

export type FileUploadWidgetCopy = {
  add: string;
  drop: string;
  emptyFile: string;
  invalidType: string;
  remove: string;
  tooLarge: (size: string) => string;
};

const defaultCopy: FileUploadWidgetCopy = {
  add: 'Select files',
  drop: 'Drag files here, or choose them from your device.',
  emptyFile: 'Empty files cannot be uploaded.',
  invalidType: 'That file type is not supported.',
  remove: 'Remove file',
  tooLarge: (size) => `Each file must be ${size} or smaller.`,
};

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function acceptsFile(file: File, accept: string) {
  if (!accept.trim()) return true;
  return accept
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .some((value) =>
      value.startsWith('.')
        ? file.name.toLowerCase().endsWith(value)
        : value.endsWith('/*')
          ? file.type.startsWith(value.slice(0, -1))
          : file.type === value,
    );
}

export function FileUploadWidget({
  accept = '',
  className,
  copy = defaultCopy,
  description,
  disabled = false,
  existingFiles = [],
  files,
  isProcessing = false,
  label,
  limitations,
  maxBytes = DEFAULT_MAX_BYTES,
  multiple = true,
  name = 'files',
  onExistingFileRemove,
  onFilesChange,
  processingText = 'Uploading files…',
  uploadProgress = 0,
}: {
  accept?: string;
  className?: string;
  copy?: FileUploadWidgetCopy;
  description?: string;
  disabled?: boolean;
  existingFiles?: ExistingUploadFile[];
  files: File[];
  isProcessing?: boolean;
  label: string;
  limitations?: string;
  maxBytes?: number;
  multiple?: boolean;
  name?: string;
  onExistingFileRemove?: (id: string) => void;
  onFilesChange: (files: File[]) => void;
  processingText?: string;
  uploadProgress?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDisabled = disabled || isProcessing;

  function addFiles(nextFiles: FileList | File[]) {
    const acceptedFiles: File[] = [];
    setError(null);

    for (const file of Array.from(nextFiles)) {
      if (!acceptsFile(file, accept)) {
        setError(copy.invalidType);
        continue;
      }
      if (file.size === 0) {
        setError(copy.emptyFile);
        continue;
      }
      if (file.size > maxBytes) {
        setError(copy.tooLarge(formatBytes(maxBytes)));
        continue;
      }
      acceptedFiles.push(file);
    }

    if (acceptedFiles.length) {
      const next = multiple ? [...files, ...acceptedFiles] : acceptedFiles.slice(0, 1);
      onFilesChange(next);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!isDisabled) addFiles(event.dataTransfer.files);
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <p className='text-sm font-medium text-foreground'>{label}</p>
        {description ? <p className='mt-1 text-sm text-muted-foreground'>{description}</p> : null}
      </div>
      <div
        className={cn(
          'rounded-md border border-dashed border-border bg-muted/20 p-4 transition-colors',
          isDragging && 'border-primary bg-primary/5',
        )}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) {
            event.dataTransfer.dropEffect = 'copy';
            setIsDragging(true);
          }
        }}
        onDrop={handleDrop}
      >
        <Input
          ref={inputRef}
          accept={accept || undefined}
          aria-label={label}
          className='hidden'
          disabled={isDisabled}
          multiple={multiple}
          name={name}
          type='file'
          onChange={handleInputChange}
        />
        <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground'>
              <Upload aria-hidden='true' className='size-4' />
            </span>
            <div>
              <p className='text-sm text-foreground'>{copy.drop}</p>
              {limitations ? <p className='mt-1 text-xs text-muted-foreground'>{limitations}</p> : null}
            </div>
          </div>
          <Button disabled={isDisabled} type='button' variant='outline' onClick={() => inputRef.current?.click()}>
            {copy.add}
          </Button>
        </div>

        {isProcessing ? (
          <div className='mt-4 space-y-2'>
            <div className='flex items-center gap-3'>
              <Progress className='flex-1' value={uploadProgress} />
              <span className='w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground'>
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <p className='text-xs text-muted-foreground'>{processingText}</p>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className='text-sm font-medium text-destructive' role='alert'>
          {error}
        </p>
      ) : null}

      {existingFiles.length || files.length ? (
        <ul className='divide-y divide-border rounded-md border border-border' role='list'>
          {existingFiles.map((file) => (
            <li className='flex items-center gap-3 px-3 py-2.5' key={`existing-${file.id}`}>
              <FileText aria-hidden='true' className='size-4 shrink-0 text-muted-foreground' />
              <span className='min-w-0 flex-1 truncate text-sm'>{file.label}</span>
              {onExistingFileRemove ? (
                <Button
                  aria-label={`${copy.remove}: ${file.label}`}
                  disabled={isDisabled}
                  size='icon'
                  type='button'
                  variant='ghost'
                  onClick={() => onExistingFileRemove(file.id)}
                >
                  <X aria-hidden='true' className='size-4' />
                </Button>
              ) : null}
            </li>
          ))}
          {files.map((file, index) => (
            <li className='flex items-center gap-3 px-3 py-2.5' key={`${file.name}-${file.lastModified}-${index}`}>
              <FileText aria-hidden='true' className='size-4 shrink-0 text-muted-foreground' />
              <span className='min-w-0 flex-1 truncate text-sm'>{file.name}</span>
              <span className='text-xs tabular-nums text-muted-foreground'>{formatBytes(file.size)}</span>
              <Button
                aria-label={`${copy.remove}: ${file.name}`}
                disabled={isDisabled}
                size='icon'
                type='button'
                variant='ghost'
                onClick={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))}
              >
                <X aria-hidden='true' className='size-4' />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
