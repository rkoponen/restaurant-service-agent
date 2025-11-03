import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai";
import { createAgent } from "npm:langchain";
import { MemorySaver } from "npm:@langchain/langgraph";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import z from "zod/v3";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0.7,
  apiKey: Deno.env.get("GOOGLE_GENAI_API_KEY") ?? "",
});

const systemPrompt = `You are a friendly and helpful restaurant customer service agent.
 You assist customers with their inquiries about restaurant services, menu items, reservations, and more.
 Always provide accurate and courteous responses to ensure a positive customer experience.
  Take orders when requested and confirm details with the customer.`;

// Create a memory saver to store conversation history per session
const checkpointer = new MemorySaver();

const responseFormat = z.object({
  response: z.string().describe("The agent's response to the user's message"),
});

const agent = createAgent({
  model,
  systemPrompt: systemPrompt,
  checkpointer: checkpointer,
  responseFormat: responseFormat,
});

const router = new Router();

router.get("/", (context) => {
  context.response.body = "hello world";
});

router.post("/chat", async (context) => {
  try {
    // Parse the request body
    const bodyJson = await context.request.body.json();

    const message = bodyJson.message;
    const sessionId = bodyJson.sessionId;

    // Validate required fields
    if (!message || typeof message !== "string") {
      context.response.status = 400;
      context.response.body = {
        error: "Field 'message' is required and must be a string",
      };
      return;
    }

    if (!sessionId || typeof sessionId !== "string") {
      context.response.status = 400;
      context.response.body = {
        error: "Field 'sessionId' is required and must be a string",
      };
      return;
    }

    // Configure the agent with the session ID
    const config = {
      configurable: { thread_id: sessionId },
    };

    // Invoke the agent with the user's message
    const llmResponse = await agent.invoke(
      { messages: [{ role: "user", content: message }] },
      config
    );

    // Extract the reply from the agent's response
    const reply = llmResponse.structuredResponse.response;

    // Send the response
    context.response.status = 200;
    context.response.body = {
      sessionId,
      reply,
    };
  } catch (error) {
    console.error("Error in /chat endpoint:", error);
    context.response.status = 500;
    context.response.body = { error: "Internal server error" };
  }
});

export function add(a: number, b: number): number {
  return a + b;
}

// Start the server when run directly
if (import.meta.main) {
  const app = new Application();

  app.use(router.routes());
  app.use(router.allowedMethods());

  const port = 8000;
  console.log(`🚀 Restaurant Agent API listening on http://localhost:${port}`);
  console.log(
    `POST /chat - Send messages with { "message": "...", "sessionId": "..." }`
  );

  await app.listen({ port });
}
