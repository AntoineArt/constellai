export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">ConstellAI</h1>
      <p className="mt-2 text-sm text-zinc-600">Bibliothèque d’outils IA.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <a className="border rounded-lg p-4 hover:bg-zinc-50" href="/chat">Chat</a>
        <a className="border rounded-lg p-4 hover:bg-zinc-50" href="/regex">Regex Generator</a>
      </div>
    </main>
  );
}
