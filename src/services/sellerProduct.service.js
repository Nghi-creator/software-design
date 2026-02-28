import * as productModel from '../models/product.model.js';
import * as productDescUpdateModel from '../models/productDescriptionUpdate.model.js';
import * as biddingHistoryModel from '../models/biddingHistory.model.js';
import * as productCommentModel from '../models/productComment.model.js';
import { FileService } from './file.service.js';
import { sendMail } from '../utils/mailer.js';
import { EmailTemplates } from './emailTemplate.service.js';

export const SellerProductService = {
  async createProduct(productData, product, imgs) {
    const returnedID = await productModel.addProduct(productData);
    const productId = returnedID[0].id;

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

  async deleteProduct(productId, sellerId) {
    const result = await productModel.cancelProduct(productId, sellerId);
    return result;
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
