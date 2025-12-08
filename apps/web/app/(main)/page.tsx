"use client";

import ConfigDock, {
  LOCAL_STORAGE_BG_KEY,
} from "@/components/dock/config-dock";
import Header from "@/components/header/header";
import TimerCard from "@/components/timer/timer-card";
import { useIsMobile } from "@workspace/ui/hooks/useIsMobile";
import Image from "next/image";
import { useEffect, useState } from "react";

export type BgTypes = "color" | "video" | "image";

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

  const isMobile = useIsMobile();

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
        <div className="absolute inset-0 h-full w-full md:p-4 lg:p-8 max-w-[1920px] transition-all duration-1000">
          <div className="h-full w-full flex flex-col md:border-2 md:rounded-xl bg-background/50">
            <Header />

            <main className="flex-1 overflow-auto md:pb-6">
              <section className="h-full w-full flex items-center justify-evenly gap-4">
                {!isMobile && (
                  <div className="w-full h-full flex flex-col max-w-md gap-2">
                    <div className="flex-3/5 border-2 rounded-2xl bg-background/60 hover:bg-background/80 md:border-2 md:rounded-4xl md:shadow-xl"></div>
                    <div className="flex-2/5 border-2 rounded-2xl bg-background/60 hover:bg-background/80 md:border-2 md:rounded-4xl md:shadow-xl"></div>
                  </div>
                )}

                <div className="flex flex-col w-full h-full max-w-md md:pb-6 items-center justify-center">
                  <TimerCard className="bg-background/60 hover:bg-background/80 md:border-2 md:rounded-4xl md:shadow-xl" />
                </div>

                {!isMobile && (
                  <div className="w-full h-full max-w-md bg-background/60 hover:bg-background/80 md:border-2 md:rounded-4xl md:shadow-xl"></div>
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
