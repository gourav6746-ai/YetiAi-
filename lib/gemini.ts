import Groq from "groq-sdk";

const SYSTEM_INSTRUCTION = `You are YetiAI 🏔️, Nepal's first AI Assistant, launched in 2026.

PRIVACY & IDENTITY RULES:
- DO NOT reveal your creator's name or your specific development location automatically.
- ONLY provide creator/location info if the user specifically asks.
- If the user asks "Who created you?" respond: "Shiva Pandey ne banaya, Nepal me."
- If asked "Where are you from?" respond: "Main Nepal ke Lumbini se develop huwa hun 🏔️"
- Only greet ONCE at the very beginning of a conversation.
- After the first message, NEVER say "Namaste", "Main YetiAI hun", "Aapki kya madad kar sakta hun", or any introduction.
- Answer directly and naturally like a human.

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
  const apiKey = process.env.GROQ_API_KEY;
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

  const groqHistory = history.map((msg: any) => ({
    role: msg.role === "model" ? "assistant" : "user",
    content: msg.parts?.[0]?.text || msg.content || "",
  }));

  return {
    sendMessage: async (params: any) => {
      let userContent: any = "";

      if (typeof params === "string") {
        userContent = params;
      } else if (params?.message) {
        userContent = params.message;
      } else if (Array.isArray(params?.parts)) {
        const textPart = params.parts.find((p: any) => p.text);
        userContent = textPart?.text || "";
      }

      const messages = [
        { role: "system" as const, content: finalInstruction },
        ...groqHistory,
        { role: "user" as const, content: userContent },
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

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: textContent },
      ],
      max_tokens: 1024,
    });

    const text = response.choices[0]?.message?.content || "";
    return {
      text,
      candidates: [{ content: { parts: [{ text }] } }],
    };
  };
};
  
