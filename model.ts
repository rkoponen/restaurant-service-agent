import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Load environment variables from .env file
await load({ export: true });

export const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0.7,
  apiKey: Deno.env.get("GOOGLE_GENAI_API_KEY") ?? "",
});
