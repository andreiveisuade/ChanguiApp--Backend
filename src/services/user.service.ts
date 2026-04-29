import * as userRepository from '../repositories/user.repository';
import { ApiError, type User, type UserUpdate } from '../types/domain';

const ALLOWED_FIELDS: (keyof UserUpdate)[] = ['full_name', 'avatar_url'];

export async function getProfile(userId: string): Promise<User> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError('Perfil no encontrado', 404);
  }
  return user;
}

export async function updateProfile(
  userId: string,
  body: Record<string, unknown>
): Promise<User> {
  const fields: UserUpdate = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      (fields as Record<string, unknown>)[key] = body[key];
    }
  }

  if (Object.keys(fields).length === 0) {
    throw new ApiError('No hay campos válidos para actualizar', 400);
  }

  return userRepository.update(userId, fields);
}

export async function deleteProfile(userId: string): Promise<void> {
  await userRepository.remove(userId);
}
