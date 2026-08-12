import { useCallback,useState } from 'react';

import { 
  type DatabaseRecord,
  type FileUploadOptions,
  saveToDatabase, 
  uploadFilesWithProgress, 
  type UploadProgress, 
  validateFile} from '@/supacharger/utils/upload';

/** ==========
 *
 * Generic File Upload Hook
 *
 * ========== */

export interface UseFileUploadOptions extends FileUploadOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  tableName?: string;
  generateFileName?: (file: File, index: number) => string;
}

export interface UseFileUploadReturn {
  uploadFiles: (files: File[], metadata?: DatabaseRecord[]) => Promise<string[]>;
  uploadProgress: Map<string, UploadProgress>;
  isUploading: boolean;
  error: string | null;
  resetUpload: () => void;
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultGenerateFileName = useCallback((file: File, index: number) => {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'jpg';
    return `${timestamp}-${index}.${fileExt}`;
  }, []);

  const handleProgress = useCallback((progress: UploadProgress) => {
    setUploadProgress(prev => {
      const newMap = new Map(prev);
      newMap.set(progress.fileId, progress);
      return newMap;
    });
  }, []);

  const uploadFiles = useCallback(async (
    files: File[], 
    metadata?: DatabaseRecord[]
  ): Promise<string[]> => {
    console.log('🎯 useFileUpload.uploadFiles called with:', files.length, 'files');
    
    if (files.length === 0) return [];

    setIsUploading(true);
    setError(null);
    setUploadProgress(new Map());

    try {
      console.log('🔍 Validating files...');
      // Validate files
      for (const file of files) {
        console.log(`🔍 Validating file: ${file.name} (${file.size} bytes, ${file.type})`);
        const validation = validateFile(
          file, 
          options.maxFileSize, 
          options.allowedTypes
        );
        
        if (!validation.valid) {
          console.error('❌ File validation failed:', validation.error);
          throw new Error(validation.error);
        }
        console.log('✅ File validation passed');
      }

      console.log('🚀 Starting file upload...');
      // Upload files
      const uploadedUrls = await uploadFilesWithProgress(
        files,
        options.generateFileName || defaultGenerateFileName,
        options,
        handleProgress
      );

      console.log('📤 Upload completed, URLs:', uploadedUrls);

      // Only save to database if upload was successful and we have URLs
      if (options.tableName && metadata && uploadedUrls.length > 0 && uploadedUrls.every(url => url)) {
        console.log('💾 Saving to database:', options.tableName);
        for (let i = 0; i < metadata.length; i++) {
          const record = {
            ...metadata[i],
            photo_url: uploadedUrls[i]
          };
          console.log(`💾 Saving record ${i + 1}:`, record);
          await saveToDatabase(options.tableName, record);
        }
        console.log('✅ Database save completed');
      } else if (uploadedUrls.length === 0 || uploadedUrls.some(url => !url)) {
        console.error('❌ Skipping database save - no valid URLs from upload');
        throw new Error('File upload failed - no valid URLs returned');
      }

      return uploadedUrls;

    } catch (err) {
      console.error('💥 Upload hook error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [options, defaultGenerateFileName, handleProgress]);

  const resetUpload = useCallback(() => {
    setUploadProgress(new Map());
    setError(null);
    setIsUploading(false);
  }, []);

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    error,
    resetUpload
  };
} 