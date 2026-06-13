import * as userRepository from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import type { User, UserUpdate } from '../types/domain';

const ALLOWED_FIELDS: (keyof UserUpdate)[] = ['full_name', 'avatar_url'];

type AuthUserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

const nameFromMetadata = (metadata: Record<string, unknown> | null | undefined): string => {
  const meta = metadata ?? {};
  if (typeof meta.full_name === 'string') return meta.full_name;
  if (typeof meta.name === 'string') return meta.name;
  return '';
};

export async function getProfile(userId: string, authUser?: AuthUserLike): Promise<User> {
  const user = await userRepository.findById(userId);
  if (user) {
    return user;
  }

  // Token válido pero sin fila en `users`: pasa con el login por Google, que se
  // resuelve en el cliente (exchangeCodeForSession) y no pasa por
  // /api/auth/register. Creamos el perfil de forma idempotente desde Auth.
  const email = authUser?.email ?? '';
  if (!email) {
    throw new ApiError('Perfil no encontrado', 404);
  }

  try {
    return (await userRepository.createUserProfile(
      userId,
      email,
      nameFromMetadata(authUser?.user_metadata),
    )) as User;
  } catch {
    // Carrera: otra request ya lo creó entre el findById y el insert.
    const created = await userRepository.findById(userId);
    if (created) {
      return created;
    }
    throw new ApiError('Perfil no encontrado', 404);
  }
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
  // Primero el perfil (tabla users) y luego la identidad en Supabase Auth.
  // Ese orden evita problemas de FK y deja la cuenta realmente eliminada.
  await userRepository.remove(userId);
  await userRepository.removeAuthUser(userId);
}
