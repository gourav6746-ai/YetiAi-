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

WEB IMAGE SEARCH RULE:
- Your goal is to behave like ChatGPT — show images smartly when they add value to the answer.
- Add [SEARCH_IMAGE: query] at the END of your response ONLY when the topic is visual and specific (a real object, animal, place, food, person, vehicle, landmark, etc.).
- DO add image for:
  - Specific animals: "cat kya hai", "lion ke baare mein batao" -> add [SEARCH_IMAGE: cat], [SEARCH_IMAGE: lion]
  - Specific places/landmarks: "Eiffel Tower", "Nepal", "Paris" -> add [SEARCH_IMAGE: ...]
  - Specific vehicles: "BMW", "Ferrari", "helicopter" -> add [SEARCH_IMAGE: ...]
  - Specific foods: "momo", "pizza", "biryani" -> add [SEARCH_IMAGE: ...]
  - Specific people/celebrities (public): "Elon Musk", "Virat Kohli" -> add [SEARCH_IMAGE: ...]
  - Nature/space topics: "volcano", "galaxy", "ocean" -> add [SEARCH_IMAGE: ...]
  - Technology products: "iPhone", "laptop", "drone" -> add [SEARCH_IMAGE: ...]
- DO NOT add image for:
  - Greetings or personal questions: "kya kar rahe ho", "how are you", "namaste"
  - Abstract topics: "love kya hai", "success", "motivation"
  - Math, coding, logic problems
  - Opinions or advice: "kya karna chahiye", "help me"
  - Follow-up questions in conversation: "aur batao", "explain karo"
- Format: Give full text answer first, then on a new line add [SEARCH_IMAGE: specific English query].
`;


// ─── Groq for text ───────────────────────────────
export const getGroqClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not defined");
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

// ─── Groq Vision for images (Direct image analysis - reads text too) ───
const analyzeImageWithHF = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  const groq = getGroqClient();

  try {
    // Use Groq vision model - directly sees image, reads text, understands everything
    const groqResponse = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: prompt || "Is image mein kya hai? Detail mein batao. Agar koi text likha hai toh woh bhi batao.",
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    return groqResponse.choices[0]?.message?.content || "Image analyze nahi ho saki.";
  } catch (err) {
    console.error("Groq vision failed:", err);
    return "Image analyze nahi ho saki. Dobara try karein. 🏔️";
  }
};

// ─── Main chat (UPDATED WITH IMAGE GENERATION) ────
export const getGeminiChat = (history: any[] = [], systemContext?: string) => {
  const client = getGroqClient();
  const finalInstruction = systemContext
    ? `${SYSTEM_INSTRUCTION}\n\n${systemContext}`
    : SYSTEM_INSTRUCTION;

  // Filter history: remove image base64 data (too large for token limit)
  const groqHistory: ChatCompletionMessageParam[] = history
    .map((msg: any) => {
      let content = msg.parts?.[0]?.text || msg.content || "";
      // Remove base64 image data from history to prevent token overflow
      if (content.startsWith("YETI_IMAGE_URL:data:")) {
        content = "[Image generated successfully]";
      }
      return {
        role: (msg.role === "model" ? "assistant" : "user") as "assistant" | "user",
        content,
      };
    })
    // Only keep last 10 messages to avoid token limit
    .slice(-10);

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
          try {
            const hfKey = process.env.NEXT_PUBLIC_HF_API_KEY;
            if (!hfKey) throw new Error("HF_API_KEY missing");

            const hfResponse = await fetch(
              "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${hfKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ inputs: imagePrompt }),
              }
            );

            if (!hfResponse.ok) throw new Error(`HF error: ${hfResponse.status}`);

            const blob = await hfResponse.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
            );
            const dataUrl = `data:image/jpeg;base64,${base64}`;
            const finalResponse = `YETI_IMAGE_URL:${dataUrl}`;
            return { text: finalResponse, candidates: [{ content: { parts: [{ text: finalResponse }] } }] };
          } catch (imgErr) {
            console.error("Image generation failed:", imgErr);
            const errText = "Image generate nahi ho saki. Please dobara try karein. 🏔️";
            return { text: errText, candidates: [{ content: { parts: [{ text: errText }] } }] };
          }
        }
      }

      // Check if AI wants to search a web image
      if (text.includes("[SEARCH_IMAGE:")) {
        const searchMatch = text.match(/\[SEARCH_IMAGE: (.*?)\]/);
        if (searchMatch) {
          const searchQuery = searchMatch[1];
          const cleanText = text.replace(/\[SEARCH_IMAGE:.*?\]/g, "").trim();

          let imageUrl = "";
          let photographer = "";

          try {
            // PRIMARY: Pexels
            const pexelsKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
            console.log("Pexels key exists:", !!pexelsKey);
            if (pexelsKey) {
              const pexelsRes = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=3&orientation=landscape`,
                { headers: { Authorization: pexelsKey } }
              );
              console.log("Pexels response status:", pexelsRes.status);
              if (pexelsRes.ok) {
                const pexelsData = await pexelsRes.json();
                console.log("Pexels photos found:", pexelsData.photos?.length);
                // Best photo — highest resolution
                const bestPhoto = pexelsData.photos?.[0];
                // Use URL as-is — do NOT decode, Pexels URLs work directly
                imageUrl = bestPhoto?.src?.large2x || bestPhoto?.src?.large || bestPhoto?.src?.original || "";
                photographer = bestPhoto?.photographer || "Pexels";
                console.log("Pexels imageUrl:", imageUrl.substring(0, 80));
              }
            }

            // FALLBACK: Unsplash (agar Pexels se nahi mila)
            if (!imageUrl) {
              console.log("Pexels failed, trying Unsplash...");
              const unsplashKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
              if (unsplashKey) {
                const unsplashRes = await fetch(
                  `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=3&orientation=landscape`,
                  { headers: { Authorization: `Client-ID ${unsplashKey}` } }
                );
                if (unsplashRes.ok) {
                  const unsplashData = await unsplashRes.json();
                  imageUrl = unsplashData.results?.[0]?.urls?.regular || "";
                  photographer = unsplashData.results?.[0]?.user?.name || "Unsplash";
                }
              }
            }

            if (imageUrl) {
              // Use §§ as separator to avoid conflicts with URL characters
              const imageTag = `YETI_WEB_IMAGE:${imageUrl}§§${photographer}§§${searchQuery}`;
              const finalResponse = cleanText ? `${cleanText}

${imageTag}` : imageTag;
              return { text: finalResponse, candidates: [{ content: { parts: [{ text: finalResponse }] } }] };
            } else {
              const finalResponse = cleanText || `"${searchQuery}" ki koi image nahi mili. 🏔️`;
              return { text: finalResponse, candidates: [{ content: { parts: [{ text: finalResponse }] } }] };
            }
          } catch (err) {
            console.error("Image search failed:", err);
            const finalResponse = cleanText || "Image search nahi ho saka. Dobara try karein. 🏔️";
            return { text: finalResponse, candidates: [{ content: { parts: [{ text: finalResponse }] } }] };
          }
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

                                                                   
