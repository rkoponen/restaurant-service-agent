import { tool } from "npm:langchain";
import z from "zod/v3";
import { changeAgent } from "./main.ts";

export const completeOrder = tool(
  ({ orderSummary }) => {
    console.log("Order marked as complete. Returning to orchestrator.");
    changeAgent("orchestratorAgent");
    return `Order completed successfully: ${orderSummary}. Customer has been returned to the main assistant.`;
  },
  {
    name: "complete_order",
    description:
      "Mark the order as complete and return control to the orchestrator. Use this after the customer has confirmed their order and you've presented the final order summary.",
    schema: z.object({
      orderSummary: z
        .string()
        .describe(
          "A brief summary of what was ordered (e.g., '1x Bacon Burger, Total: $12.99')"
        ),
    }),
  }
);

export const order = tool(
  async ({ restaurant, items }) => {
    const response = await fetch(
      `${Deno.env.get("API_BASE_URL")}/${restaurant}/order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      }
    );
    const orderConfirmation = await response.json();

    console.log(orderConfirmation);

    return JSON.stringify(orderConfirmation);
  },
  {
    name: "place_order",
    description: "Place a food order with the specified restaurant.",
    schema: z.object({
      restaurant: z
        .enum(["burger", "pizza", "salad"])
        .describe("The restaurant to place the order with"),
      items: z
        .array(
          z.object({
            id: z.number().describe("The menu item ID from the menu"),
            quantity: z.number().min(1).describe("The quantity to order"),
          })
        )
        .describe("The list of items to order with their IDs and quantities"),
    }),
  }
);

export const getMenu = tool(
  async ({ restaurant }) => {
    const response = await fetch(
      `${Deno.env.get("API_BASE_URL")}/${restaurant}/menu`
    );
    const menu = await response.json();

    return JSON.stringify(menu);
  },
  {
    name: "get_menu",
    schema: z.object({
      restaurant: z
        .enum(["burger", "pizza", "salad"])
        .describe("The restaurant to get the menu from"),
    }),
    description:
      "Fetches the burger restaurant's menu items including names, descriptions, and prices.",
  }
);
