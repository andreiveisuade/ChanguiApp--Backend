export {};

jest.mock('../../../src/repositories/user.repository');

const userService = require('../../../src/services/user.service');
const userRepository = require('../../../src/repositories/user.repository');

const { validUser } = require('../../helpers/testData');

describe('UserService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('devuelve datos del usuario autenticado', async () => {
      const profile = {
        id: validUser.id,
        email: validUser.email,
        full_name: validUser.full_name,
      };
      userRepository.findById.mockResolvedValue(profile);

      const result = await userService.getProfile(validUser.id);

      expect(userRepository.findById).toHaveBeenCalledWith(validUser.id);
      expect(result).toEqual(profile);
    });

    it('lanza ApiError 404 si el usuario no existe', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.getProfile('no-existe')).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('updateProfile', () => {
    it('actualiza solo full_name y avatar_url, devuelve perfil actualizado', async () => {
      const body = { full_name: 'Nuevo Nombre', avatar_url: 'https://img.com/a.png' };
      const updated = { id: validUser.id, email: validUser.email, ...body };
      userRepository.update.mockResolvedValue(updated);

      const result = await userService.updateProfile(validUser.id, body);

      expect(userRepository.update).toHaveBeenCalledWith(validUser.id, body);
      expect(result).toEqual(updated);
    });

    it('ignora campos no permitidos (id, role, email)', async () => {
      const body = { full_name: 'Nuevo', id: 'hack-id', role: 'admin', email: 'hack@x.com' };
      const sanitized = { full_name: 'Nuevo' };
      const updated = { id: validUser.id, email: validUser.email, ...sanitized };
      userRepository.update.mockResolvedValue(updated);

      const result = await userService.updateProfile(validUser.id, body);

      expect(userRepository.update).toHaveBeenCalledWith(validUser.id, sanitized);
      expect(result).toEqual(updated);
    });

    it('lanza ApiError 400 si no hay campos validos para actualizar', async () => {
      await expect(
        userService.updateProfile(validUser.id, { id: 'hack', role: 'admin' }),
      ).rejects.toMatchObject({ status: 400 });

      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile (mas casos borde)', () => {
    it('acepta full_name de 1 char (no rechaza por longitud aca, validar en frontend)', async () => {
      const body = { full_name: 'A' };
      userRepository.update.mockResolvedValue({ id: validUser.id, full_name: 'A' });

      const result = await userService.updateProfile(validUser.id, body);

      expect(result.full_name).toBe('A');
    });

    it('actualiza solo avatar_url si solo se manda eso', async () => {
      const body = { avatar_url: 'https://img.com/x.jpg' };
      const updated = { id: validUser.id, avatar_url: 'https://img.com/x.jpg' };
      userRepository.update.mockResolvedValue(updated);

      const result = await userService.updateProfile(validUser.id, body);

      expect(userRepository.update).toHaveBeenCalledWith(validUser.id, body);
      expect(result.avatar_url).toBe('https://img.com/x.jpg');
    });

    it('propaga error de DB del repository', async () => {
      userRepository.update.mockRejectedValue(new Error('DB write failed'));

      await expect(
        userService.updateProfile(validUser.id, { full_name: 'X' }),
      ).rejects.toThrow('DB write failed');
    });
  });

  describe('deleteProfile', () => {
    it('llama a userRepository.remove con el userId', async () => {
      userRepository.remove.mockResolvedValue(undefined);

      await userService.deleteProfile(validUser.id);

      expect(userRepository.remove).toHaveBeenCalledWith(validUser.id);
    });

    it('propaga error de DB del repository', async () => {
      userRepository.remove.mockRejectedValue(new Error('DB delete failed'));

      await expect(userService.deleteProfile(validUser.id)).rejects.toThrow('DB delete failed');
    });
  });
});
