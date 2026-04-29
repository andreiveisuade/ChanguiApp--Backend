import { authRepository } from '../repositories/auth.repository';
import * as userRepository from '../repositories/user.repository';
import { ApiError } from '../types/domain';

export const authService = {
  async register(email: string, password: string, name: string) {
    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser) {
      throw new ApiError('El email ya está registrado', 409);
    }

    const authData = await authRepository.register(email, password);
    if (!authData.user) {
      throw new ApiError('Error al crear el usuario en Supabase Auth', 500);
    }

    const userProfile = await userRepository.createUserProfile(authData.user.id, email, name);

    return {
      session: authData.session,
      user: userProfile,
    };
  },

  async login(email: string, password: string) {
    try {
      const authData = await authRepository.login(email, password);
      return { session: authData.session, user: authData.user };
    } catch {
      throw new ApiError('Credenciales inválidas', 401);
    }
  },
};