import * as orderModel from "../models/order.model.js";
import * as invoiceModel from "../models/invoice.model.js";
import * as reviewModel from "../models/review.model.js";
import db from "../utils/db.js";

export const OrderService = {
  updateOrderStatus: async (orderId, newStatus, userId, note = null) => {
    const updateData = {
      status: newStatus,
      updated_at: db.fn.now(),
    };

    switch (newStatus) {
      case "payment_submitted":
        updateData.payment_submitted_at = db.fn.now();
        break;
      case "payment_confirmed":
        updateData.payment_confirmed_at = db.fn.now();
        break;
      case "shipped":
        updateData.shipped_at = db.fn.now();
        break;
      case "delivered":
        updateData.delivered_at = db.fn.now();
        break;
      case "completed":
        updateData.completed_at = db.fn.now();
        break;
      case "cancelled":
        updateData.cancelled_at = db.fn.now();
        updateData.cancelled_by = userId;
        if (note) updateData.cancellation_reason = note;
        break;
    }

    return await orderModel.updateOrderData(orderId, updateData, userId, note);
  },

  submitPayment: async (orderId, userId, data) => {
    const { payment_method, payment_proof_urls, note, shipping_address, shipping_phone } = data;

    const order = await orderModel.findById(orderId);
    if (!order || order.buyer_id !== userId) {
      throw new Error('Unauthorized');
    }

    await invoiceModel.createPaymentInvoice({
      order_id: orderId,
      issuer_id: userId,
      payment_method,
      payment_proof_urls,
      note
    });

    await orderModel.updateShippingInfo(orderId, {
      shipping_address,
      shipping_phone
    });

    await orderModel.updateStatus(orderId, 'payment_submitted', userId);
  },

  confirmPayment: async (orderId, userId) => {
    const order = await orderModel.findById(orderId);
    if (!order || order.seller_id !== userId) {
      throw new Error('Unauthorized');
    }

    const paymentInvoice = await invoiceModel.getPaymentInvoice(orderId);
    if (!paymentInvoice) {
      throw new Error('No payment invoice found');
    }

    await invoiceModel.verifyInvoice(paymentInvoice.id);
    await orderModel.updateStatus(orderId, 'payment_confirmed', userId);
  },

  submitShipping: async (orderId, userId, data) => {
    const { tracking_number, shipping_provider, shipping_proof_urls, note } = data;

    const order = await orderModel.findById(orderId);
    if (!order || order.seller_id !== userId) {
      throw new Error('Unauthorized');
    }

    await invoiceModel.createShippingInvoice({
      order_id: orderId,
      issuer_id: userId,
      tracking_number,
      shipping_provider,
      shipping_proof_urls,
      note
    });

    await orderModel.updateStatus(orderId, 'shipped', userId);
  },

  confirmDelivery: async (orderId, userId) => {
    const order = await orderModel.findById(orderId);
    if (!order || order.buyer_id !== userId) {
      throw new Error('Unauthorized');
    }

    await orderModel.updateStatus(orderId, 'delivered', userId);
  },

  submitRating: async (orderId, userId, rating, comment) => {
    const order = await orderModel.findById(orderId);
    if (!order || (order.buyer_id !== userId && order.seller_id !== userId)) {
      throw new Error('Unauthorized');
    }

    const isBuyer = order.buyer_id === userId;
    const reviewerId = userId;
    const revieweeId = isBuyer ? order.seller_id : order.buyer_id;
    const ratingValue = rating === 'positive' ? 1 : -1;

    const existingReview = await reviewModel.findByReviewerAndProduct(reviewerId, order.product_id);
    if (existingReview) {
      await reviewModel.updateByReviewerAndProduct(reviewerId, order.product_id, {
        rating: ratingValue,
        comment: comment || null
      });
    } else {
      await reviewModel.create({
        reviewer_id: reviewerId,
        reviewed_user_id: revieweeId,
        product_id: order.product_id,
        rating: ratingValue,
        comment: comment || null
      });
    }

    const buyerReview = await reviewModel.getProductReview(order.buyer_id, order.seller_id, order.product_id);
    const sellerReview = await reviewModel.getProductReview(order.seller_id, order.buyer_id, order.product_id);

    if (buyerReview && sellerReview) {
      await orderModel.updateStatus(orderId, 'completed', userId);
      await db('products').where('id', order.product_id).update({
        is_sold: true,
        closed_at: new Date()
      });
    }
  },

  skipRatingAndComplete: async (orderId, userId) => {
    const order = await orderModel.findById(orderId);
    if (!order || (order.buyer_id !== userId && order.seller_id !== userId)) {
      throw new Error('Unauthorized');
    }

    const isBuyer = order.buyer_id === userId;
    const reviewerId = userId;
    const revieweeId = isBuyer ? order.seller_id : order.buyer_id;

    const existingReview = await reviewModel.findByReviewerAndProduct(reviewerId, order.product_id);
    if (!existingReview) {
      await reviewModel.create({
        reviewer_id: reviewerId,
        reviewed_user_id: revieweeId,
        product_id: order.product_id,
        rating: 0,
        comment: null
      });
    }

    const buyerReview = await reviewModel.getProductReview(order.buyer_id, order.seller_id, order.product_id);
    const sellerReview = await reviewModel.getProductReview(order.seller_id, order.buyer_id, order.product_id);

    if (buyerReview && sellerReview) {
      await orderModel.updateStatus(orderId, 'completed', userId);
      await db('products').where('id', order.product_id).update({
        is_sold: true,
        closed_at: new Date()
      });
    }
  },
};
