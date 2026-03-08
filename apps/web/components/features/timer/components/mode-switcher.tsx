import {
  HourglassIcon,
  TimerIcon,
} from "@workspace/ui/components/lucide-animated-icons";
import { cn } from "@workspace/ui/lib/utils";
import { motion, Variants } from "motion/react";
import { useState } from "react";
import { TimerMode } from "../domain/timer";
import { useTimerActions, useTimerMode } from "../store/timer-store";

interface ModeSwitcherProps {
  isExpanded: boolean;
  layoutDone: boolean;
}

const modes: { id: TimerMode; label: string; Icon: typeof TimerIcon }[] = [
  { id: "pomodoro", label: "Pomodoro", Icon: TimerIcon },
  { id: "stopwatch", label: "Stopwatch", Icon: HourglassIcon },
];

const modesVariants: Variants = {
  closed: {
    borderWidth: "0px",
  },
  opened: {
    borderWidth: "2px",
    transition: {
      duration: 0.5,
    },
  },
};

const iconVariants: Variants = {
  closed: {
    opacity: 0,
  },
  opened: {
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const labelVariants: Variants = {
  closed: { opacity: 0, x: -10 },
  opened: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function ModeSwitcher({ isExpanded, layoutDone }: ModeSwitcherProps) {
  const activeMode = useTimerMode();
  const { switchMode } = useTimerActions();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const activateMode = (modeId: TimerMode) => {
    if (modeId !== activeMode) {
      switchMode();
    }
  };

  const handleModeClick = (e: React.MouseEvent, modeId: TimerMode) => {
    e.stopPropagation();
    activateMode(modeId);
  };

  return (
    <motion.div className={cn("flex items-center justify-center h-fit py-1")}>
      {isExpanded ? (
        <motion.ul
          variants={modesVariants}
          style={{ borderRadius: 16 }}
          role="tablist"
          aria-label="Timer mode"
          className={cn("h-10 flex items-center justify-center gap-0.5 p-0.5")}
        >
          {modes.map((item) => {
            const isActive = item.id === activeMode;

            return (
              <motion.li
                key={item.id}
                data-active={isActive}
                onMouseEnter={() => {
                  if (!layoutDone) return;
                  setHoveredMode(item.id);
                }}
                onMouseLeave={() => {
                  if (!layoutDone) return;
                  setHoveredMode(null);
                }}
                onClick={(e) => handleModeClick(e, item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activateMode(item.id);
                  }
                }}
                className={cn(
                  "relative flex items-center gap-1.5 h-full list-none cursor-pointer px-2.5 text-xs font-medium rounded-lg transition-colors",
                  "bg-transparent text-foreground hover:text-foreground/80",
                )}
                aria-pressed={isActive}
                role="tab"
                aria-selected={isActive}
                tabIndex={0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  layoutId={`mode-${item.id}`}
                  animate={isActive || layoutDone ? "opened" : "closed"}
                  variants={iconVariants}
                  className="relative z-20"
                >
                  <item.Icon size={14} isHovered={hoveredMode === item.id} />
                </motion.div>

                <motion.span
                  variants={labelVariants}
                  className="relative z-20 text-[11px] font-medium"
                >
                  {item.label}
                </motion.span>

                {isActive && layoutDone && (
                  <motion.div
                    layoutId="mode-background"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ borderRadius: 12, height: "100%", width: "100%" }}
                    className="absolute inset-0 z-10 bg-primary/50"
                  ></motion.div>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      ) : (
        <motion.div className="w-9 h-9 flex items-center justify-center">
          {modes
            .filter((m) => {
              return m.id === activeMode;
            })
            .map((m) => {
              return (
                <motion.div key={m.id} layoutId={`mode-${m.id}`} className="">
                  <m.Icon size={14} isHovered={hoveredMode === m.id} />
                </motion.div>
              );
            })}
        </motion.div>
      )}
    </motion.div>
  );
}
