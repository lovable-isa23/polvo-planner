import { Order } from "@/types/pastry";
import { calculateROI } from "./calculations";
import { supabase } from "@/integrations/supabase/client";

export async function chatWithAgent(
  messages: any[],
  pendingOrders: Order[]
): Promise<any> {
  // Prepare order summaries for the AI
  const orderSummaries = pendingOrders.map((o) => ({
    id: o.id,
    name: o.name,
    quantity: o.quantity,
    pricePerBatch: o.pricePerBatch,
    profit: calculateROI(o).profit.toFixed(2),
  }));

  try {
    const { data, error } = await supabase.functions.invoke('decision-chat', {
      body: {
        messages,
        pendingOrders: orderSummaries
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (!data || !data.message) {
      throw new Error('Invalid response from decision chat');
    }

    return data.message;
  } catch (error) {
    console.error('Chat with agent error:', error);
    throw error;
  }
}