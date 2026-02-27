import * as productModel from "../models/product.model.js";
import * as orderModel from "../models/order.model.js";
import { sendMail } from "../utils/mailer.js";
import { AuctionEmailTemplates } from "../services/emailTemplate.service.js";

const BASE_URL = process.env.BASE_URL || "http://localhost:3005";

export async function checkAndNotifyEndedAuctions() {
  try {
    const endedAuctions = await productModel.getNewlyEndedAuctions();

    if (endedAuctions.length === 0) return;

    console.log(`📧 Found ${endedAuctions.length} ended auctions to process`);

    for (const auction of endedAuctions) {
      try {
        const productUrl = `${BASE_URL}/products/detail?id=${auction.id}`;

        // IF THERE IS A WINNER
        if (auction.highest_bidder_id) {
          // 1. CREATE THE ORDER (Replacing the old SQL Trigger)
          console.log(`📦 Creating order for product #${auction.id}...`);
          await orderModel.createOrder({
            product_id: auction.id,
            seller_id: auction.seller_id,
            buyer_id: auction.highest_bidder_id,
            final_price: auction.current_price,
            status: "pending_payment",
          });

          // 2. SEND WINNER EMAIL
          if (auction.winner_email) {
            await sendMail({
              to: auction.winner_email,
              subject: `🎉 Congratulations! You won the auction: ${auction.name}`,
              html: AuctionEmailTemplates.winner(
                auction.winner_name,
                auction.name,
                auction.current_price,
                productUrl,
              ),
            });
          }

          // 3. SEND SELLER EMAIL (Winner Found)
          if (auction.seller_email) {
            await sendMail({
              to: auction.seller_email,
              subject: `🔔 Auction Ended: ${auction.name} - Winner Found!`,
              html: AuctionEmailTemplates.sellerWinnerFound(
                auction.seller_name,
                auction.name,
                auction.winner_name,
                auction.current_price,
                productUrl,
              ),
            });
          }
        } else {
          // IF NO WINNER
          if (auction.seller_email) {
            const addUrl = `${BASE_URL}/seller/add`;
            await sendMail({
              to: auction.seller_email,
              subject: `⏰ Auction Ended: ${auction.name} - No Bidders`,
              html: AuctionEmailTemplates.sellerNoBidders(
                auction.seller_name,
                auction.name,
                addUrl,
              ),
            });
          }
        }

        // Mark as processed in DB
        await productModel.markEndNotificationSent(auction.id);
      } catch (processError) {
        console.error(
          `❌ Failed to process/notify for product #${auction.id}:`,
          processError,
        );
      }
    }
  } catch (error) {
    console.error("❌ Error checking ended auctions:", error);
  }
}

export function startAuctionEndNotifier(intervalSeconds = 30) {
  console.log(
    `🚀 Auction End Notifier started (checking every ${intervalSeconds} second(s))`,
  );
  checkAndNotifyEndedAuctions();
  setInterval(checkAndNotifyEndedAuctions, intervalSeconds * 1000);
}
