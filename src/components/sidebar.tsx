"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Library,
  ListChecks,
  Mic2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const NAV_ITEMS = [
  { id: "overview", label: "总览", icon: LayoutDashboard },
  { id: "library", label: "内容库", icon: Library },
  { id: "tasks", label: "拉取任务", icon: ListChecks },
  { id: "settings", label: "系统设置", icon: Settings },
] as const;

type NavItemId = (typeof NAV_ITEMS)[number]["id"];

interface SidebarProps {
  pendingSyncs: number;
}

export function Sidebar({ pendingSyncs }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<NavItemId>("overview");

  const handleNavClick = (itemId: NavItemId) => {
    setActiveTab(itemId);
    
    // 这里添加实际的导航逻辑
    // 目前只是模拟点击响应
    console.log(`导航到: ${itemId}`);
    
    // 你可以在这里添加更多功能,比如:
    // - 滚动到对应的内容区域
    // - 切换显示不同的内容
    // - 使用路由导航到不同页面等
    
    // 显示提示信息
    if (itemId !== "overview") {
      alert(`"${NAV_ITEMS.find(item => item.id === itemId)?.label}" 功能正在开发中...`);
    }
  };

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
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.id)}
            className={
              activeTab === item.id
                ? "flex items-center gap-3 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium shadow transition-all hover:bg-primary/90"
                : "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
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
              onClick={() => alert("Worker 状态查看功能正在开发中...")}
            >
              查看 Worker 状态
            </Button>
          </CardFooter>
        </Card>
      </div>
    </aside>
  );
}
