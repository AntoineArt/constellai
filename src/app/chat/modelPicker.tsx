"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Props {
  current: string | undefined;
  onSelect: (modelId: string) => void;
}

export function ModelPicker({ current, onSelect }: Props) {
  const models = useQuery(api.index.listAllowedModels) ?? [];
  return (
    <div className="flex flex-wrap gap-2">
      {models.map((m) => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`border rounded px-2 py-1 text-xs ${current === m ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
        >
          {m}
        </button>
      ))}
      {models.length === 0 ? <span className="text-xs text-zinc-500">Limited mode exhausted</span> : null}
    </div>
  );
}


