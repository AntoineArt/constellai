import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: Request) {
	const { description, dialect } = (await req.json()) as { description: string; dialect: "ecmascript" | "pcre" };
	const prompt = `You are a regex generator. Given a description, output:\n1) A single regex pattern for the ${dialect} dialect, between backticks.\n2) A short human explanation (2-3 sentences).\n3) Code snippets in JS and Python showing usage.\nKeep it concise.`;
	const { text } = await generateText({ model: openai("gpt-4o-mini"), prompt: `${prompt}\nDescription: ${description}` });
	// naive extraction by backticks and markers
	const pattern = (text.match(/`([^`]+)`/m)?.[1] ?? text).trim();
	const explanationMatch = text.match(/\n\n([^#`][\s\S]*?)(?:\n\n|$)/);
	const explanation = (explanationMatch?.[1] ?? "").trim();
	const js = (text.match(/```(?:javascript|js)[\s\S]*?```/m)?.[0] ?? "").replace(/```(?:javascript|js)\n?|```/g, "").trim();
	const py = (text.match(/```(?:python|py)[\s\S]*?```/m)?.[0] ?? "").replace(/```(?:python|py)\n?|```/g, "").trim();
	return Response.json({ pattern, explanation, snippets: { js, py } });
}


