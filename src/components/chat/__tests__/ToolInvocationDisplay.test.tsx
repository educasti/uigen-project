import { test, expect, describe } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolInvocationDisplay } from "../ToolInvocationDisplay";

function makeTool(toolName: string, args: Record<string, unknown>, state = "call") {
  return { toolName, args, state };
}

describe("ToolInvocationDisplay — str_replace_editor", () => {
  test("create command shows filename", () => {
    render(<ToolInvocationDisplay tool={makeTool("str_replace_editor", { command: "create", path: "/src/App.jsx" })} />);
    expect(screen.getByText("Creating App.jsx")).toBeTruthy();
  });

  test("str_replace command shows editing label", () => {
    render(<ToolInvocationDisplay tool={makeTool("str_replace_editor", { command: "str_replace", path: "/components/Button.tsx" })} />);
    expect(screen.getByText("Editing Button.tsx")).toBeTruthy();
  });

  test("insert command shows editing label", () => {
    render(<ToolInvocationDisplay tool={makeTool("str_replace_editor", { command: "insert", path: "/App.jsx" })} />);
    expect(screen.getByText("Editing App.jsx")).toBeTruthy();
  });

  test("view command shows reading label", () => {
    render(<ToolInvocationDisplay tool={makeTool("str_replace_editor", { command: "view", path: "/App.jsx" })} />);
    expect(screen.getByText("Reading App.jsx")).toBeTruthy();
  });
});

describe("ToolInvocationDisplay — file_manager", () => {
  test("delete command shows filename", () => {
    render(<ToolInvocationDisplay tool={makeTool("file_manager", { command: "delete", path: "/src/Old.jsx" })} />);
    expect(screen.getByText("Deleting Old.jsx")).toBeTruthy();
  });

  test("rename command shows old and new filename", () => {
    render(<ToolInvocationDisplay tool={makeTool("file_manager", { command: "rename", path: "/src/Old.jsx", new_path: "/src/New.jsx" })} />);
    expect(screen.getByText("Renaming Old.jsx to New.jsx")).toBeTruthy();
  });
});

describe("ToolInvocationDisplay — unknown tool", () => {
  test("falls back to tool name", () => {
    render(<ToolInvocationDisplay tool={makeTool("unknown_tool", { path: "/foo.js" })} />);
    expect(screen.getByText("unknown_tool")).toBeTruthy();
  });
});

describe("ToolInvocationDisplay — loading vs done state", () => {
  test("shows spinner when state is call", () => {
    const { container } = render(
      <ToolInvocationDisplay tool={makeTool("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")} />
    );
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  test("shows green dot when state is result", () => {
    const { container } = render(
      <ToolInvocationDisplay tool={makeTool("str_replace_editor", { command: "create", path: "/App.jsx" }, "result")} />
    );
    expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
    expect(container.querySelector(".animate-spin")).toBeNull();
  });
});
