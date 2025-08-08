"use client";

import { useState } from "react";

interface TestResult {
  isMatch: boolean;
  matches: Array<string>;
}

export default function RegexGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [dialect, setDialect] = useState("ecmascript");
  const [pattern, setPattern] = useState("");
  const [sample, setSample] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);

  function generate() {
    // v0: simple client-side placeholder; will be replaced by server call
    const p = ".+";
    setPattern(p);
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
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Regex Generator</h2>
      <div className="grid md:grid-cols-2 gap-4">
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
        </div>
      </div>
    </main>
  );
}


