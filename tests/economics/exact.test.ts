import { describe, expect, it } from 'vitest';

import {
  add,
  compare,
  divide,
  formatDecimal,
  multiply,
  parseDecimal,
  rational,
  serialize,
  subtract,
  type Rational,
} from '../../src/economics/exact.js';

describe('exact financial evidence', () => {
  it('does not introduce binary floating point error', () => {
    expect(serialize(add(parseDecimal('0.1'), parseDecimal('0.2')))).toEqual({
      numerator: '3',
      denominator: '10',
    });
  });

  it('does not round a unit rate before multiplying back', () => {
    expect(
      serialize(
        multiply(divide(parseDecimal('1'), rational(3n)), rational(3n)),
      ),
    ).toEqual({ numerator: '1', denominator: '1' });
  });

  it('parses scale-12 and integers above Number.MAX_SAFE_INTEGER exactly', () => {
    expect(serialize(parseDecimal('0.123456789012'))).toEqual({
      numerator: '30864197253',
      denominator: '250000000000',
    });
    expect(serialize(parseDecimal('9007199254740993'))).toEqual({
      numerator: '9007199254740993',
      denominator: '1',
    });
  });

  it('rejects non-canonical, wrong-scale, and overflowing decimal inputs', () => {
    const invalid = [
      '',
      ' 1',
      '1 ',
      '+1',
      '01',
      '-0',
      '-0.0',
      '1.',
      '.1',
      '1e2',
      '0.1234567890123',
      '123456789012345678901234567',
    ];

    for (const value of invalid) expect(() => parseDecimal(value)).toThrow();
    expect(() => parseDecimal(1 as unknown as string)).toThrow();
  });

  it('normalizes signs, reduces fractions, freezes results, and canonicalizes zero', () => {
    expect(rational(6n, -8n)).toEqual({ numerator: -3n, denominator: 4n });
    expect(serialize(rational(0n, -9n))).toEqual({
      numerator: '0',
      denominator: '1',
    });
    expect(Object.isFrozen(rational(1n, 2n))).toBe(true);
  });

  it('rejects zero denominators and zero divisors', () => {
    expect(() => rational(1n, 0n)).toThrow();
    expect(() => divide(rational(1n), rational(0n))).toThrow();
  });

  it('defensively rejects malformed public operation inputs', () => {
    const malformed = { numerator: 1n, denominator: 0n } as Rational;
    const valid = rational(1n);

    for (const operation of [add, subtract, multiply, divide, compare]) {
      expect(() => operation(malformed, valid)).toThrow();
      expect(() => operation(valid, malformed)).toThrow();
    }
    expect(() => formatDecimal(malformed)).toThrow();
    expect(() => serialize(malformed)).toThrow();
  });

  it('performs signed arithmetic and comparison exactly', () => {
    expect(
      serialize(subtract(parseDecimal('-2.5'), parseDecimal('0.75'))),
    ).toEqual({
      numerator: '-13',
      denominator: '4',
    });
    expect(compare(rational(-1n, 2n), rational(-2n, 3n))).toBe(1);
    expect(compare(rational(4n, 6n), rational(2n, 3n))).toBe(0);
    expect(compare(rational(-3n), rational(2n))).toBe(-1);
  });

  it('rounds ties to even on either side of zero', () => {
    expect(formatDecimal(parseDecimal('1.005'))).toBe('1.00');
    expect(formatDecimal(parseDecimal('1.015'))).toBe('1.02');
    expect(formatDecimal(parseDecimal('-1.005'))).toBe('-1.00');
    expect(formatDecimal(parseDecimal('-0.005'))).toBe('0.00');
  });

  it('rounds non-ties, pads output, and supports 0 and 12 places', () => {
    expect(formatDecimal(rational(2n, 3n), 0)).toBe('1');
    expect(formatDecimal(parseDecimal('-1.006'))).toBe('-1.01');
    expect(formatDecimal(parseDecimal('12.3'), 12)).toBe('12.300000000000');
    expect(formatDecimal(rational(1n, 8n), 2)).toBe('0.12');
  });

  it('rejects invalid presentation-place counts', () => {
    for (const places of [-1, 13, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => formatDecimal(rational(1n), places)).toThrow();
    }
  });
});
