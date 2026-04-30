const manualReplies = {
  "return policy":   "You can return any item within 30 days of purchase for a full refund.",
  "shipping time":   "Standard shipping takes 5–7 business days. Express is 2–3 days.",
  "payment methods": "We accept Visa, Mastercard, UPI, and PayPal.",
  "track order":     "Please share your order ID and we'll help you track it.",
  "cancel order":    "Orders can be cancelled within 24 hours of placing them.",
  "contact":         "You can reach our support team at support@xoriva.com.",
};

function manualReply(message) {
  const lower = message.toLowerCase();
  for (const [keyword, reply] of Object.entries(manualReplies)) {
    if (lower.includes(keyword)) return reply;
  }
  return "I'm sorry, I didn't understand that. Try asking about returns, shipping, or payments.";
}

module.exports = { manualReply };