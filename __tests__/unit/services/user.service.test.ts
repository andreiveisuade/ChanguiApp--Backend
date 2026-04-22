export {};

const userService = require('../../../src/services/user.service');
const userRepository = require('../../../src/repositories/user.repository');

jest.mock('../../../src/repositories/user.repository');
const { validUser } = require('../../helpers/testData');

describe('UserService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('devuelve datos del usuario autenticado', async () => {
      const profile = { id: validUser.id, email: validUser.email, name: 'Test User' };
      userRepository.findById.mockResolvedValue(profile);

      const result = await userService.getProfile(validUser.id);

      expect(userRepository.findById).toHaveBeenCalledWith(validUser.id);
      expect(result).toEqual(profile);
    });

    it('lanza error si el usuario no existe', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.getProfile('no-existe'))
        .rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('updateProfile', () => {
    it('actualiza campos enviados y devuelve perfil actualizado', async () => {
      const updates = { name: 'Nuevo Nombre' };
      const updated = { id: validUser.id, email: validUser.email, ...updates };
      userRepository.findById.mockResolvedValue({ id: validUser.id, email: validUser.email });
      userRepository.update.mockResolvedValue(updated);

      const result = await userService.updateProfile(validUser.id, updates);

      expect(userRepository.update).toHaveBeenCalledWith(validUser.id, updates);
      expect(result).toEqual(updated);
    });

    it('ignora campos no permitidos (id, role)', async () => {
      const updates = { name: 'Nuevo Nombre', id: 'hack-id', role: 'admin' };
      const sanitized = { name: 'Nuevo Nombre' };
      const updated = { id: validUser.id, email: validUser.email, ...sanitized };
      userRepository.findById.mockResolvedValue({ id: validUser.id, email: validUser.email });
      userRepository.update.mockResolvedValue(updated);

      const result = await userService.updateProfile(validUser.id, updates);

      expect(userRepository.update).toHaveBeenCalledWith(validUser.id, sanitized);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteAccount', () => {
    it('elimina usuario y borra datos asociados', async () => {
      userRepository.findById.mockResolvedValue({ id: validUser.id });
      userRepository.deleteWithData.mockResolvedValue(true);

      const result = await userService.deleteAccount(validUser.id);

      expect(userRepository.findById).toHaveBeenCalledWith(validUser.id);
      expect(userRepository.deleteWithData).toHaveBeenCalledWith(validUser.id);
      expect(result).toBe(true);
    });

    it('lanza error si el usuario no existe', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.deleteAccount('no-existe'))
        .rejects.toThrow('Usuario no encontrado');
    });
  });
});
