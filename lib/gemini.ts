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

NEPAL SPECIAL COMMANDS (respond with exact tag only):
- If user asks weather/mausam of any Nepal city: respond with [NEPAL_WEATHER: cityname]
- If user asks NPR currency/convert: respond with [NEPAL_CURRENCY: TARGETCURRENCY AMOUNT] e.g. [NEPAL_CURRENCY: USD 100]
- If user asks Nepal news/khabar: respond with [NEPAL_NEWS]
- If user asks BS/AD date convert: respond with [NEPAL_DATE: YYYY-MM-DD] for AD to BS, or [NEPAL_DATE_BS: YYYY] for BS to AD
- If user asks to translate to Nepali/Hindi/English: translate directly in response, no special tag needed.
- Examples:
  - "Kathmandu ka mausam" -> [NEPAL_WEATHER: Kathmandu]
  - "Pokhara weather" -> [NEPAL_WEATHER: Pokhara]
  - "100 NPR kitna USD hai" -> [NEPAL_CURRENCY: USD 100]
  - "Nepal news" -> [NEPAL_NEWS]
  - "2025-01-15 ko BS mein batao" -> [NEPAL_DATE: 2025-01-15]

IMAGE ANALYSIS CONTEXT:
- When analyzing images (via captions provided), connect the visual data with your vast knowledge to give a meaningful description, not just a literal one.

IMAGE GENERATION RULE:
- If the user asks to "generate", "create", "make", or "draw" an image/photo/art.
- Respond ONLY with this exact format: [GENERATE_IMAGE: descriptive prompt in English].
- Example: If user says "Momo ki photo banao", you reply: [GENERATE_IMAGE: A delicious plate of steaming Nepali momos with spicy chutney, cinematic lighting].
- Do not add any other text when generating an image.

WEB IMAGE SEARCH RULE:
- ONLY add [SEARCH_IMAGE: query] when user EXPLICITLY uses words like: "dikhao", "photo", "image", "show", "dekho", "picture", "dekhna hai".
- Examples where you MUST add image:
  - "car dikhao" -> [SEARCH_IMAGE: car]
  - "cat ki photo" -> [SEARCH_IMAGE: cat]
  - "BMW ka photo dikhao" -> text + [SEARCH_IMAGE: BMW car]
  - "Everest dikhao" -> [SEARCH_IMAGE: Mount Everest]
