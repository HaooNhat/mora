"use client";

import { BgTypes } from "@/app/(main)/page";
import { JournalDialog } from "@/components/journal/journal-dialog";
import { useTimerStore } from "@workspace/frontend/stores/timer-store";
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
import { ChartLineIcon } from "@workspace/ui/components/lucide-animated-icons/chart-line";
import { PencilLineIcon } from "@workspace/ui/components/lucide-animated-icons/pencil-line";
import { SettingsIcon } from "@workspace/ui/components/lucide-animated-icons/settings";
import { UserIcon } from "@workspace/ui/components/lucide-animated-icons/user-pencil";
import { useIsMobile } from "@workspace/ui/hooks/useIsMobile";
import { cn } from "@workspace/ui/lib/utils";
import { ImageIcon, Video } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  Dispatch,
  JSX,
  memo,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export const LOCAL_STORAGE_BG_KEY = "app-selected-background";

const SETTINGS_DISPLAY = {
  background: { title: "Choose your background" },
};

type TabType = "images" | "videos";
type Attribution = { href: string; text: string };
type ImageSetting = { url: string; attribution: Attribution };

interface ConfigDockProps {
  setBgType: Dispatch<SetStateAction<BgTypes>>;
  setBgLink: Dispatch<SetStateAction<string>>;
}

export default function ConfigDock({ setBgType, setBgLink }: ConfigDockProps) {
  const isMobile = useIsMobile(767);
  const [mounted, setMounted] = useState(false);
  const [openBgSetting, setOpenBgSetting] = useState(false);
  const [openJournal, setOpenJournal] = useState<boolean>(false);

  const [backgrounds, setBackgrounds] = useState<{
    images: ImageSetting[];
    videos: string[];
    colors: string;
  }>({ colors: "", images: [], videos: [] });
  // const [attribution, setAttribution] = useState<Attribution | null>(null);
  const status = useTimerStore((state) => state.timerState.status);

  const actions = [
    {
      label: "Settings",
      icon: SettingsIcon,
      onClick: () => setOpenBgSetting(true),
    },
    { label: "Stats", icon: ChartLineIcon, onClick: () => {} },
    {
      label: "Journals",
      icon: PencilLineIcon,
      onClick: () => setOpenJournal((prev) => !prev),
    },
    { label: "Profile", icon: UserIcon, onClick: () => {} },
  ];
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch("/backgrounds.json")
      .then((res) => res.json())
      .then((data) =>
        setBackgrounds((prev) => ({ ...data, colors: prev.colors })),
      )
      .catch((err) => console.error("Failed to fetch backgrounds:", err));
  }, []);

  const handleBgSelect = useCallback(
    (
      type: BgTypes,
      link: string,
      attributionData: Attribution | null = null,
    ) => {
      setBgType(type);
      setBgLink(link);
      // setAttribution(attributionData);
      setOpenBgSetting(false);

      localStorage.setItem(
        LOCAL_STORAGE_BG_KEY,
        JSON.stringify({ type, link, attribution: attributionData }),
      );
    },
    [setBgType, setBgLink],
  );

  if (!mounted) return <aside className="h-16 bg-background"></aside>;

  const MotionButton = motion(Button);

  return (
    <>
      <AnimatePresence>
        {status !== "running" && (
          <motion.aside
            initial={{ opacity: 0, scale: 0, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 40 }}
            transition={{ type: "spring", duration: 1, bounce: 0.4 }}
            className={cn(
              "h-14 flex w-full max-w-lg items-center justify-evenly bg-background/75 hover:bg-background md:rounded-2xl md:border-2 shadow-2xl",
              !isMobile && "w-fit absolute bottom-4 right-1/2 translate-x-1/2",
            )}
          >
            <div className="flex items-center justify-start md:gap-2 md:px-4">
              {actions.map(({ label, icon: Icon, onClick }) => (
                <MotionButton
                  key={label}
                  variant="ghost"
                  size="default"
                  onClick={onClick}
                  initial={{ scale: 1 }}
                  animate={{ scale: 1 }}
                  whileHover={{
                    scale: [1, 1.5, 1.2],
                    transition: { times: [0, 0.1, 1] },
                  }}
                  transition={{
                    duration: 0.3,
                    times: [0, 0.1, 1],
                    ease: "easeOut",
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="rounded-lg text-accent-foreground/70"
                >
                  <Icon />
                  <p className="text-sm">{label}</p>
                </MotionButton>
              ))}
            </div>
            <JournalDialog open={openJournal} onOpenChange={setOpenJournal} />
          </motion.aside>
        )}
      </AnimatePresence>
      {isMobile ? (
        <Drawer open={openBgSetting} onOpenChange={setOpenBgSetting}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{SETTINGS_DISPLAY.background.title}</DrawerTitle>
            </DrawerHeader>

            <MemoBackgroundContent
              backgrounds={backgrounds}
              handleSelect={handleBgSelect}
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

            <MemoBackgroundContent
              backgrounds={backgrounds}
              handleSelect={handleBgSelect}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function formatFileName(filename: string) {
  return (
    filename
      .split("/")
      .pop()
      ?.replace(/\.(jpg|jpeg|png|gif|mp4|webm)$/i, "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()) || filename
  );
}

interface BackgroundContentProps {
  backgrounds: {
    images: ImageSetting[];
    videos: string[];
    colors: string;
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

  const tabs = useMemo(
    () => [
      {
        key: "images" as const,
        icon: <ImageIcon className="h-4 w-4" />,
        label: "Images",
        count: backgrounds.images.length,
      },
      {
        key: "videos" as const,
        icon: <Video className="h-4 w-4" />,
        label: "Videos",
        count: backgrounds.videos.length,
      },
    ],
    [backgrounds.images.length, backgrounds.videos.length],
  );

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
        {activeTab === "images" &&
          (backgrounds.images.length ? (
            <>
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
            </>
          ) : (
            <EmptyState
              icon={<ImageIcon className="h-12 w-12 mb-2 opacity-50" />}
              label="No images available"
            />
          ))}

        {activeTab === "videos" &&
          (backgrounds.videos.length ? (
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
          ))}
      </div>
    </div>
  );
};

const MemoBackgroundContent = memo(BackgroundContent);

const EmptyState = ({ icon, label }: { icon: JSX.Element; label: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
    {icon}
    <p>{label}</p>
  </div>
);

// const ShowAttribution = ({
//   attribution,
// }: {
//   attribution?: { text: string; href: string };
// }) => {
//   if (attribution)
//     return (
//       <div className="border-2 rounded-lg bg-card/50 px-3 py-1">
//         <a href={attribution.href} target="_blank" rel="noreferrer">
//           {attribution.text}
//         </a>
//       </div>
//     );
//   return null;
// };
