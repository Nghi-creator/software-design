import fs from "fs";
import path from "path";
import * as orderModel from "../models/order.model.js";
import db from "../utils/db.js";

export const FileService = {
  moveAndRenameProductImages: (productId, thumbnailName, subImagesArray) => {
    const dirPath = path
      .join("public", "images", "products")
      .replace(/\\/g, "/");

    const mainPath = path
      .join(dirPath, `p${productId}_thumb.jpg`)
      .replace(/\\/g, "/");
    const oldMainPath = path
      .join("public", "uploads", path.basename(thumbnailName))
      .replace(/\\/g, "/");
    const savedMainPath =
      "/" +
      path
        .join("images", "products", `p${productId}_thumb.jpg`)
        .replace(/\\/g, "/");

    if (fs.existsSync(oldMainPath)) fs.renameSync(oldMainPath, mainPath);

    let newImgPaths = [];
    let i = 1;
    for (const imgPath of subImagesArray) {
      const oldPath = path
        .join("public", "uploads", path.basename(imgPath))
        .replace(/\\/g, "/");
      const newPath = path
        .join(dirPath, `p${productId}_${i}.jpg`)
        .replace(/\\/g, "/");
      const savedPath =
        "/" +
        path
          .join("images", "products", `p${productId}_${i}.jpg`)
          .replace(/\\/g, "/");

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        newImgPaths.push({ product_id: productId, img_link: savedPath });
        i++;
      }
    }
    return { savedMainPath, newImgPaths };
  },
};

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
