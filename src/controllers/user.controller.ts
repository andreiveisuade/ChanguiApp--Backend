import { asyncHandler } from '../utils/asyncHandler';
import * as userService from '../services/user.service';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user!.id, req.user);
  res.json(profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await userService.updateProfile(req.user!.id, req.body);
  res.json(profile);
});

export const deleteProfile = asyncHandler(async (req, res) => {
  await userService.deleteProfile(req.user!.id);
  res.json({ deleted: true });
});
