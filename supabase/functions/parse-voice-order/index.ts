import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedItem {
  name: string;
  quantity: number;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcription, availableMedicines } = await req.json();
    
    if (!transcription) {
      console.error("No transcription provided");
      return new Response(
        JSON.stringify({ error: "No transcription provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsing transcription:", transcription);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a pharmacy order parser. Extract medicine order details from customer transcriptions.

Context: Available medicines in the pharmacy include common over-the-counter and prescription medications.
${availableMedicines ? `Known medicines: ${availableMedicines.join(', ')}` : ''}

Your task:
1. Identify medicine names (match to known medicines if possible, or use the spoken name)
2. Extract quantities (default to 1 if not specified)
3. Note any special instructions or preferences
4. Flag any unclear or potentially dangerous requests`
          },
          {
            role: "user",
            content: `Parse this medicine order transcription and extract the items:\n\n"${transcription}"`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_order_items",
              description: "Extract medicine order items from the transcription",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { 
                          type: "string", 
                          description: "Medicine name as identified" 
                        },
                        quantity: { 
                          type: "number", 
                          description: "Number of units/packs requested" 
                        },
                        notes: { 
                          type: "string", 
                          description: "Special instructions or preferences" 
                        }
                      },
                      required: ["name", "quantity"],
                      additionalProperties: false
                    }
                  },
                  customerNotes: {
                    type: "string",
                    description: "General notes or delivery instructions from customer"
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence level in the parsing accuracy"
                  },
                  warnings: {
                    type: "array",
                    items: { type: "string" },
                    description: "Any warnings about unclear items or potential issues"
                  }
                },
                required: ["items", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_order_items" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("AI credits exhausted");
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to parse order");
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response");
      return new Response(
        JSON.stringify({ 
          items: [], 
          confidence: "low", 
          warnings: ["Could not parse order items"] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    console.log("Parsed result:", parsed);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Parse voice order error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
