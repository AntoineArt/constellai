"use client";

import { useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

interface Props {
  children: React.ReactNode;
  url: string;
}

export function ConvexClerkProvider({ children, url }: Props) {
  const client = useMemo(() => new ConvexReactClient(url), [url]);
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}


