/**
 * SchoolCore Domain Error Hierarchy & Graceful Degradation Utilities
 * Replaces generic error throwing with structured AppError subclasses.
 */

import { supabase } from './supabaseClient';

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export class AppError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly severity: ErrorSeverity;
  public readonly details?: Record<string, any>;
  public readonly recoverable: boolean;

  constructor(options: {
    message: string;
    code?: string;
    userMessage?: string;
    statusCode?: number;
    severity?: ErrorSeverity;
    details?: Record<string, any>;
    recoverable?: boolean;
  }) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = options.code || 'APP_INTERNAL_ERROR';
    this.userMessage = options.userMessage || 'An unexpected issue occurred. Your data is safe.';
    this.statusCode = options.statusCode || 500;
    this.severity = options.severity || 'error';
    this.details = options.details;
    this.recoverable = options.recoverable ?? true;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection interrupted.', details?: Record<string, any>) {
    super({
      message,
      code: 'NETWORK_DISCONNECTED',
      userMessage: 'Your connection appears unstable. Please check your network and try again.',
      statusCode: 503,
      severity: 'warning',
      details,
      recoverable: true,
    });
  }
}

export class ValidationError extends AppError {
  constructor(fieldErrors: Record<string, string> | string, details?: Record<string, any>) {
    const msg = typeof fieldErrors === 'string' ? fieldErrors : Object.values(fieldErrors).join(', ');
    super({
      message: `Validation failed: ${msg}`,
      code: 'VALIDATION_FAILED',
      userMessage: typeof fieldErrors === 'string' ? fieldErrors : 'Please check required form fields and try again.',
      statusCode: 422,
      severity: 'warning',
      details: typeof fieldErrors === 'object' ? fieldErrors : details,
      recoverable: true,
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Session expired or invalid credentials.', details?: Record<string, any>) {
    super({
      message,
      code: 'AUTH_SESSION_EXPIRED',
      userMessage: 'Your session has expired. Please sign in again to continue.',
      statusCode: 401,
      severity: 'error',
      details,
      recoverable: false,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resourceName = 'Record', id?: string) {
    super({
      message: `${resourceName} with identifier ${id || 'specified'} was not found.`,
      code: 'RESOURCE_NOT_FOUND',
      userMessage: `We couldn't find the requested ${resourceName.toLowerCase()} record.`,
      statusCode: 404,
      severity: 'warning',
      recoverable: true,
    });
  }
}

export class ConflictError extends AppError {
  public readonly serverVersion?: number | string;
  public readonly clientVersion?: number | string;

  constructor(message = 'A concurrent modification occurred.', details?: { serverVersion?: number | string; clientVersion?: number | string }) {
    super({
      message,
      code: 'CONCURRENCY_CONFLICT',
      userMessage: 'This record was modified by another staff member. The latest data has been loaded.',
      statusCode: 409,
      severity: 'warning',
      details,
      recoverable: true,
    });
    this.serverVersion = details?.serverVersion;
    this.clientVersion = details?.clientVersion;
  }
}

export class DatabaseSyncError extends AppError {
  constructor(message = 'Failed to synchronize with database.', details?: Record<string, any>) {
    super({
      message,
      code: 'DATABASE_SYNC_FAILED',
      userMessage: 'We could not sync changes to the database. Changes are saved locally and will retry.',
      statusCode: 502,
      severity: 'error',
      details,
      recoverable: true,
    });
  }
}

/**
 * Sends a structured error payload to the server / Supabase system_logs
 */
export async function logSystemError(payload: {
  message: string;
  stack?: string;
  componentStack?: string;
  userId?: string;
  schoolId?: string;
  level?: string;
}): Promise<void> {
  try {
    // 1. Send to server backend route
    fetch('/api/system/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Fire-and-forget
    });

    // 2. Direct Supabase insert attempt
    if (supabase) {
      await supabase.from('system_logs').insert([
      {
        level: payload.level || 'ERROR',
        message: payload.message,
        stack: payload.stack || null,
        component_stack: payload.componentStack || null,
        user_id: payload.userId || null,
        school_id: payload.schoolId || null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      },
    ]);
    }
  } catch (err) {
    console.warn('[SystemLog] Could not record stack trace to system_logs:', err);
  }
}

/**
 * Maps any unknown exception to a typed AppError and dispatches a user-friendly toast.
 */
export function handleAppError(
  err: unknown,
  showToast?: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void
): AppError {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof TypeError && err.message.includes('fetch')) {
    appError = new NetworkError(err.message);
  } else if (typeof err === 'object' && err !== null && 'status' in err && (err as any).status === 401) {
    appError = new AuthenticationError();
  } else if (typeof err === 'object' && err !== null && 'status' in err && (err as any).status === 409) {
    appError = new ConflictError();
  } else if (typeof err === 'object' && err !== null && 'code' in err && (err as any).code === 'PGRST116') {
    appError = new NotFoundError();
  } else {
    const rawMsg = err instanceof Error ? err.message : String(err);
    appError = new AppError({
      message: rawMsg,
      userMessage: rawMsg.length < 80 && !rawMsg.includes('TypeError') && !rawMsg.includes('{')
        ? rawMsg
        : 'Something went wrong. Please check your input or try again in a few moments.',
    });
  }

  if (showToast) {
    const toastType = appError.severity === 'warning' ? 'warning' : 'error';
    showToast(appError.userMessage, toastType);
  }

  return appError;
}
