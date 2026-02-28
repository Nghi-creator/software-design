import * as orderModel from "../models/order.model.js";
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
};
