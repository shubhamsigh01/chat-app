require('dotenv').config(); // safety net in case called standalone
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ aiBot.js: GEMINI_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Handles @bot messages and returns an AI-generated response.
 * @param {string} message - The raw chat message text
 * @param {Array}  history - Recent messages [{username, text}] for context
 * @returns {string|null} AI response string, or null if not a @bot message
 */
async function handleBotMessage(message, history = []) {
  const botRegex = /^@bot\s+/i;

  if (!botRegex.test(message.trim())) return null;

  const userQuestion = message.replace(botRegex, "").trim();

  if (!userQuestion) {
    return "Hey! Ask me something after @bot 😊";
  }

  console.log(`🤖 [Bot] Question received: "${userQuestion}"`);

  try {
    let model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const contextBlock =
      history.length > 0
        ? `Recent chat context:\n${history
            .slice(-10)
            .map((m) => `${m.username}: ${m.text}`)
            .join("\n")}\n\n`
        : "";

    const prompt = `${contextBlock}A user in a group chat asked: "${userQuestion}"\nAnswer helpfully and concisely in 2-4 sentences.`;

    console.log(`🤖 [Bot] Calling Gemini API...`);
    
    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (e) {
      if (e.status === 404 || e.message.includes("not found")) {
        console.log("🤖 [Bot] gemini-2.5-flash not found, falling back to gemini-1.5-flash...");
        try {
          model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          result = await model.generateContent(prompt);
        } catch (err2) {
          console.log("🤖 [Bot] gemini-1.5-flash not found, falling back to gemini-pro...");
          model = genAI.getGenerativeModel({ model: "gemini-pro" });
          result = await model.generateContent(prompt);
        }
      } else {
        throw e;
      }
    }

    const response = await result.response;
    const text = response.text();

    console.log(`✅ [Bot] Gemini responded successfully (${text.length} chars)`);
    return text;

  } catch (err) {
    // Log the FULL error for debugging
    console.error("❌ [Bot] Gemini API Error:");
    console.error("  Message:", err.message);
    console.error("  Status:", err.status || "N/A");
    console.error("  Error details:", JSON.stringify(err?.errorDetails || {}, null, 2));

    // Return specific user-facing messages based on error type
    if (err.message?.includes("API_KEY") || err.message?.includes("API key") || err.status === 400) {
      return "⚠️ Bot config error: Invalid API key. Contact admin.";
    }
    if (err.message?.includes("quota") || err.status === 429) {
      return "⚠️ Bot is rate-limited. Please wait a moment and try again.";
    }
    if (err.status === 404) {
      return "⚠️ Bot model not found. Contact admin to update the model name.";
    }
    if (err.message?.includes("network") || err.message?.includes("fetch")) {
      return "⚠️ Bot can't reach the AI service right now. Check server internet access.";
    }

    // Temporarily expose the real error message to help with debugging
    return `⚠️ Bot error: ${err.message || "Unknown error — check server logs."}`;
  }
}

module.exports = { handleBotMessage };
