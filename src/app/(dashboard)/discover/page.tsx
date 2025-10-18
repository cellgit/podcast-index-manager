import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

import { PodcastDiscovery } from "@/components/podcast/podcast-discovery";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DiscoverPage() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">探索新增播客</p>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">发现新内容</h1>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto gap-2 text-xs" asChild>
            <Link href="/library">
              <ArrowLeft className="h-3.5 w-3.5" />
              返回内容库
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <Card className="border-border/70">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">PodcastIndex 推荐源</CardTitle>
              <CardDescription>
                按榜单、最新入库以及主题分类快速浏览潜在合作播客，挑选后可随项目同步至内容库。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PodcastDiscovery />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
