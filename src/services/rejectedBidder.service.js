import * as rejectedBidderModel from '../models/rejectedBidder.model.js';
import * as productModel from '../models/product.model.js';
import * as userModel from '../models/user.model.js';
import db from '../utils/db.js';
import { sendMail } from '../utils/mailer.js';
import { EmailTemplates } from './emailTemplate.service.js';

export const RejectedBidderService = {
  async rejectBidder(productId, bidderId, sellerId) {
    let rejectedBidderInfo = null;
    let productInfo = null;

    await db.transaction(async (trx) => {
      const product = await trx('products')
        .where('id', productId)
        .forUpdate()
        .first();

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.seller_id !== sellerId) {
        throw new Error('Only the seller can reject bidders');
      }

      const now = new Date();
      const endDate = new Date(product.end_at);
      
      if (product.is_sold !== null || endDate <= now || product.closed_at) {
        throw new Error('Can only reject bidders for active auctions');
      }

      const autoBid = await trx('auto_bidding')
        .where('product_id', productId)
        .where('bidder_id', bidderId)
        .first();

      if (!autoBid) {
        throw new Error('This bidder has not placed a bid on this product');
      }

      rejectedBidderInfo = await trx('users')
        .where('id', bidderId)
        .first();
      
      productInfo = product;
      const sellerInfo = await trx('users')
        .where('id', sellerId)
        .first();

      await trx('rejected_bidders').insert({
        product_id: productId,
        bidder_id: bidderId,
        seller_id: sellerId
      }).onConflict(['product_id', 'bidder_id']).ignore();

      await trx('bidding_history')
        .where('product_id', productId)
        .where('bidder_id', bidderId)
        .del();

      await trx('auto_bidding')
        .where('product_id', productId)
        .where('bidder_id', bidderId)
        .del();

      const allAutoBids = await trx('auto_bidding')
        .where('product_id', productId)
        .orderBy('max_price', 'desc');

      const bidderIdNum = parseInt(bidderId);
      const highestBidderIdNum = parseInt(product.highest_bidder_id);
      const wasHighestBidder = (highestBidderIdNum === bidderIdNum);

      if (allAutoBids.length === 0) {
        await trx('products')
          .where('id', productId)
          .update({
            highest_bidder_id: null,
            current_price: product.starting_price,
            highest_max_price: null
          });
      } else if (allAutoBids.length === 1) {
        const winner = allAutoBids[0];
        const newPrice = product.starting_price;

        await trx('products')
          .where('id', productId)
          .update({
            highest_bidder_id: winner.bidder_id,
            current_price: newPrice,
            highest_max_price: winner.max_price
          });

        if (wasHighestBidder || product.current_price !== newPrice) {
          await trx('bidding_history').insert({
            product_id: productId,
            bidder_id: winner.bidder_id,
            current_price: newPrice
          });
        }
      } else {
        const winner = allAutoBids[0];
        const secondHighest = allAutoBids[1];
        const stepPrice = parseFloat(product.step_price);
        let newPrice = parseFloat(winner.max_price);

        if (parseFloat(secondHighest.max_price) + stepPrice < newPrice) {
          newPrice = parseFloat(secondHighest.max_price) + stepPrice;
        }
        if (newPrice > parseFloat(winner.max_price)) {
          newPrice = parseFloat(winner.max_price);
        }

        await trx('products')
          .where('id', productId)
          .update({
            highest_bidder_id: winner.bidder_id,
            current_price: newPrice,
            highest_max_price: winner.max_price
          });

        if (wasHighestBidder || product.current_price !== newPrice) {
          await trx('bidding_history').insert({
            product_id: productId,
            bidder_id: winner.bidder_id,
            current_price: newPrice
          });
        }
      }
    });

    if (rejectedBidderInfo && rejectedBidderInfo.email && productInfo) {
      const productUrl = `${process.env.APP_BASE_URL || 'http://localhost:3005'}/products/detail?id=${productId}`;
      
      sendMail({
        to: rejectedBidderInfo.email,
        subject: `Your bid has been rejected: ${productInfo.name}`,
        html: EmailTemplates.rejectedBidderNotification(
          rejectedBidderInfo.fullname,
          productInfo.name,
          'Seller',
          productUrl
        )
      }).catch(err => console.error('Failed to send rejection email:', err));
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
