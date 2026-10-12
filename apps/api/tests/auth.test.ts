import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  buildTestApp,
  createUser,
  loginAs,
  resetDatabase,
  TEST_ADMIN,
  type ErrorBody,
  type LoginBody,
  type MeBody,
} from './helpers.ts';

describe('auth', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    await createUser(app, TEST_ADMIN);
  });

  it('POST /login devuelve el usuario, sin token en el body, y setea cookie segura', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: TEST_ADMIN.email, password: TEST_ADMIN.password },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<LoginBody>();
    expect(body.user.id).toBeTypeOf('string');
    expect(body.user.email).toBe(TEST_ADMIN.email);
    expect(body.user.name).toBe(TEST_ADMIN.name);
    expect(body.user.role).toBe('ADMIN');
    expect(body.user).not.toHaveProperty('passwordHash');
    expect(response.body).not.toContain('token');

    const setCookie = response.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? '');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('Secure');
    expect(cookieHeader).toContain('SameSite=Strict');
    expect(cookieHeader).toContain('Path=/');
    expect(cookieHeader).toContain('Max-Age=3600');
  });

  it('no revela si el email existe: mismo 401 genérico', async () => {
    const wrongPassword = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: TEST_ADMIN.email, password: 'contrasena-incorrecta' },
    });
    const unknownEmail = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'nadie@test.local', password: 'contrasena-incorrecta' },
    });

    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    expect(wrongPassword.json<ErrorBody>()).toEqual(unknownEmail.json<ErrorBody>());
    expect(wrongPassword.json<ErrorBody>().error.message).toBe('Credenciales inválidas');
  });

  it('valida el cuerpo con zod: 400 con details', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'no-es-email', password: '' },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json<ErrorBody>();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details?.length).toBeGreaterThan(0);
  });

  it('rechaza campos desconocidos en el login (esquemas estrictos)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: TEST_ADMIN.email, password: TEST_ADMIN.password, extra: 'hack' },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json<ErrorBody>();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(
      body.error.details?.some((detail) => detail.message.includes('campos no permitidos')),
    ).toBe(true);
  });

  it('GET /me: 401 sin cookie, 200 con cookie; POST /logout limpia la cookie', async () => {
    const noCookie = await app.inject({ method: 'GET', url: '/me' });
    expect(noCookie.statusCode).toBe(401);

    const cookie = await loginAs(app, TEST_ADMIN.email, TEST_ADMIN.password);

    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(me.statusCode).toBe(200);
    expect(me.json<MeBody>().user.email).toBe(TEST_ADMIN.email);

    const logout = await app.inject({ method: 'POST', url: '/logout', headers: { cookie } });
    expect(logout.statusCode).toBe(204);
    const clearCookie = logout.headers['set-cookie'];
    const clearHeader = Array.isArray(clearCookie) ? clearCookie.join(';') : (clearCookie ?? '');
    expect(clearHeader).toContain('token=');
  });

  it('rechaza cookies manipuladas', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { cookie: 'token=inventado' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<ErrorBody>().error.code).toBe('UNAUTHORIZED');
  });

  it('limita los intentos de login: 429 uniforme', async () => {
    const limitedApp = await buildTestApp({ loginRateLimitMax: 2 });

    try {
      const payload = { email: TEST_ADMIN.email, password: 'mala' };
      await limitedApp.inject({ method: 'POST', url: '/login', payload });
      await limitedApp.inject({ method: 'POST', url: '/login', payload });
      const third = await limitedApp.inject({ method: 'POST', url: '/login', payload });

      expect(third.statusCode).toBe(429);
      expect(third.json<ErrorBody>().error.code).toBe('RATE_LIMITED');
    } finally {
      await limitedApp.close();
    }
  });

  it('exige application/json en mutaciones (protección CSRF)', async () => {
    const textPlain = await app.inject({
      method: 'POST',
      url: '/login',
      payload: 'email=a&password=b',
      headers: { 'content-type': 'text/plain' },
    });
    expect(textPlain.statusCode).toBe(415);

    const form = await app.inject({
      method: 'POST',
      url: '/login',
      payload: 'email=a&password=b',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    expect(form.statusCode).toBe(415);
    expect(form.json<ErrorBody>().error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });
});
