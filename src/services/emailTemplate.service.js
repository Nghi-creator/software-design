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
    `
};
