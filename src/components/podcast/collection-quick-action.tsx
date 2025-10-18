"use client";

import { useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Collection = {
  id: number;
  name: string;
  description?: string | null;
};

type Props = {
  podcastId: number;
  collections: Collection[];
};

export function CollectionQuickAction({ podcastId, collections }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleAdd = async (collectionId: number) => {
    setState("loading");
    setMessage(null);
    try {
      const response = await fetch(`/api/library/collections/${collectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ podcastId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          typeof payload?.error === "string" ? payload.error : `添加失败（${response.status}）`,
        );
      }
      setState("success");
      setMessage("已加入收藏集");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "添加失败");
    }
  };

  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 text-xs">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1 text-muted-foreground hover:text-primary"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        加入收藏集
      </button>
      {expanded ? (
        <div className="flex flex-wrap gap-2">
          {collections.map((collection) => (
            <Button
              key={collection.id}
              variant="outline"
              size="sm"
              className="h-6 text-[11px]"
              onClick={() => handleAdd(collection.id)}
              disabled={state === "loading"}
            >
              {state === "loading" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              {collection.name}
            </Button>
          ))}
        </div>
      ) : null}
      {message ? (
        <p className={cn("text-[11px]", state === "error" ? "text-destructive" : "text-muted-foreground")}>{message}</p>
      ) : null}
    </div>
  );
}
