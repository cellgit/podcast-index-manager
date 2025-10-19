"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  collectionId: number;
  podcastId: number;
};

export function CollectionItemActions({ collectionId, podcastId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/library/collections/${collectionId}/items?podcastId=${podcastId}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : `移除失败（${response.status}）`,
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "移除失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-[11px]"
        onClick={handleRemove}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        移除
      </Button>
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
