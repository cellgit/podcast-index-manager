"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Hash, Link2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ImportPayload =
  | { feedUrl: string }
  | { feedId: number }
  | { guid: string }
  | { itunesId: number };

type ImportState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export function PodcastImportPanel() {
  const router = useRouter();
  const [syncEpisodes, setSyncEpisodes] = useState(true);
  const [state, setState] = useState<ImportState>({
    status: "idle",
    message: "",
  });

  const [feedUrlValue, setFeedUrlValue] = useState("");
  const [feedIdValue, setFeedIdValue] = useState("");
  const [guidValue, setGuidValue] = useState("");
  const [itunesValue, setItunesValue] = useState("");

  const handleSubmit =
    (payloadBuilder: () => ImportPayload | null) =>
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const payload = payloadBuilder();
      if (!payload) {
        return;
      }
      setState({ status: "loading", message: "正在导入订阅源…" });
      try {
        const response = await fetch("/api/podcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            syncEpisodes,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          const errorMessage =
            typeof result?.error === "string"
              ? result.error
              : `导入失败（${response.status}）`;
          throw new Error(errorMessage);
        }

        setFeedUrlValue("");
        setFeedIdValue("");
        setGuidValue("");
        setItunesValue("");
        setState({
          status: "success",
          message:
            typeof result?.podcast?.title === "string"
              ? `成功导入《${result.podcast.title}》`
              : "订阅源已导入目录",
        });
        router.refresh();
      } catch (error) {
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "导入失败，请稍后重试",
        });
      }
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 bg-muted/40 px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">同步节目</p>
          <p className="text-xs text-muted-foreground">
            启用后在导入成功时即刻抓取最新节目；关闭则仅创建目录稍后手动同步。
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            checked={syncEpisodes}
            onChange={(event) => setSyncEpisodes(event.target.checked)}
          />
          {syncEpisodes ? "已开启" : "已关闭"}
        </label>
      </div>

      <form
        className="space-y-2 rounded-md border border-border/60 bg-background p-4"
        onSubmit={handleSubmit(() => {
          if (!feedUrlValue.trim()) {
            return null;
          }
          return { feedUrl: feedUrlValue.trim() };
        })}
      >
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="import-feed-url" className="text-sm font-medium text-foreground">
            通过 RSS 地址导入
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="import-feed-url"
            placeholder="https://example.com/feed.xml"
            value={feedUrlValue}
            onChange={(event) => setFeedUrlValue(event.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={state.status === "loading"}>
            {state.status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "导入"
            )}
          </Button>
        </div>
      </form>

      <form
        className="space-y-2 rounded-md border border-border/60 bg-background p-4"
        onSubmit={handleSubmit(() => {
          const parsed = Number.parseInt(feedIdValue, 10);
          if (!Number.isFinite(parsed)) {
            return null;
          }
          return { feedId: parsed };
        })}
      >
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="import-feed-id" className="text-sm font-medium text-foreground">
            通过 PodcastIndex Feed ID 导入
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="import-feed-id"
            placeholder="例如 920666"
            value={feedIdValue}
            onChange={(event) => setFeedIdValue(event.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={state.status === "loading"}>
            {state.status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "导入"
            )}
          </Button>
        </div>
      </form>

      <form
        className="space-y-2 rounded-md border border-border/60 bg-background p-4"
        onSubmit={handleSubmit(() => {
          if (!guidValue.trim()) {
            return null;
          }
          return { guid: guidValue.trim() };
        })}
      >
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="import-guid" className="text-sm font-medium text-foreground">
            通过 Podcast GUID 导入
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="import-guid"
            placeholder="9b024349-ccf0-5f69-a609-6b82873eab3c"
            value={guidValue}
            onChange={(event) => setGuidValue(event.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={state.status === "loading"}>
            {state.status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "导入"
            )}
          </Button>
        </div>
      </form>

      <form
        className="space-y-2 rounded-md border border-border/60 bg-background p-4"
        onSubmit={handleSubmit(() => {
          const parsed = Number.parseInt(itunesValue, 10);
          if (!Number.isFinite(parsed)) {
            return null;
          }
          return { itunesId: parsed };
        })}
        id="import"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="import-itunes" className="text-sm font-medium text-foreground">
            通过 Apple Podcasts ID 导入
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="import-itunes"
            placeholder="例如 1441923632"
            value={itunesValue}
            onChange={(event) => setItunesValue(event.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={state.status === "loading"}>
            {state.status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "导入"
            )}
          </Button>
        </div>
      </form>

  <p
    className={cn(
      "text-sm",
      state.status === "error" ? "text-destructive" : "text-muted-foreground",
    )}
  >
    {state.message}
  </p>
    </div>
  );
}
