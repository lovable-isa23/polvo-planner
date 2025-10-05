import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, pendingOrders } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build system prompt with pending orders context
    const systemPrompt = `You are a helpful assistant for the Polvo Planner bakery. You can help the user decide on pending orders.
The current pending orders are:
${JSON.stringify(pendingOrders)}

You have tools to approve, reject, and list orders.
When asked to do something, you can use the tools. For example, if the user says "approve the croissant order", you should find the order ID for the croissant order and use the approveOrder tool.
If you are asked a question, answer it.
If you use a tool, the system will execute it and return the result.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'approveOrder',
              description: 'Approve a pending order',
              parameters: {
                type: 'object',
                properties: {
                  orderId: {
                    type: 'string',
                    description: 'The ID of the order to approve'
                  }
                },
                required: ['orderId'],
                additionalProperties: false
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'rejectOrder',
              description: 'Reject a pending order',
              parameters: {
                type: 'object',
                properties: {
                  orderId: {
                    type: 'string',
                    description: 'The ID of the order to reject'
                  }
                },
                required: ['orderId'],
                additionalProperties: false
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'listPendingOrders',
              description: 'List all pending orders',
              parameters: {
                type: 'object',
                properties: {},
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: 'auto'
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI gateway error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const message = data.choices[0].message;

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Decision chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
