import * as productModel from '../models/product.model.js';
import * as productDescUpdateModel from '../models/productDescriptionUpdate.model.js';
import * as biddingHistoryModel from '../models/biddingHistory.model.js';
import * as productCommentModel from '../models/productComment.model.js';
import { FileService } from './file.service.js';
import { sendMail } from '../utils/mailer.js';
import { EmailTemplates } from './emailTemplate.service.js';

export const SellerProductService = {
  async createProductFromRequest(product, sellerId) {
    const createdAtUTC = new Date(product.created_at);
    const endAtUTC = new Date(product.end_date);

    const productData = {
      seller_id: sellerId,
      category_id: product.category_id,
      name: product.name,
      starting_price: product.start_price.replace(/,/g, ''),
      step_price: product.step_price.replace(/,/g, ''),
      buy_now_price: product.buy_now_price !== '' ? product.buy_now_price.replace(/,/g, '') : null,
      created_at: createdAtUTC,
      end_at: endAtUTC,
      auto_extend: product.auto_extend === '1' ? true : false,
      thumbnail: null,
      description: product.description,
      highest_bidder_id: null,
      current_price: product.start_price.replace(/,/g, ''),
      is_sold: null,
      allow_unrated_bidder: product.allow_new_bidders === '1' ? true : false,
      closed_at: null
    };

    const returnedID = await productModel.addProduct(productData);
    const productId = returnedID[0].id;

    const imgs = JSON.parse(product.imgs_list);
    const { savedMainPath, newImgPaths } = FileService.moveAndRenameProductImages(
      productId,
      product.thumbnail,
      imgs
    );

    await productModel.updateProductThumbnail(productId, savedMainPath);
    await productModel.addProductImages(newImgPaths);

    return productId;
  },

  async updateProduct(productId, productData) {
    await productModel.updateProduct(productId, productData);
    return { success: true };
  },

  async cancelAuction(productId, sellerId, reason, highest_bidder_id) {
    await productModel.cancelProduct(productId, sellerId);

    if (highest_bidder_id) {
      const reviewModule = await import('../models/review.model.js');
      const reviewData = {
        reviewer_id: sellerId,
        reviewee_id: highest_bidder_id,
        product_id: productId,
        rating: -1,
        comment: reason || 'Auction cancelled by seller'
      };
      await reviewModule.createReview(reviewData);
    }
    return { success: true };
  },

  async rateBidder(productId, sellerId, rating, comment, highest_bidder_id) {
    const ratingValue = rating === 'positive' ? 1 : -1;
    const reviewModule = await import('../models/review.model.js');

    const existingReview = await reviewModule.findByReviewerAndProduct(sellerId, productId);

    if (existingReview) {
      await reviewModule.updateByReviewerAndProduct(sellerId, productId, {
        rating: ratingValue,
        comment: comment || null
      });
    } else {
      await reviewModule.createReview({
        reviewer_id: sellerId,
        reviewee_id: highest_bidder_id,
        product_id: productId,
        rating: ratingValue,
        comment: comment || ''
      });
    }
  },

  async updateBidderRating(productId, sellerId, rating, comment, highest_bidder_id) {
    const ratingValue = rating === 'positive' ? 1 : -1;
    const reviewModule = await import('../models/review.model.js');

    await reviewModule.updateReview(sellerId, highest_bidder_id, productId, {
      rating: ratingValue,
      comment: comment || ''
    });
  },

  async appendDescription(productId, sellerId, description) {
    await productDescUpdateModel.create({
      product_id: productId,
      content: description
    });

    const product = await productModel.findByProductId2(productId, null);
    const productUrl = `${process.env.APP_BASE_URL || 'http://localhost:3005'}/products/detail?id=${productId}`;

    const [bidders, commenters] = await Promise.all([
      biddingHistoryModel.getUniqueBidders(productId),
      productCommentModel.getUniqueCommenters(productId)
    ]);

    const notifyUsers = [];
    const userIds = new Set();

    bidders.forEach(b => {
      if (b.id !== sellerId && !userIds.has(b.id)) {
        userIds.add(b.id);
        notifyUsers.push(b);
      }
    });

    commenters.forEach(c => {
      if (c.id !== sellerId && !userIds.has(c.id)) {
        userIds.add(c.id);
        notifyUsers.push(c);
      }
    });

    Promise.all(notifyUsers.map(user => {
      return sendMail({
        to: user.email,
        subject: `[Auction Update] New description added for "${product.name}"`,
        html: EmailTemplates.productDescriptionUpdated(
          user.fullname,
          product.name,
          product.current_price,
          productUrl,
          description.trim()
        )
      }).catch(err => console.error('Failed to send email to', user.email, err));
    })).catch(err => console.error('Email notification error:', err));

    return { success: true };
  },

  async getSellerStats(sellerId) {
    return productModel.getSellerStats(sellerId);
  },

  async getAllProducts(sellerId) {
    return productModel.findAllProductsBySellerId(sellerId);
  },

  async getActiveProducts(sellerId) {
    return productModel.findActiveProductsBySellerId(sellerId);
  },

  async getPendingProducts(sellerId) {
    return productModel.findPendingProductsBySellerId(sellerId);
  },

  async getSoldProducts(sellerId) {
    return productModel.findSoldProductsBySellerId(sellerId);
  },

  async getExpiredProducts(sellerId) {
    return productModel.findExpiredProductsBySellerId(sellerId);
  }
};
