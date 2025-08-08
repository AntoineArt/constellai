import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
	attachments: f({
		"application/pdf": { maxFileSize: "10MB" },
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "10MB" },
		"text/plain": { maxFileSize: "2MB" },
		"text/markdown": { maxFileSize: "2MB" },
		"text/csv": { maxFileSize: "5MB" },
		"image/*": { maxFileSize: "10MB" },
	})
		.middleware(async () => ({ userId: "anon" }))
		.onUploadComplete(async ({ file }) => {
			return { url: file.url, name: file.name, type: file.type, size: file.size };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;


