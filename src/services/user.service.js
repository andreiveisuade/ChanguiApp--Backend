const userRepository = require('../repositories/user.repository');

const ALLOWED_FIELDS = ['full_name', 'avatar_url'];

async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    const err = new Error('Perfil no encontrado');
    err.status = 404;
    throw err;
  }
  return user;
}

async function updateProfile(userId, body) {
  const fields = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) fields[key] = body[key];
  }

  if (Object.keys(fields).length === 0) {
    const err = new Error('No hay campos válidos para actualizar');
    err.status = 400;
    throw err;
  }

  return userRepository.update(userId, fields);
}

async function deleteProfile(userId) {
  await userRepository.remove(userId);
}

module.exports = { getProfile, updateProfile, deleteProfile };
