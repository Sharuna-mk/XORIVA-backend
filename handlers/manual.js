const manualReplies = [
  { keys: ["hi", "hello", "hey"], reply: "Hi! Welcome to Xoriva. Are you shopping for new products or thrift pieces today?" },
  { keys: ["return", "refund", "exchange"], reply: "You can return an eligible item within 30 days of purchase for a refund. Contact support with your order number to start a return." },
  { keys: ["shipping", "delivery", "deliver"], reply: "Standard delivery usually takes 5-7 business days. Express delivery takes 2-3 business days where available." },
  { keys: ["payment", "pay", "upi", "card", "cod", "cash"], reply: "We accept cards, UPI, and cash on delivery where available at checkout." },
  { keys: ["track", "tracking", "where is my order", "order status"], reply: "Open Account, then My Orders to see your order status and delivery details." },
  { keys: ["cancel", "cancellation"], reply: "Orders can be cancelled within 24 hours when they have not shipped yet. Contact support with your order number." },
  { keys: ["thrift", "used", "sell", "seller", "list an item"], reply: "Visit Thrift and choose Start Selling to list a pre-loved piece. You can track your thrift sales from Account > Thrift Sales." },
  { keys: ["contact", "support", "help"], reply: "You can reach the Xoriva support team at xoriva0@gmail.com." },
  { keys: ["discount", "offer", "coupon", "sale"], reply: "Browse the product catalog and sale sections for current discounts. Prices and offers are shown on each product card." },
  { keys: ["account", "profile", "login", "password"], reply: "Open Account from the header to view your profile, orders, wishlist, and thrift sales." },
];

function manualReply(message) {
  const lower = message.toLowerCase().replace(/[^a-z0-9? ]/g, " ");
  for (const intent of manualReplies) {
    if (intent.keys.some((keyword) => lower.includes(keyword))) return intent.reply;
  }
  return "I can help with products, orders, shipping, returns, payments, accounts, or selling thrift pieces. What would you like to know?";
}

module.exports = { manualReply };