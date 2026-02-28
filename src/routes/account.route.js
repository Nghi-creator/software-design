import express from 'express';
import passport from '../utils/passport.js';
import * as userModel from '../models/user.model.js';
import * as upgradeRequestModel from '../models/upgradeRequest.model.js';
import * as watchlistModel from '../models/watchlist.model.js';
import * as reviewModel from '../models/review.model.js';
import * as autoBiddingModel from '../models/autoBidding.model.js';
import { isAuthenticated } from '../middlewares/auth.mdw.js';
import { AuthService } from '../services/auth.service.js';

const router = express.Router();

router.get('/ratings', isAuthenticated, async (req, res) => {
  const currentUserId = req.session.authUser.id;

  const { rating_point, reviews, totalReviews, positiveReviews, negativeReviews } =
    await AuthService.getUserRating(currentUserId);

  res.render('vwAccount/rating', {
    activeSection: 'ratings',
    rating_point,
    reviews,
    totalReviews,
    positiveReviews,
    negativeReviews
  });
});
// GET /signup
router.get('/signup', function (req, res) {
  // CẬP NHẬT: Truyền Site Key xuống view để hiển thị widget
  res.render('vwAccount/auth/signup', {
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
  });
});


// GET /signin
router.get('/signin', function (req, res) {
  const success_message = req.session.success_message;
  delete req.session.success_message;
  res.render('vwAccount/auth/signin', { success_message });
});

// GET /verify-email?email=...
router.get('/verify-email', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.redirect('/account/signin');
  }

  return res.render('vwAccount/auth/verify-otp', {
    email,
    info_message:
      'We have sent an OTP to your email. Please enter it below to verify your account.',
  });
});

router.get('/forgot-password', (req, res) => {
  res.render('vwAccount/auth/forgot-password');
});
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.requestPasswordReset(email);

  if (!result.success) {
    return res.render('vwAccount/auth/forgot-password', {
      error_message: result.error,
    });
  }

  return res.render('vwAccount/auth/verify-forgot-password-otp', {
    email,
  });
});
router.post('/verify-forgot-password-otp', async (req, res) => {
  const { email, otp } = req.body;
  const result = await AuthService.verifyOtp(email, otp, 'reset_password');

  if (!result.success) {
    return res.render('vwAccount/auth/verify-forgot-password-otp', {
      email,
      error_message: result.error,
    });
  }

  return res.render('vwAccount/auth/reset-password', { email });
});
router.post('/resend-forgot-password-otp', async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.resendOtp(email, 'reset_password');

  if (!result.success) {
    return res.render('vwAccount/auth/verify-forgot-password-otp', {
      email,
      error_message: result.error,
    });
  }

  return res.render('vwAccount/auth/verify-forgot-password-otp', {
    email,
    info_message: 'We have sent a new OTP to your email. Please check your inbox.',
  });
});
router.post('/reset-password', async (req, res) => {
  const { email, new_password, confirm_new_password } = req.body;

  if (new_password !== confirm_new_password) {
    return res.render('vwAccount/auth/reset-password', {
      email,
      error_message: 'Passwords do not match.',
    });
  }

  const result = await AuthService.resetPassword(email, new_password);

  if (!result.success) {
    return res.render('vwAccount/auth/reset-password', {
      email,
      error_message: result.error,
    });
  }

  return res.render('vwAccount/auth/signin', {
    success_message: 'Your password has been reset. You can sign in now.',
  });
});
// POST /signin
router.post('/signin', async function (req, res) {
  const { email, password } = req.body;

  const result = await AuthService.authenticateUser(email, password);

  if (!result.success) {
    return res.render('vwAccount/auth/signin', {
      error_message: result.error,
      old: { email },
    });
  }

  if (!result.verified) {
    return res.redirect(
      `/account/verify-email?email=${encodeURIComponent(email)}`
    );
  }

  req.session.isAuthenticated = true;
  req.session.authUser = result.user;
  const returnUrl = req.session.returnUrl || '/';
  delete req.session.returnUrl;
  return res.redirect(returnUrl);
});

