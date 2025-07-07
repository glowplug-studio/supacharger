'use client';

import { ChangeEvent, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface AvatarProps {
  initialImage?: string | null;
  onImageChange?: (file: File | null) => void;
}

export function Avatar({ initialImage, onImageChange }: AvatarProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const isValidSize = img.width === 400 && img.height === 400;
          const isValidFileSize = file.size <= 10 * 1024 * 1024; // 10MB
          resolve(isValidSize && isValidFileSize);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const isValid = await validateImage(file);
      if (!isValid) {
        alert('Image must be exactly 400x400px and under 10MB');
        return;
      }

      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
      if (onImageChange) {
        onImageChange(file);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsLoading(true);

    // Simulate API upload with a delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    setSelectedFile(null);
  };

  return (
    <div className='flex w-full flex-col items-center space-y-4'>
      <div className='text-center'>
        <p className='font-medium'>Set Avatar</p>
      </div>

      <div className='flex flex-col items-center'>
        <div
          className={cn(
            'h-32 w-32 overflow-hidden rounded-full border-2',
            'flex items-center justify-center bg-muted',
            'aspect-square',
            image ? 'border-primary' : 'border-muted-foreground'
          )}
        >
          {image ? (
            <div className='relative h-full w-full'>
              <Image
                src={image}
                alt='Avatar'
                width={128}
                height={128}
                className='h-full w-full object-cover'
                priority
              />
            </div>
          ) : (
            <span className='text-sm text-muted-foreground'>No Image</span>
          )}
        </div>
        <p className='mt-1 text-center text-[10px] text-muted-foreground'>Must be 400x400px, max 10mb</p>
      </div>

      <input type='file' ref={fileInputRef} onChange={handleFileChange} accept='image/*' className='hidden' />

      <div className='flex w-full max-w-[200px] flex-col gap-2'>
        <Button type='button' variant='secondary' onClick={handleUploadClick}>
          Upload New
        </Button>

        <Button type='button' disabled={!selectedFile || isLoading} onClick={handleSave}>
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  );
}
