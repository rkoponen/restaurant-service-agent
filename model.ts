import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai";

export const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0.7,
  apiKey: Deno.env.get("GOOGLE_GENAI_API_KEY") ?? "",
});
