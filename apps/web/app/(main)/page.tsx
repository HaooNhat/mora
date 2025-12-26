"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import ConfigDock, {
  LOCAL_STORAGE_BG_KEY,
} from "@/components/dock/config-dock";
import Header from "@/components/header/header";
import MoodCard from "@/components/mood/mood-card";
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
  // GPU layer
  "transition-[transform,opacity,filter,shadow] duration-700 ease-out",
  "will-change-transform",
  // Preserve 3D for nested elements
  "transform-3d",
);

const cardLighting = cn(
  "relative",
  "before:absolute before:inset-0 before:rounded-[inherit]",
  "before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-black/5",
  "before:opacity-0 before:transition-opacity before:duration-300",
  "hover:before:opacity-100 before:pointer-events-none",
);

const cardBase = cn(cardSurface, cardMotion, cardLighting);

/**
 * Main play page with dynamic background and timer
 * Protected - requires authentication
 */
function PlayPageContent() {
  // ==========================================================================
  // HOOKS
  // ==========================================================================

  // Background state (kept local as it's UI-specific)
  const [bgType, setBgType] = useState<BgTypes>("image");
  const [bgLink, setBgLink] = useState<string>("images/cozy-bedroom.jpg");

  const status = useTimerStore((state) => state.timerState.status);
  const isMobile = useIsMobile();

  const isFocusMode = status === "running";

  const card3DByMode = {
    idle: {
      left: cn(
        // Transform origin
        "origin-right",
        // 3D transforms with depth
        "rotate-y-15 -rotate-x-3 -translate-x-1/4 scale-60",
        // Transitions
        "transition-transform duration-500 ease-out",
        // GPU acceleration
        "will-change-transform",
        "hover:rotate-y-0 hover:rotate-x-0 hover:translate-x-0 hover:scale-100",
      ),
      center: cn(
        "origin-center",
        "rotate-y-0 rotate-x-0 scale-85",
        "hover:scale-100",
        "transition-transform duration-500 ease-out",
        "will-change-transform",
      ),
      right: cn(
        "origin-left",
        "-rotate-y-15 -rotate-x-3 translate-x-1/4 scale-60",
        "hover:rotate-y-0 hover:rotate-x-0 hover:translate-x-0 hover:scale-100",
        "transition-transform duration-500 ease-out",
        "will-change-transform",
      ),
    },
    focus: {
      left: cn(
        "rotate-y-0 rotate-x-0 translate-x-0 scale-100",
        // Reduce opacity
        // "opacity-40 blur-md brightness-75",
        "transition-transform duration-300 ease-out",
        "will-change-transform",
      ),
      center: cn(
        "rotate-y-0 rotate-x-0 scale-100",
        // "opacity-100 blur-0 brightness-100",
        "drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]",
        "transition-transform duration-300 ease-out",
        "will-change-transform",
      ),
      right: cn(
        "rotate-y-0 rotate-x-0 translate-x-0 scale-100",
        // "opacity-40 blur-md brightness-75",
        "transition-transform duration-300 ease-out",
        "will-change-transform",
      ),
    },
  };

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
            isFocusMode ? "p-0" : "md:p-4 lg:p-8",
          )}
        >
          <div
            className={cn(
              "h-full w-full flex flex-col transition-all duration-1000",
              isFocusMode
                ? "bg-transparent border-none"
                : "bg-background/50 md:border-2 md:rounded-xl",
            )}
          >
            <Header />

            <main
              className={cn(
                "flex-1 overflow-visible md:pb-6",
                "perspective-[1200px]",
                "perspective-origin-center",
              )}
            >
              <section
                className={cn(
                  "h-full w-full",
                  "transform-3d",
                  "flex items-center justify-evenly gap-4 p-1",
                )}
              >
                {!isMobile && (
                  <div
                    className={cn(
                      "w-full h-full flex flex-col max-w-md gap-2",
                      "transform-3d",
                    )}
                  >
                    {/* Mood & Journal Card */}
                    <MoodCard
                      className={cn(
                        "rounded-2xl flex-1",
                        cardBase,
                        card3D.left,
                      )}
                    />

                    <MusicCard
                      className={cn("rounded-2xl", cardBase, card3D.left)}
                    />
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col w-full h-full max-w-md",
                    "items-center justify-center",
                    "transform-3d",
                  )}
                >
                  <TimerCard
                    className={cn(
                      "rounded-2xl",
                      cardBase,
                      card3D.center,
                      isFocusMode &&
                        "shadow-[0_0_60px_-15px_rgba(var(--primary-rgb),0.8)]",
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

/**
 * Wrap content with ProtectedRoute
 */
export default function PlayPage() {
  return (
    <ProtectedRoute>
      <PlayPageContent />
    </ProtectedRoute>
  );
}
