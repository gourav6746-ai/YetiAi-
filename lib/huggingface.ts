// huggingface.ts
export const runtime = "nodejs"; // ✅ Ensure Node.js runtime for Buffer support

import fs from "fs";
import path from "path";

// Example function to send image buffer to HuggingFace Inference API
export async function sendImageToHuggingFace(imageBuffer: Buffer) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/YOUR_MODEL", // Replace with your model
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/octet-stream", // Required for binary data
        },
        body: new Uint8Array(imageBuffer), // 🔹 Fixed type error
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending image to HuggingFace:", error);
    throw error;
  }
}

// Optional: function to load an image file as buffer
export function loadImageAsBuffer(filePath: string): Buffer {
  const absolutePath = path.resolve(filePath);
  return fs.readFileSync(absolutePath);
}
