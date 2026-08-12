import { createClient } from '@/lib/supabase/client';

import { logSupachargerError,parseSupabaseError } from './errors';

/** ==========
 *
 * Supacharger Upload Utilities
 *
 * ========== */

// Generic interfaces for upload functionality
export interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileUploadOptions {
  bucket: string;
  path?: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface DatabaseRecord {
  [key: string]: any;
}

/**
 * Upload a single file to Supabase Storage
 * @param file - The file to upload
 * @param fileName - The filename to use in storage
 * @param options - Upload options including bucket name
 * @returns Promise with the uploaded file's public URL
 */
export async function uploadFileToSupabase(
  file: File,
  fileName: string,
  options: FileUploadOptions
): Promise<string> {
  const supabase = createClient();
  
  const fullPath = options.path ? `${options.path}/${fileName}` : fileName;
  
  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(fullPath, file, {
        cacheControl: options.cacheControl || '3600',
        upsert: options.upsert || false
      });

    if (error) {
      const parsedError = parseSupabaseError(error, 'upload');
      logSupachargerError(parsedError, 'uploadFileToSupabase');
      throw parsedError;
    }



    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(fullPath);


    
    return publicUrl;
  } catch (error: any) {
    if (!(error.type)) {
      // If it's not already a SupachargerError, parse it
      const parsedError = parseSupabaseError(error, 'upload');
      logSupachargerError(parsedError, 'uploadFileToSupabase');
      throw parsedError;
    }
    throw error;
  }
}

/**
 * Upload multiple files with progress tracking
 * @param files - Array of files to upload
 * @param generateFileName - Function to generate filename for each file
 * @param options - Upload options
 * @param onProgress - Progress callback function
 * @returns Promise with array of uploaded file URLs
 */
export async function uploadFilesWithProgress(
  files: File[],
  generateFileName: (file: File, index: number) => string,
  options: FileUploadOptions,
  onProgress?: (progress: UploadProgress) => void
): Promise<string[]> {
  const results: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileId = `file-${i}`;
    
    try {
      // Update progress - uploading
      onProgress?.({
        fileId,
        progress: 0,
        status: 'uploading'
      });

      // Generate filename
      const fileName = generateFileName(file, i);
      
      // Upload file
      const fileUrl = await uploadFileToSupabase(file, fileName, options);
      results.push(fileUrl);

      // Update progress - completed
      onProgress?.({
        fileId,
        progress: 100,
        status: 'completed'
      });

    } catch (error) {
      console.error(`Failed to upload file ${i}:`, error);
      
      // Update progress - error
      onProgress?.({
        fileId,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Save a record to Supabase database
 * @param tableName - The table name
 * @param record - The record to save
 * @returns Promise with the created record
 */
export async function saveToDatabase<T extends DatabaseRecord>(
  tableName: string,
  record: T
): Promise<T> {
  
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .insert([record])
      .select()
      .single();

    if (error) {
      const parsedError = parseSupabaseError(error, 'database');
      logSupachargerError(parsedError, 'saveToDatabase');
      throw parsedError;
    }


    
    return data;
  } catch (error: any) {
    if (!(error.type)) {
      const parsedError = parseSupabaseError(error, 'database');
      logSupachargerError(parsedError, 'saveToDatabase');
      throw parsedError;
    }
    throw error;
  }
}

/**
 * Fetch records from Supabase database
 * @param tableName - The table name
 * @param filter - Optional filter conditions
 * @param orderBy - Optional ordering
 * @returns Promise with array of records
 */
export async function fetchFromDatabase<T extends DatabaseRecord>(
  tableName: string,
  filter?: { column: string; value: any },
  orderBy?: { column: string; ascending?: boolean }
): Promise<T[]> {
  const supabase = createClient();
  
  let query = supabase.from(tableName).select('*');
  
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }
  
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
  }

  const { data, error } = await query;

  if (error) {
    const parsedError = parseSupabaseError(error, 'database');
    logSupachargerError(parsedError, 'fetchFromDatabase');
    throw parsedError;
  }

  return data || [];
}

/**
 * Convert base64 data URL to File object (legacy support)
 * @param dataUrl - The base64 data URL
 * @param filename - The desired filename
 * @returns File object
 */
export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * Validate file before upload
 * @param file - The file to validate
 * @param maxSize - Maximum file size in bytes (default: 10MB)
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateFile(
  file: File,
  maxSize: number = 10 * 1024 * 1024, // 10MB default
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { valid: true };
} 