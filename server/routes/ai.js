const express = require('express');
const router = express.Router();

/**
 * Helper function to call Google Gemini API using native fetch
 */
async function callGemini(systemPrompt, userContent, maxOutputTokens = 150) {
  const apiKey = process.env.Gemini_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not set');
  }

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
        maxOutputTokens: maxOutputTokens
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates.length > 0) {
    return data.candidates[0].content.parts[0].text;
  }
  return "";
}

/**
 * POST /api/ai/smart-replies
 * Generates 3 smart reply suggestions based on the last 10 messages.
 */
router.post('/smart-replies', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Join the recent messages by newline for context
    const context = messages.join('\n');
    
    if (!context.trim()) {
      return res.json({ suggestions: [] });
    }

    const systemPrompt = 'You are a helpful chat assistant. Given recent chat messages, return exactly 3 short reply suggestions as a JSON array of strings. No explanation, only the JSON array. Example: ["Sounds good!", "I agree", "Can you elaborate?"]';
    
    const replyText = await callGemini(systemPrompt, context, 150);
    
    try {
      // Parse the JSON array from the response
      // Sometimes Gemini returns markdown blocks, so let's clean it just in case
      const cleanedText = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
      const suggestions = JSON.parse(cleanedText);
      return res.json({ suggestions });
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', replyText);
      return res.json({ suggestions: [] });
    }
    
  } catch (error) {
    console.error('Error in /smart-replies:', error);
    return res.json({ suggestions: [] });
  }
});

/**
 * POST /api/ai/summarize
 * Generates a 3-5 sentence summary from an array of up to 50 message objects.
 */
router.post('/summarize', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Format the messages as "sender: text" joined by newline
    const formattedMessages = messages
      .map(m => `${m.sender}: ${m.text}`)
      .join('\n');
      
    if (!formattedMessages.trim()) {
      return res.json({ summary: "No messages to summarize." });
    }

    const systemPrompt = 'You are a concise summarizer. Given a list of chat messages, write a clear 3-5 sentence summary of the key topics discussed, decisions made, and any action items. Be neutral and factual.';
    
    const summaryText = await callGemini(systemPrompt, formattedMessages, 300);
    
    return res.json({ summary: summaryText });
  } catch (error) {
    console.error('Error in /summarize:', error);
    return res.json({ summary: 'Could not generate summary.' });
  }
});

module.exports = router;
