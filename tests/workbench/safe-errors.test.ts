import { describe, expect, it } from 'vitest';
import { safeErrorFromUnknown } from '../../src/workbench/safe-errors.js';

describe('safe error taxonomy', () => {
  it('maps known authorization errors without returning internal messages', () => {
    expect(safeErrorFromUnknown(new Error('ACTION_NOT_ALLOWED'))).toEqual({
      category: 'FORBIDDEN',
      message: 'You do not have permission to perform this action.',
      status: 403,
    });
  });

  it('maps upload bounds to a stable public category', () => {
    expect(
      safeErrorFromUnknown(new Error('USAGE_CSV_TOO_LARGE')),
    ).toMatchObject({
      category: 'UPLOAD_TOO_LARGE',
      status: 413,
    });
  });

  it('does not echo unknown exception content', () => {
    const secret = 'postgres://user:password@example/private';
    const result = safeErrorFromUnknown(new Error(secret));

    expect(result.category).toBe('INTERNAL_ERROR');
    expect(result.message).not.toContain('password');
    expect(JSON.stringify(result)).not.toContain(secret);
  });
});
