import { createAgent } from "npm:langchain";
import { model } from "../model.ts";
import { MemorySaver } from "npm:@langchain/langgraph";
import { tool } from "npm:langchain";
import z from "zod/v3";
import { changeAgent } from "../main.ts";

const checkpointer = new MemorySaver();

const restaurantDirectory = [
  {
    name: "Pizza Palace",
    type: "pizza",
    pricePoint: "moderate",
    description: "Italian-style pizzas with fresh ingredients",
  },
  {
    name: "Burger House",
    type: "burger",
    pricePoint: "cheap",
    description: "Fast and affordable burgers",
  },
  {
    name: "Fresh Greens",
    type: "salad",
    pricePoint: "moderate",
    description: "Healthy salads and fresh options",
  },
];

const getNearbyRestaurants = tool(
  () => {
    const restaurantList = restaurantDirectory
      .map(
        (r) =>
          `${r.name} (${r.type}): ${r.pricePoint} price point - ${r.description}`
      )
      .join("\n");
    return `Nearby restaurants:\n${restaurantList}`;
  },
  {
    name: "get_nearby_restaurants",
    description:
      "Get a list of nearby restaurants available for ordering food, including their price points (cheap, moderate, expensive) and descriptions.",
  }
);

const switchAgent = tool(
  (agent_name) => {
    changeAgent(agent_name.agent_name);
    return `Switching to ${agent_name.agent_name}`;
  },
  {
    name: "switch_to_restaurant",
    description:
      "Switch to a restaurant specialist to help the driver order food. Use pizzaAgent for pizza, burgerAgent for burgers, saladAgent for healthy options.",
    schema: z.object({
      agent_name: z
        .enum(["pizzaAgent", "burgerAgent", "saladAgent"])
        .describe("The restaurant agent to switch to"),
    }),
  }
);

export const orchestratorAgent = createAgent({
  model,
  systemPrompt: `You are an AI assistant helping a driver in their car. You're their helpful companion on the road.

PERSONALITY & VOICE:
- Be conversational, friendly, and attentive
- Speak naturally like a helpful co-pilot
- Keep responses brief and clear - the driver is driving!
- Be proactive in understanding what they need
- Stay focused on safety - don't distract them unnecessarily

YOUR ROLE:
- Listen to the driver's needs and respond helpfully
- You can automatically find nearby restaurants and connect them to customer service agents
- When they mention hunger or wanting food, offer restaurant options you've found nearby
- Ask clarifying questions if needed, but keep it simple
- When a customer returns from a restaurant agent after placing an order, acknowledge their completed order positively and ask if there's anything else you can help with

FOOD ASSISTANCE:
When the driver indicates they're hungry or want food:
1. Acknowledge their need and mention you're finding nearby options, use the 'get_nearby_restaurants' tool
2. Present ONLY the restaurant names and types (e.g., "Pizza Palace for pizza, Burger House for burgers, Fresh Greens for salads")
3. DO NOT mention price points unless the driver specifically asks about pricing or budget
4. If asked about price points, then share the pricing information naturally
5. Ask what they're in the mood for

IMPORTANT - AGENT SWITCHING:
When the driver chooses a restaurant, you MUST use the 'switch_to_restaurant' tool:
- For pizza/Pizza Palace → use switch_to_restaurant with agent_name: "pizzaAgent"
- For burgers/Burger House → use switch_to_restaurant with agent_name: "burgerAgent"  
- For salads/Fresh Greens → use switch_to_restaurant with agent_name: "saladAgent"

After calling the tool, the customer will be connected to that restaurant's specialist agent.

Keep it conversational and helpful. You're their road companion!`,
  checkpointer: checkpointer,
  tools: [switchAgent, getNearbyRestaurants],
});
