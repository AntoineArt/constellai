import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: Request) {
	const { description, dialect } = (await req.json()) as { description: string; dialect: "ecmascript" | "pcre" };
	const prompt = `You are a regex generator. Given a description, output a single regex pattern for the ${dialect} dialect. Only output the pattern between backticks, no explanation.`;
	const { text } = await generateText({ model: openai("gpt-4o-mini"), prompt: `${prompt}\nDescription: ${description}` });
	return Response.json({ pattern: text.replaceAll("`", "").trim() });
}


