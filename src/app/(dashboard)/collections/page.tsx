import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { CollectionCreateForm } from "@/components/podcast/collection-create-form";
import { CollectionManageActions } from "@/components/podcast/collection-manage-actions";
import { CollectionItemActions } from "@/components/podcast/collection-item-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CollectionsPage() {
  if (!prisma) {
    return null;
  }

  const collections = await prisma.podcastCollection.findMany({
    orderBy: { updated_at: "desc" },
    include: {
      _count: { select: { items: true } },
      items: {
        orderBy: { position: "asc" },
        include: {
          podcast: {
            select: {
              id: true,
              title: true,
              author: true,
              artwork: true,
              image: true,
              podcast_index_id: true,
              editorial: {
                select: {
                  display_title: true,
                  display_author: true,
                  display_image: true,
                  status: true,
                  priority: true,
                  tags: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/60 bg-background/90 px-4 backdrop-blur sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">运营精选</p>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">收藏集管理</h1>
        </div>
      </header>

      <main className="flex-1 space-y-8 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">新建收藏集</CardTitle>
              <CardDescription>
                将重点播客整理成专题合集，可在运营活动或专题策划中快速引用。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CollectionCreateForm />
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">使用建议</CardTitle>
              <CardDescription>
                收藏集可用于运营专题、播客推荐、内容分发白名单等场景。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <p>• 为不同主题建立收藏集，例如「每周精选」「音乐播客」「重点监测」。</p>
              <p>• 配合内容库的收藏按钮，在导入或审核时快速归档。</p>
              <p>• 可以通过批量任务导出收藏集，或在 Worker 中按合集同步。</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          {collections.length === 0 ? (
            <Card className="border-dashed border-border/70">
              <CardHeader>
                <CardTitle className="text-base">暂无收藏集</CardTitle>
                <CardDescription>使用左侧表单创建第一个收藏集，开始运营策划。</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            collections.map((collection) => (
              <Card key={collection.id} className="border-border/70">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-foreground">{collection.name}</CardTitle>
                    {collection.description ? (
                      <CardDescription>{collection.description}</CardDescription>
                    ) : null}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">共 {collection._count.items} 条</Badge>
                      <span>最近更新：{new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false }).format(collection.updated_at)}</span>
                    </div>
                  </div>
                  <CollectionManageActions
                    id={collection.id}
                    name={collection.name}
                    description={collection.description}
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  {collection.items.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                      当前收藏集没有播客，可在内容库的收藏操作中加入。
                    </div>
                  ) : (
                    collection.items.map((item) => {
                      const podcast = item.podcast;
                      const editorial = podcast.editorial;
                      const displayTitle = editorial?.display_title ?? podcast.title;
                      const displayAuthor = editorial?.display_author ?? podcast.author ?? "未知作者";
                      const cover = editorial?.display_image ?? podcast.artwork ?? podcast.image ?? null;
                      return (
                        <div
                          key={podcast.id}
                          className="flex flex-col gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cover}
                                alt={displayTitle}
                                className="h-12 w-12 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs">
                                无封面
                              </div>
                            )}
                            <div className="space-y-1">
                              <Link
                                href={`/podcast/${podcast.id}`}
                                className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                              >
                                {displayTitle}
                              </Link>
                              <p className="text-xs text-muted-foreground">{displayAuthor}</p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                {typeof podcast.podcast_index_id === "number" ? (
                                  <span>Feed #{podcast.podcast_index_id}</span>
                                ) : null}
                                {editorial?.status ? (
                                  <Badge variant="outline" className="uppercase">
                                    {editorial.status}
                                  </Badge>
                                ) : null}
                                {editorial?.priority ? (
                                  <Badge variant="outline" className="uppercase">
                                    {editorial.priority}
                                  </Badge>
                                ) : null}
                                {editorial?.tags?.length ? (
                                  <span>标签：{editorial.tags.join(", ")}</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <CollectionItemActions collectionId={collection.id} podcastId={podcast.id} />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </main>
    </>
  );
}
