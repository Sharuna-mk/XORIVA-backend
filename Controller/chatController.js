const { manualReply } = require('../handlers/manual');
const { geminiReply } = require('../handlers/gemini');

exports.chatController = async (req, res) => {
  const { message } = req.body || {};

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message is required" });
  }
  if (message.trim().length > 1000) {
    return res.status(400).json({ error: "Message is too long" });
  }

  try {
    const mode = process.env.CHAT_MODE || "ai";
    let reply;

    if (mode === "manual") {
      reply = manualReply(message);
    } else {
      try {
        reply = await geminiReply(message);
      } catch (error) {
        console.error("AI unavailable, using manual fallback:", error.message);
        reply = manualReply(message);
      }
    }

    return res.status(200).json({ reply: reply || manualReply(message) });

  } catch (error) {
    console.error("Chat controller error:", error.message);
    return res.status(200).json({ reply: manualReply(message) });
  }
};
