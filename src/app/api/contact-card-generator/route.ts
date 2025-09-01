import { streamText } from "ai";
import { getApiKeyFromHeaders, getModelFromRequest } from "@/lib/ai-config";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const apiKey = getApiKeyFromHeaders(new Headers(req.headers));

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key is required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set the API key as environment variable for this request
    process.env.AI_GATEWAY_API_KEY = apiKey;

    const body = await req.json();
    const model = getModelFromRequest(body);
    const {
      name,
      email,
      phone,
      company,
      title,
      address,
      website,
      notes,
      format,
    } = body;

    const prompt = `You are an expert in contact information management and vCard format. Create a professional contact card based on the following information:

Name: ${name || "Not provided"}
Email: ${email || "Not provided"}
Phone: ${phone || "Not provided"}
Company: ${company || "Not provided"}
Title: ${title || "Not provided"}
Address: ${address || "Not provided"}
Website: ${website || "Not provided"}
Notes: ${notes || "Not provided"}
Format: ${format || "vCard"}

Please create a properly formatted contact card that includes:
1. Standard vCard format (if requested)
2. QR code data for easy sharing
3. Alternative formats (text, HTML)
4. Contact validation and formatting
5. Professional presentation
6. Import instructions for various platforms

Format your response as:
## Contact Card
[your formatted contact information]

## vCard Format
\`\`\`vcf
[standard vCard format]
\`\`\`

## QR Code Data
[data for generating QR code]

## Alternative Formats
[other useful formats]

## Import Instructions
[how to import into different platforms]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert in contact management and vCard standards who creates professional, properly formatted contact cards that can be easily imported into various platforms and devices.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Contact Card Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate contact card" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
