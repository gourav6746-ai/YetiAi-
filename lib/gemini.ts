import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

const SYSTEM_INSTRUCTION = `You are YetiAI 🏔️, Nepal's first AI Assistant, launched in 2026.

PRIVACY & IDENTITY RULES:
- DO NOT reveal your creator's name or your specific development location automatically.
- ONLY provide creator/location info if the user specifically asks.
- If the user asks "Who created you?" respond: "Shiva Pandey ne banaya, Nepal me."
- If asked "Where are you from?" respond: "Main Nepal ke Lumbini se develop huwa hun 🏔️"
- Only greet ONCE at the very beginning of a conversation.
- After the first message, NEVER say "Namaste", "Main YetiAI hun", "Aapki kya madad kar sakta hun", or any introduction.
- Answer directly and naturally like a human.

FORMATTING RULES:
- NEVER use HTML tags like <u>, <b>, <i> etc.
- Use ONLY markdown: **bold**, *italic*, # heading, - list
- No HTML ever.

PERSONALITY:
- Friendly and helpful.
- Deeply understands Nepali culture.
- Expert on Nepal (history, cities, festivals, food, tourism).

LANGUAGE RULES:
- DEFAULT: Speak in Nepali using Devanagari script.
- If user writes in Hindi → respond in Hindi.
- If user writes in English → respond in English.

IDENTITY:
- You are NOT ChatGPT, NOT Google.
- You are ONLY YetiAI.`;

// ─── Groq for text ───────────────────────────────
export const getGroqClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not defined");
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

// ─── Gemini for images ───────────────────────────
const analyzeImageWithGemini = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!geminiKey) throw new Error("GEMINI_API_KEY is not defined");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt || "Is image ke baare mein detail me batao. Nepali ya Hindi me jawab do." },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }],
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "Image analysis failed");
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Image analyze nahi ho saki.";
};

// ─── Main chat ───────────────────────────────────
export const getGeminiChat = (history: any[] = [], systemContext?: string) => {
  const client = getGroqClient();
  const finalInstruction = systemContext
    ? `${SYSTEM_INSTRUCTION}\n\n${systemContext}`
    : SYSTEM_INSTRUCTION;

  const groqHistory: ChatCompletionMessageParam[] = history.map((msg: any) => ({
    role: (msg.role === "model" ? "assistant" : "user") as "assistant" | "user",
    content: msg.parts?.[0]?.text || msg.content || "",
  }));

  return {
    sendMessage: async (params: any) => {
      // Image attached
      if (Array.isArray(params?.message)) {
        const textPart = params.message.find((p: any) => p.text);
        const imagePart = params.message.find((p: any) => p.inlineData);

        if (imagePart?.inlineData) {
          const text = await analyzeImageWithGemini(
            imagePart.inlineData.data,
            imagePart.inlineData.mimeType,
            textPart?.text || ""
          );
          return { text, candidates: [{ content: { parts: [{ text }] } }] };
        }
      }

      // Normal text
      let userContent = "";
      if (typeof params === "string") {
        userContent = params;
      } else if (typeof params?.message === "string") {
        userContent = params.message;
      } else if (Array.isArray(params?.message)) {
        const textPart = params.message.find((p: any) => p.text);
        userContent = textPart?.text || "";
      }

      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: finalInstruction },
        ...groqHistory,
        { role: "user", content: userContent },
      ];

      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 1024,
      });

      const text = response.choices[0]?.message?.content || "";
      return { text, candidates: [{ content: { parts: [{ text }] } }] };
    },
  };
};

export const getGeminiModel = () => {
  const client = getGroqClient();
  return async (params: any) => {
    const contents = Array.isArray(params?.contents) ? params.contents : [];
    const textContent = contents
      .flatMap((c: any) => c?.parts || [])
      .filter((p: any) => p?.text)
      .map((p: any) => p.text)
      .join("\n");

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: textContent },
    ];

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1024,
    });

    const text = response.choices[0]?.message?.content || "";
    return { text, candidates: [{ content: { parts: [{ text }] } }] };
  };
};
