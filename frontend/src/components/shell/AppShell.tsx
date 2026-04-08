// 应用主壳层组件
"use client";

import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { PreviewPanel } from "./PreviewPanel";
import { useSandpackStore } from "@/store/sandpackStore";
import { Eye, Code2 } from "lucide-react";
import type { LayoutMode, AppShellProps } from "@/types/components";

/**
 * AppShell
 *
 * 职责：
 * - 管理整体布局结构（两列 / 预览全屏）
 * - 分配 Chat / Preview 的空间
 *
 * 不负责：
 * - 不处理任何业务逻辑
 * - 不关心 prompt / sandpack / AI
 * - 不直接依赖 store（未来可由上层注入）
 */

export function AppShell({ children }: AppShellProps) {
  const { viewMode, setViewMode } = useSandpackStore();

  /**
   * 当前布局模式
   *
   * split         : Chat + Preview
   * preview-only  : Preview 全屏
   */
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");

  /**
   * 布局控制方法
   * 注意：这里只是能力，不是业务触发
   */
  const showPreviewOnly = () => setLayoutMode("preview-only");
  const showSplit = () => setLayoutMode("split");

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-50">
      {/* 顶部 Header */}
      <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-3">
          {/*标题 */}
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <span>Exist-Agent-FE-Build</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500">
              Beta
            </span>
          </div>
        </div>

        {/* 中间 Toggle Controls */}
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === "preview"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Eye size={16} />
              预览
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === "code"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Code2 size={16} />
              代码
            </button>
          </div>
        </div>
      </header>

      {/* 下方主体内容：包含 Chat 和 Preview */}
      <main className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* 左侧 Chat 面板 */}
        <div
          className={`flex flex-col shrink-0 transition-all duration-300 ease-out ${
            layoutMode === "preview-only"
              ? "w-0 opacity-0 pointer-events-none"
              : "w-[400px] opacity-100"
          }`}
        >
          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <ChatPanel />
          </div>
        </div>

        {/* 右侧 Preview 面板 */}
        <div className="flex-1 relative bg-gray-50 transition-all duration-300 ease-out">
          <PreviewPanel
            layoutMode={layoutMode}
            onExitFullScreen={showSplit}
            onEnterFullScreen={showPreviewOnly}
          >
            {children}
          </PreviewPanel>
        </div>
      </main>
    </div>
  );
}
