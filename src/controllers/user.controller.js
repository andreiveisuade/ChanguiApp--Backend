const userService = require('../services/user.service');

async function getProfile(req, res, next) {
  try {
    const profile = await userService.getProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await userService.updateProfile(req.user.id, req.body);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function deleteProfile(req, res, next) {
  try {
    await userService.deleteProfile(req.user.id);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, deleteProfile };
