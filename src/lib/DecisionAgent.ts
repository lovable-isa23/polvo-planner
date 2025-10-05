import OpenAI from "openai";
import { z } from "zod";
import { Order } from "@/types/pastry";
import { calculateROI } from "./calculations";
import { zodToJsonSchema } from "zod-to-json-schema";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const toolSchemas = {
  approveOrder: z.object({
    orderId: z.string().describe("The ID of the order to approve"),
  }),
  rejectOrder: z.object({
    orderId: z.string().describe("The ID of the order to reject"),
  }),
  listPendingOrders: z.object({}),
};

export async function chatWithAgent(
  messages: any[],
  pendingOrders: Order[]
): Promise<any> {
  const systemPrompt = `You are a helpful assistant for the Polvo Planner bakery. You can help the user decide on pending orders.
  The current pending orders are:
  ${JSON.stringify(
    pendingOrders.map((o) => ({
      id: o.id,
      name: o.name,
      quantity: o.quantity,
      pricePerBatch: o.pricePerBatch,
      profit: calculateROI(o).profit.toFixed(2),
    }))
  )}
  You have tools to approve, reject, and list orders.
  When asked to do something, you can use the tools. For example, if the user says "approve the croissant order", you should find the order ID for the croissant order and use the approveOrder tool.
  If you are asked a question, answer it.
  If you use a tool, the system will execute it and return the result.
  `;

  const response = await openai.chat.completions.create({
    model: "o3-mini",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    tools: [
      {
        type: "function",
        function: {
          name: "approveOrder",
          description: "Approve a pending order",
          parameters: zodToJsonSchema(toolSchemas.approveOrder),
        },
      },
      {
        type: "function",
        function: {
          name: "rejectOrder",
          description: "Reject a pending order",
          parameters: zodToJsonSchema(toolSchemas.rejectOrder),
        },
      },
      {
        type: "function",
        function: {
          name: "listPendingOrders",
          description: "List all pending orders",
          parameters: zodToJsonSchema(toolSchemas.listPendingOrders),
        },
      },
    ],
    tool_choice: "auto",
  });

  return response.choices[0].message;
}