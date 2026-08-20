export type AuthActionError = {
  code: string;
  status: number | null;
};

export type AuthActionFailure = {
  data: null;
  error: AuthActionError;
};

export type AuthActionSuccess<T> = {
  data: T;
  error: null;
};

export type AuthActionResult<T = null> = AuthActionFailure | AuthActionSuccess<T>;

const SAFE_ERROR_CODE = /^[a-z0-9_]{1,100}$/;

function safeErrorCode(value: unknown, fallbackCode: string) {
  return typeof value === 'string' && SAFE_ERROR_CODE.test(value) ? value : fallbackCode;
}

export function authActionFailure(
  error: unknown,
  fallbackCode = 'unexpected_failure',
): AuthActionFailure {
  const record = typeof error === 'object' && error !== null
    ? (error as { code?: unknown; status?: unknown })
    : null;
  const code = safeErrorCode(record?.code ?? error, fallbackCode);
  const status = typeof record?.status === 'number' && Number.isInteger(record.status)
    ? record.status
    : null;

  return {
    data: null,
    error: { code, status },
  };
}

export function authActionSuccess<T>(data: T): AuthActionSuccess<T> {
  return { data, error: null };
}
