const manualReplies = {
    "hi": "Hey there 👋! Looking for something special? How can I assist you today?",
  "return policy":    "You can return any item within 30 days of purchase for a full refund.",
  "shipping":         "Standard shipping takes 5–7 business days. Express is 2–3 days.",
  "payment":          "We accept masterCard and cod.",
  "track":            "You can track your order from the Orders section in your account.",  
  "cancel":           "Orders can be cancelled within 24 hours of placing them. Contact us at xoriva0@gmail.com.",
  "contact":          "You can reach our support team at xoriva0@gmail.com or call +91-XXXXXXXXXX.",
  "discount":         "Check our Offers page for the latest deals and promo codes.",
  "account":          "You can manage your account from the profile section after logging in.",
};

function manualReply(message) {
  const lower = message.toLowerCase();
  for (const [keyword, reply] of Object.entries(manualReplies)) {
    if (lower.includes(keyword)) return reply;
  }
  return "I'm sorry, I didn't understand that. Try asking about returns, shipping, or payments.";
}

module.exports = { manualReply };