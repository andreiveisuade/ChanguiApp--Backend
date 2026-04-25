import { authRepository } from '../repositories/auth.repository';
import { userRepository } from '../repositories/user.repository';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const authService = {
  async register(email: string, password: string, name: string) {
    // 1. Validar si el email ya existe en la tabla (Error 409)
    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser) {
      throw new ApiError(409, 'El email ya está registrado');
    }

    // 2. Crear usuario en Supabase Auth
    const authData = await authRepository.register(email, password);
    if (!authData.user) {
      throw new ApiError(500, 'Error al crear el usuario en Supabase Auth');
    }

    // 3. Crear el perfil en la tabla 'users'
    const userProfile = await userRepository.createUserProfile(authData.user.id, email, name);

    return {
      session: authData.session,
      user: userProfile
    };
  },

  async login(email: string, password: string) {
    try {
      const authData = await authRepository.login(email, password);
      return { session: authData.session, user: authData.user };
    } catch (error: any) {
      throw new ApiError(401, 'Credenciales inválidas');
    }
  }
};