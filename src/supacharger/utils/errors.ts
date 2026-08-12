/** ==========
 *
 * Supacharger Error Utilities
 *
 * Specific error types and error handling utilities for better debugging
 *
 * ========== */

/**
 * Base Supacharger error class
 */
export abstract class SupachargerError extends Error {
  abstract readonly type: string;
  public readonly details?: any;
  public readonly timestamp: number;

  constructor(message: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.timestamp = Date.now();
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * Get debug information
   */
  getDebugInfo(): Record<string, any> {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      timestamp: new Date(this.timestamp).toISOString(),
      stack: this.stack
    };
  }
}

/**
 * Upload-related errors
 */
export class SupachargerUploadError extends SupachargerError {
  readonly type = 'UPLOAD_ERROR';

  constructor(
    message: string,
    public subType: 'RLS_POLICY' | 'BUCKET_NOT_FOUND' | 'FILE_TOO_LARGE' | 'NETWORK' | 'VALIDATION' | 'UNKNOWN',
    details?: any
  ) {
    super(message, details);
  }

  getUserMessage(): string {
    switch (this.subType) {
      case 'RLS_POLICY':
        return 'Upload blocked by security policy. Please check your Supabase configuration.';
      case 'BUCKET_NOT_FOUND':
        return 'Storage bucket not found. Please check your bucket configuration.';
      case 'FILE_TOO_LARGE':
        return 'File is too large. Please select a smaller file.';
      case 'NETWORK':
        return 'Network error. Please check your connection and try again.';
      case 'VALIDATION':
        return 'File validation failed. Please check the file type and size.';
      default:
        return 'Upload failed. Please try again.';
    }
  }
}

/**
 * Database-related errors
 */
export class SupachargerDatabaseError extends SupachargerError {
  readonly type = 'DATABASE_ERROR';

  constructor(
    message: string,
    public subType: 'TABLE_NOT_FOUND' | 'RLS_POLICY' | 'VALIDATION' | 'CONSTRAINT' | 'UNKNOWN',
    details?: any
  ) {
    super(message, details);
  }

  getUserMessage(): string {
    switch (this.subType) {
      case 'TABLE_NOT_FOUND':
        return 'Database table not found. Please check your configuration.';
      case 'RLS_POLICY':
        return 'Database access blocked by security policy.';
      case 'VALIDATION':
        return 'Data validation failed. Please check your input.';
      case 'CONSTRAINT':
        return 'Data constraint violation. Please check required fields.';
      default:
        return 'Database error. Please try again.';
    }
  }
}

/**
 * Real-time subscription errors
 */
export class SupachargerRealtimeError extends SupachargerError {
  readonly type = 'REALTIME_ERROR';

  constructor(
    message: string,
    public subType: 'CONNECTION_FAILED' | 'CHANNEL_ERROR' | 'SUBSCRIPTION_FAILED' | 'UNKNOWN',
    details?: any
  ) {
    super(message, details);
  }

  getUserMessage(): string {
    switch (this.subType) {
      case 'CONNECTION_FAILED':
        return 'Failed to connect to real-time updates.';
      case 'CHANNEL_ERROR':
        return 'Real-time channel error occurred.';
      case 'SUBSCRIPTION_FAILED':
        return 'Failed to subscribe to real-time updates.';
      default:
        return 'Real-time error occurred.';
    }
  }
}

/**
 * Configuration/setup errors
 */
export class SupachargerConfigError extends SupachargerError {
  readonly type = 'CONFIG_ERROR';

  constructor(
    message: string,
    public subType: 'MISSING_ENV' | 'INVALID_CONFIG' | 'SETUP_INCOMPLETE' | 'UNKNOWN',
    details?: any
  ) {
    super(message, details);
  }

  getUserMessage(): string {
    switch (this.subType) {
      case 'MISSING_ENV':
        return 'Environment configuration missing. Please check your .env file.';
      case 'INVALID_CONFIG':
        return 'Invalid configuration. Please check your settings.';
      case 'SETUP_INCOMPLETE':
        return 'Setup incomplete. Please complete the Supabase configuration.';
      default:
        return 'Configuration error occurred.';
    }
  }
}

/**
 * Parse Supabase error and convert to appropriate SupachargerError
 */
export function parseSupabaseError(error: any, context: 'upload' | 'database' | 'realtime' = 'upload'): SupachargerError {
  const message = error?.message || 'Unknown error occurred';
  const details = {
    originalError: error,
    code: error?.code,
    statusCode: error?.statusCode,
    hint: error?.hint
  };

  // Parse common Supabase error patterns
  if (message.includes('row-level security policy')) {
    if (context === 'upload') {
      return new SupachargerUploadError(message, 'RLS_POLICY', details);
    } else {
      return new SupachargerDatabaseError(message, 'RLS_POLICY', details);
    }
  }

  if (message.includes('bucket') && message.includes('not found')) {
    return new SupachargerUploadError(message, 'BUCKET_NOT_FOUND', details);
  }

  if (message.includes('too large') || message.includes('file size')) {
    return new SupachargerUploadError(message, 'FILE_TOO_LARGE', details);
  }

  if (message.includes('table') && message.includes('does not exist')) {
    return new SupachargerDatabaseError(message, 'TABLE_NOT_FOUND', details);
  }

  if (message.includes('violates not-null constraint') || message.includes('constraint')) {
    return new SupachargerDatabaseError(message, 'CONSTRAINT', details);
  }

  if (message.includes('invalid input syntax') || message.includes('validation')) {
    return new SupachargerDatabaseError(message, 'VALIDATION', details);
  }

  if (error?.code === 'NETWORK_ERROR' || message.includes('network')) {
    return new SupachargerUploadError(message, 'NETWORK', details);
  }

  // Default to generic error based on context
  switch (context) {
    case 'upload':
      return new SupachargerUploadError(message, 'UNKNOWN', details);
    case 'database':
      return new SupachargerDatabaseError(message, 'UNKNOWN', details);
    case 'realtime':
      return new SupachargerRealtimeError(message, 'UNKNOWN', details);
    default:
      return new SupachargerUploadError(message, 'UNKNOWN', details);
  }
}

/**
 * Log error with appropriate level and context
 */
export function logSupachargerError(error: SupachargerError, context?: string): void {
  const logData = {
    context,
    ...error.getDebugInfo()
  };

  // In development, log full details
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 ${error.type}${context ? ` (${context})` : ''}`);
    console.error('Message:', error.message);
    console.error('Type:', error.type);
    if ('subType' in error) {
      console.error('SubType:', (error as any).subType);
    }
    console.error('Details:', error.details);
    console.error('Stack:', error.stack);
    console.groupEnd();
  } else {
    // In production, log essential info only
    console.error(`${error.type}: ${error.message}`, {
      type: error.type,
      timestamp: error.timestamp
    });
  }
}

/**
 * Create user-friendly error message with actionable advice
 */
export function createUserErrorMessage(error: SupachargerError): string {
  const baseMessage = error.getUserMessage();
  
  // Add specific advice based on error type
  if (error instanceof SupachargerUploadError && error.subType === 'RLS_POLICY') {
    return `${baseMessage}\n\nTo fix this:\n1. Go to your Supabase dashboard\n2. Navigate to Storage → Policies\n3. Add upload/read policies for your bucket`;
  }

  if (error instanceof SupachargerDatabaseError && error.subType === 'RLS_POLICY') {
    return `${baseMessage}\n\nTo fix this:\n1. Go to your Supabase dashboard\n2. Navigate to Authentication → Policies\n3. Add insert/select policies for your table`;
  }

  return baseMessage;
} 