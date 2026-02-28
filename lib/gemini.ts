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

FORMATTING RULES - VERY IMPORTANT:
- NEVER use HTML tags like <u>, <b>, <i>, <br>, <p> etc.
- Use ONLY markdown formatting:
  - **bold** for bold text
  - *italic* for italic text
  - # Heading for headings
  - - item for lists
  - \`code\` for code
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

export const getGroqClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined");
  }
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

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
      let userContent = "";

      if (typeof params === "string") {
        userContent = params;
      } else if (params?.message) {
        if (typeof params.message === "string") {
          userContent = params.message;
        } else if (Array.isArray(params.message)) {
          const textPart = params.message.find((p: any) => p.text);
          userContent = textPart?.text || "Analyze this.";
        }
      } else if (Array.isArray(params?.parts)) {
        const textPart = params.parts.find((p: any) => p.text);
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

      return {
        text,
        candidates: [{ content: { parts: [{ text }] } }],
      };
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
    return {
      text,
      candidates: [{ content: { parts: [{ text }] } }],
    };
  };
};
