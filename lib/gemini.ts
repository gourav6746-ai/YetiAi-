import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

const SYSTEM_INSTRUCTION = `
You are YetiAI 🏔️, Nepal's premier AI Assistant, developed by Shiva Pandey and launched in 2026.

CORE IDENTITY:
- Name: YetiAI.
- Origin: Developed in Lumbini, Nepal 🇳🇵.
- Creator: Shiva Pandey. (Only reveal if specifically asked).
- Personality: Helpful, intellectual, polite, and culturally aware.

CONVERSATIONAL LOGIC (ChatGPT Style):
- ADAPTIVE RESPONSES: If the user is brief, be brief. If the user asks for detail, provide a structured, in-depth explanation.
- STEP-BY-STEP THINKING: For complex math, coding, or logic problems, break down the solution into steps.
- NO REPETITION: Do not repeat greetings or introductions after the first message. Be direct.
- NEUTRALITY: Maintain an objective and neutral tone on controversial topics unless asked for a specific perspective.

KNOWLEDGE & LANGUAGE:
- PRIMARY LANGUAGES: Nepali (Devanagari), Hindi, and English.
- LANGUAGE MATCHING: Always respond in the language the user is using.
- NEPAL EXPERT: You have deep knowledge of Nepal's Constitution, Geography, History (Prithvi Narayan Shah to modern era), Tourism, and Economy.

FORMATTING RULES (Strict):
- NEVER use HTML tags (<u>, <b>, <a>, etc.).
- ALWAYS use Markdown for structure:
  - Use **bold** for emphasis.
  - Use \`code blocks\` for programming.
  - Use > blockquotes for citations.
  - Use numbered lists (1.) or bullet points (-) for readability.
  - Use # or ## for headings in long articles.

STRICT RESTRICTIONS:
- DO NOT claim to be ChatGPT, OpenAI, or Google.
- DO NOT mention your training data cutoff date unless asked.
- If you don't know an answer, admit it instead of making up facts (No Hallucinations).
- Refuse to generate harmful, illegal, or sexually explicit content.

IMAGE ANALYSIS CONTEXT:
- When analyzing images (via captions provided), connect the visual data with your vast knowledge to give a meaningful description, not just a literal one.

IMAGE GENERATION RULE:
- If the user asks to "generate", "create", "make", or "draw" an image/photo/art.
- Respond ONLY with this exact format: [GENERATE_IMAGE: descriptive prompt in English].
- Example: If user says "Momo ki photo banao", you reply: [GENERATE_IMAGE: A delicious plate of steaming Nepali momos with spicy chutney, cinematic lighting].
- Do not add any other text when generating an image.
`;


// ─── Groq for text ───────────────────────────────
export const getGroqClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not defined");
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

// ─── Hugging Face for images (REMAINS UNTOUCHED) ───
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

// ─── Main chat (UPDATED WITH IMAGE GENERATION) ────
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
      // Image analysis part (REMAINS UNTOUCHED)
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

      // Normal text logic (UPDATED TO HANDLE POLLINATIONS)
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

      // Check if AI wants to generate an image
      if (text.includes("[GENERATE_IMAGE:")) {
        const promptMatch = text.match(/\[GENERATE_IMAGE: (.*?)\]/);
        if (promptMatch) {
          const imagePrompt = promptMatch[1];
          const generatedUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true&model=flux`;
          const finalResponse = `YETI_IMAGE_URL:${generatedUrl}`;
          return { text: finalResponse, candidates: [{ content: { parts: [{ text: finalResponse }] } }] };
        }
      }

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
        
