import * as productModel from '../models/product.model.js';
import * as userModel from '../models/user.model.js';
import * as reviewModel from '../models/review.model.js';
import * as biddingHistoryModel from '../models/biddingHistory.model.js';
import * as systemSettingModel from '../models/systemSetting.model.js';
import db from '../utils/db.js';
import { sendMail } from '../utils/mailer.js';
import { EmailTemplates } from './emailTemplate.service.js';

export const BiddingService = {
  async validateBid(productId, userId) {
    const product = await db('products').where('id', productId).first();
    if (!product) {
      return { valid: false, error: 'Product not found' };
    }

    if (product.is_sold === true) {
      return { valid: false, error: 'This product has already been sold' };
    }

    if (product.seller_id === userId) {
      return { valid: false, error: 'You cannot bid on your own product' };
    }

    const isRejected = await db('rejected_bidders')
      .where('product_id', productId)
      .where('bidder_id', userId)
      .first();
    
    if (isRejected) {
      return { valid: false, error: 'You have been rejected from bidding on this product by the seller' };
    }

    const ratingPoint = await reviewModel.calculateRatingPoint(userId);
    const userReviews = await reviewModel.getReviewsByUserId(userId);
    const hasReviews = userReviews.length > 0;
    
    if (!hasReviews) {
      if (!product.allow_unrated_bidder) {
        return { valid: false, error: 'This seller does not allow unrated bidders to bid on this product.' };
      }
    } else if (ratingPoint && ratingPoint.rating_point < 0) {
      return { valid: false, error: 'You are not eligible to place bids due to your rating.' };
    } else if (ratingPoint && ratingPoint.rating_point === 0) {
      return { valid: false, error: 'You are not eligible to place bids due to your rating.' };
    } else if (ratingPoint && ratingPoint.rating_point <= 0.8) {
      return { valid: false, error: 'Your rating point is not greater than 80%. You cannot place bids.' };
    }

    const now = new Date();
    const endDate = new Date(product.end_at);
    if (now > endDate) {
      return { valid: false, error: 'Auction has ended' };
    }

    return { valid: true, product };
  },

  async validateBidAmount(product, bidAmount) {
    const currentPrice = parseFloat(product.current_price || product.starting_price);
    const minIncrement = parseFloat(product.step_price);
    
    if (bidAmount <= currentPrice) {
      return { valid: false, error: `Bid must be higher than current price (${currentPrice.toLocaleString()} VND)` };
    }

    if (bidAmount < currentPrice + minIncrement) {
      return { valid: false, error: `Bid must be at least ${minIncrement.toLocaleString()} VND higher than current price` };
    }

    return { valid: true };
  },

  async checkAutoExtend(product) {
    if (!product.auto_extend) {
      return { extended: false };
    }

    const settings = await systemSettingModel.getSettings();
    const triggerMinutes = settings?.auto_extend_trigger_minutes;
    const extendMinutes = settings?.auto_extend_duration_minutes;
    
    const now = new Date();
    const endTime = new Date(product.end_at);
    const minutesRemaining = (endTime - now) / (1000 * 60);
    
    if (minutesRemaining <= triggerMinutes) {
      const extendedEndTime = new Date(endTime.getTime() + extendMinutes * 60 * 1000);
      return { extended: true, extendedEndTime };
    }

    return { extended: false };
  },

  async sendBidNotifications(result, productUrl) {
    const [seller, currentBidder, previousBidder] = await Promise.all([
      userModel.findById(result.sellerId),
      userModel.findById(result.userId),
      result.previousHighestBidderId && result.previousHighestBidderId !== result.userId 
        ? userModel.findById(result.previousHighestBidderId) 
        : null
    ]);

    const emailPromises = [];

    if (seller && seller.email) {
      emailPromises.push(sendMail({
        to: seller.email,
        subject: `💰 New bid on your product: ${result.productName}`,
        html: EmailTemplates.newBidNotification(
          seller.fullname,
          result.productName,
          currentBidder ? currentBidder.fullname : 'Anonymous',
          result.newCurrentPrice,
          result.previousPrice,
          productUrl,
          result.productSold
        )
      }));
    }

    if (currentBidder && currentBidder.email) {
      const isWinning = result.newHighestBidderId === result.userId;
      emailPromises.push(sendMail({
        to: currentBidder.email,
        subject: isWinning 
          ? `✅ You're winning: ${result.productName}` 
          : `📊 Bid placed: ${result.productName}`,
        html: EmailTemplates.newBidNotification(
          currentBidder.fullname,
          result.productName,
          result.bidAmount,
          result.newCurrentPrice,
          isWinning,
          productUrl
        )
      }));
    }

    if (previousBidder && previousBidder.email && result.priceChanged) {
      const wasOutbid = result.newHighestBidderId !== result.previousHighestBidderId;
      emailPromises.push(sendMail({
        to: previousBidder.email,
        subject: wasOutbid 
          ? `⚠️ You've been outbid: ${result.productName}`
          : `📊 Price updated: ${result.productName}`,
        html: EmailTemplates.newBidNotification(
          previousBidder.fullname,
          result.productName,
          result.newCurrentPrice,
          result.previousPrice,
          wasOutbid,
          productUrl
        )
      }));
    }

    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
    }
  },

  async getProductBiddingInfo(productId) {
    const product = await productModel.findByProductId(productId);
    const biddingHistory = await biddingHistoryModel.getBiddingHistory(productId);
    return { product, biddingHistory };
  }
};
