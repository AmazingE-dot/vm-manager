import { describe, expect, it } from 'vitest';
import { findProductionConfigErrors, PRODUCTION_SECRET_MIN_LENGTH } from '../src/config/env.ts';

const EXAMPLE_SECRET = 'cambia-esto-por-un-secreto-largo-de-al-menos-32-caracteres';
const DEV_SECRET = 'dev-secret-solo-para-desarrollo-no-usar-en-produccion';

function checkSecret(secret: string): string[] {
  return findProductionConfigErrors(
    { JWT_SECRET: secret },
    { DATABASE_URL: 'postgresql://vmuser:vmpass@localhost:5433/vmdb', JWT_SECRET: secret },
  );
}

describe('findProductionConfigErrors', () => {
  it('rechaza el secreto de ejemplo del .env.example', () => {
    const errors = checkSecret(EXAMPLE_SECRET);

    expect(errors).toContain(
      'JWT_SECRET no puede ser un valor de ejemplo o de desarrollo en producción',
    );
  });

  it('rechaza el secreto por defecto de desarrollo', () => {
    const errors = checkSecret(DEV_SECRET);

    expect(errors).toContain(
      'JWT_SECRET no puede ser un valor de ejemplo o de desarrollo en producción',
    );
  });

  it('rechaza secretos de menos de 48 caracteres', () => {
    const errors = checkSecret('secreto-corto-pero-propio');

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(`${PRODUCTION_SECRET_MIN_LENGTH} caracteres`);
  });

  it('no reporta problemas con un secreto propio y suficientemente largo', () => {
    expect(checkSecret('x'.repeat(PRODUCTION_SECRET_MIN_LENGTH))).toEqual([]);
  });

  it('exige DATABASE_URL y JWT_SECRET presentes', () => {
    const errors = findProductionConfigErrors({ JWT_SECRET: 'x'.repeat(60) }, {});

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('DATABASE_URL');
    expect(errors[0]).toContain('JWT_SECRET');
  });
});
