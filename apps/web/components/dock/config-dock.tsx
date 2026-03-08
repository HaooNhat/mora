"use client";

import { Button } from "@workspace/ui/components/button";
import {
  ChartLineIcon,
  FoldersIcon,
  RabbitIcon,
  UserIcon,
} from "@workspace/ui/components/lucide-animated-icons";
import { useIsMobile } from "@workspace/ui/hooks/useIsMobile";
import { cn } from "@workspace/ui/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { LayoutState } from "../features/main-page-container";

export const LOCAL_STORAGE_BG_KEY = "app-selected-background";

interface ConfigDockProps {
  handleSelect: (button: string, state: LayoutState) => void;
  layoutState: {
    mora: LayoutState;
    timer: LayoutState;
    tasks: LayoutState;
  };
}

const MotionButton = motion.create(Button);

export default function ConfigDock({
  handleSelect,
  layoutState,
}: ConfigDockProps) {
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const isMobile = useIsMobile(767);
  const [curHover, setCurHover] = useState<
    "Stats" | "Timer" | "Tasks" | "Profile" | null
  >(null);
  const [mounted, setMounted] = useState(false);

  const actions = [
    {
      label: "Mora",
      icon: RabbitIcon,
      onClick: () => {
        handleSelect(
          "mora",
          layoutState.mora === "minimized" ? "opened" : "minimized",
        );
      },
      layoutId: "mora-component",
      key: "mora",
      isActive: layoutState.mora !== "minimized",
    },
    {
      label: "Stats",
      icon: ChartLineIcon,
      onClick: () => {},
      key: "stats",
    },
    {
      label: "Profile",
      icon: UserIcon,
      onClick: () => {},
      key: "profile",
    },
    {
      label: "Tasks",
      icon: FoldersIcon,
      onClick: () => {
        handleSelect(
          "tasks",
          layoutState.tasks === "minimized" ? "opened" : "minimized",
        );
      },
      layoutId: "project-task-management",
      key: "tasks",
      isActive: layoutState.tasks !== "minimized",
    },
  ];

  useEffect(() => setMounted(true), []);

  if (!mounted) return <aside className="h-16 bg-background"></aside>;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: !isMobile ? 0.75 : 1, scale: 1 }}
        whileHover={{ opacity: 0.8 }}
        transition={{ type: "spring", duration: 1, bounce: 0.4 }}
        className={cn(
          "h-12 flex w-full items-center justify-evenly bg-background/75 hover:bg-background shadow-2xl z-50",
          "md:rounded-4xl md:border-2",
          !isMobile && "w-fit absolute bottom-4 left-1/2 -translate-x-1/2",
        )}
      >
        {!isOpened ? (
          <div className="w-12 selfce">/</div>
        ) : (
          <div className="flex items-center justify-start md:gap-2 md:px-2">
            {actions.map(
              ({ label, icon: Icon, onClick, layoutId, key, isActive }) => {
                // Hide the button if it's active (expanded)
                const shouldHide = isActive;

                return (
                  <AnimatePresence key={key} mode="wait">
                    {!shouldHide && (
                      <MotionButton
                        layoutId={layoutId}
                        variant="ghost"
                        size="default"
                        onClick={onClick}
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{
                          scale: 1.05,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: "easeOut",
                        }}
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => {
                          setCurHover(
                            label as "Stats" | "Timer" | "Tasks" | "Profile",
                          );
                        }}
                        onMouseLeave={() => {
                          setCurHover(null);
                        }}
                        className="rounded-4xl text-accent-foreground/70"
                      >
                        <Icon isHovered={curHover === label} />
                        <p className="text-sm">{label}</p>
                      </MotionButton>
                    )}
                  </AnimatePresence>
                );
              },
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}
