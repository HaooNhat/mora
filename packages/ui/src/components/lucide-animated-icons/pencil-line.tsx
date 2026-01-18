"use client";

import type { Variants } from "motion/react";
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

export interface PencilLineIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface PencilLineIconProps extends HTMLAttributes<HTMLDivElement> {
  isHovered: boolean;
  size?: number;
}

const PATH_VARIANT: Variants = {
  normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
  animate: {
    pathLength: [0, 1],
    opacity: [0, 1],
    pathOffset: [1, 0],
  },
};

const PencilLineIcon = forwardRef<PencilLineIconHandle, PencilLineIconProps>(
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
        if (!isControlledRef.current) {
          controls.start("animate");
        } else {
          onMouseEnter?.(e);
        }
      },
      [controls, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start("normal");
        } else {
          onMouseLeave?.(e);
        }
      },
      [controls, onMouseLeave],
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
          className="lucide lucide-pencil-line-icon lucide-pencil-line"
        >
          <motion.path
            d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
            animate={controls}
            variants={PATH_VARIANT}
            transition={{
              delay: 0,
              duration: 0.4,
            }}
          />
          <motion.path
            d="m15 5 4 4"
            animate={controls}
            variants={PATH_VARIANT}
            transition={{
              delay: 0.2,
              duration: 0.4,
            }}
          />
          <motion.path
            d="M13 21h8"
            animate={controls}
            variants={PATH_VARIANT}
            transition={{
              delay: 0.4,
              duration: 0.4,
            }}
          />
        </svg>
      </div>
    );
  },
);

PencilLineIcon.displayName = "UserIcon";

export { PencilLineIcon };
