"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function ReferralActions() {
  const [busy, setBusy] = useState<boolean>(false);
  const generateMyReferralCode = useMutation(api.index.generateMyReferralCode);
  const applyReferralCodeForSelf = useMutation(api.index.applyReferralCodeForSelf);

  async function handleShowCode() {
    setBusy(true);
    try {
      const code = await generateMyReferralCode();
      alert(`Your referral code: ${code}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleRedeem() {
    const code = prompt("Enter referral code");
    if (!code) return;
    setBusy(true);
    try {
      await applyReferralCodeForSelf({ code: code.trim() });
      alert("Referral code applied");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to apply code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button className="text-xs underline disabled:opacity-50" onClick={handleShowCode} disabled={busy}>My code</button>
      <button className="text-xs underline disabled:opacity-50" onClick={handleRedeem} disabled={busy}>Redeem</button>
    </div>
  );
}


