"use client";

import { useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const key = storage.getApiKey();
    if (key) setApiKey(key);
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      storage.setApiKey(apiKey.trim());
    } else {
      storage.clearApiKey();
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearAll = () => {
    if (window.confirm("This will clear all your progress, history, and settings. Continue?")) {
      storage.clearAll();
      setApiKey("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Claude API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your Anthropic API key to generate new practice questions on demand.
            Your key is stored locally and only sent directly to Anthropic&apos;s API.
          </p>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
            />
          </div>
          <Button onClick={handleSaveKey}>
            {saved ? "Saved!" : "Save API Key"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clear all locally stored data including exam history, cached questions, and settings.
          </p>
          <Button variant="destructive" onClick={handleClearAll}>
            Clear All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