// POST /signup
router.post('/signup', async function (req, res) {
  const { fullname, email, address, password, confirmPassword } = req.body;
  const recaptchaResponse = req.body['g-recaptcha-response'];

  const userData = { fullname, email, address, password, confirmPassword };
  const validation = await AuthService.validateSignupInput(userData, recaptchaResponse);

  if (Object.keys(validation.errors).length > 0) {
    return res.render('vwAccount/auth/signup', {
      errors: validation.errors,
      old: validation.old,
      recaptchaSiteKey: validation.recaptchaSiteKey,
      error_message: 'Please correct the errors below.',
    });
  }

  const result = await AuthService.registerUser(userData);

  if (result.success) {
    return res.redirect(`/account/verify-email?email=${encodeURIComponent(result.email)}`);
  }
});

// POST /verify-email
router.post('/verify-email', async (req, res) => {
  const { email, otp } = req.body;

  const result = await AuthService.verifyOtp(email, otp, 'verify_email');

  if (!result.success) {
    return res.render('vwAccount/auth/verify-otp', {
      email,
      error_message: result.error,
    });
  }

  req.session.success_message = 'Your email has been verified. You can sign in now.';
  return res.redirect('/account/signin');
});

// POST /resend-otp
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  const result = await AuthService.resendOtp(email, 'verify_email');

  if (!result.success) {
    return res.render('vwAccount/auth/verify-otp', {
      email,
      error_message: result.error,
    });
  }

  return res.render('vwAccount/auth/verify-otp', {
    email,
    info_message: 'We have sent a new OTP to your email.',
  });
});

// GET /profile - HIỂN THỊ PROFILE & THÔNG BÁO
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.session.authUser.id;
    const user = await userModel.findById(currentUserId);

    // 1. Kiểm tra query string "success=true" trên URL
    let success_message = null;
    if (req.query.success === 'true') {
      success_message = 'Profile updated successfully.';
    }
    if (req.query['send-request-upgrade'] === 'true') {
      success_message = 'Your upgrade request has been sent successfully.';
    }
    // 2. Render và truyền biến success_message xuống view
    res.render('vwAccount/profile', {
      user: user,
      success_message: success_message // Nếu null thì HBS sẽ không hiện
    });

  } catch (err) {
    console.error(err);
    res.render('vwAccount/profile', {
      user: req.session.authUser,
      err_message: 'Unable to load profile information.'
    });
  }
});

// PUT /profile - XỬ LÝ UPDATE
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.session.authUser.id;
    const result = await AuthService.updateProfile(currentUserId, req.body);

    if (!result.success) {
      return res.render('vwAccount/profile', {
        user: result.user || req.session.authUser,
        err_message: result.error
      });
    }

    if (result.updatedUser) {
      req.session.authUser = result.updatedUser;
    }

    return res.redirect('/account/profile?success=true');
  }
  catch (err) {
    console.error(err);
    return res.render('vwAccount/profile', {
      user: req.session.authUser,
      err_message: 'System error. Please try again later.'
    });
  }
});
router.post('/logout', isAuthenticated, (req, res) => {
  req.session.isAuthenticated = false;
  delete req.session.authUser;
  res.redirect('/');
});
router.get('/request-upgrade', isAuthenticated, async (req, res) => {
  const currentUserId = req.session.authUser.id;
  const upgradeRequest = await upgradeRequestModel.findByUserId(currentUserId);
  res.render('vwAccount/request-upgrade', { upgrade_request: upgradeRequest });
});
router.post('/request-upgrade', isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.session.authUser.id;
    await userModel.markUpgradePending(currentUserId);
    await upgradeRequestModel.createUpgradeRequest(currentUserId);
    return res.redirect('/account/profile?send-request-upgrade=true');
  } catch (err) {
    console.error(err);
    res.render('vwAccount/profile', {
      user: req.session.authUser,
      err_message: 'Unable to submit your request at this time. Please try again later.'
    });

  }
});
router.get('/watchlist', isAuthenticated, async (req, res) => {
  const limit = 3;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;
  // Implementation for watchlist route
  const currentUserId = req.session.authUser.id;
  const watchlistProducts = await watchlistModel.searchPageByUserId(currentUserId, limit, offset);
  const total = await watchlistModel.countByUserId(currentUserId);
  const totalCount = Number(total.count);
  const nPages = Math.ceil(totalCount / limit);
  let from = (page - 1) * limit + 1;
  let to = page * limit;
  if (to > totalCount) to = totalCount;
  if (totalCount === 0) { from = 0; to = 0; }
  res.render('vwAccount/watchlist', {
    products: watchlistProducts,
    totalCount,
    from,
    to,
    currentPage: page,
    totalPages: nPages,
  });
});

