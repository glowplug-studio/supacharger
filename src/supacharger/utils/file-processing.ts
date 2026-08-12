import { 
  checkFileExists, 
  createTrackedObjectURL, 
  generateUniqueId, 
  saveFileToMemory} from './memory';

/** ==========
 *
 * Supacharger File Processing Utilities
 *
 * Generic file processing functions for handling multiple files,
 * batch processing, camera input, and duplicate detection
 *
 * ========== */

// Generic interfaces for file processing
export interface ProcessedFile {
  id: string;
  url: string;
  file?: File;
  status: 'ready' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface FileProcessingOptions {
  maxFiles?: number;
  batchSize?: number;
  allowedTypes?: string[];
  maxFileSize?: number;
  checkDuplicates?: boolean;
}

export interface ProcessingResult {
  processedFiles: ProcessedFile[];
  duplicateCount: number;
  errorCount: number;
  totalProcessed: number;
}

// Configuration
const DEFAULT_OPTIONS: Required<FileProcessingOptions> = {
  maxFiles: 50,
  batchSize: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  checkDuplicates: true
};

/**
 * Process a batch of files
 */
async function processBatch(
  files: File[],
  existingFiles: ProcessedFile[],
  allNewFiles: ProcessedFile[],
  options: Required<FileProcessingOptions>
): Promise<{ processedFiles: ProcessedFile[]; duplicateCount: number; errorCount: number }> {
  const batchProcessedFiles: ProcessedFile[] = [];
  let batchDuplicateCount = 0;
  let batchErrorCount = 0;

  for (const file of files) {
    try {
      // Check for duplicates if enabled
      if (options.checkDuplicates) {
        const isDuplicateExisting = checkFileExists(file, existingFiles);
        const isDuplicateInAll = checkFileExists(file, [...allNewFiles, ...batchProcessedFiles]);
        
        if (isDuplicateExisting || isDuplicateInAll) {
          batchDuplicateCount++;
          continue;
        }
      }

      // Validate file type
      if (!file.type.startsWith('image/') || !options.allowedTypes.includes(file.type)) {
        console.warn(`Skipping invalid file type: ${file.type}`);
        batchErrorCount++;
        continue;
      }

      // Validate file size
      if (file.size > options.maxFileSize) {
        console.warn(`Skipping oversized file: ${file.name} (${file.size} bytes)`);
        batchErrorCount++;
        continue;
      }

      // Create processed file object
      const fileId = generateUniqueId();
      const objectUrl = createTrackedObjectURL(file, fileId);
      
      const processedFile: ProcessedFile = {
        id: fileId,
        url: objectUrl,
        file: file,
        status: 'ready'
      };

      batchProcessedFiles.push(processedFile);
      
      // Store file in memory
      saveFileToMemory(fileId, file);

    } catch (error) {
      console.error('Error processing file:', error);
      batchErrorCount++;
    }
  }

  return { 
    processedFiles: batchProcessedFiles, 
    duplicateCount: batchDuplicateCount, 
    errorCount: batchErrorCount 
  };
}

/**
 * Process multiple files with batching and duplicate detection
 */
export async function processMultipleFiles(
  fileList: FileList,
  existingFiles: ProcessedFile[] = [],
  options: FileProcessingOptions = {}
): Promise<ProcessingResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const totalFiles = fileList.length;

  // Check file limit
  const currentFileCount = existingFiles.length;
  if (currentFileCount + totalFiles > mergedOptions.maxFiles) {
    throw new Error(
      `Too many files! You can select up to ${mergedOptions.maxFiles} files total. ` +
      `You currently have ${currentFileCount} and are trying to add ${totalFiles} more.`
    );
  }

  if (totalFiles === 0) {
    return { processedFiles: [], duplicateCount: 0, errorCount: 0, totalProcessed: 0 };
  }

  const allFiles = Array.from(fileList);
  const allProcessedFiles: ProcessedFile[] = [];
  let totalDuplicateCount = 0;
  let totalErrorCount = 0;

  // Process files in batches to avoid overwhelming the browser
  for (let i = 0; i < allFiles.length; i += mergedOptions.batchSize) {
    const batch = allFiles.slice(i, i + mergedOptions.batchSize);
    console.log(`Processing batch ${Math.floor(i / mergedOptions.batchSize) + 1}/${Math.ceil(allFiles.length / mergedOptions.batchSize)} (${batch.length} files)`);
    
    try {
      const batchResult = await processBatch(batch, existingFiles, allProcessedFiles, mergedOptions);
      allProcessedFiles.push(...batchResult.processedFiles);
      totalDuplicateCount += batchResult.duplicateCount;
      totalErrorCount += batchResult.errorCount;
        
      // Small delay between batches to keep UI responsive
      if (i + mergedOptions.batchSize < allFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error processing batch:', error);
      totalErrorCount += batch.length;
    }
  }

  console.log(`Processed ${totalFiles} files: ${allProcessedFiles.length} new, ${totalDuplicateCount} duplicates, ${totalErrorCount} errors`);
  
  return {
    processedFiles: allProcessedFiles,
    duplicateCount: totalDuplicateCount,
    errorCount: totalErrorCount,
    totalProcessed: allProcessedFiles.length
  };
}

/**
 * Process single camera file
 */
export async function processCameraFile(
  file: File,
  existingFiles: ProcessedFile[] = [],
  options: FileProcessingOptions = {}
): Promise<{ processedFile: ProcessedFile | null; isDuplicate: boolean; error?: string }> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Check for duplicates
    if (mergedOptions.checkDuplicates && checkFileExists(file, existingFiles)) {
      return { processedFile: null, isDuplicate: true };
    }

    // Validate file type
    if (!file.type.startsWith('image/') || !mergedOptions.allowedTypes.includes(file.type)) {
      return { 
        processedFile: null, 
        isDuplicate: false, 
        error: `Invalid file type: ${file.type}` 
      };
    }

    // Validate file size
    if (file.size > mergedOptions.maxFileSize) {
      return { 
        processedFile: null, 
        isDuplicate: false, 
        error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB` 
      };
    }

    // Create processed file object
    const fileId = generateUniqueId();
    const objectUrl = createTrackedObjectURL(file, fileId);
    
    const processedFile: ProcessedFile = {
      id: fileId,
      url: objectUrl,
      file: file,
      status: 'ready'
    };

    // Store file in memory
    saveFileToMemory(fileId, file);

    return { processedFile, isDuplicate: false };

  } catch (error) {
    console.error('Error processing camera file:', error);
    return { 
      processedFile: null, 
      isDuplicate: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Create camera input element and handle file selection
 */
export function createCameraInput(): Promise<File | null> {
  return new Promise((resolve) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use back camera by default
      
      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        resolve(file || null);
      };
      
      // Trigger file selection
      input.click();
    } catch (error) {
      console.error('Error creating camera input:', error);
      resolve(null);
    }
  });
}

/**
 * Create regular file input element for multiple file selection
 */
export function createFileInput(multiple: boolean = true): Promise<FileList | null> {
  return new Promise((resolve) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = multiple;
      
      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        resolve(files && files.length > 0 ? files : null);
      };
      
      // Trigger file selection
      input.click();
    } catch (error) {
      console.error('Error creating file input:', error);
      resolve(null);
    }
  });
}

/**
 * Check if URL exists in processed files (for legacy compatibility)
 */
export function checkUrlExists(url: string, existingFiles: ProcessedFile[]): boolean {
  return existingFiles.some(file => file.url === url);
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Validate file extension
 */
export function isValidFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = getFileExtension(filename);
  return allowedExtensions.includes(extension);
} 