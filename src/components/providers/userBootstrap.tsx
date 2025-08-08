"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function UserBootstrap() {
  const { isSignedIn } = useAuth();
  const ensureSelf = useMutation(api.index.ensureSelf);
  const ensureWalletWithWelcome = useMutation(api.index.ensureWalletWithWelcome);

  useEffect(() => {
    async function run() {
      if (!isSignedIn) return;
      try {
        const userId = await ensureSelf();
        await ensureWalletWithWelcome({ userId, welcomeUsdMicro: 5_000_000n as any });
      } catch {}
    }
    run();
  }, [isSignedIn, ensureSelf, ensureWalletWithWelcome]);

  return null;
}