- NEVER add [SEARCH_IMAGE] on your own - ONLY when user explicitly asks to see something.
- For ALL other questions (news, facts, greetings, explanations, advice) -> NO image, just text.
`;

export const convertADtoBS = (adYear: number, adMonth: number, adDay: number): string => {
  const bsYear = adYear + 56;
  const bsMonth = adMonth + 9 > 12 ? adMonth - 3 : adMonth + 9;
  const names = ["Baishakh","Jestha","Ashadh","Shrawan","Bhadra","Ashwin","Kartik","Mangsir","Poush","Magh","Falgun","Chaitra"];
  return bsYear + " " + names[bsMonth - 1] + " " + adDay + " (approx.)";
};

export const convertBStoAD = (bsYear: number): number => bsYear - 56;

export const getNepalWeather = async (city: string = "Kathmandu"): Promise<string> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) return "Weather API key missing.";
    const url = "https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(city) + ",NP&appid=" + apiKey + "&units=metric&lang=hi";
    const res = await fetch(url);
    if (!res.ok) return city + " ka weather nahi mila.";
    const d = await res.json();
    return ["🌤️ **" + city + " ka Mausam:**",
      "- 🌡️ Temperature: **" + d.main?.temp + "°C** (feels like " + d.main?.feels_like + "°C)",
      "- 💧 Humidity: " + d.main?.humidity + "%",
      "- 🌬️ Wind: " + d.wind?.speed + " m/s",
      "- ☁️ Sky: " + d.weather?.[0]?.description].join("\n");
  } catch (e) {
    return "Weather fetch karne mein error aaya.";
  }
};

export const getNPRExchangeRate = async (fromCurrency: string, amount: number): Promise<string> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_EXCHANGERATE_API_KEY;
    if (!apiKey) return "Exchange rate API key missing.";
    const res = await fetch("https://v6.exchangerate-api.com/v6/" + apiKey + "/latest/NPR");
    if (!res.ok) return "Exchange rate fetch nahi ho saca.";
    const d = await res.json();
    const rates = d.conversion_rates;
    const to = fromCurrency.toUpperCase();
    if (!rates[to]) return to + " currency nahi mili.";
    return ["💱 **NPR Currency Converter:**",
      "- 🇳🇵 " + amount + " NPR = **" + (amount * rates[to]).toFixed(2) + " " + to + "**",
      "- 🇺🇸 " + amount + " NPR = " + (amount * rates["USD"]).toFixed(4) + " USD",
      "- 🇮🇳 " + amount + " NPR = " + (amount * rates["INR"]).toFixed(2) + " INR"].join("\n");
  } catch (e) {
    return "Currency convert karne mein error aaya.";
  }
};

export const getNepalNews = async (): Promise<string> => {
  const fmt = (items: any[]) => items.slice(0, 5).map((x: any, i: number) => (i + 1) + ". **" + x.title + "**");
  try {
    const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://kathmandupost.com/rss") + "&count=5");
    if (!res.ok) throw new Error("failed");
    const d = await res.json();
    if (!d.items?.length) throw new Error("empty");
    return ["📰 **Nepal Ki Taza Khabrein (Kathmandu Post):**", ...fmt(d.items)].join("\n");
  } catch {
    try {
      const res2 = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://myrepublica.nagariknetwork.com/feed") + "&count=5");
      const d2 = await res2.json();
      if (d2.items?.length) return ["📰 **Nepal Ki Taza Khabrein:**", ...fmt(d2.items)].join("\n");
      return "📰 **Nepal Ki Taza Khabrein:**\nKhabrein load nahi ho sakin.";
    } catch {
      return "Nepal news abhi load nahi ho saki. Baad mein try karein.";
    }
  }
};

export const getGroqClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not defined");
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

const analyzeImageWithHF = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  const groq = getGroqClient();
  try {
    const r = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: [
          { type: "image_url", image_url: { url: "data:" + mimeType + ";base64," + base64Image } },
          { type: "text", text: prompt || "Is image mein kya hai? Detail mein batao. Agar koi text likha hai toh woh bhi batao." }
        ]}
      ],
      max_tokens: 1024,
    });
    return r.choices[0]?.message?.content || "Image analyze nahi ho saki.";
  } catch (err) {
    console.error("Groq vision failed:", err);
    return "Image analyze nahi ho saki. Dobara try karein. 🏔️";
  }
};

export const getGeminiChat = (history: any[] = [], systemContext?: string) => {
  const client = getGroqClient();
  const finalInstruction = systemContext ? SYSTEM_INSTRUCTION + "\n\n" + systemContext : SYSTEM_INSTRUCTION;

  const groqHistory: ChatCompletionMessageParam[] = history.map((msg: any) => {
    let content = msg.parts?.[0]?.text || msg.content || "";
    if (content.startsWith("YETI_IMAGE_URL:data:")) content = "[Image generated successfully]";
    return { role: (msg.role === "model" ? "assistant" : "user") as "assistant" | "user", content };
  }).slice(-10);

  return {
    sendMessage: async (params: any) => {
      if (Array.isArray(params?.message)) {
        const textPart = params.message.find((p: any) => p.text);
        const imagePart = params.message.find((p: any) => p.inlineData);
        if (imagePart?.inlineData) {
          const text = await analyzeImageWithHF(imagePart.inlineData.data, imagePart.inlineData.mimeType, textPart?.text || "");
          return { text, candidates: [{ content: { parts: [{ text }] } }] };
        }
      }

      let userContent = "";
      if (typeof params === "string") userContent = params;
      else if (typeof params?.message === "string") userContent = params.message;
      else if (Array.isArray(params?.message)) userContent = params.message.find((p: any) => p.text)?.text || "";

      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: finalInstruction },
        ...groqHistory,
        { role: "user", content: userContent },
      ];

      const response = await client.chat.completions.create({ model: "llama-3.3-70b-versatile", messages, max_tokens: 1024 });
      const text = response.choices[0]?.message?.content || "";

      if (text.includes("[NEPAL_WEATHER:")) {
        const m = text.match(/\[NEPAL_WEATHER:\s*(.*?)\]/);
        if (m) { const r = await getNepalWeather(m[1].trim()); return { text: r, candidates: [{ content: { parts: [{ text: r }] } }] }; }
      }
      if (text.includes("[NEPAL_CURRENCY:")) {
        const m = text.match(/\[NEPAL_CURRENCY:\s*([A-Z]+)\s*(\d+(?:\.\d+)?)\]/);
        if (m) { const r = await getNPRExchangeRate(m[1], parseFloat(m[2])); return { text: r, candidates: [{ content: { parts: [{ text: r }] } }] }; }
      }
      if (text.includes("[NEPAL_NEWS]")) {
        const r = await getNepalNews(); return { text: r, candidates: [{ content: { parts: [{ text: r }] } }] };
      }
      if (text.includes("[NEPAL_DATE:")) {
        const m = text.match(/\[NEPAL_DATE:\s*(\d{4})-(\d{2})-(\d{2})\]/);
        if (m) { const r = "📅 **Date Conversion:**\n- AD: " + m[1] + "-" + m[2] + "-" + m[3] + "\n- BS: " + convertADtoBS(+m[1], +m[2], +m[3]); return { text: r, candidates: [{ content: { parts: [{ text: r }] } }] }; }
      }
      if (text.includes("[NEPAL_DATE_BS:")) {
        const m = text.match(/\[NEPAL_DATE_BS:\s*(\d{4})\]/);
        if (m) { const r = "📅 **Date Conversion:**\n- BS Year: " + m[1] + "\n- AD Year: " + convertBStoAD(+m[1]); return { text: r, candidates: [{ content: { parts: [{ text: r }] } }] }; }
      }

      if (text.includes("[GENERATE_IMAGE:")) {
        const m = text.match(/\[GENERATE_IMAGE: (.*?)\]/);
        if (m) {
          try {
            const hfKey = process.env.NEXT_PUBLIC_HF_API_KEY;
            if (!hfKey) throw new Error("HF_API_KEY missing");
            const hfRes = await fetch("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell", {
              method: "POST",
              headers: { Authorization: "Bearer " + hfKey, "Content-Type": "application/json" },
              body: JSON.stringify({ inputs: m[1] }),
            });
            if (!hfRes.ok) throw new Error("HF error: " + hfRes.status);
            const ab = await hfRes.blob().then(b => b.arrayBuffer());
            const b64 = btoa(new Uint8Array(ab).reduce((d, b) => d + String.fromCharCode(b), ""));
            const r = "YETI_IMAGE_URL:data:image/jpeg;base64," + b64;
            return { text: r, candidates: [{ content: { parts: [{ text: r }] } }] };
          } catch (e) {
            const r = "Image generate nahi ho saki. Please dobara try karein. 🏔️";
            return { text: r, candidates: [{ content: { parts: [{ text: r }] } }] };
          }
        }
      }

      if (text.includes("[SEARCH_IMAGE:")) {
        const m = text.match(/\[SEARCH_IMAGE: (.*?)\]/);
        if (m) {
          const query = m[1];
          const cleanText = text.replace(/\[SEARCH_IMAGE:.*?\]/g, "").trim();
          let imageUrl = "";
          let photographer = "";
          try {
            const pKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
            if (pKey) {
              const pr = await fetch("https://api.pexels.com/v1/search?query=" + encodeURIComponent(query) + "&per_page=3&orientation=landscape", { headers: { Authorization: pKey } });
              if (pr.ok) {
                const pd = await pr.json();
                const best = pd.photos?.[0];
                imageUrl = best?.src?.large2x || best?.src?.large || "";
                photographer = best?.photographer || "Pexels";
              }
            }
            if (!imageUrl) {
              const uKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
              if (uKey) {
                const ur = await fetch("https://api.unsplash.com/search/photos?query=" + encodeURIComponent(query) + "&per_page=1&orientation=landscape", { headers: { Authorization: "Client-ID " + uKey } });
                if (ur.ok) {
                  const ud = await ur.json();
                  imageUrl = ud.results?.[0]?.urls?.regular || "";
                  photographer = ud.results?.[0]?.user?.name || "Unsplash";
                }
              }
            }
            if (imageUrl) {
              const tag = "YETI_WEB_IMAGE:" + imageUrl + "§§" + photographer + "§§" + query;
              const r = cleanText ? cleanText + "\n\n" + tag : tag;
              return { text: r, candidates: [{ content: { parts: [{ text: r }] } }] };
            }
            const r = cleanText || ('"' + query + '" ki koi image nahi mili. 🏔️');
            return { text: r, candidates: [{ content: { parts: [{ text: r }] } }] };
          } catch {
            const r = cleanText || "Image search nahi ho saka. Dobara try karein. 🏔️";
            return { text: r, candidates: [{ content: { parts: [{ text: r }] } }] };
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
    const textContent = contents.flatMap((c: any) => c?.parts || []).filter((p: any) => p?.text).map((p: any) => p.text).join("\n");
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: textContent },
    ];
    const response = await client.chat.completions.create({ model: "llama-3.3-70b-versatile", messages, max_tokens: 1024 });
    const text = response.choices[0]?.message?.content || "";
    return { text, candidates: [{ content: { parts: [{ text }] } }] };
  };
};
                                     
