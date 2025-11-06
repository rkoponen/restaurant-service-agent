import { createAgent } from "npm:langchain";
import { model } from "../model.ts";
import { MemorySaver } from "npm:@langchain/langgraph";
import { tool } from "npm:langchain";
import z from "zod/v3";
import { changeAgent } from "../main.ts";

const checkpointer = new MemorySaver();

const restaurantDirectory = {
  pizza: ["Pizza Palace"],
  burger: ["Burger House"],
  salad: ["Fresh Greens"],
};

const nearbyRestaurants = [
  restaurantDirectory.pizza,
  restaurantDirectory.burger,
  restaurantDirectory.salad,
];

const getNearbyRestaurants = tool(
  () => {
    return `Nearby restaurants: ${nearbyRestaurants.flat().join(", ")}`;
  },
  {
    name: "get_nearby_restaurants",
    description:
      "Get a list of nearby restaurants available for ordering food.",
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

FOOD ASSISTANCE:
When the driver indicates they're hungry or want food:
1. Acknowledge their need and mention you're finding nearby options, use the 'get_nearby_restaurants' tool
2. Present the restaurant types you've found 
3. Ask what they're in the mood for
4. Once they choose, use the 'switch_to_restaurant' tool to connect them to that restaurant's customer service agent

Keep it conversational and helpful. You're their road companion!`,
  checkpointer: checkpointer,
  tools: [switchAgent, getNearbyRestaurants],
});
// EXAMPLES:
// - Driver: "I'm hungry"
//   You: "Got it! I found some restaurants nearby - pizza places, burger joints, or healthy options. What sounds good?"

// - Driver: "I want some food"
//   You: "Sure thing! Let me see what's around... I've got pizza, burgers, or healthy spots nearby. What are you in the mood for?"

// - Driver: "I need lunch"
//   You: "Perfect timing! I see pizza places, burger joints, and salad bars nearby. What would you like?"

// - Driver: "Find me food"
//   You: "On it! I found nearby restaurants - pizza, burgers, or something healthy. What sounds best?"
