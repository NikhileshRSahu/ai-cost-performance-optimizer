export type Rational = Readonly<{ numerator: bigint; denominator: bigint }>;

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function validated(value: Rational): Rational {
  if (
    typeof value.numerator !== 'bigint' ||
    typeof value.denominator !== 'bigint' ||
    value.denominator <= 0n
  ) {
    throw new RangeError('a rational denominator must be a positive bigint');
  }
  return rational(value.numerator, value.denominator);
}

export function rational(numerator: bigint, denominator = 1n): Rational {
  if (typeof numerator !== 'bigint' || typeof denominator !== 'bigint') {
    throw new TypeError('rational values require bigint inputs');
  }
  if (denominator === 0n) throw new RangeError('denominator must not be zero');
  if (numerator === 0n)
    return Object.freeze({ numerator: 0n, denominator: 1n });

  if (denominator < 0n) {
    numerator = -numerator;
    denominator = -denominator;
  }
  const divisor = gcd(numerator, denominator);
  return Object.freeze({
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  });
}

export function parseDecimal(value: string): Rational {
  if (typeof value !== 'string')
    throw new TypeError('decimal input must be a string');

  const match = /^(-?)(0|[1-9]\d{0,25})(?:\.(\d{1,12}))?$/.exec(value);
  if (match === null) throw new RangeError('invalid canonical decimal');

  const sign = match[1] === '-' ? -1n : 1n;
  const integer = match[2] ?? '';
  const fraction = match[3] ?? '';
  if (sign < 0n && /^0+$/.test(integer + fraction)) {
    throw new RangeError('negative zero is not canonical');
  }

  return rational(
    sign * BigInt(integer + fraction),
    10n ** BigInt(fraction.length),
  );
}

export function add(a: Rational, b: Rational): Rational {
  a = validated(a);
  b = validated(b);
  return rational(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

export function subtract(a: Rational, b: Rational): Rational {
  a = validated(a);
  b = validated(b);
  return rational(
    a.numerator * b.denominator - b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

export function multiply(a: Rational, b: Rational): Rational {
  a = validated(a);
  b = validated(b);
  return rational(a.numerator * b.numerator, a.denominator * b.denominator);
}

export function divide(a: Rational, b: Rational): Rational {
  a = validated(a);
  b = validated(b);
  if (b.numerator === 0n) throw new RangeError('divisor must not be zero');
  return rational(a.numerator * b.denominator, a.denominator * b.numerator);
}

export function compare(a: Rational, b: Rational): -1 | 0 | 1 {
  a = validated(a);
  b = validated(b);
  const left = a.numerator * b.denominator;
  const right = b.numerator * a.denominator;
  return left < right ? -1 : left > right ? 1 : 0;
}

export function formatDecimal(value: Rational, places = 2): string {
  value = validated(value);
  if (!Number.isInteger(places) || places < 0 || places > 12) {
    throw new RangeError('places must be an integer from 0 through 12');
  }

  const magnitude = value.numerator < 0n ? -value.numerator : value.numerator;
  const scaled = magnitude * 10n ** BigInt(places);
  let rounded = scaled / value.denominator;
  const remainder = scaled % value.denominator;
  if (
    2n * remainder > value.denominator ||
    (2n * remainder === value.denominator && rounded % 2n !== 0n)
  ) {
    rounded += 1n;
  }

  let digits = rounded.toString();
  if (places > 0) {
    digits = digits.padStart(places + 1, '0');
    digits = `${digits.slice(0, -places)}.${digits.slice(-places)}`;
  }
  return value.numerator < 0n && rounded > 0n ? `-${digits}` : digits;
}

export function serialize(
  value: Rational,
): Readonly<{ numerator: string; denominator: string }> {
  value = validated(value);
  return Object.freeze({
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString(),
  });
}
