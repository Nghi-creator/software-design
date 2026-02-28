import * as rejectedBidderModel from '../models/rejectedBidder.model.js';
import * as productModel from '../models/product.model.js';
import * as userModel from '../models/user.model.js';
import { sendMail } from '../utils/mailer.js';
import { EmailTemplates } from './emailTemplate.service.js';

export const RejectedBidderService = {
  async rejectBidder(productId, bidderId, sellerId) {
    const product = await productModel.findByProductId2(productId, null);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (product.seller_id !== sellerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (product.highest_bidder_id === bidderId) {
      return { success: false, error: 'Cannot reject the current highest bidder' };
    }

    await rejectedBidderModel.add({
      product_id: productId,
      bidder_id: bidderId,
      seller_id: sellerId
    });

    const [bidder, seller] = await Promise.all([
      userModel.findById(bidderId),
      userModel.findById(sellerId)
    ]);

    if (bidder && bidder.email) {
      const productUrl = `${process.env.APP_BASE_URL || 'http://localhost:3005'}/products/detail?id=${productId}`;
      
      sendMail({
        to: bidder.email,
        subject: `Your bid has been rejected: ${product.name}`,
        html: EmailTemplates.rejectedBidderNotification(
          bidder.fullname,
          product.name,
          seller.fullname,
          productUrl
        )
      }).then(() => {
        console.log(`Rejection email sent to ${bidder.email} for product #${productId}`);
      }).catch((emailError) => {
        console.error('Failed to send rejection email:', emailError);
      });
    }

    return { success: true };
  },

  async unrejectBidder(productId, bidderId, sellerId) {
    const product = await productModel.findByProductId2(productId, null);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (product.seller_id !== sellerId) {
      return { success: false, error: 'Unauthorized' };
    }

    await rejectedBidderModel.remove(productId, bidderId);
    return { success: true };
  },

  async getRejectedBidders(productId) {
    return rejectedBidderModel.findByProductId(productId);
  },

  async isBidderRejected(productId, bidderId) {
    const rejected = await rejectedBidderModel.findByProductAndBidder(productId, bidderId);
    return !!rejected;
  }
};
