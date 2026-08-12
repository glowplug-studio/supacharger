import { useCallback, useRef,useState } from 'react';
import { useRouter } from 'next/navigation';

import { 
  createCameraInput, 
  createFileInput,
  type FileProcessingOptions, 
  processCameraFile, 
  type ProcessedFile, 
  processMultipleFiles} from '@/supacharger/utils/file-processing';

import { 
  createArrayStateManager, 
  createKeyValueStateManager, 
  createNavigationHelper 
} from '../supacharger/utils/state-management';

/** ==========
 *
 * File Management Hook
 *
 * Provides ready-to-use file selection, camera capture, and management functions
 *
 * ========== */

export interface UseFileManagementOptions extends FileProcessingOptions {
  storageKey?: string;
  fileNamesKey?: string;
  autoNavigate?: boolean;
  navigationPath?: string;
  eventId?: string;
}

export interface UseFileManagementReturn {
  // State
  files: ProcessedFile[];
  fileNames: Record<string, string>;
  isProcessing: boolean;
  error: string | null;
  
  // Actions
  handleFileSelection: () => Promise<void>;
  handleCameraCapture: () => Promise<void>;
  addFiles: (newFiles: ProcessedFile[], names?: string[]) => void;
  removeFile: (fileId: string) => void;
  updateFile: (fileId: string, updates: Partial<ProcessedFile>) => void;
  clearFiles: () => void;
  
  // Navigation
  navigateToUpload: (customPath?: string) => void;
  
  // Utilities
  getFileCount: () => number;
  getFileById: (fileId: string) => ProcessedFile | undefined;
  getFileName: (fileId: string) => string | undefined;
  setFileName: (fileId: string, name: string) => void;
}

export function useFileManagement(
  options: UseFileManagementOptions = {}
): UseFileManagementReturn {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State managers
  const filesManager = useRef(createArrayStateManager<ProcessedFile>(
    options.storageKey || 'processedFiles'
  ));
  const fileNamesManager = useRef(createKeyValueStateManager<string>(
    options.fileNamesKey || 'fileNames'
  ));
  const navigationHelper = useRef(createNavigationHelper(router));
  
  // Get current state
  const files = filesManager.current.getAll();
  const fileNames = fileNamesManager.current.getAll();

  // Handle file selection
  const handleFileSelection = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const fileList = await createFileInput(true);
      
      if (!fileList || fileList.length === 0) {
        setIsProcessing(false);
        return;
      }

      console.log('File selection triggered with', fileList.length, 'files');
      
      const existingFiles = filesManager.current.getAll();
      const result = await processMultipleFiles(fileList, existingFiles, options);
      
      if (result.processedFiles.length > 0) {
        filesManager.current.addMany(result.processedFiles);
        
        // Store file names
        Array.from(fileList).forEach((file, index) => {
          if (result.processedFiles[index]) {
            fileNamesManager.current.set(result.processedFiles[index].id, file.name);
          }
        });
        
        console.log('Added', result.processedFiles.length, 'files to state');
        
        // Auto-navigate if enabled
        if (options.autoNavigate && options.navigationPath) {
          navigateToUpload(options.navigationPath);
        }
      }
      
      if (result.duplicateCount > 0) {
        console.warn(`${result.duplicateCount} duplicate files were skipped`);
      }
      
      if (result.errorCount > 0) {
        setError(`${result.errorCount} files could not be processed`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process files';
      setError(errorMessage);
      console.error('File selection error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  // Handle camera capture
  const handleCameraCapture = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const file = await createCameraInput();
      
      if (!file) {
        setIsProcessing(false);
        return;
      }

      console.log('Camera capture triggered:', file.name);
      
      const existingFiles = filesManager.current.getAll();
      const result = await processCameraFile(file, existingFiles, options);
      
      if (result.isDuplicate) {
        setError('This image was already selected');
      } else if (result.error) {
        setError(result.error);
      } else if (result.processedFile) {
        filesManager.current.add(result.processedFile);
        fileNamesManager.current.set(result.processedFile.id, file.name);
        
        console.log('Added camera file to state');
        
        // Auto-navigate if enabled
        if (options.autoNavigate && options.navigationPath) {
          navigateToUpload(options.navigationPath);
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process camera image';
      setError(errorMessage);
      console.error('Camera capture error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  // Add files manually
  const addFiles = useCallback((newFiles: ProcessedFile[], names?: string[]) => {
    filesManager.current.addMany(newFiles);
    
    if (names) {
      newFiles.forEach((file, index) => {
        if (names[index]) {
          fileNamesManager.current.set(file.id, names[index]);
        }
      });
    }
  }, []);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    filesManager.current.remove(fileId);
    fileNamesManager.current.delete(fileId);
  }, []);

  // Update file
  const updateFile = useCallback((fileId: string, updates: Partial<ProcessedFile>) => {
    filesManager.current.update(fileId, (file) => ({ ...file, ...updates }));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    filesManager.current.clear();
    fileNamesManager.current.clear();
  }, []);

  // Navigate to upload page
  const navigateToUpload = useCallback((customPath?: string) => {
    const path = customPath || options.navigationPath || '/upload';
    const query = options.eventId ? { eventId: options.eventId } : undefined;
    
    navigationHelper.current.navigate(path, { query });
  }, [options.navigationPath, options.eventId]);

  // Get file count
  const getFileCount = useCallback(() => {
    return filesManager.current.count();
  }, []);

  // Get file by ID
  const getFileById = useCallback((fileId: string) => {
    return filesManager.current.findById(fileId);
  }, []);

  // Get file name
  const getFileName = useCallback((fileId: string) => {
    return fileNamesManager.current.get(fileId);
  }, []);

  // Set file name
  const setFileName = useCallback((fileId: string, name: string) => {
    fileNamesManager.current.set(fileId, name);
  }, []);

  return {
    // State
    files,
    fileNames,
    isProcessing,
    error,
    
    // Actions
    handleFileSelection,
    handleCameraCapture,
    addFiles,
    removeFile,
    updateFile,
    clearFiles,
    
    // Navigation
    navigateToUpload,
    
    // Utilities
    getFileCount,
    getFileById,
    getFileName,
    setFileName
  };
} 