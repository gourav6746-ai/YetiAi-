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
- NEVER add [SEARCH_IMAGE] on your own — ONLY when user explicitly asks to see something.
- For ALL other questions (news, facts, greetings, explanations, advice) -> NO image, just text.
`;


// ─── Nepal Utilities ───────────────────────────────

// BS/AD Calendar converter
const AD_TO_BS_DATA: Record<number, number[]> = {
  1970:[2026,9,17],1971:[2027,9,17],1972:[2028,9,17],1973:[2029,9,17],
  1974:[2030,9,17],1975:[2031,9,17],1976:[2032,9,17],1977:[2033,9,17],
  1978:[2034,9,17],1979:[2035,9,17],1980:[2036,9,17],1981:[2037,9,17],
  1982:[2038,9,17],1983:[2039,9,17],1984:[2040,9,17],1985:[2041,9,17],
  1986:[2042,9,17],1987:[2043,9,17],1988:[2044,9,17],1989:[2045,9,17],
  1990:[2046,9,17],1991:[2047,9,17],1992:[2048,9,17],1993:[2049,9,17],
  1994:[2050,9,17],1995:[2051,9,17],1996:[2052,9,17],1997:[2053,9,17],
  1998:[2054,9,17],1999:[2055,9,17],2000:[2056,9,17],2001:[2057,9,17],
  2002:[2058,9,17],2003:[2059,9,17],2004:[2060,9,17],2005:[2061,9,17],
  2006:[2062,9,17],2007:[2063,9,17],2008:[2064,9,17],2009:[2065,9,17],
  2010:[2066,9,17],2011:[2067,9,17],2012:[2068,9,17],2013:[2069,9,17],
  2014:[2070,9,17],2015:[2071,9,17],2016:[2072,9,17],2017:[2073,9,17],
  2018:[2074,9,17],2019:[2075,9,17],2020:[2076,9,17],2021:[2077,9,17],
  2022:[2078,9,17],2023:[2079,9,17],2024:[2080,9,17],2025:[2081,9,17],
  2026:[2082,9,17],
};

export const convertADtoBS = (adYear: number, adMonth: number, adDay: number): string => {
  // Approximate conversion: BS = AD + 56 years 8.5 months
  const bsYear = adYear + 56;
  const bsMonth = adMonth + 9 > 12 ? adMonth - 3 : adMonth + 9;
  const bsDay = adDay;
  const bsMonthNames = ['Baishakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];
  return `${bsYear} ${bsMonthNames[bsMonth - 1]} ${bsDay} (approx.)`;
};

export const convertBStoAD = (bsYear: number): number => bsYear - 56;

// Nepal Weather
export const getNepalWeather = async (city: string = 'Kathmandu'): Promise<string> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) return "Weather API key missing.";
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},NP&appid=${apiKey}&units=metric&lang=hi`
    );
    if (!res.ok) return `${city} ka weather nahi mila.`;
    const data = await res.json();
    const temp = data.main?.temp;
    const feels = data.main?.feels_like;
    const humidity = data.main?.humidity;
    const desc = data.weather?.[0]?.description;
    const wind = data.wind?.speed;
    return `🌤️ **${city} ka Mausam:**
- 🌡️ Temperature: **${temp}°C** (feels like ${feels}°C)
- 💧 Humidity: ${humidity}%
- 🌬️ Wind: ${wind} m/s
- ☁️ Sky: ${desc}`;
  } catch (e) {
    return "Weather fetch karne mein error aaya.";
  }
};

// NPR Currency Converter
export const getNPRExchangeRate = async (fromCurrency: string, amount: number): Promise<string> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_EXCHANGERATE_API_KEY;
    if (!apiKey) return "Exchange rate API key missing.";
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/NPR`);
    if (!res.ok) return "Exchange rate fetch nahi ho saka.";
    const data = await res.json();
    const rates = data.conversion_rates;
    const to = fromCurrency.toUpperCase();
    if (!rates[to]) return `${to} currency nahi mili.`;
    const converted = (amount * rates[to]).toFixed(2);
    const usd = (amount * rates['USD']).toFixed(4);
    const inr = (amount * rates['INR']).toFixed(2);
    return `💱 **NPR Currency Converter:**
