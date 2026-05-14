export {};

jest.mock('../../../src/repositories/auth.repository');
jest.mock('../../../src/repositories/user.repository');

const { authService } = require('../../../src/services/auth.service');
const { authRepository } = require('../../../src/repositories/auth.repository');
const userRepository = require('../../../src/repositories/user.repository');

const { validUser } = require('../../helpers/testData');

describe('AuthService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('crea usuario en Supabase Auth + perfil en users, devuelve session y user', async () => {
      const authData = {
        user: { id: validUser.id, email: validUser.email },
        session: { access_token: 'test-token' },
      };
      userRepository.getUserByEmail.mockResolvedValue(null);
      authRepository.register.mockResolvedValue(authData);
      userRepository.createUserProfile.mockResolvedValue({
        id: validUser.id,
        email: validUser.email,
        full_name: 'Test User',
      });

      const result = await authService.register(validUser.email, validUser.password, 'Test User');

      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(validUser.email);
      expect(authRepository.register).toHaveBeenCalledWith(validUser.email, validUser.password);
      expect(userRepository.createUserProfile).toHaveBeenCalledWith(
        authData.user.id,
        validUser.email,
        'Test User',
      );
      expect(result).toHaveProperty('session.access_token', 'test-token');
      expect(result.user.email).toBe(validUser.email);
    });

    it('devuelve error 409 si el email ya existe en la tabla users', async () => {
      userRepository.getUserByEmail.mockResolvedValue({ id: validUser.id, email: validUser.email });

      await expect(
        authService.register(validUser.email, validUser.password, 'Test User'),
      ).rejects.toMatchObject({ status: 409 });

      expect(authRepository.register).not.toHaveBeenCalled();
    });

    it('devuelve error 500 si Supabase Auth falla en crear el usuario', async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);
      authRepository.register.mockResolvedValue({ user: null, session: null });

      await expect(
        authService.register(validUser.email, validUser.password, 'Test User'),
      ).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('login', () => {
    it('valida credenciales y devuelve session + user', async () => {
      const authData = {
        user: { id: validUser.id, email: validUser.email },
        session: { access_token: 'test-token' },
      };
      authRepository.login.mockResolvedValue(authData);

      const result = await authService.login(validUser.email, validUser.password);

      expect(authRepository.login).toHaveBeenCalledWith(validUser.email, validUser.password);
      expect(result).toHaveProperty('session.access_token', 'test-token');
      expect(result.user.email).toBe(validUser.email);
    });

    it('devuelve error 401 si credenciales inválidas', async () => {
      authRepository.login.mockRejectedValue(new Error('Invalid login credentials'));

      await expect(authService.login('wrong@test.com', 'wrong')).rejects.toMatchObject({
        status: 401,
      });
    });
  });
});
