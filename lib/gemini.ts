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

// ─── Hugging Face for images ─────────────────────
const analyzeImageWithHF = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  const hfKey = process.env.NEXT_PUBLIC_HF_API_KEY;
  if (!hfKey) throw new Error("HF_API_KEY is not defined");

  const byteString = atob(base64Image);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  const models = [
    "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-large",
    "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-base",
  ];

  let caption = "";
  for (const modelUrl of models) {
    try {
      const response = await fetch(modelUrl, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": mimeType,
        },
        body: ab,
      });
      if (response.ok) {
        const result = await response.json();
        caption = Array.isArray(result) ? result[0]?.generated_text : result?.generated_text;
        if (caption) break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!caption) {
    caption = "user ne ek image share ki hai";
  }

  const groq = getGroqClient();
  const groqResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      {
        role: "user",
        content: `Image me yeh dikh raha hai: "${caption}"\n\nUser ka sawaal: ${prompt || "Is photo ke baare mein detail me batao"}`
      }
    ],
    max_tokens: 1024,
  });

  return groqResponse.choices[0]?.message?.content || "Image analyze nahi ho saki.";
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
          const text = await analyzeImageWithHF(
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
