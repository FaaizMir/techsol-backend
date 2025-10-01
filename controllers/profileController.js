const { User } = require('../models/associations');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ['password']
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        company: user.company,
        profilePicture: user.profilePicture,
        bio: user.bio,
        address: user.address,
        city: user.city,
        country: user.country,
        timezone: user.timezone,
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        isOnboardingCompleted: user.isOnboardingCompleted
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      phone,
      company,
      bio,
      address,
      city,
      country,
      timezone,
      emailNotifications,
      pushNotifications
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    await user.update({
      firstName,
      lastName,
      phone,
      company,
      bio,
      address,
      city,
      country,
      timezone,
      emailNotifications,
      pushNotifications
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        company: user.company,
        profilePicture: user.profilePicture,
        bio: user.bio,
        address: user.address,
        city: user.city,
        country: user.country,
        timezone: user.timezone,
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update profile picture
exports.updateProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' }
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const { filename } = req.file;
    const profilePicturePath = `/uploads/${filename}`;

    await user.update({ profilePicture: profilePicturePath });

    res.json({
      success: true,
      data: {
        profilePicture: profilePicturePath
      }
    });
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Current password and new password are required' }
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 6 characters long' }
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Current password is incorrect' }
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};