"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Filter,
  LayoutDashboard,
  Library,
  ListChecks,
  Mic2,
  Settings,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type NavItem = {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  isActive: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "总览",
    icon: LayoutDashboard,
    href: "/overview",
    isActive: (pathname) => pathname === "/overview",
  },
  {
    id: "library",
    label: "内容库",
    icon: Library,
    href: "/library",
    isActive: (pathname) => pathname.startsWith("/library") || pathname.startsWith("/podcast"),
  },
  {
    id: "discover",
    label: "发现新内容",
    icon: Sparkles,
    href: "/discover",
    isActive: (pathname) =>
      pathname === "/discover" || pathname === "/discover/",
  },
  {
    id: "discover-filter",
    label: "新内容筛选",
    icon: Filter,
    href: "/discover/filter",
    isActive: (pathname) => pathname.startsWith("/discover/filter"),
  },
  {
    id: "tasks",
    label: "拉取任务",
    icon: ListChecks,
    href: "/tasks",
    isActive: (pathname) => pathname.startsWith("/tasks"),
  },
  {
    id: "queue",
    label: "队列面板",
    icon: Activity,
    href: "/dashboard/queue",
    isActive: (pathname) => pathname.startsWith("/dashboard/queue"),
  },
  {
    id: "settings",
    label: "系统设置",
    icon: Settings,
    href: "/settings",
    isActive: (pathname) => pathname.startsWith("/settings"),
  },
];

interface SidebarProps {
  pendingSyncs: number;
}

export function Sidebar({ pendingSyncs }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 flex-col border-r border-border/60 bg-background/80 backdrop-blur lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border/60 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mic2 className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">播客运维</p>
          <p className="text-xs text-muted-foreground">抓取控制台</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={
              item.isActive(pathname)
                ? "flex items-center gap-3 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium shadow transition-all hover:bg-primary/90"
                : "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-border/60 p-4">
        <Card className="border-dashed border-border/80 bg-muted/40">
          <CardHeader className="space-y-1.5 pb-3">
            <CardTitle className="text-sm font-semibold">自动化状态</CardTitle>
            <CardDescription className="text-xs">
              队列中共有 {pendingSyncs} 个同步任务,请确认 Worker 正常运行以保持内容最新。
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-center"
              asChild
            >
              <Link href="/tasks#workers">查看 Worker 状态</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </aside>
  );
}
