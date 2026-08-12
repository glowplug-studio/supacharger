import { 
  loadFromMemory, 
  loadFromSession, 
  removeFromMemory, 
  removeFromSession, 
  saveToMemory, 
  saveToSession} from './memory';

/** ==========
 *
 * Supacharger State Management Utilities
 *
 * Generic state management functions for handling application state,
 * navigation, and data persistence
 *
 * ========== */

// Generic interfaces for state management
export interface StateItem<T = any> {
  id: string;
  data: T;
  timestamp: number;
  version: number;
}

export interface NavigationOptions {
  replace?: boolean;
  query?: Record<string, string>;
  preserveState?: boolean;
}

export interface StateManagerOptions {
  persistToSession?: boolean;
  memoryOnly?: boolean;
  version?: number;
}

/**
 * Generic state manager class
 */
export class StateManager<T> {
  private key: string;
  private options: StateManagerOptions;
  private currentState: T | null = null;
  private version: number;

  constructor(key: string, options: StateManagerOptions = {}) {
    this.key = key;
    this.options = {
      persistToSession: true,
      memoryOnly: false,
      version: 1,
      ...options
    };
    this.version = this.options.version!;
  }

  /**
   * Save state to storage
   */
  save(data: T): void {
    this.currentState = data;
    const stateItem: StateItem<T> = {
      id: this.key,
      data,
      timestamp: Date.now(),
      version: this.version
    };

    // Always save to memory
    saveToMemory(this.key, stateItem);

    // Save to session if enabled and not memory-only
    if (this.options.persistToSession && !this.options.memoryOnly) {
      saveToSession(this.key, stateItem);
    }
  }

  /**
   * Load state from storage
   */
  load(): T | null {
    if (this.currentState) {
      return this.currentState;
    }

    let stateItem: StateItem<T> | null = null;

    // Try to load from memory first
    stateItem = loadFromMemory<StateItem<T>>(this.key);

    // Fallback to session storage if not found in memory
    if (!stateItem && this.options.persistToSession) {
      stateItem = loadFromSession<StateItem<T>>(this.key);
    }

    // Validate version compatibility
    if (stateItem && stateItem.version !== this.version) {
      console.warn(`State version mismatch for ${this.key}. Expected ${this.version}, got ${stateItem.version}`);
      this.clear();
      return null;
    }

    this.currentState = stateItem?.data || null;
    return this.currentState;
  }

  /**
   * Update state with partial data
   */
  update(updater: (current: T | null) => T): void {
    const currentState = this.load();
    const newState = updater(currentState);
    this.save(newState);
  }

  /**
   * Clear state from storage
   */
  clear(): void {
    this.currentState = null;
    removeFromMemory(this.key);
    if (this.options.persistToSession) {
      removeFromSession(this.key);
    }
  }

  /**
   * Check if state exists
   */
  exists(): boolean {
    return this.load() !== null;
  }
}

/**
 * Generic navigation helper
 */
export class NavigationHelper {
  private router: any;

  constructor(router: any) {
    this.router = router;
  }

  /**
   * Navigate to a page with options
   */
  navigate(path: string, options: NavigationOptions = {}): void {
    try {
      let url = path;

      // Add query parameters
      if (options.query) {
        const queryString = new URLSearchParams(options.query).toString();
        url = `${path}${path.includes('?') ? '&' : '?'}${queryString}`;
      }

      console.log('Navigating to:', url);

      // Navigate using router
      if (options.replace) {
        this.router.replace(url);
      } else {
        this.router.push(url);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      this.router.push(path);
    }
  }

  /**
   * Navigate with state preservation
   */
  navigateWithState<T>(
    path: string, 
    state: T, 
    stateKey: string, 
    options: NavigationOptions = {}
  ): void {
    if (options.preserveState !== false) {
      const stateManager = new StateManager<T>(stateKey);
      stateManager.save(state);
    }

    this.navigate(path, options);
  }

  /**
   * Navigate back
   */
  goBack(): void {
    try {
      this.router.back();
    } catch (error) {
      console.error('Back navigation error:', error);
    }
  }

  /**
   * Navigate forward
   */
  goForward(): void {
    try {
      this.router.forward();
    } catch (error) {
      console.error('Forward navigation error:', error);
    }
  }
}

/**
 * Create a state manager instance
 */
export function createStateManager<T>(
  key: string, 
  options: StateManagerOptions = {}
): StateManager<T> {
  return new StateManager<T>(key, options);
}

/**
 * Create a navigation helper instance
 */
export function createNavigationHelper(router: any): NavigationHelper {
  return new NavigationHelper(router);
}

/**
 * Generic array state management utilities
 */
export class ArrayStateManager<T extends { id: string }> {
  private stateManager: StateManager<T[]>;

