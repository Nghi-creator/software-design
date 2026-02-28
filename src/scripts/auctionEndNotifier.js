import * as productModel from "../models/product.model.js";
import * as orderModel from "../models/order.model.js";
import { NotificationService } from "../services/notification.service.js";

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

export async function checkAndNotifyEndedAuctions() {
  try {
    const endedAuctions = await productModel.getNewlyEndedAuctions();

    if (endedAuctions.length === 0) return;

    console.log(`📧 Tìm thấy ${endedAuctions.length} đấu giá vừa kết thúc.`);

    for (const auction of endedAuctions) {
      try {
        const productUrl = `${BASE_URL}/products/detail?id=${auction.id}`;
        const addUrl = `${BASE_URL}/seller/add`;

        if (auction.highest_bidder_id) {
          console.log(`📦 Đang tạo đơn hàng cho sản phẩm #${auction.id}...`);
          await orderModel.createOrder({
            product_id: auction.id,
            seller_id: auction.seller_id,
            buyer_id: auction.highest_bidder_id,
            final_price: auction.current_price,
            status: "pending_payment",
          });

          await Promise.all([
            NotificationService.sendWinnerNotification(auction, productUrl),
            NotificationService.sendSellerSuccessNotification(
              auction,
              productUrl,
            ),
          ]);
        } else {
          await NotificationService.sendSellerFailureNotification(
            auction,
            addUrl,
          );
        }

        await productModel.markEndNotificationSent(auction.id);
      } catch (processError) {
        console.error(
          `❌ Lỗi khi xử lý kết quả cho sản phẩm #${auction.id}:`,
          processError,
        );
      }
    }
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra đấu giá kết thúc:", error);
  }
}

export function startAuctionEndNotifier(intervalSeconds = 30) {
  console.log(
    `🚀 Auction End Notifier đã khởi chạy (Kiểm tra mỗi ${intervalSeconds} giây)`,
  );
  checkAndNotifyEndedAuctions();
  setInterval(checkAndNotifyEndedAuctions, intervalSeconds * 1000);
}
