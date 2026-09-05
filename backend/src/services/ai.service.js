import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

// Setup Gemini AI client if API key exists
let genAI = null;
if (config.geminiApiKey) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
  console.log('Gemini AI client initialized with API key.');
}

export function isAiAvailable() {
  return !!genAI;
}

// Generate a mentor reply. Returns null when the AI is unavailable or
// when the provider call fails, letting the caller use a fallback.
export async function generateMentorReply(message) {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({
      model: config.geminiModel,
      systemInstruction: config.geminiSystemInstruction
    });
    const result = await model.generateContent(message);
    return result.response.text();
  } catch (err) {
    console.error(err);
    return null;
  }
}