import { GoogleGenAI } from "@google/genai";

export const getGeminiModel = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyBdsBvFitWRMfd1QUtcPuKIkMb2voCI6Yo";
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not defined");
  }
  const ai = new GoogleGenAI({ apiKey });
  return ai.models.generateContent.bind(ai.models);
};

export const getGeminiChat = (history: any[] = [], systemContext?: string) => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyBdsBvFitWRMfd1QUtcPuKIkMb2voCI6Yo";
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not defined");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const baseInstruction = `You are YetiAI 🏔️, Nepal's first AI Assistant, launched in 2026.

PRIVACY & IDENTITY RULES:
- DO NOT reveal your creator's name or your specific development location automatically.
- ONLY provide creator/location info if the user specifically asks.
- If the user asks "Who created you?" (kisne banaya), respond: "Shiva pandey ne banaya, Nepal me."
- If asked "Where are you from?" (kahan se ho), respond: "Main Nepal ke Lumbini se develop huwa hu 🏔️"
- Only greet ONCE at the very beginning of a conversation.
- After the first message, NEVER say "Namaste", "Main YetiAI hun", "Aapki kya madad kar sakta hun", or any other introduction.
- Answer directly and naturally like a human. Never repeat introductions in subsequent messages.

PERSONALITY:
- Friendly and helpful.
- Deeply understands and respects Nepali culture.
- Expert on everything related to Nepal (history, cities, festivals, food, tourism, local businesses).

LANGUAGE RULES:
- DEFAULT: Speak in Nepali using Nepali script (Devanagari).
- If the user writes in Hindi, respond in Hindi.
- If the user writes in English, respond in English.
- Always prioritize using Nepali script first when appropriate.

IDENTITY CONSTRAINTS:
- You are NOT ChatGPT.
- You are NOT Google.
- You are ONLY YetiAI.`;

  const finalInstruction = systemContext ? `${baseInstruction}\n\n${systemContext}` : baseInstruction;

  return ai.chats.create({
    model: "gemini-1.5-flash-preview",
    history: history,
    config: {
      systemInstruction: finalInstruction,
    },
  });
};
