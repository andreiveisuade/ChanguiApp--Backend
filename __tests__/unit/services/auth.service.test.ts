const authService = require('../../../src/services/auth.service');
const authRepository = require('../../../src/repositories/auth.repository');

jest.mock('../../../src/repositories/auth.repository');

const { validUser } = require('../../helpers/testData');

describe('AuthService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('crea usuario en Supabase Auth + perfil en users, devuelve token y datos', async () => {
      const authData = {
        user: { id: validUser.id, email: validUser.email },
        session: { access_token: 'test-token' },
      };
      authRepository.signUp.mockResolvedValue(authData);
      authRepository.createProfile.mockResolvedValue({
        id: validUser.id,
        email: validUser.email,
      });

      const result = await authService.register(validUser.email, validUser.password);

      expect(authRepository.signUp).toHaveBeenCalledWith(validUser.email, validUser.password);
      expect(authRepository.createProfile).toHaveBeenCalledWith(authData.user.id, validUser.email);
      expect(result).toHaveProperty('token', 'test-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(validUser.email);
    });

    it('devuelve error 409 si el email ya existe', async () => {
      authRepository.signUp.mockRejectedValue({ status: 409, message: 'El email ya está registrado' });

      await expect(authService.register(validUser.email, validUser.password))
        .rejects.toMatchObject({ status: 409 });
    });

    it('devuelve error si falta email o password', async () => {
      await expect(authService.register(null, validUser.password))
        .rejects.toThrow();

      await expect(authService.register(validUser.email, null))
        .rejects.toThrow();
    });
  });

  describe('login', () => {
    it('valida credenciales y devuelve token + datos del usuario', async () => {
      const authData = {
        user: { id: validUser.id, email: validUser.email },
        session: { access_token: 'test-token' },
      };
      authRepository.signIn.mockResolvedValue(authData);

      const result = await authService.login(validUser.email, validUser.password);

      expect(authRepository.signIn).toHaveBeenCalledWith(validUser.email, validUser.password);
      expect(result).toHaveProperty('token', 'test-token');
      expect(result.user.email).toBe(validUser.email);
    });

    it('devuelve error 401 si credenciales inválidas', async () => {
      authRepository.signIn.mockRejectedValue({ status: 401, message: 'Credenciales inválidas' });

      await expect(authService.login('wrong@test.com', 'wrong'))
        .rejects.toMatchObject({ status: 401 });
    });

    it('devuelve error si falta email o password', async () => {
      await expect(authService.login(null, validUser.password))
        .rejects.toThrow();

      await expect(authService.login(validUser.email, null))
        .rejects.toThrow();
    });
  });
});
