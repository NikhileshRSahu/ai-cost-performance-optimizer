export type SafeErrorCategory =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'UPLOAD_TOO_LARGE'
  | 'DATA_UNAVAILABLE'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

const SAFE_MESSAGES = Object.freeze({
  UNAUTHORIZED: 'Authentication is required.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  INVALID_INPUT: 'The supplied input is invalid.',
  UPLOAD_TOO_LARGE: 'The uploaded file exceeds the supported size limit.',
  DATA_UNAVAILABLE: 'Required evidence is unavailable or incomplete.',
  DATABASE_UNAVAILABLE:
    'The service is temporarily unable to access its data store.',
  INTERNAL_ERROR: 'The request could not be completed safely.',
} satisfies Record<SafeErrorCategory, string>);

export type SafeError = Readonly<{
  category: SafeErrorCategory;
  message: string;
  status: number;
}>;

export function safeErrorFromUnknown(error: unknown): SafeError {
  const code = error instanceof Error ? error.message : '';

  if (
    code === 'ORGANIZATION_MEMBERSHIP_REQUIRED' ||
    code === 'ACTION_NOT_ALLOWED'
  ) {
    return safe('FORBIDDEN', 403);
  }
  if (
    code === 'RECOMMENDATION_NOT_FOUND' ||
    code === 'WORKLOAD_NOT_FOUND' ||
    code === 'ORGANIZATION_NOT_FOUND'
  ) {
    return safe('NOT_FOUND', 404);
  }
  if (
    code === 'USAGE_CSV_REQUIRED' ||
    code === 'BENCHMARK_INPUT_REQUIRED' ||
    code === 'HISTORY_JSON_REQUIRED' ||
    code === 'INVALID_HISTORY_JSON' ||
    code === 'INVALID_HISTORY_SCHEMA' ||
    code === 'INVALID_REPLAY_INPUT' ||
    code === 'DATA_DELETION_CONFIRMATION_MISMATCH' ||
    code === 'DUPLICATE_TELEMETRY_EVENT_ID' ||
    code === 'INVALID_TELEMETRY_JSON' ||
    code === 'INVALID_TELEMETRY_SCHEMA'
  ) {
    return safe('INVALID_INPUT', 400);
  }
  if (
    code === 'USAGE_CSV_TOO_LARGE' ||
    code === 'BENCHMARK_CSV_TOO_LARGE' ||
    code === 'SANITIZED_HISTORY_JSON_TOO_LARGE' ||
    code === 'PRODUCTION_TELEMETRY_JSON_TOO_LARGE'
  ) {
    return safe('UPLOAD_TOO_LARGE', 413);
  }
  if (
    code === 'LAB_EVIDENCE_INCOMPLETE' ||
    code === 'IMPORT_STILL_PROCESSING'
  ) {
    return safe('DATA_UNAVAILABLE', 409);
  }

  return safe('INTERNAL_ERROR', 500);
}

function safe(category: SafeErrorCategory, status: number): SafeError {
  return Object.freeze({
    category,
    message: SAFE_MESSAGES[category],
    status,
  });
}
