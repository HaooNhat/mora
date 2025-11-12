"use client";

import { Button } from "@workspace/ui/components/button";
import { useIsMobile } from "@workspace/ui/hooks/useIsMobile";
import { Filter, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ConfigDock() {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  const [mounted, setMounted] = useState(false);

  // Wait until after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid rendering before we know the actual theme
    return null;
  }

  return (
    <aside className="h-16 flex items-center justify-between">
      {!isMobile && <div className="flex-1"></div>}
      <div className="flex-1 flex items-center justify-evenly border-4 rounded-4xl px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant={"ghost"} size={"sm"}>
          <Filter />
        </Button>
      </div>
      {!isMobile && (
        <div className="flex-1 flex items-center justify-end gap-1 p-1 rounded-lg bg-background/50">
          <Button
            variant={theme === "light" ? "outline" : "ghost"}
            size={"sm"}
            onClick={() => {
              setTheme("light");
            }}
          >
            <Sun />
          </Button>
          <Button
            variant={theme === "dark" ? "outline" : "ghost"}
            size={"sm"}
            onClick={() => {
              setTheme("dark");
            }}
          >
            <Moon />
          </Button>
          <Button
            variant={theme === "system" ? "outline" : "ghost"}
            size={"sm"}
            onClick={() => {
              setTheme("system");
            }}
          >
            <Monitor />
          </Button>
        </div>
      )}
    </aside>
  );
}
