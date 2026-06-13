import * as authRepository from '../repositories/auth.repository';
import * as userRepository from '../repositories/user.repository';
import { ApiError } from '../types/domain';

export const authService = {
  async register(email: string, password: string, name: string) {
    const existingUser = await userRepository.findByEmail(email);
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
    const authData = await authRepository
      .login(email, password)
      .catch(() => {
        throw new ApiError('Credenciales inválidas', 401);
      });

    if (!authData.user) {
      throw new ApiError('Credenciales inválidas', 401);
    }

    // El nombre vive en la tabla `users`, no en Supabase Auth (igual que en register).
    const profile = await userRepository.findById(authData.user.id);
    return { session: authData.session, user: profile ?? authData.user };
  },
};