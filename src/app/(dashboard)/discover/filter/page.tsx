import Link from "next/link";
import { ArrowLeft, Filter } from "lucide-react";

import { PodcastFilterExplorer } from "@/components/podcast/podcast-filter-explorer";
import { Button } from "@/components/ui/button";

export default function DiscoverFilterPage() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                精准发现播客
              </p>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                新内容筛选
              </h1>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto gap-2 text-xs" asChild>
            <Link href="/discover">
              <ArrowLeft className="h-3.5 w-3.5" />
              返回发现页
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <PodcastFilterExplorer />
        </div>
      </main>
    </>
  );
}
