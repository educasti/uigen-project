"use client";

import { Loader2, FilePlus, FilePen, FileSearch, FileX, FileCog } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state: string;
  args: Record<string, unknown>;
}

interface ToolInvocationDisplayProps {
  tool: ToolInvocation;
}

function getLabel(toolName: string, args: Record<string, unknown>): { icon: React.ReactNode; text: string } {
  const path = typeof args.path === "string" ? args.path : "";
  const filename = path.split("/").filter(Boolean).pop() ?? path;

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return { icon: <FilePlus className="w-3 h-3" />, text: `Creating ${filename}` };
      case "str_replace":
      case "insert":
        return { icon: <FilePen className="w-3 h-3" />, text: `Editing ${filename}` };
      case "view":
        return { icon: <FileSearch className="w-3 h-3" />, text: `Reading ${filename}` };
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "delete":
        return { icon: <FileX className="w-3 h-3" />, text: `Deleting ${filename}` };
      case "rename": {
        const newPath = typeof args.new_path === "string" ? args.new_path : "";
        const newFilename = newPath.split("/").filter(Boolean).pop() ?? newPath;
        return { icon: <FileCog className="w-3 h-3" />, text: `Renaming ${filename} to ${newFilename}` };
      }
    }
  }

  return { icon: <FileCog className="w-3 h-3" />, text: toolName };
}

export function ToolInvocationDisplay({ tool }: ToolInvocationDisplayProps) {
  const { icon, text } = getLabel(tool.toolName, tool.args);
  const isDone = tool.state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-600">{icon}</span>
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
