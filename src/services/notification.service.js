import { sendMail } from "../utils/mailer.js";
import { AuctionEmailTemplates } from "./emailTemplate.service.js";

export const NotificationService = {
  async sendWinnerNotification(auction, productUrl) {
    if (!auction.winner_email) return;
    return sendMail({
      to: auction.winner_email,
      subject: `🎉 Congratulations! You won the auction: ${auction.name}`,
      html: AuctionEmailTemplates.winner(
        auction.winner_name,
        auction.name,
        auction.current_price,
        productUrl,
      ),
    });
  },

  async sendSellerSuccessNotification(auction, productUrl) {
    if (!auction.seller_email) return;
    return sendMail({
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
  },

  async sendSellerFailureNotification(auction, addUrl) {
    if (!auction.seller_email) return;
    return sendMail({
      to: auction.seller_email,
      subject: `⏰ Auction Ended: ${auction.name} - No Bidders`,
      html: AuctionEmailTemplates.sellerNoBidders(
        auction.seller_name,
        auction.name,
        addUrl,
      ),
    });
  },
};
