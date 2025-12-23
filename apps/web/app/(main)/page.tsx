"use client";

import ConfigDock, {
  LOCAL_STORAGE_BG_KEY,
} from "@/components/dock/config-dock";
import Header from "@/components/header/header";
import MusicCard from "@/components/music/music-card";
import { ProjectsPanel } from "@/components/project/project-panel";
import TimerCard from "@/components/timer/timer-card";
import { useTimerStore } from "@workspace/frontend/stores/timer-store";
import { useIsMobile } from "@workspace/ui/hooks/useIsMobile";
import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

export type BgTypes = "color" | "video" | "image";

const cardSurface = cn(
  "bg-card/75 hover:bg-card/90",
  "md:border-2 md:rounded-4xl",
  // 3D depth shadows
  "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]",
  "hover:shadow-[0_35px_70px_-15px_rgba(0,0,0,0.6)]",
  // Glass morphism
  "backdrop-blur-xl backdrop-saturate-150",
  // Hide backface
  "backface-hidden",
  // Ring on hover
  "hover:ring-2 hover:ring-primary/80",
);

const cardMotion = cn(
  // Smooth transforms
  "transition-all duration-500 ease-out",
  // GPU layer
  "will-change-transform",
  // Preserve 3D for nested elements
  "transform-3d",
);

const cardLighting = cn(
  "before:absolute before:inset-0 before:rounded-[inherit]",
  "before:bg-gradient-to-bl before:from-white/10 before:to-black/5",
  "before:opacity-0 hover:before:opacity-100",
  "before:transition-opacity before:pointer-events-none",
);

const cardBase = cn(
  "relative",
  cardSurface,
  cardMotion,
  cardLighting,
  "backface-hidden",
  "transform-3d",
);

const card3DByMode = {
  idle: {
    left: cn(
      // Transform origin
      "origin-right",
      // 3D transforms with depth
      "rotate-y-15 -rotate-x-3 -translate-x-1/4 scale-60",
      // Hover state
      "hover:rotate-y-0 hover:rotate-x-0 hover:translate-x-0 hover:scale-100",
      // Transitions
      "transition-all duration-700 ease-out",
      // GPU acceleration
      "will-change-transform",
    ),
    center: cn(
      "origin-center",
      // Center card slightly forward
      "rotate-y-0 rotate-x-0 scale-80",
      "hover:scale-100",
      "transition-all duration-500 ease-out",
      "will-change-transform",
    ),
    right: cn(
      "origin-left",
      // Mirror left side
      "-rotate-y-15 -rotate-x-3 translate-x-1/4 scale-60",
      "hover:rotate-y-0 hover:rotate-x-0 hover:translate-x-0 hover:scale-100",
      "transition-all duration-700 ease-out",
      "will-change-transform",
    ),
  },
  focus: {
    // Flatten all cards when focusing
    left: cn(
      "rotate-y-0 rotate-x-0 translate-x-0 scale-100",
      // "opacity-50 blur-sm",
      "transition-all duration-500",
    ),
    center: cn(
      "rotate-y-0 rotate-x-0 scale-105",
      "opacity-100 blur-0",
      "transition-all duration-500",
    ),
    right: cn(
      "rotate-y-0 rotate-x-0 scale-100",
      // "opacity-50 blur-sm",
      "transition-all duration-500",
    ),
  },
};

/**
 * Main play page with dynamic background and timer
 */
export default function PlayPage() {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  // Background state (kept local as it's UI-specific)
  const [bgType, setBgType] = useState<BgTypes>("image");
  const [bgLink, setBgLink] = useState<string>("images/cozy-bedroom.jpg");

  const status = useTimerStore((state) => state.timerState.status);
  const isMobile = useIsMobile();

  // const prefersReducedMotion =
  //   typeof window !== 'undefined' &&
  //   window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFocusMode = status === "running";
  const card3D = isFocusMode ? card3DByMode.focus : card3DByMode.idle;

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  // Load saved background from localStorage
  useEffect(() => {
    try {
      const savedBg = localStorage.getItem(LOCAL_STORAGE_BG_KEY);
      if (savedBg) {
        const { type, link } = JSON.parse(savedBg);
        setBgType(type);
        setBgLink(link);
      }
    } catch (err) {
      console.error("Failed to load background from localStorage:", err);
    }
  }, []);

  // ==========================================================================
  // RENDER LOGICS
  // ==========================================================================
  const BackgroundImage = () => {
    return (
      <div className="absolute inset-0 w-full h-full">
        {bgType === "image" && (
          <Image
            src={`/${bgLink}`}
            alt="Background Image"
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            priority
          />
        )}
        {bgType === "video" && (
          <video
            src={`/${bgLink}`}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <BackgroundImage />
      </div>

      {/* Main content */}
      <div className="relative h-dvh md:h-screen transition-all duration-1000">
        <div
          className={cn(
            "absolute inset-0 h-full w-full max-w-[1920px] transition-all duration-1000",
            status === "running" ? "p-0" : "md:p-4 lg:p-8",
          )}
        >
          <div
            className={cn(
              "h-full w-full flex flex-col transition-all duration-1000",
              status === "running"
                ? "bg-transparent border-none"
                : "bg-background/50 md:border-2 md:rounded-xl",
            )}
          >
            <Header />

            <main
              className={cn(
                "flex-1 overflow-visible md:pb-6",
                // 3D perspective context
                "perspective-[1200px]",
                // Perspective origin (eye position)
                "perspective-origin-center",
              )}
            >
              <section
                className={cn(
                  "h-full w-full",
                  // Preserve 3D space for children
                  "transform-3d",
                  // Layout
                  "flex items-center justify-evenly gap-4 md:p-1",
                )}
              >
                {!isMobile && (
                  <div className="w-full h-full transform-3d flex flex-col max-w-md gap-2">
                    <div
                      className={cn(
                        "flex-1 rounded-2xl",
                        cardBase,
                        card3D.left,
                      )}
                    />
                    <MusicCard
                      className={cn("rounded-2xl", cardBase, card3D.left)}
                    />
                  </div>
                )}

                <div className="origin-center flex flex-col w-full h-full max-w-md items-center justify-center">
                  <TimerCard
                    className={cn(
                      "h-full md:h-fit md:rounded-2xl",
                      cardBase,
                      !isMobile && card3D.center,
                    )}
                  />
                </div>

                {!isMobile && (
                  <ProjectsPanel className={cn(cardBase, card3D.right)} />
                )}
              </section>
            </main>

            <ConfigDock setBgType={setBgType} setBgLink={setBgLink} />
          </div>
        </div>
      </div>
    </>
  );
}
