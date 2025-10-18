"use client";

import { useState } from "react";
import { Clipboard, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

type CopyCommandButtonProps = {
  command: string;
};

export function CopyCommandButton({ command }: CopyCommandButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      variant={copied ? "secondary" : "outline"}
      size="sm"
      className="gap-2"
      onClick={handleCopy}
    >
      {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
      {copied ? "已复制" : "复制命令"}
    </Button>
  );
}