  constructor(key: string, options: StateManagerOptions = {}) {
    this.stateManager = new StateManager<T[]>(key, options);
  }

  /**
   * Get all items
   */
  getAll(): T[] {
    return this.stateManager.load() || [];
  }

  /**
   * Add item to array
   */
  add(item: T): void {
    this.stateManager.update(current => {
      const items = current || [];
      return [...items, item];
    });
  }

  /**
   * Add multiple items to array
   */
  addMany(items: T[]): void {
    this.stateManager.update(current => {
      const existingItems = current || [];
      return [...existingItems, ...items];
    });
  }

  /**
   * Remove item by id
   */
  remove(id: string): void {
    this.stateManager.update(current => {
      const items = current || [];
      return items.filter(item => item.id !== id);
    });
  }

  /**
   * Update item by id
   */
  update(id: string, updater: (item: T) => T): void {
    this.stateManager.update(current => {
      const items = current || [];
      return items.map(item => 
        item.id === id ? updater(item) : item
      );
    });
  }

  /**
   * Find item by id
   */
  findById(id: string): T | undefined {
    const items = this.getAll();
    return items.find(item => item.id === id);
  }

  /**
   * Check if item exists
   */
  exists(id: string): boolean {
    return this.findById(id) !== undefined;
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.stateManager.clear();
  }

  /**
   * Get count of items
   */
  count(): number {
    return this.getAll().length;
  }

  /**
   * Filter items
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  /**
   * Map items
   */
  map<U>(mapper: (item: T) => U): U[] {
    return this.getAll().map(mapper);
  }
}

/**
 * Create an array state manager instance
 */
export function createArrayStateManager<T extends { id: string }>(
  key: string, 
  options: StateManagerOptions = {}
): ArrayStateManager<T> {
  return new ArrayStateManager<T>(key, options);
}

/**
 * Key-value state management utilities
 */
export class KeyValueStateManager<T> {
  private stateManager: StateManager<Record<string, T>>;

  constructor(key: string, options: StateManagerOptions = {}) {
    this.stateManager = new StateManager<Record<string, T>>(key, options);
  }

  /**
   * Get all key-value pairs
   */
  getAll(): Record<string, T> {
    return this.stateManager.load() || {};
  }

  /**
   * Get value by key
   */
  get(key: string): T | undefined {
    const data = this.getAll();
    return data[key];
  }

  /**
   * Set value by key
   */
  set(key: string, value: T): void {
    this.stateManager.update(current => {
      const data = current || {};
      return { ...data, [key]: value };
    });
  }

  /**
   * Delete value by key
   */
  delete(key: string): void {
    this.stateManager.update(current => {
      const data = current || {};
      const { [key]: deleted, ...rest } = data;
      return rest;
    });
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Object.keys(this.getAll());
  }

  /**
   * Get all values
   */
  values(): T[] {
    return Object.values(this.getAll());
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.stateManager.clear();
  }

  /**
   * Get count of items
   */
  count(): number {
    return this.keys().length;
  }
}

/**
 * Create a key-value state manager instance
 */
export function createKeyValueStateManager<T>(
  key: string, 
  options: StateManagerOptions = {}
): KeyValueStateManager<T> {
  return new KeyValueStateManager<T>(key, options);
} 