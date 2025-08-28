"use client";

import { useCallback, useRef, useState, useEffect, useId } from "react";
import type { ChatStatus } from "ai";

import { TopBar } from "@/components/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ToolHistorySidebar } from "@/components/tool-history-sidebar";
import { useApiKey } from "@/hooks/use-api-key";
import { useToolHistory, usePreferences, TOOL_IDS } from "@/lib/storage";
import { Copy, RotateCcw, Trash2 } from "lucide-react";

export default function ContactCardGeneratorPage() {
  const { hasApiKey, apiKey } = useApiKey();
  const toolHistory = useToolHistory(TOOL_IDS.CONTACT_CARD_GENERATOR, {
    apiKey,
  });
  const { preferences } = usePreferences();
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const companyId = useId();
  const titleId = useId();
  const addressId = useId();
  const websiteId = useId();
  const notesId = useId();

  const [selectedModel, setSelectedModel] = useState(preferences.defaultModel);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [format, setFormat] = useState("vcard");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
  const [copiedResult, setCopiedResult] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Load current execution data
  useEffect(() => {
    if (toolHistory.isLoaded && toolHistory.currentExecution) {
      const execution = toolHistory.currentExecution;
      if (execution.inputs?.name) {
        setName(execution.inputs.name);
      }
      if (execution.inputs?.email) {
        setEmail(execution.inputs.email);
      }
      if (execution.inputs?.phone) {
        setPhone(execution.inputs.phone);
      }
      if (execution.inputs?.company) {
        setCompany(execution.inputs.company);
      }
      if (execution.inputs?.title) {
        setTitle(execution.inputs.title);
      }
      if (execution.inputs?.address) {
        setAddress(execution.inputs.address);
      }
      if (execution.inputs?.website) {
        setWebsite(execution.inputs.website);
      }
      if (execution.inputs?.notes) {
        setNotes(execution.inputs.notes);
      }
      if (execution.inputs?.format) {
        setFormat(execution.inputs.format);
      }
      if (execution.outputs?.result) {
        setResult(execution.outputs.result);
      }
      if (execution.settings?.selectedModel) {
        setSelectedModel(execution.settings.selectedModel);
      }
    }
  }, [toolHistory.isLoaded, toolHistory.currentExecution]);

  // Auto-focus input when API key is available
  useEffect(() => {
    if (hasApiKey && nameRef.current) {
      nameRef.current.focus();
    }
  }, [hasApiKey]);

  const clearForm = useCallback(() => {
    if (status === "streaming") return;
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setTitle("");
    setAddress("");
    setWebsite("");
    setNotes("");
    setResult("");
    toolHistory.clearActiveExecution();
  }, [status, toolHistory]);

  const copyResult = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
    } catch (error) {
      console.error("Failed to copy result:", error);
    }
  }, [result]);

  const handleSubmit = useCallback(async () => {
    if (
      !hasApiKey ||
      status === "submitted" ||
      status === "streaming" ||
      (!name.trim() && !email.trim() && !phone.trim())
    )
      return;

    setStatus("submitted");

    try {
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/contact-card-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          title: title.trim(),
          address: address.trim(),
          website: website.trim(),
          notes: notes.trim(),
          format,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      if (!response.body) {
        const text = await response.text();
        setResult(text);
        setStatus(undefined);
        controllerRef.current = null;
        return;
      }

      setStatus("streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let resultContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultContent += decoder.decode(value, { stream: true });
        setResult(resultContent);
      }

      resultContent += decoder.decode();
      setResult(resultContent);

      controllerRef.current = null;
      setStatus(undefined);

      // Save execution
      if (!toolHistory.currentExecution) {
        await toolHistory.createNewExecution(
          {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            company: company.trim(),
            title: title.trim(),
            address: address.trim(),
            website: website.trim(),
            notes: notes.trim(),
            format,
          },
          { selectedModel }
        );
      }
      toolHistory.updateCurrentExecution({
        inputs: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          title: title.trim(),
          address: address.trim(),
          website: website.trim(),
          notes: notes.trim(),
          format,
        },
        outputs: { result: resultContent },
        settings: { selectedModel },
      });
    } catch (error) {
      controllerRef.current = null;
      if (error instanceof Error && error.name === "AbortError") {
        setStatus(undefined);
      } else {
        setResult(
          "Sorry, an error occurred while generating the contact card."
        );
        setStatus("error");
      }
    }
  }, [
    hasApiKey,
    apiKey,
    name,
    email,
    phone,
    company,
    title,
    address,
    website,
    notes,
    format,
    status,
    toolHistory,
    selectedModel,
  ]);

  const regenerateCard = useCallback(async () => {
    if (
      status === "streaming" ||
      (!name.trim() && !email.trim() && !phone.trim())
    )
      return;
    await handleSubmit();
  }, [status, name, email, phone, handleSubmit]);

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await handleSubmit();
    },
    [handleSubmit]
  );

  return (
    <div className="h-screen overflow-hidden flex">
      {/* Tool History Sidebar */}
      <ToolHistorySidebar
        executions={toolHistory.executions}
        activeExecutionId={toolHistory.activeExecutionId}
        onSelectExecution={toolHistory.switchToExecution}
        onDeleteExecution={toolHistory.deleteExecution}
        onRenameExecution={toolHistory.renameExecution}
        onNewExecution={async () => {
          if (status !== "streaming") {
            clearForm();
            await toolHistory.createNewExecution(
              {
                name: "",
                email: "",
                phone: "",
                company: "",
                title: "",
                address: "",
                website: "",
                notes: "",
                format: "vcard",
              },
              { selectedModel }
            );
          }
        }}
        toolName="Contact Card Generator"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar
          title="Contact Card Generator"
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />

        {/* Main content area */}
        <div className="flex-1 overflow-hidden p-6">
          {!hasApiKey ? (
            <div className="h-full flex items-center justify-center">
              <Card className="border-muted bg-muted/20 max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your Vercel AI Gateway API key in the top bar to
                    generate contact cards
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-6">
              {/* Input Form */}
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={nameId}>Full Name</Label>
                        <Input
                          ref={nameRef}
                          id={nameId}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={emailId}>Email Address</Label>
                        <Input
                          id={emailId}
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john.doe@example.com"
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={phoneId}>Phone Number</Label>
                        <Input
                          id={phoneId}
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select value={format} onValueChange={setFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vcard">vCard (.vcf)</SelectItem>
                            <SelectItem value="text">Plain Text</SelectItem>
                            <SelectItem value="html">HTML</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={companyId}>Company</Label>
                        <Input
                          id={companyId}
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Company Name"
                          disabled={status === "streaming"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={titleId}>Job Title</Label>
                        <Input
                          id={titleId}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Software Engineer"
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={addressId}>Address</Label>
                      <Textarea
                        id={addressId}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Main St, City, State 12345"
                        className="min-h-[60px] max-h-[100px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={websiteId}>Website</Label>
                        <Input
                          id={websiteId}
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://example.com"
                          disabled={status === "streaming"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={notesId}>Notes (Optional)</Label>
                      <Textarea
                        id={notesId}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional information, meeting notes, etc."
                        className="min-h-[60px] max-h-[100px] resize-none"
                        disabled={status === "streaming"}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={
                          (!name.trim() && !email.trim() && !phone.trim()) ||
                          status === "streaming"
                        }
                      >
                        {status === "streaming"
                          ? "Generating..."
                          : "Generate Contact Card"}
                      </Button>
                      {status === "streaming" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (controllerRef.current) {
                              controllerRef.current.abort();
                              controllerRef.current = null;
                              setStatus(undefined);
                            }
                          }}
                        >
                          Stop
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={regenerateCard}
                        disabled={
                          status === "streaming" ||
                          (!name.trim() && !email.trim() && !phone.trim()) ||
                          !result
                        }
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearForm}
                        disabled={status === "streaming"}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Results */}
              {result && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Generated Contact Card
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyResult}
                        disabled={copiedResult}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {copiedResult ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                        {result}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading indicator */}
              {(status === "submitted" || status === "streaming") &&
                !result && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {status === "submitted"
                            ? "Processing contact information..."
                            : "Generating contact card..."}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
