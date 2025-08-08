export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[220px_1fr] min-h-[calc(100vh-49px)]">
      <aside className="border-r p-4 space-y-2">
        <a className="block px-2 py-1 rounded hover:bg-zinc-50" href="/chat">Chat</a>
        <a className="block px-2 py-1 rounded hover:bg-zinc-50" href="/regex">Regex</a>
      </aside>
      <section>{children}</section>
    </div>
  );
}


