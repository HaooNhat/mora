import { BgTypes } from "@/app/(main)/page";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import { useIsMobile } from "@workspace/ui/hooks/useIsMobile";
import { BACKGROUND_GRADIENTS, cn } from "@workspace/ui/lib/utils";
import { Image as ImageIcon, Palette, Video, Wallpaper } from "lucide-react";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

// ============================================================================
// Constants
// ============================================================================

const SETTINGS_DISPLAY = {
  background: {
    title: "Choose your background",
  },
};

// ============================================================================
// Types
// ============================================================================

interface FooterProps {
  setBgType: Dispatch<SetStateAction<BgTypes>>;
  setBgLink: Dispatch<SetStateAction<string>>;
}

type TabType = "colors" | "images" | "videos";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format filename to readable display name
 * Example: "cozy_workplace_1.jpg" -> "Cozy Workplace 1"
 */
const formatFileName = (filename: string): string => {
  // Remove path and extension
  const nameWithoutPath = filename.split("/").pop() || filename;
  const nameWithoutExt = nameWithoutPath.replace(
    /\.(jpg|jpeg|png|gif|mp4|webm)$/i,
    "",
  );

  // Replace underscores and hyphens with spaces
  const withSpaces = nameWithoutExt.replace(/[_-]/g, " ");

  // Capitalize each word
  return withSpaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// ============================================================================
// Component
// ============================================================================

/**
 * BottomConfig component with background settings
 */
export default function BottomConfig({ setBgType, setBgLink }: FooterProps) {
  const [openBgSetting, setOpenBgSetting] = useState<boolean>(false);
  const [backgrounds, setBackgrounds] = useState<{
    colors: Record<string, string>;
    images: string[];
    videos: string[];
  }>({
    colors: BACKGROUND_GRADIENTS,
    images: [],
    videos: [],
  });

  const isMobile = useIsMobile();

  useEffect(() => {
    fetch("/backgrounds.json")
      .then((res) => res.json())
      .then((data) => {
        setBackgrounds((prev) => ({
          ...data,
          colors: prev.colors,
        }));
      })
      .catch((err) => {
        console.log("Failed to fetch backgrounds: ", err);
      });
  }, []);

  const handleSelect = (type: BgTypes, link: string) => {
    setBgType(type);
    setBgLink(link);
    setOpenBgSetting(false);
  };

  return (
    <>
      <aside className="absolute bottom-0 w-full flex items-center justify-center gap-4 px-4 py-4 z-10">
        <Button
          variant={"outline"}
          onClick={() => {
            setOpenBgSetting((prev) => !prev);
          }}
        >
          <Wallpaper />
        </Button>

        {isMobile ? (
          <Drawer open={openBgSetting} onOpenChange={setOpenBgSetting}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{SETTINGS_DISPLAY.background.title}</DrawerTitle>
              </DrawerHeader>

              <BackgroundContent
                backgrounds={backgrounds}
                handleSelect={handleSelect}
                className="p-4 pb-8"
              />
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={openBgSetting} onOpenChange={setOpenBgSetting}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>{SETTINGS_DISPLAY.background.title}</DialogTitle>
              </DialogHeader>

              <BackgroundContent
                backgrounds={backgrounds}
                handleSelect={handleSelect}
              />
            </DialogContent>
          </Dialog>
        )}
      </aside>
    </>
  );
}

// ============================================================================
// Background Content Component
// ============================================================================

interface BackgroundContentProps {
  backgrounds: {
    colors: Record<string, string>;
    images: string[];
    videos: string[];
  };
  handleSelect: (type: BgTypes, link: string) => void;
  className?: string;
}

const BackgroundContent = ({
  backgrounds,
  handleSelect,
  className,
}: BackgroundContentProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("colors");

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const hasColors = Object.keys(backgrounds.colors).length > 0;
  const hasImages = backgrounds.images.length > 0;
  const hasVideos = backgrounds.videos.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tab Navigation */}
      <div className="flex items-center justify-between gap-2 border-b">
        <button
          onClick={() => handleTabChange("colors")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 font-medium transition-all relative",
            activeTab === "colors"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Palette className="h-4 w-4" />
          Colors
          {hasColors && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {Object.keys(backgrounds.colors).length}
            </span>
          )}
          {activeTab === "colors" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>

        <button
          onClick={() => handleTabChange("images")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 font-medium transition-all relative",
            activeTab === "images"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ImageIcon className="h-4 w-4" />
          Images
          {hasImages && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {backgrounds.images.length}
            </span>
          )}
          {activeTab === "images" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>

        <button
          onClick={() => handleTabChange("videos")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 font-medium transition-all relative",
            activeTab === "videos"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Video className="h-4 w-4" />
          Videos
          {hasVideos && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              {backgrounds.videos.length}
            </span>
          )}
          {activeTab === "videos" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="overflow-y-auto max-h-[50vh]">
        {activeTab === "colors" && (
          <div className="space-y-3">
            {hasColors ? (
              <div className="p-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(backgrounds.colors).map(([name, color]) => (
                  <div
                    key={name}
                    className="group cursor-pointer border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all hover:shadow-lg"
                    onClick={() => handleSelect("color", name)}
                  >
                    <div className="relative aspect-video bg-muted">
                      <div
                        className={`absolute w-full h-full bg-gradient-to-br ${color} group-hover:scale-105 transition-transform duration-200`}
                      ></div>
                    </div>
                    <div className="p-2 bg-card">
                      <p className="text-xs font-medium truncate">
                        {name.slice(0, 1).toLocaleUpperCase() + name.slice(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Palette className="h-12 w-12 mb-2 opacity-50" />
                <p>No colors available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "images" && (
          <div className="space-y-3">
            {hasImages ? (
              <div className="p-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {backgrounds.images.map((img) => (
                  <div
                    key={img}
                    className="group cursor-pointer border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all hover:shadow-lg"
                    onClick={() => handleSelect("image", img)}
                  >
                    <div className="relative aspect-video bg-muted">
                      <Image
                        src={`/${img}`}
                        alt={formatFileName(img)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                    </div>
                    <div className="p-2 bg-card">
                      <p className="text-xs font-medium truncate">
                        {formatFileName(img)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                <p>No images available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "videos" && (
          <div className="space-y-3">
            {hasVideos ? (
              <div className="p-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {backgrounds.videos.map((vid) => (
                  <div
                    key={vid}
                    className="group cursor-pointer border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all hover:shadow-lg"
                    onClick={() => handleSelect("video", vid)}
                  >
                    <div className="relative aspect-video bg-muted">
                      <video
                        src={`/${vid}`}
                        muted
                        loop
                        playsInline
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Video className="h-8 w-8 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                      </div>
                    </div>
                    <div className="p-2 bg-card">
                      <p className="text-xs font-medium truncate">
                        {formatFileName(vid)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Video className="h-12 w-12 mb-2 opacity-50" />
                <p>No videos available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
