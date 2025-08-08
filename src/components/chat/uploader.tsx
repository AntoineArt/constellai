"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface Props {
  onUploaded: (files: Array<{ url: string; name?: string | null; kind: string }>) => void;
}

export function ChatUploader({ onUploaded }: Props) {
  return (
    <UploadButton<OurFileRouter>
      endpoint="attachments"
      onClientUploadComplete={(res) => {
        const files = (res ?? []).map((f) => ({ url: f.serverData.url as string, name: f.serverData.name as string, kind: f.serverData.type as string }));
        onUploaded(files);
      }}
      onUploadError={() => {}}
    />
  );
}


