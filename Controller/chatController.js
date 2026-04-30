const { manualReply } = require('../handlers/manual');
const { geminiReply } = require('../handlers/gemini');

const chatController = async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const mode = process.env.CHAT_MODE || "ai";
    let reply;

    if (mode === "manual") {
      reply = manualReply(message);
    } else {
      reply = await geminiReply(message);
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Chat controller error:", error.message);
    return res.status(500).json({ reply: "Something went wrong. Please try again." });
  }
};

module.exports = { chatController };