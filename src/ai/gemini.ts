import { GoogleGenAI, type Content } from "@google/genai";

import {
  itemReportReviewJsonSchema,
  itemReportReviewSchema,
  type ItemReportReview,
} from "../schemas/review";
import { EXAMPLES, MODEL, SYSTEM_PROMPT, wrap } from "./prompt";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to .env, and to Vercel.");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
}

export function buildContents(description: string): Content[] {
  const contents: Content[] = [];

  for (const example of EXAMPLES) {
    contents.push(
      {
        role: "user",
        parts: [{ text: wrap(example.description) }],
      },
      {
        role: "model",
        parts: [{ text: JSON.stringify(example.review) }],
      },
    );
  }

  contents.push({
    role: "user",
    parts: [{ text: wrap(description) }],
  });

  return contents;
}

export class AiReplyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiReplyError";
  }
}

export async function reviewItemReport(
  description: string,
): Promise<ItemReportReview> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: buildContents(description),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: itemReportReviewJsonSchema,
    },
  });

  const text = response.text;
  if (!text?.trim()) {
    throw new AiReplyError("Gemini returned no text.");
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AiReplyError("Gemini returned invalid JSON.");
  }

  const result = itemReportReviewSchema.safeParse(data);
  if (!result.success) {
    throw new AiReplyError("Gemini returned an invalid item report review.");
  }

  return result.data;
}
