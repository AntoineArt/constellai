"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface TestResult {
  isMatch: boolean;
  matches: Array<string>;
}
interface Snippets { js?: string; py?: string }

export default function RegexGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [dialect, setDialect] = useState("ecmascript");
  const [pattern, setPattern] = useState("");
  const [explanation, setExplanation] = useState("");
  const [snippets, setSnippets] = useState<Snippets>({});
  const [sample, setSample] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const createRegexSession = useMutation(api.index.createRegexSession);
  const sessions = useQuery(api.index.listMyRegexSessions) ?? [];

  async function generate() {
    const res = await fetch("/api/regex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: prompt, dialect }),
    });
    const data = (await res.json()) as { pattern: string; explanation?: string; snippets?: Snippets };
    setPattern(data.pattern);
    setExplanation(data.explanation ?? "");
    setSnippets(data.snippets ?? {});
    try {
      await createRegexSession({ prompt, dialect: dialect as any, pattern: data.pattern });
    } catch {}
  }

  function testRegex() {
    try {
      const re = new RegExp(pattern, "g");
      const matches = Array.from(sample.matchAll(re)).map((m) => m[0]);
      setResult({ isMatch: matches.length > 0, matches });
    } catch (e) {
      setResult({ isMatch: false, matches: [] });
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Regex Generator</h2>
      <div className="grid md:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-2">
          <label className="block text-sm">Description</label>
          <textarea className="w-full border rounded p-2" rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <div className="flex items-center gap-2">
            <label className="text-sm">Dialect</label>
            <select className="border rounded px-2 py-1" value={dialect} onChange={(e) => setDialect(e.target.value)}>
              <option value="ecmascript">JavaScript (ECMAScript)</option>
              <option value="pcre">PCRE</option>
            </select>
          </div>
          <button className="border rounded px-3 py-2" onClick={generate}>Générer</button>
          <div>
            <label className="block text-sm mt-2">Pattern</label>
            <input className="w-full border rounded p-2" value={pattern} onChange={(e) => setPattern(e.target.value)} />
          </div>
          {explanation ? (
            <div className="text-sm text-zinc-700">
              <div className="font-medium mt-2">Explanation</div>
              <p>{explanation}</p>
            </div>
          ) : null}
          {(snippets.js || snippets.py) ? (
            <div className="text-sm mt-2 space-y-2">
              {snippets.js ? (
                <div>
                  <div className="font-medium">JavaScript</div>
                  <pre className="border rounded p-2 overflow-auto text-xs"><code>{snippets.js}</code></pre>
                </div>
              ) : null}
              {snippets.py ? (
                <div>
                  <div className="font-medium">Python</div>
                  <pre className="border rounded p-2 overflow-auto text-xs"><code>{snippets.py}</code></pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Sample</label>
          <textarea className="w-full border rounded p-2" rows={10} value={sample} onChange={(e) => setSample(e.target.value)} />
          <button className="border rounded px-3 py-2" onClick={testRegex}>Tester</button>
          {result ? (
            <div className="text-sm">
              <div>Match: {result.isMatch ? "oui" : "non"}</div>
              {result.matches.length ? (
                <ul className="list-disc pl-5">
                  {result.matches.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <div className="border rounded p-2 h-[60vh] overflow-auto">
            <div className="text-sm text-zinc-600 mb-2">Recent sessions</div>
            {sessions.map((s: { _id: string; dialect: string; pattern: string }) => (
              <div key={s._id} className="border rounded p-2 mb-2">
                <div className="text-xs text-zinc-500">{s.dialect}</div>
                <div className="font-mono text-sm break-all">{s.pattern}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}


