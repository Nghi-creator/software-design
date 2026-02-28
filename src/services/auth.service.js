import bcrypt from 'bcryptjs';
import * as userModel from '../models/user.model.js';
import * as upgradeRequestModel from '../models/upgradeRequest.model.js';
import * as watchlistModel from '../models/watchlist.model.js';
import * as reviewModel from '../models/review.model.js';
import * as autoBiddingModel from '../models/autoBidding.model.js';
import { verifyRecaptcha } from '../utils/recaptcha.util.js';
import { sendMail } from '../utils/mailer.js';
import { EmailTemplates } from './emailTemplate.service.js';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const AuthService = {
  generateOtp,

  async validateSignupInput(userData, recaptchaResponse) {
    const errors = {};
    const old = { fullname: userData.fullname, email: userData.email, address: userData.address };
    const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;

    const isCaptchaValid = await verifyRecaptcha(recaptchaResponse);
    if (!isCaptchaValid) {
      errors.captcha = 'Captcha verification failed. Please try again.';
    }

    if (!userData.fullname) errors.fullname = 'Full name is required';
    if (!userData.address) errors.address = 'Address is required';
    if (!userData.email) errors.email = 'Email is required';
    if (!userData.password) errors.password = 'Password is required';
    if (userData.password !== userData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    const isEmailExist = await userModel.findByEmail(userData.email);
    if (isEmailExist) errors.email = 'Email is already in use';

    return { errors, old, recaptchaSiteKey };
  },

  async registerUser(userData) {
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    const newUser = await userModel.add({
      email: userData.email,
      fullname: userData.fullname,
      address: userData.address,
      password_hash: hashedPassword,
      role: 'bidder',
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await userModel.createOtp({
      user_id: newUser.id,
      otp_code: otp,
      purpose: 'verify_email',
      expires_at: expiresAt,
    });

    await sendMail({
      to: userData.email,
      subject: 'Verify your Online Auction account',
      html: EmailTemplates.otpEmail(otp)
    });

    return { success: true, email: userData.email };
  },

  async authenticateUser(email, password) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.email_verified) {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await userModel.createOtp({
        user_id: user.id,
        otp_code: otp,
        purpose: 'verify_email',
        expires_at: expiresAt,
      });

      await sendMail({
        to: email,
        subject: 'Verify your Online Auction account',
        html: EmailTemplates.otpEmail(otp)
      });

      return { success: true, verified: false, user };
    }

    return { success: true, verified: true, user };
  },

  async requestPasswordReset(email) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return { success: false, error: 'Email not found.' };
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await userModel.createOtp({
      user_id: user.id,
      otp_code: otp,
      purpose: 'reset_password',
      expires_at: expiresAt,
    });

    await sendMail({
      to: email,
      subject: 'Password Reset for Your Online Auction Account',
      html: EmailTemplates.otpEmail(otp)
    });

    return { success: true, email };
  },

  async resendOtp(email, purpose) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return { success: false, error: 'Email not found.' };
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await userModel.createOtp({
      user_id: user.id,
      otp_code: otp,
      purpose,
      expires_at: expiresAt,
    });

    const subject = purpose === 'verify_email'
      ? 'Verify your Online Auction account'
      : 'New OTP for Password Reset';

    await sendMail({
      to: email,
      subject,
      html: EmailTemplates.otpEmail(otp)
    });

    return { success: true };
  },

  async verifyOtp(email, otpCode, purpose) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    const otpRecord = await userModel.findValidOtp(user.id, otpCode, purpose);
    if (!otpRecord) {
      return { success: false, error: 'Invalid or expired OTP.' };
    }

    await userModel.markOtpUsed(otpRecord.id);

    if (purpose === 'verify_email') {
      await userModel.markEmailVerified(user.id);
    }

    return { success: true, user };
  },

  async resetPassword(email, newPassword) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await userModel.updatePassword(user.id, hashedPassword);

    return { success: true };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userModel.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await userModel.updatePassword(userId, hashedPassword);

    return { success: true };
  },

  async updateProfile(currentUserId, data) {
    const { email, fullname, address, date_of_birth, old_password, new_password, confirm_new_password } = data;
    const currentUser = await userModel.findById(currentUserId);

    if (!currentUser.oauth_provider) {
      if (!old_password || !bcrypt.compareSync(old_password, currentUser.password_hash)) {
        return { success: false, error: 'Password is incorrect!', user: currentUser };
      }
    }

    if (email !== currentUser.email) {
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return { success: false, error: 'Email is already in use by another user.', user: currentUser };
      }
    }

    if (!currentUser.oauth_provider && new_password) {
      if (new_password !== confirm_new_password) {
        return { success: false, error: 'New passwords do not match.', user: currentUser };
      }
    }

    const entity = {
      email,
      fullname,
      address: address || currentUser.address,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : currentUser.date_of_birth,
    };

    if (!currentUser.oauth_provider) {
      entity.password_hash = new_password
        ? bcrypt.hashSync(new_password, 10)
        : currentUser.password_hash;
    }

    const updatedUser = await userModel.update(currentUserId, entity);
    if (updatedUser) {
      delete updatedUser.password_hash;
    }

    return { success: true, updatedUser };
  },

  async getUserRating(userId) {
    const ratingData = await reviewModel.calculateRatingPoint(userId);
    const rating_point = ratingData ? ratingData.ratingData.rating_point : 0;
    const reviews = await reviewModel.getReviewsByUserId(userId);

    const totalReviews = reviews.length;
    const positiveReviews = reviews.filter(r => r.rating === 1).length;
    const negativeReviews = reviews.filter(r => r.rating === -1).length;

    return {
      rating_point,
      reviews,
      totalReviews,
      positiveReviews,
      negativeReviews
    };
  },

  async requestUpgradeToSeller(userId, userFullname, userEmail) {
    const existingRequest = await upgradeRequestModel.findPendingByUserId(userId);
    if (existingRequest) {
      return { success: false, error: 'You already have a pending upgrade request.' };
    }

    await upgradeRequestModel.create({
      bidder_id: userId,
      status: 'pending',
    });

    await sendMail({
      to: userEmail,
      subject: 'Upgrade Request Submitted',
      html: `
        <p>Dear ${userFullname},</p>
        <p>Your request to upgrade to seller has been submitted. We will review it shortly.</p>
      `
    });

    return { success: true };
  }
};
