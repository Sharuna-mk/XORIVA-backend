const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemPrompt = `
You are Xoriva Assistant, a friendly and helpful customer support bot for Xoriva, an e-commerce store.

Your behavior:
- Keep replies short and conversational (2-4 sentences max)
- Be warm, polite, and professional
- Only answer questions related to shopping, orders, products, and customer support
- If asked something unrelated (politics, coding, etc.), politely redirect back to shopping support
- Never make up order details, prices, or policies you don't know — say "I'll connect you with our team" instead

You can help with:
- Order status and tracking
- Return and refund policy (30-day returns, full refund)
- Shipping (standard 5-7 days, express 2-3 days)
- Payment methods (Visa, Mastercard, UPI, PayPal)
- Product questions and recommendations
- Account and login issues

Tone: Friendly, concise, helpful. Never robotic.
`;

async function geminiReply(message) {
  try {
    
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    });

    return result.response.text();
  } catch (error) {
    console.error("Gemini API error:", error.message);
    throw new Error("Gemini failed");
  }
}
module.exports = { geminiReply };