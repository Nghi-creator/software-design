// src/services/emailTemplate.service.js

const getBaseTemplate = (headerColor, headerTitle, contentHtml) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, ${headerColor}); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">${headerTitle}</h1>
  </div>
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    ${contentHtml}
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #888; font-size: 12px; text-align: center;">This is an automated message from Online Auction.</p>
</div>
`;

export const AuctionEmailTemplates = {
  winner: (winnerName, productName, price, productUrl) => {
    const formattedPrice = new Intl.NumberFormat("en-US").format(price);
    const content = `
      <p>Dear <strong>${winnerName}</strong>,</p>
      <p>Congratulations! You have won the auction for:</p>
      <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
        <p style="font-size: 24px; color: #28a745; margin: 0; font-weight: bold;">${formattedPrice} VND</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${productUrl}" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Payment</a>
      </div>
    `;
    return getBaseTemplate("#667eea 0%, #764ba2 100%", "🎉 You Won!", content);
  },

  sellerWinnerFound: (
    sellerName,
    productName,
    winnerName,
    price,
    productUrl,
  ) => {
    const formattedPrice = new Intl.NumberFormat("en-US").format(price);
    const content = `
      <p>Dear <strong>${sellerName}</strong>,</p>
      <p>Your auction has ended with a winner!</p>
      <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #72AEC8;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
        <p style="margin: 5px 0;"><strong>Winner:</strong> ${winnerName}</p>
        <p style="font-size: 24px; color: #72AEC8; margin: 10px 0 0 0; font-weight: bold;">${formattedPrice} VND</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${productUrl}" style="display: inline-block; background: linear-gradient(135deg, #72AEC8 0%, #5a9ab8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Product</a>
      </div>
    `;
    return getBaseTemplate(
      "#72AEC8 0%, #5a9ab8 100%",
      "Auction Ended",
      content,
    );
  },

  sellerNoBidders: (sellerName, productName, addUrl) => {
    const content = `
      <p>Dear <strong>${sellerName}</strong>,</p>
      <p>Unfortunately, your auction has ended without any bidders.</p>
      <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #6c757d;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
        <p style="color: #6c757d; margin: 0;">No bids received</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${addUrl}" style="display: inline-block; background: linear-gradient(135deg, #72AEC8 0%, #5a9ab8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Create New Auction</a>
      </div>
    `;
    return getBaseTemplate(
      "#6c757d 0%, #495057 100%",
      "Auction Ended",
      content,
    );
  },
};

export const EmailTemplates = {
    otpEmail: (otpCode) => `
        <div style="font-family: Arial; max-width: 600px; margin: auto;">
            <h2 style="color: #4A90E2;">Your Verification Code</h2>
            <div style="background: #f4f4f4; padding: 20px; font-size: 24px; letter-spacing: 5px; text-align: center;">
                <strong>${otpCode}</strong>
            </div>
            <p>This code expires in 5 minutes.</p>
        </div>
    `,
    adminResetPassword: (fullname, defaultPassword) => `
        <div style="font-family: Arial; max-width: 600px; margin: auto;">
            <h2 style="color: #333;">Password Reset Notification</h2>
            <p>Dear <strong>${fullname}</strong>,</p>
            <p>Your new temporary password is: <strong style="color:red; font-size: 20px;">${defaultPassword}</strong></p>
            <p>Please log in and change this immediately.</p>
        </div>
    `,
    newBidNotification: (sellerName, productName, bidderName, currentPrice, previousPrice, productUrl, productSold) => {
        const formattedPrice = new Intl.NumberFormat("en-US").format(currentPrice);
        const formattedPrevious = previousPrice ? new Intl.NumberFormat("en-US").format(previousPrice) : '';
        
        let html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #72AEC8 0%, #5a9ab8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">New Bid Received!</h1>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p>Dear <strong>${sellerName}</strong>,</p>
                    <p>Great news! Your product has received a new bid:</p>
                    <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #72AEC8;">
                        <h3 style="margin: 0 0 15px 0; color: #333;">${productName}</h3>
                        <p style="margin: 5px 0;"><strong>Bidder:</strong> ${bidderName || 'Anonymous'}</p>
                        <p style="margin: 5px 0;"><strong>Current Price:</strong></p>
                        <p style="font-size: 28px; color: #72AEC8; margin: 5px 0; font-weight: bold;">
                            ${formattedPrice} VND
                        </p>
                        ${previousPrice && previousPrice !== currentPrice ? `
                        <p style="margin: 5px 0; color: #666; font-size: 14px;">
                            <i>Previous: ${formattedPrevious} VND</i>
                        </p>
                        ` : ''}
                    </div>
                    ${productSold ? `
                    <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 0; color: #155724;"><strong>🎉 Buy Now price reached!</strong> Auction has ended.</p>
                    </div>
                    ` : ''}
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${productUrl}" style="display: inline-block; background: #72AEC8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">View Product</a>
                    </div>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #888; font-size: 12px; text-align: center;">This is an automated message from Online Auction.</p>
            </div>
        `;
        return html;
    },
    productDescriptionUpdated: (userFullname, productName, currentPrice, productUrl, newDescription) => {
        const formattedPrice = new Intl.NumberFormat("en-US").format(currentPrice);
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #72AEC8 0%, #5a9ab8 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Product Description Updated</h1>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Hello <strong>${userFullname}</strong>,</p>
                    <p>The seller has added new information to the product description:</p>
                    <div style="background: white; padding: 15px; border-left: 4px solid #72AEC8; margin: 15px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
                        <p style="margin: 0; color: #666;">Current Price: <strong style="color: #72AEC8;">${formattedPrice} VND</strong></p>
                    </div>
                    <div style="background: #fff8e1; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #f57c00;">✉ New Description Added:</p>
                        <div style="color: #333;">${newDescription}</div>
                    </div>
                    <p>View the product to see the full updated description:</p>
                    <a href="${productUrl}" style="display: inline-block; background: #72AEC8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0;">View Product</a>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">You received this email because you placed a bid or asked a question on this product.</p>
                </div>
            </div>
        `;
    },
    sellerReplyNotification: (recipientName, productName, sellerName, productUrl) => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">Seller Response on Product</h2>
                <p>Dear <strong>${recipientName}</strong>,</p>
                <p>The seller has responded to a question on a product you're interested in:</p>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p><strong>Product:</strong> ${productName}</p>
                    <p><strong>Seller:</strong> ${sellerName}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${productUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Product</a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #888; font-size: 12px;">This is an automated message from Online Auction. Please do not reply to this email.</p>
            </div>
        `;
    },
    newQuestionNotification: (commenterName, productName, productUrl) => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">New Question About Your Product</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p><strong>Product:</strong> ${productName}</p>
                    <p><strong>From:</strong> ${commenterName}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${productUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Product & Answer</a>
                </div>
            </div>
        `;
    },
    newReplyNotification: (commenterName, productName, productUrl) => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">New Reply on Your Product</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p><strong>Product:</strong> ${productName}</p>
                    <p><strong>From:</strong> ${commenterName}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${productUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Product & Reply</a>
                </div>
            </div>
        `;
    },
    rejectedBidderNotification: (bidderName, productName, sellerName, productUrl) => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">Bid Rejected</h1>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p>Dear <strong>${bidderName}</strong>,</p>
                    <p>We regret to inform you that the seller has rejected your bid on the following product:</p>
                    <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #dc3545;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">${productName}</h3>
                        <p style="margin: 5px 0; color: #666;"><strong>Seller:</strong> ${sellerName}</p>
                    </div>
                    <p style="color: #666;">This means you can no longer place bids on this specific product.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${productUrl}" style="display: inline-block; background: #72AEC8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Browse Other Auctions</a>
                    </div>
                    <p style="color: #888; font-size: 13px;">If you believe this was done in error, please contact our support team.</p>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #888; font-size: 12px; text-align: center;">This is an automated message from Online Auction.</p>
            </div>
        `;
    }
};
