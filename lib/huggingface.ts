export async function analyzeImageWithHF(imageBuffer: Buffer) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
      body: imageBuffer,
    }
  );

  if (!response.ok) {
    throw new Error("HuggingFace API Error");
  }

  return response.json();
}
