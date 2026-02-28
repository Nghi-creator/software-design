import * as productModel from '../models/product.model.js';
import * as userModel from '../models/user.model.js';
import * as reviewModel from '../models/review.model.js';
import * as biddingHistoryModel from '../models/biddingHistory.model.js';
import * as systemSettingModel from '../models/systemSetting.model.js';
import db from '../utils/db.js';
import { sendMail } from '../utils/mailer.js';
import { EmailTemplates } from './emailTemplate.service.js';

export const BiddingService = {
  async placeBid(productId, userId, bidAmount) {
    const result = await db.transaction(async (trx) => {
      const product = await trx('products')
        .where('id', productId)
        .forUpdate()
        .first();
      
      if (!product) {
        throw new Error('Product not found');
      }

      const previousHighestBidderId = product.highest_bidder_id;
      const previousPrice = parseFloat(product.current_price || product.starting_price);

      if (product.is_sold === true) {
        throw new Error('This product has already been sold');
      }

      if (product.seller_id === userId) {
        throw new Error('You cannot bid on your own product');
      }

      const isRejected = await trx('rejected_bidders')
        .where('product_id', productId)
        .where('bidder_id', userId)
        .first();
      
      if (isRejected) {
        throw new Error('You have been rejected from bidding on this product by the seller');
      }

      const ratingPoint = await reviewModel.calculateRatingPoint(userId);
      const userReviews = await reviewModel.getReviewsByUserId(userId);
      const hasReviews = userReviews.length > 0;
      
      if (!hasReviews) {
        if (!product.allow_unrated_bidder) {
          throw new Error('This seller does not allow unrated bidders to bid on this product.');
        }
      } else if (ratingPoint && ratingPoint.rating_point < 0) {
        throw new Error('You are not eligible to place bids due to your rating.');
      } else if (ratingPoint && ratingPoint.rating_point === 0) {
        throw new Error('You are not eligible to place bids due to your rating.');
      } else if (ratingPoint && ratingPoint.rating_point <= 0.8) {
        throw new Error('Your rating point is not greater than 80%. You cannot place bids.');
      }

      const now = new Date();
      const endDate = new Date(product.end_at);
      if (now > endDate) {
        throw new Error('Auction has ended');
      }

      const currentPrice = parseFloat(product.current_price || product.starting_price);
      
      if (bidAmount <= currentPrice) {
        throw new Error(`Bid must be higher than current price (${currentPrice.toLocaleString()} VND)`);
      }

      const minIncrement = parseFloat(product.step_price);
      if (bidAmount < currentPrice + minIncrement) {
        throw new Error(`Bid must be at least ${minIncrement.toLocaleString()} VND higher than current price`);
      }

      let extendedEndTime = null;
      if (product.auto_extend) {
        const settings = await systemSettingModel.getSettings();
        const triggerMinutes = settings?.auto_extend_trigger_minutes;
        const extendMinutes = settings?.auto_extend_duration_minutes;
        
        const endTime = new Date(product.end_at);
        const minutesRemaining = (endTime - now) / (1000 * 60);
        
        if (minutesRemaining <= triggerMinutes) {
          extendedEndTime = new Date(endTime.getTime() + extendMinutes * 60 * 1000);
          product.end_at = extendedEndTime;
        }
      }

      let newCurrentPrice;
      let newHighestBidderId;
      let newHighestMaxPrice;
      let shouldCreateHistory = true;

      const buyNowPrice = product.buy_now_price ? parseFloat(product.buy_now_price) : null;
      let buyNowTriggered = false;
      
      if (buyNowPrice && product.highest_bidder_id && product.highest_max_price && product.highest_bidder_id !== userId) {
        const currentHighestMaxPrice = parseFloat(product.highest_max_price);
        
        if (currentHighestMaxPrice >= buyNowPrice) {
          newCurrentPrice = buyNowPrice;
          newHighestBidderId = product.highest_bidder_id;
          newHighestMaxPrice = currentHighestMaxPrice;
          buyNowTriggered = true;
        }
      }

      if (!buyNowTriggered) {
        if (product.highest_bidder_id === userId) {
          newCurrentPrice = parseFloat(product.current_price || product.starting_price);
          newHighestBidderId = userId;
          newHighestMaxPrice = bidAmount;
          shouldCreateHistory = false;
        }
        else if (!product.highest_bidder_id || !product.highest_max_price) {
          newCurrentPrice = product.starting_price;
          newHighestBidderId = userId;
          newHighestMaxPrice = bidAmount;
        } 
        else {
          const currentHighestMaxPrice = parseFloat(product.highest_max_price);
          const currentHighestBidderId = product.highest_bidder_id;

          if (bidAmount < currentHighestMaxPrice) {
            newCurrentPrice = bidAmount;
            newHighestBidderId = currentHighestBidderId;
            newHighestMaxPrice = currentHighestMaxPrice;
          }
          else if (bidAmount === currentHighestMaxPrice) {
            newCurrentPrice = bidAmount;
            newHighestBidderId = currentHighestBidderId;
            newHighestMaxPrice = currentHighestMaxPrice;
          }
          else {
            newCurrentPrice = currentHighestMaxPrice + minIncrement;
            newHighestBidderId = userId;
            newHighestMaxPrice = bidAmount;
          }
        }

        if (buyNowPrice && newCurrentPrice >= buyNowPrice) {
          newCurrentPrice = buyNowPrice;
          buyNowTriggered = true;
        }
      }

      const productSold = buyNowTriggered;

      const updateData = {
        current_price: newCurrentPrice,
        highest_bidder_id: newHighestBidderId,
        highest_max_price: newHighestMaxPrice
      };

      if (productSold) {
        updateData.end_at = new Date();
        updateData.closed_at = new Date();
      }
      else if (extendedEndTime) {
        updateData.end_at = extendedEndTime;
      }

      await trx('products')
        .where('id', productId)
        .update(updateData);

      if (shouldCreateHistory) {
        await trx('bidding_history').insert({
          product_id: productId,
          bidder_id: newHighestBidderId,
          current_price: newCurrentPrice
        });
      }

      await trx.raw(`
        INSERT INTO auto_bidding (product_id, bidder_id, max_price)
        VALUES (?, ?, ?)
        ON CONFLICT (product_id, bidder_id)
        DO UPDATE SET 
          max_price = EXCLUDED.max_price,
          created_at = NOW()
      `, [productId, userId, bidAmount]);

      return { 
        newCurrentPrice, 
        newHighestBidderId, 
        userId, 
        bidAmount,
        productSold,
        autoExtended: !!extendedEndTime,
        newEndTime: extendedEndTime,
        productName: product.name,
        sellerId: product.seller_id,
        previousHighestBidderId,
        previousPrice,
        priceChanged: previousPrice !== newCurrentPrice
      };
    });

    return result;
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
        html: EmailTemplates.bidderConfirmation(
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
        html: EmailTemplates.priceUpdateNotification(
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
