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

const cardSurface =
  "bg-card/75 hover:bg-card md:border-2 md:rounded-4xl md:shadow-xl hover:ring-2";

const cardMotion =
  "transition-transform duration-500 ease-out will-change-transform";

const cardBase = cn(cardSurface, cardMotion);

// const card3D = {
//   left: "origin-right rotate-y-30 scale-75 hover:rotate-y-0 hover:scale-100 hover:translate-y-0",
//   right: "origin-left -rotate-y-30 scale-75 hover:rotate-y-0 hover:scale-100",
//   center: "origin-center scale-80 hover:scale-100",
// };

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

  const isFocusMode = status === "running";

  const card3DByMode = {
    idle: {
      left: "origin-right rotate-y-30 scale-75 hover:rotate-y-0 hover:scale-100",
      right:
        "origin-left -rotate-y-30 scale-75 hover:rotate-y-0 hover:scale-100",
      center: "origin-center scale-80 hover:scale-100",
    },
    focus: {
      left: "translate-y-0",
      right: "translate-y-0",
      center: "origin-center scale-100",
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

            <main className="flex-1 perspective-[1200px] overflow-visible md:pb-6">
              <section className="h-full w-full transform-3d flex items-center justify-evenly gap-4 p-1">
                {!isMobile && (
                  <div className="w-full h-full transform-3d flex flex-col max-w-md gap-2">
                    <div
                      className={cn(
                        "flex-1 rounded-2xl translate-y-1/16",
                        cardBase,
                        card3D.left,
                      )}
                    />
                    <MusicCard
                      className={cn(
                        "rounded-2xl -translate-y-1/8",
                        cardBase,
                        card3D.left,
                      )}
                    />
                  </div>
                )}

                <div className="origin-center flex flex-col w-full h-full max-w-md items-center justify-center">
                  <TimerCard
                    className={cn("rounded-2xl", cardBase, card3D.center)}
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
