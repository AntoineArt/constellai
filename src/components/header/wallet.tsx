"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function formatUsdMicro(micro: bigint): string {
  const sign = micro < 0n ? "-" : "";
  const abs = micro < 0n ? -micro : micro;
  const dollars = Number(abs) / 1_000_000;
  return `${sign}$${dollars.toFixed(2)}`;
}

export function WalletInfo() {
  const summary = useQuery(api.index.getWalletSummary);
  const limits = useQuery(api.index.getLimitsSummary);
  const limitedExhausted = !!limits && limits.isLimited && limits.usedTodayUsdMicro >= limits.dailyQuotaUsdMicro;
  return (
    <div className="flex items-center gap-3">
      {summary ? (
        <span className="text-sm text-zinc-700">{formatUsdMicro(summary.balanceUsdMicro as unknown as bigint)}</span>
      ) : null}
      {limitedExhausted ? (
        <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">Limited mode exhausted</span>
      ) : null}
    </div>
  );
}


