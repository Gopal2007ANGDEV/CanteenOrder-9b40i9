
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activeOrders, itemCount } = await req.json();

    const ONSPACE_AI_API_KEY = Deno.env.get('ONSPACE_AI_API_KEY');
    const ONSPACE_AI_BASE_URL = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!ONSPACE_AI_API_KEY || !ONSPACE_AI_BASE_URL) {
      throw new Error('OnSpace AI not configured');
    }

    const prompt = `You are an AI assistant for a college canteen ordering system.
This is an INSTANT ORDER. Estimate how many minutes until the order will be ready.

Current situation:
- Number of active orders in queue: ${activeOrders}
- Number of items in this order: ${itemCount}
- Average preparation time per item: 3-5 minutes
- Canteen has 2 cooking stations

Provide a realistic time estimate in minutes. Format: "Your order will be ready in approximately X-Y minutes"
Keep response under 15 words.`;

    const response = await fetch(`${ONSPACE_AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ONSPACE_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    const estimation = data.choices[0]?.message?.content || 'Estimated wait time: 10-15 minutes';

    return new Response(
      JSON.stringify({ estimation }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

