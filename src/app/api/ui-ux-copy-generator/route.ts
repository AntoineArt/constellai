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
      productName,
      interfaceType,
      targetAudience,
      tone,
      includeMicrocopy,
      includeErrorMessages,
    } = body;

    const prompt = `You are an expert UX writer and interface copy specialist. Create comprehensive UI/UX copy for the following product:

Product Name: ${productName || "Product name"}
Interface Type: ${interfaceType || "Web application"}
Target Audience: ${targetAudience || "General users"}
Tone: ${tone || "Professional"}
Include Microcopy: ${includeMicrocopy ? "Yes" : "No"}
Include Error Messages: ${includeErrorMessages ? "Yes" : "No"}

Please create detailed UI/UX copy that includes:

1. Navigation and Menu Copy
   - Main navigation labels
   - Menu item descriptions
   - Breadcrumb text

2. Button and Action Copy
   - Primary action buttons
   - Secondary actions
   - Call-to-action text

3. Form and Input Copy
   - Field labels and placeholders
   - Validation messages
   - Helper text and instructions

4. Page and Section Headers
   - Page titles
   - Section headings
   - Subsection labels

5. Status and Feedback Messages
   - Success messages
   - Loading states
   - Progress indicators

6. Microcopy (if requested)
   - Tooltips and hints
   - Empty state messages
   - Onboarding text

7. Error Messages (if requested)
   - User-friendly error descriptions
   - Recovery suggestions
   - Technical error explanations

Format your response as:

## UI/UX Copy for [Product Name]

### Navigation & Menu
- **Main Navigation**: [navigation items with descriptions]
- **Menu Items**: [menu copy with context]

### Buttons & Actions
- **Primary Actions**: [main button copy]
- **Secondary Actions**: [secondary button copy]
- **Call-to-Action**: [CTA text variations]

### Forms & Inputs
- **Field Labels**: [form field labels]
- **Placeholders**: [input placeholder text]
- **Validation**: [validation messages]

### Headers & Titles
- **Page Titles**: [page header copy]
- **Section Headers**: [section titles]
- **Subsections**: [subsection labels]

### Status Messages
- **Success**: [success message examples]
- **Loading**: [loading state text]
- **Progress**: [progress indicators]

### Microcopy
[Detailed microcopy examples if requested]

### Error Messages
[User-friendly error messages if requested]

### Tone Guidelines
[Guidelines for maintaining consistent tone]`;

    const result = streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert UX writer and interface copy specialist who creates clear, user-friendly, and effective copy for digital interfaces. Focus on creating copy that is concise, helpful, and aligned with the product's tone and target audience.",
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
    console.error("UI/UX Copy Generator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate UI/UX copy" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
