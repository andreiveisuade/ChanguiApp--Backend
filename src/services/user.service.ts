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
  // /api/auth/register. Creamos el perfil desde Auth (idealmente lo crea el
  // trigger handle_new_user; esto queda como red de seguridad).
  const email = authUser?.email ?? '';
  if (!email) {
    throw new ApiError('Perfil no encontrado', 404);
  }

  // Identidades no vinculadas: ya existe un perfil con este email bajo OTRO id
  // (p. ej. registrado con email/password y entrando ahora por Google sin que
  // Supabase haya linkeado las identidades). No podemos crear un segundo perfil
  // (email es único) ni adoptar el ajeno: devolvemos un error explícito en vez
  // de un 404 que oculta la causa real.
  const existingByEmail = await userRepository.getUserByEmail(email);
  if (existingByEmail && existingByEmail.id !== userId) {
    throw new ApiError(
      'Ya existe una cuenta con este email registrada con otro método de acceso.',
      409,
    );
  }

  try {
    return (await userRepository.createUserProfile(
      userId,
      email,
      nameFromMetadata(authUser?.user_metadata),
    )) as User;
  } catch (err) {
    // El perfil pudo crearse entre el findById y el insert (carrera o el trigger
    // handle_new_user). Si ya está, lo devolvemos.
    const created = await userRepository.findById(userId);
    if (created) {
      return created;
    }
    // Falla real: la logueamos para no perder la causa (antes se tragaba el
    // error y se devolvía un 404 engañoso).
    console.error('[getProfile] no se pudo crear el perfil', { userId, email }, err);
    throw new ApiError('No se pudo crear el perfil', 500);
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
