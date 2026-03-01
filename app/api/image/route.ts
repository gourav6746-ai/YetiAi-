import { NextRequest, NextResponse } from "next/server";
import { analyzeImageWithHF } from "@/lib/huggingface";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await analyzeImageWithHF(buffer);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Image processing failed" },
      { status: 500 }
    );
  }
}
