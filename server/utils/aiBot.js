/**
 * Helper to interact with the Anthropic API for the @bot feature.
 */

/**
 * getBotReply calls the Anthropic API to generate a reply for an @bot question.
 * @param {string} userQuestion - The question asked by the user after the @bot prefix.
 * @param {Array<string>} recentContext - The last 5 messages in the room as plain strings for context.
 * @returns {Promise<string>} - The bot's reply.
 */
async function getBotReply(userQuestion, recentContext) {
  const apiKey = process.env.Gemini_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini API key is not set');
    return "I'm sorry, my AI features are currently unconfigured.";
  }

  const systemPrompt = "You are Orbit, a friendly AI assistant inside a chat room. Keep replies short (1-3 sentences), helpful, and conversational. You may use the recent chat context to give better answers.";
  const userContent = "Recent context:\n" + recentContext.join("\n") + "\n\nUser asked: " + userQuestion;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{
          role: "user",
          parts: [{ text: userContent }]
        }],
        generationConfig: {
          maxOutputTokens: 200
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error in getBotReply: ${response.status} ${errorBody}`);
      return "I encountered an error trying to process your request. Please try again later.";
    }

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    return "I'm not sure how to respond to that.";
  } catch (error) {
    console.error('Error in getBotReply:', error);
    return "I am currently unavailable.";
  }
}

module.exports = {
  getBotReply
};