- 🇳🇵 ${amount} NPR = **${converted} ${to}**
- 🇺🇸 ${amount} NPR = ${usd} USD
- 🇮🇳 ${amount} NPR = ${inr} INR`;
  } catch (e) {
    return "Currency convert karne mein error aaya.";
  }
};

// Nepal Live News (RSS)
export const getNepalNews = async (): Promise<string> => {
  try {
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://kathmandupost.com/rss')}&count=5`
    );
    if (!res.ok) throw new Error("RSS fetch failed");
    const data = await res.json();
    if (!data.items?.length) throw new Error("No items");
    const headlines = data.items.slice(0, 5).map((item: any, i: number) => 
      `${i + 1}. **${item.title}**`
    ).join('
');
    return `📰 **Nepal Ki Taza Khabrein (Kathmandu Post):**
${headlines}`;
  } catch (e) {
    // Fallback to another RSS
    try {
      const res2 = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://myrepublica.nagariknetwork.com/feed')}&count=5`
      );
      const data2 = await res2.json();
      const headlines2 = data2.items?.slice(0, 5).map((item: any, i: number) => 
        `${i + 1}. **${item.title}**`
      ).join('
') || "Khabrein load nahi ho sakin.";
      return `📰 **Nepal Ki Taza Khabrein:**
${headlines2}`;
    } catch {
      return "Nepal news abhi load nahi ho saki. Baad mein try karein.";
    }
  }
};

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

      // ─── Nepal Special Command Handlers ───

      // Weather
      if (text.includes("[NEPAL_WEATHER:")) {
        const match = text.match(/\[NEPAL_WEATHER:\s*(.*?)\]/);
        if (match) {
          const city = match[1].trim();
          const weatherText = await getNepalWeather(city);
          return { text: weatherText, candidates: [{ content: { parts: [{ text: weatherText }] } }] };
        }
      }

      // Currency
      if (text.includes("[NEPAL_CURRENCY:")) {
        const match = text.match(/\[NEPAL_CURRENCY:\s*([A-Z]+)\s*(\d+(?:\.\d+)?)\]/);
        if (match) {
          const toCurrency = match[1];
          const amount = parseFloat(match[2]);
          const currText = await getNPRExchangeRate(toCurrency, amount);
          return { text: currText, candidates: [{ content: { parts: [{ text: currText }] } }] };
        }
      }

      // News
      if (text.includes("[NEPAL_NEWS]")) {
        const newsText = await getNepalNews();
        return { text: newsText, candidates: [{ content: { parts: [{ text: newsText }] } }] };
      }

      // Date BS/AD
      if (text.includes("[NEPAL_DATE:")) {
        const match = text.match(/\[NEPAL_DATE:\s*(\d{4})-(\d{2})-(\d{2})\]/);
        if (match) {
          const bsDate = convertADtoBS(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
          const dateText = `📅 **Date Conversion:**
- AD: ${match[1]}-${match[2]}-${match[3]}
- BS: ${bsDate}`;
          return { text: dateText, candidates: [{ content: { parts: [{ text: dateText }] } }] };
        }
      }
      if (text.includes("[NEPAL_DATE_BS:")) {
        const match = text.match(/\[NEPAL_DATE_BS:\s*(\d{4})\]/);
        if (match) {
          const adYear = convertBStoAD(parseInt(match[1]));
          const dateText = `📅 **Date Conversion:**
- BS Year: ${match[1]}
- AD Year: ${adYear}`;
          return { text: dateText, candidates: [{ content: { parts: [{ text: dateText }] } }] };
        }
      }

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

    const messages: ChatCompletionMessageParam[] 
