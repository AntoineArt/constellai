declare namespace NodeJS {
	interface ProcessEnv {
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
		CLERK_SECRET_KEY: string;
		OPENAI_API_KEY?: string;
		UPLOADTHING_TOKEN?: string;
	}
}


