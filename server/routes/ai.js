const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/summarize", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided to summarize." });
  }

  if (messages.length < 3) {
    return res.status(400).json({ error: "Need at least 3 messages to generate a summary." });
  }

  try {
    let model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chatText = messages
      .map((m) => `${m.username || "Unknown"} (${new Date(m.createdAt).toLocaleTimeString()}): ${m.text}`)
      .join("\n");

    const prompt = `Summarize this chat conversation in 3-5 bullet points. Be concise and highlight the key topics, decisions, or questions discussed:\n\n${chatText}`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (e) {
      if (e.status === 404 || e.message.includes("not found")) {
        console.log("✅ [Summarize] gemini-2.5-flash not found, falling back to gemini-1.5-flash...");
        try {
          model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          result = await model.generateContent(prompt);
        } catch (err2) {
          console.log("✅ [Summarize] gemini-1.5-flash not found, falling back to gemini-pro...");
          model = genAI.getGenerativeModel({ model: "gemini-pro" });
          result = await model.generateContent(prompt);
        }
      } else {
        throw e;
      }
    }

    const response = await result.response;
    const summary = response.text();

    console.log("✅ [Summarize] Summary generated successfully");
    res.json({ summary });

  } catch (err) {
    console.error("❌ [Summarize] Gemini error:", err.message, "| Status:", err.status);

    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limit reached. Please wait before summarizing again." });
    }
    if (err.message?.includes("API_KEY") || err.status === 400) {
      return res.status(500).json({ error: "AI service config error. Contact admin." });
    }
    res.status(500).json({ error: `Failed to generate summary: ${err.message}` });
  }
});

module.exports = router;
