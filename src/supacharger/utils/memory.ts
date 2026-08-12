/** ==========
 *
 * Supacharger Memory Management Utilities
 *
 * Generic memory management for handling files and data in browser memory
 * to avoid sessionStorage quota issues
 *
 * ========== */

// Generic interfaces for memory management
export interface MemoryStorageItem {
  id: string;
  data: any;
  timestamp: number;
}

export interface FileMemoryItem {
  id: string;
  url: string;
  file?: File;
  objectUrl?: string;
  timestamp: number;
}

// In-memory storage maps
let memoryStorage: Map<string, MemoryStorageItem> = new Map();
let fileStorage: Map<string, File> = new Map();
let objectUrlStorage: Map<string, string> = new Map();

// Configuration
const MAX_MEMORY_ITEMS = 1000;
const MEMORY_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ITEM_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

/**
 * Generate unique ID for items
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Create object URL for file and track it for cleanup
 */
export function createTrackedObjectURL(file: File, itemId: string): string {
  try {
    const objectUrl = URL.createObjectURL(file);
    objectUrlStorage.set(itemId, objectUrl);
    return objectUrl;
  } catch (error) {
    console.error('Failed to create object URL:', error);
    // Return a fallback SVG placeholder
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="gray"/><text x="50" y="50" text-anchor="middle" fill="white">Error</text></svg>`;
  }
}

/**
 * Cleanup object URL
 */
export function revokeTrackedObjectURL(itemId: string): void {
  const objectUrl = objectUrlStorage.get(itemId);
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrlStorage.delete(itemId);
  }
}

/**
 * Save data to memory storage
 */
export function saveToMemory<T>(key: string, data: T): void {
  try {
    // Clean up old items if we're at capacity
    if (memoryStorage.size >= MAX_MEMORY_ITEMS) {
      cleanupExpiredItems();
    }

    memoryStorage.set(key, {
      id: key,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to save to memory:', error);
  }
}

/**
 * Load data from memory storage
 */
export function loadFromMemory<T>(key: string): T | null {
  try {
    const item = memoryStorage.get(key);
    if (item) {
      // Check if item has expired
      if (Date.now() - item.timestamp > ITEM_EXPIRY_TIME) {
        memoryStorage.delete(key);
        return null;
      }
      return item.data as T;
    }
    return null;
  } catch (error) {
    console.error('Failed to load from memory:', error);
    return null;
  }
}

/**
 * Remove item from memory storage
 */
export function removeFromMemory(key: string): void {
  memoryStorage.delete(key);
}

/**
 * Clear all memory storage
 */
export function clearMemoryStorage(): void {
  memoryStorage.clear();
}

/**
 * Save file to file storage
 */
export function saveFileToMemory(fileId: string, file: File): void {
  console.log(`💾 Saving file to memory for ID: ${fileId}`);
  console.log(`📦 File details: ${file.name} (${file.size} bytes, ${file.type})`);
  try {
    fileStorage.set(fileId, file);
    console.log(`✅ File saved successfully. Memory store now has ${fileStorage.size} files`);
  } catch (error) {
    console.error('💥 Failed to save file to memory:', error);
  }
}

/**
 * Get file from file storage
 */
export function getFileFromMemory(fileId: string): File | undefined {
  console.log(`🔍 Retrieving file from memory for ID: ${fileId}`);
  const file = fileStorage.get(fileId);
  if (file) {
    console.log(`✅ File found: ${file.name} (${file.size} bytes)`);
  } else {
    console.warn(`❌ File not found in memory for ID: ${fileId}`);
    console.log(`📊 Available file IDs:`, Array.from(fileStorage.keys()));
  }
  return file;
}

/**
 * Remove file from file storage
 */
export function removeFileFromMemory(fileId: string): void {
  console.log(`🗑️ Removing file from memory for ID: ${fileId}`);
  fileStorage.delete(fileId);
  revokeTrackedObjectURL(fileId);
  console.log(`📊 Memory store now has ${fileStorage.size} files`);
}

/**
 * Clear all file storage
 */
export function clearFileStorage(): void {
  // Cleanup all object URLs
  objectUrlStorage.forEach((url, id) => {
    URL.revokeObjectURL(url);
  });
  
  fileStorage.clear();
  objectUrlStorage.clear();
}

/**
 * Save to sessionStorage with fallback
 */
export function saveToSession<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to session storage:', error);
    // Fallback to memory storage
    saveToMemory(key, data);
  }
}

/**
 * Load from sessionStorage with fallback
 */
export function loadFromSession<T>(key: string): T | null {
  try {
    const item = sessionStorage.getItem(key);
    if (item) {
      return JSON.parse(item) as T;
    }
    return null;
  } catch (error) {
    console.error('Failed to load from session storage:', error);
    // Fallback to memory storage
    return loadFromMemory<T>(key);
  }
}

/**
 * Remove from sessionStorage
 */
export function removeFromSession(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from session storage:', error);
  }
  removeFromMemory(key);
}

/**
 * Clear all session storage
 */
export function clearSessionStorage(): void {
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear session storage:', error);
  }
  clearMemoryStorage();
}

/**
 * Clean up expired items from memory
 */
export function cleanupExpiredItems(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  memoryStorage.forEach((item, key) => {
    if (now - item.timestamp > ITEM_EXPIRY_TIME) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => {
    memoryStorage.delete(key);
  });
}

/**
 * Get memory usage info
 */
export function getMemoryInfo(): {
  memoryItems: number;
  fileItems: number;
  objectUrls: number;
  totalSize: number;
} {
  let totalSize = 0;
  
  // Calculate approximate size of files
  fileStorage.forEach(file => {
    totalSize += file.size;
  });
  
  return {
    memoryItems: memoryStorage.size,
    fileItems: fileStorage.size,
    objectUrls: objectUrlStorage.size,
    totalSize
  };
}

/**
 * Check if file already exists by name and size
 */
export function checkFileExists(
  file: File, 
  existingFiles: Array<{ id: string; file?: File }>
): boolean {
  return existingFiles.some(item => {
    const existingFile = item.file || getFileFromMemory(item.id);
    return existingFile && 
           existingFile.name === file.name && 
           existingFile.size === file.size;
  });
}

// Set up automatic cleanup
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredItems, MEMORY_CLEANUP_INTERVAL);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearFileStorage();
  });
} 