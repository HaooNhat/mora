"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import ConfigDock from "@/components/dock/config-dock";
import Header from "@/components/header/header";
import { useIsMobile } from "@workspace/ui/hooks/useIsMobile";
import { cn } from "@workspace/ui/lib/utils";

export type BgTypes = "color" | "video" | "image";

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

const cardSurface = cn(
  "bg-card/75 hover:bg-card/90",
  "md:border-2",
  // "md:rounded-4xl",
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

  // const status = useTimerStore((state) => state.timerState.status);
  const isMobile = useIsMobile();

  const isFocusMode = status === "running";

  // ==========================================================================
  // RENDER LOGICS
  // ==========================================================================
  const BackgroundImage = () => {
    return <div className="absolute inset-0 w-full h-full"></div>;
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
                "perspective-distant",
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

                    {/* <MusicCard */}
                    {/*   className={cn("rounded-2xl", cardBase, card3D.left)} */}
                    {/* /> */}
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col w-full h-full max-w-md",
                    "items-center justify-center",
                    "transform-3d",
                  )}
                ></div>
              </section>
            </main>

            <ConfigDock />
          </div>
        </div>
      </div>
    </>
  );
}
