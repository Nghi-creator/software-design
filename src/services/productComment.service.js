import * as productModel from "../models/product.model.js";
import * as userModel from "../models/user.model.js";
import * as productCommentModel from "../models/productComment.model.js";
import * as biddingHistoryModel from "../models/biddingHistory.model.js";
import { sendMail } from "../utils/mailer.js";
import { EmailTemplates } from "./emailTemplate.service.js";

export const ProductCommentService = {
  async createComment(productId, userId, content, parentId = null) {
    await productCommentModel.createComment(
      productId,
      userId,
      content.trim(),
      parentId || null,
    );
    return { success: true };
  },

  async notifyComment(product, seller, commenter, productUrl) {
    const isSellerReplying = commenter.id === product.seller_id;

    if (isSellerReplying && parentId) {
      await this.notifySellerReply(product, commenter, productUrl);
    } else if (seller && seller.email && commenter.id !== product.seller_id) {
      await this.notifyNewComment(product, commenter, seller, productUrl);
    }
  },

  async notifySellerReply(product, commenter, productUrl) {
    const bidders = await biddingHistoryModel.getUniqueBidders(product.id);
    const commenters = await productCommentModel.getUniqueCommenters(
      product.id,
    );

    const recipientsMap = new Map();

    bidders.forEach((b) => {
      if (b.id !== product.seller_id && b.email) {
        recipientsMap.set(b.id, { email: b.email, fullname: b.fullname });
      }
    });

    commenters.forEach((c) => {
      if (c.id !== product.seller_id && c.email) {
        recipientsMap.set(c.id, { email: c.email, fullname: c.fullname });
      }
    });

    for (const [recipientId, recipient] of recipientsMap) {
      try {
        await sendMail({
          to: recipient.email,
          subject: `Seller answered a question on: ${product.name}`,
          html: EmailTemplates.sellerReplyNotification(
            recipient.fullname,
            product.name,
            commenter.fullname,
            productUrl,
          ),
        });
      } catch (emailError) {
        console.error(
          `Failed to send email to ${recipient.email}:`,
          emailError,
        );
      }
    }
  },

  async notifyNewComment(
    product,
    commenter,
    seller,
    productUrl,
    isReply = false,
  ) {
    const subject = isReply
      ? `New reply on your product: ${product.name}`
      : `New question about your product: ${product.name}`;

    const html = isReply
      ? EmailTemplates.newReplyNotification(
          commenter.fullname,
          product.name,
          productUrl,
        )
      : EmailTemplates.newQuestionNotification(
          commenter.fullname,
          product.name,
          productUrl,
        );

    await sendMail({
      to: seller.email,
      subject,
      html,
    });
  },

  async getCommentsByProductId(productId) {
    return productCommentModel.getCommentsByProductId(productId);
  },

  async deleteComment(commentId, userId) {
    const comment = await productCommentModel.findById(commentId);
    if (!comment) {
      return { success: false, error: "Comment not found" };
    }

    if (comment.user_id !== userId) {
      return { success: false, error: "You can only delete your own comments" };
    }

    await productCommentModel.deleteComment(commentId);
    return { success: true };
  },
};
