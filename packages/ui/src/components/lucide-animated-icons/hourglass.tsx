"use client";

import type { HTMLAttributes } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { motion, useAnimation } from "motion/react";
import { cn } from "@workspace/ui/lib/utils";

export interface HourglassIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface HourglassIconProps extends HTMLAttributes<HTMLDivElement> {
  isHovered: boolean;
  size?: number;
}

const HourglassIcon = forwardRef<HourglassIconHandle, HourglassIconProps>(
  (
    { onMouseEnter, onMouseLeave, isHovered, className, size = 28, ...props },
    ref,
  ) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isHovered) return;
        if (!isControlledRef.current) {
          controls.start("animate");
        } else {
          onMouseEnter?.(e);
        }
      },
      [controls, isHovered, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isHovered) return;
        if (!isControlledRef.current) {
          controls.start("normal");
        } else {
          onMouseLeave?.(e);
        }
      },
      [controls, isHovered, onMouseLeave],
    );

    useEffect(() => {
      if (isHovered && !isControlledRef.current) {
        controls.start("animate");
      }
      if (!isHovered && !isControlledRef.current) {
        controls.start("normal");
      }
    }, [controls, isHovered]);

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.g
            variants={{
              normal: {
                rotate: 0,
              },
              animate: {
                rotate: 180,
              },
            }}
            animate={controls}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              mass: 1,
            }}
            style={{
              transformOrigin: "12px 12px",
            }}
          >
            <path d="M5 22h14" />
            <path d="M5 2h14" />
            <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
            <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
          </motion.g>
        </svg>
      </div>
    );
  },
);

HourglassIcon.displayName = "HourglassIcon";

export { HourglassIcon };
