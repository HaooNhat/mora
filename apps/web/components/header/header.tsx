"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Droplets } from "lucide-react";
import { motion } from "motion/react";
import { useTimerUIState } from "../features/timer/store/timer-store";
import TimerContainer from "../features/timer/timer-container";
import AvatarSetting from "./avatar-setting";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const UIState = useTimerUIState();
  const showTimer = UIState === "minimized";

  return (
    <header className={cn("", className)}>
      <motion.div
        initial={false}
        animate={{
          height: !showTimer ? 56 : 64,
        }}
        className="px-4 bg-card/80 backdrop-blur-sm border-2 rounded-2xl flex items-center justify-between"
      >
        <div className="flex-1 flex items-center justify-start gap-2 opacity-80">
          <Droplets className="size-4 md:size-4 lg:size-6 " />
          <span className="text-sm md:text-2xl font-semibold text-shadow-lg ">
            Mora
          </span>
        </div>

        {showTimer && (
          <div className="h-full flex-2 flex items-center justify-center">
            <TimerContainer className="h-full w-fit" />
          </div>
        )}
        {/* User setting */}
        <div className="flex-1 flex gap-2 md:gap-3 items-center justify-end">
          <AvatarSetting />
        </div>
      </motion.div>
    </header>
  );
}
