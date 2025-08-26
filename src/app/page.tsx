"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/top-bar";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tools } from "@/lib/tools";

export default function Hub() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;

    const query = searchQuery.toLowerCase();
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, typeof tools>();
    filteredTools.forEach((tool) => {
      const existing = categoryMap.get(tool.category) || [];
      categoryMap.set(tool.category, [...existing, tool]);
    });
    return Array.from(categoryMap.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [filteredTools]);

  return (
    <div className="flex h-screen flex-col">
      <TopBar title="AI Tools Hub" />

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="mb-8 space-y-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome to ConstellAI
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Discover powerful AI tools to enhance your workflow
              </p>
            </div>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No tools found</h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map(([category, categoryTools]) => (
                <div key={category}>
                  <h2 className="mb-4 text-xl font-semibold">{category}</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryTools.map((tool) => (
                      <Link key={tool.id} href={tool.href}>
                        <Card className="h-full transition-colors hover:bg-accent">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <tool.icon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-base">
                                  {tool.name}
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                  {tool.category}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription>
                              {tool.description}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
