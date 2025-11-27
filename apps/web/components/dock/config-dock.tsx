"use client";

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
import { cn } from "@workspace/ui/lib/utils";
import {
  ImageIcon,
  Monitor,
  Moon,
  SlidersVertical,
  Sun,
  Video,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Dispatch, JSX, SetStateAction, useEffect, useState } from "react";

export const LOCAL_STORAGE_BG_KEY = "app-selected-background";

const SETTINGS_DISPLAY = {
  background: { title: "Choose your background" },
};

type TabType = "colors" | "images" | "videos";
type Attribution = {
  href: string;
  text: string;
};
type ImageSetting = { url: string; attribution: Attribution };

interface ConfigDockProps {
  setBgType: Dispatch<SetStateAction<BgTypes>>;
  setBgLink: Dispatch<SetStateAction<string>>;
}

export default function ConfigDock({ setBgType, setBgLink }: ConfigDockProps) {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [openBgSetting, setOpenBgSetting] = useState(false);
  const [backgrounds, setBackgrounds] = useState<{
    colors: string;
    images: ImageSetting[];
    videos: string[];
  }>({ colors: "", images: [], videos: [] });
  const [attribution, setAttribution] = useState<Attribution | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch("/backgrounds.json")
      .then((res) => res.json())
      .then((data) =>
        setBackgrounds((prev) => ({ ...data, colors: prev.colors })),
      )
      .catch((err) => console.error("Failed to fetch backgrounds:", err));
  }, []);

  const handleSelect = (
    type: BgTypes,
    link: string,
    attributionData: Attribution | null = null,
  ) => {
    // setTheme(type === "color" ? "system" : "lagoon");
    setBgType(type);
    setBgLink(link);
    setAttribution(attributionData);
    setOpenBgSetting(false);

    localStorage.setItem(
      LOCAL_STORAGE_BG_KEY,
      JSON.stringify({ type, link, attribution: attributionData }),
    );
  };

  if (!mounted) return null;

  return (
    <aside className="h-16 flex gap-2 items-center justify-evenly">
      <div className="flex-1 flex items-center justify-start pl-2 md:pl-8 lg:pl-10">
        <Button
          variant="outline"
          size="default"
          onClick={() => setOpenBgSetting(true)}
          className="rounded-lg"
        >
          <SlidersVertical />
        </Button>
      </div>

      {attribution && (
        <div className="border-2 rounded-lg bg-card/50 px-3 py-1">
          <a href={attribution.href} target="_blank" rel="noreferrer">
            {attribution.text}
          </a>
        </div>
      )}

      <div className="flex-1 flex items-center justify-end gap-1 pr-2 md:pr-8 lg:pr-10 rounded-xl">
        <div className="flex items-center gap-0.5 border rounded-xl bg-card">
          {["light", "dark", "system"].map((t) => (
            <Button
              key={t}
              variant={theme === t ? "outline" : "ghost"}
              size="default"
              onClick={() => setTheme(t)}
              className="rounded-xl"
            >
              {t === "light" ? <Sun /> : t === "dark" ? <Moon /> : <Monitor />}
            </Button>
          ))}
        </div>
      </div>

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
  );
}

const formatFileName = (filename: string) =>
  filename
    .split("/")
    .pop()
    ?.replace(/\.(jpg|jpeg|png|gif|mp4|webm)$/i, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase()) || filename;

interface BackgroundContentProps {
  backgrounds: {
    colors: string;
    images: ImageSetting[];
    videos: string[];
  };
  handleSelect: (
    type: BgTypes,
    link: string,
    attribution?: Attribution,
  ) => void;
  className?: string;
}

const BackgroundContent = ({
  backgrounds,
  handleSelect,
  className,
}: BackgroundContentProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("images");

  const tabs: {
    key: TabType;
    icon: JSX.Element;
    label: string;
    count: number;
  }[] = [
    {
      key: "images",
      icon: <ImageIcon className="h-4 w-4" />,
      label: "Images",
      count: backgrounds.images.length,
    },
    {
      key: "videos",
      icon: <Video className="h-4 w-4" />,
      label: "Videos",
      count: backgrounds.videos.length,
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-evenly gap-2 border-b">
        {tabs.map(({ key, icon, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 font-medium transition-all relative",
              activeTab === key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {icon} {label}
            {count > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {count}
              </span>
            )}
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto max-h-[50vh]">
        {activeTab === "images" ? (
          backgrounds.images.length ? (
            <div className="p-1 grid grid-cols-2 gap-3">
              {backgrounds.images.map(({ url, attribution }) => (
                <div
                  key={url}
                  className="group cursor-pointer border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all hover:shadow-lg"
                  onClick={() => handleSelect("image", url, attribution)}
                >
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={`/${url}`}
                      alt={formatFileName(url)}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  </div>
                  <div className="p-2 bg-card">
                    <p className="text-xs font-medium truncate">
                      {formatFileName(url)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ImageIcon className="h-12 w-12 mb-2 opacity-50" />}
              label="No images available"
            />
          )
        ) : null}

        {activeTab === "videos" ? (
          backgrounds.videos.length ? (
            <div className="p-1 grid grid-cols-2 gap-3">
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
            <EmptyState
              icon={<Video className="h-12 w-12 mb-2 opacity-50" />}
              label="No videos available"
            />
          )
        ) : null}
      </div>
    </div>
  );
};

const EmptyState = ({ icon, label }: { icon: JSX.Element; label: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
    {icon}
    <p>{label}</p>
  </div>
);
