import { streamText } from "ai";
import { getApiKeyFromHeaders } from "@/lib/ai-config";

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

    const { productName, productDescription, targetAudience, documentationType, features, includeScreenshots, includeTroubleshooting } = await req.json();

    const prompt = `You are an expert technical writer specializing in creating comprehensive user documentation. Create professional technical documentation based on the following information:

Product Name: ${productName || "Product name"}
Product Description: ${productDescription || "Product description"}
Target Audience: ${targetAudience || "General users"}
Documentation Type: ${documentationType || "User Manual"}
Features: ${features || "No specific features provided"}
Include Screenshots: ${includeScreenshots ? "Yes" : "No"}
Include Troubleshooting: ${includeTroubleshooting ? "Yes" : "No"}

Please create comprehensive technical documentation that includes:
1. Table of Contents
2. Introduction and Overview
3. Getting Started Guide
4. Feature Documentation
5. Step-by-step Instructions
6. Configuration and Settings
7. Best Practices and Tips
8. Troubleshooting Guide (if requested)
9. FAQ Section
10. Glossary of Terms
11. Screenshot Placeholders (if requested)
12. Index and Cross-references

Format your response as:
## Technical Documentation: [Product Name]

### Table of Contents
[structured table of contents]

### Introduction
[product overview and purpose]

### Getting Started
[installation, setup, and first steps]

### Features and Functionality
[detailed feature documentation]

### User Guide
[step-by-step instructions for common tasks]

### Configuration
[settings and customization options]

### Best Practices
[recommendations and tips]

### Troubleshooting
[common issues and solutions if requested]

### FAQ
[frequently asked questions]

### Glossary
[technical terms and definitions]

### Screenshots and Visual Aids
[screenshot descriptions and placement if requested]`;

    const result = streamText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert technical writer with extensive experience in creating clear, comprehensive, and user-friendly documentation. Focus on creating documentation that is accessible to the target audience while being thorough and well-structured.",
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
    console.error("Technical Documentation Writer error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate technical documentation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
