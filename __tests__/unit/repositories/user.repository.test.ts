jest.mock('../../../src/config/supabase', () => require('../../helpers/mockSupabase'));

import mockSupabase from '../../helpers/mockSupabase';
import * as userRepository from '../../../src/repositories/user.repository';
import { validUser } from '../../helpers/testData';

const profile = {
  id: validUser.id,
  email: validUser.email,
  full_name: validUser.full_name,
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('UserRepository', () => {
  afterEach(() => jest.clearAllMocks());

  describe('findById', () => {
    it('devuelve el usuario cuando existe', async () => {
      mockSupabase.single.mockResolvedValue({ data: profile, error: null });

      const result = await userRepository.findById(validUser.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', validUser.id);
      expect(result).toEqual(profile);
    });

    it('devuelve null cuando no existe (PGRST116)', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await userRepository.findById('no-existe');

      expect(result).toBeNull();
    });

    it('propaga otros errores de la base', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: '500', message: 'DB down' } });

      await expect(userRepository.findById(validUser.id)).rejects.toMatchObject({ code: '500' });
    });
  });

  describe('update', () => {
    it('actualiza y devuelve el usuario', async () => {
      const updated = { ...profile, full_name: 'Nuevo' };
      mockSupabase.single.mockResolvedValue({ data: updated, error: null });

      const result = await userRepository.update(validUser.id, { full_name: 'Nuevo' });

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.update).toHaveBeenCalledWith({ full_name: 'Nuevo' });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', validUser.id);
      expect(result).toEqual(updated);
    });

    it('propaga el error de la base', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('update failed') });

      await expect(userRepository.update(validUser.id, { full_name: 'X' })).rejects.toThrow('update failed');
    });
  });

  describe('remove', () => {
    it('borra el perfil de la tabla users', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      await userRepository.remove(validUser.id);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', validUser.id);
    });

    it('propaga el error de la base', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ error: new Error('delete failed') });

      await expect(userRepository.remove(validUser.id)).rejects.toThrow('delete failed');
    });
  });

  describe('removeAuthUser', () => {
    it('elimina al usuario de Supabase Auth con el admin API', async () => {
      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ data: { user: null }, error: null });

      await userRepository.removeAuthUser(validUser.id);

      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith(validUser.id);
    });

    it('propaga el error de Auth', async () => {
      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ data: null, error: new Error('auth delete failed') });

      await expect(userRepository.removeAuthUser(validUser.id)).rejects.toThrow('auth delete failed');
    });
  });

  describe('createUserProfile', () => {
    it('inserta el perfil y lo devuelve', async () => {
      mockSupabase.single.mockResolvedValue({ data: profile, error: null });

      const result = await userRepository.createUserProfile(validUser.id, validUser.email, validUser.full_name);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        { id: validUser.id, email: validUser.email, full_name: validUser.full_name },
      ]);
      expect(result).toEqual(profile);
    });

    it('propaga el error de la base', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('insert failed') });

      await expect(
        userRepository.createUserProfile(validUser.id, validUser.email, validUser.full_name),
      ).rejects.toThrow('insert failed');
    });
  });

  describe('getUserByEmail', () => {
    it('devuelve el usuario cuando existe', async () => {
      mockSupabase.single.mockResolvedValue({ data: profile, error: null });

      const result = await userRepository.getUserByEmail(validUser.email);

      expect(mockSupabase.eq).toHaveBeenCalledWith('email', validUser.email);
      expect(result).toEqual(profile);
    });

    it('devuelve null cuando no existe (PGRST116)', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await userRepository.getUserByEmail('no@existe.com');

      expect(result).toBeNull();
    });
  });
});