// Bidding Products - Sản phẩm đang tham gia đấu giá
router.get('/bidding', isAuthenticated, async (req, res) => {
  const currentUserId = req.session.authUser.id;
  const biddingProducts = await autoBiddingModel.getBiddingProductsByBidderId(currentUserId);

  res.render('vwAccount/bidding-products', {
    activeSection: 'bidding',
    products: biddingProducts
  });
});

// Won Auctions - Sản phẩm đã thắng (pending, sold, cancelled)
router.get('/auctions', isAuthenticated, async (req, res) => {
  const currentUserId = req.session.authUser.id;
  const wonAuctions = await autoBiddingModel.getWonAuctionsByBidderId(currentUserId);

  // Check if user has rated seller for each product
  for (let product of wonAuctions) {
    const review = await reviewModel.findByReviewerAndProduct(currentUserId, product.id);
    // Only show rating if it's not 0 (actual rating, not skip)
    if (review && review.rating !== 0) {
      product.has_rated_seller = true;
      product.seller_rating = review.rating === 1 ? 'positive' : 'negative';
      product.seller_rating_comment = review.comment;
    } else {
      product.has_rated_seller = false;
    }
  }

  res.render('vwAccount/won-auctions', {
    activeSection: 'auctions',
    products: wonAuctions
  });
});

// Rate Seller - POST
router.post('/won-auctions/:productId/rate-seller', isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.session.authUser.id;
    const productId = req.params.productId;
    const { seller_id, rating, comment } = req.body;

    // Validate rating
    const ratingValue = rating === 'positive' ? 1 : -1;

    // Check if already rated
    const existingReview = await reviewModel.findByReviewerAndProduct(currentUserId, productId);
    if (existingReview) {
      // Update existing review instead of creating new
      await reviewModel.updateByReviewerAndProduct(currentUserId, productId, {
        rating: ratingValue,
        comment: comment || null
      });
    } else {
      // Create new review
      await reviewModel.create({
        reviewer_id: currentUserId,
        reviewed_user_id: seller_id,
        product_id: productId,
        rating: ratingValue,
        comment: comment || null
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error rating seller:', error);
    res.json({ success: false, message: 'Failed to submit rating.' });
  }
});

// Rate Seller - PUT (Edit)
router.put('/won-auctions/:productId/rate-seller', isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.session.authUser.id;
    const productId = req.params.productId;
    const { rating, comment } = req.body;

    const ratingValue = rating === 'positive' ? 1 : -1;

    // Update review
    await reviewModel.updateByReviewerAndProduct(currentUserId, productId, {
      rating: ratingValue,
      comment: comment || null
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating rating:', error);
    res.json({ success: false, message: 'Failed to update rating.' });
  }
});

router.get('/seller/products', isAuthenticated, async (req, res) => {
  res.render('vwAccount/my-products');
});

router.get('/seller/sold-products', isAuthenticated, async (req, res) => {
  res.render('vwAccount/sold-products');
});

// ===================== OAUTH ROUTES =====================

// Google OAuth
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/account/signin' }),
  (req, res) => {
    // Lưu user vào session
    req.session.authUser = req.user;
    req.session.isAuthenticated = true;
    res.redirect('/');
  }
);

// Facebook OAuth
// NOTE: 'email' scope chỉ hoạt động với Admin/Developer/Tester trong Development Mode
// Tạm thời chỉ dùng 'public_profile' để test, sau đó thêm 'email' khi đã add tester
router.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['public_profile'] })
);

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/account/signin' }),
  (req, res) => {
    req.session.authUser = req.user;
    req.session.isAuthenticated = true;
    res.redirect('/');
  }
);

// GitHub OAuth
router.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/account/signin' }),
  (req, res) => {
    req.session.authUser = req.user;
    req.session.isAuthenticated = true;
    res.redirect('/');
  }
);

export default router;
