"use client";

import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import AvatarSetting from "@/components/header/header-avatar-setting";
import { useTimer } from "@workspace/features/Timer/hooks/useTimer";
import type { Task } from "@workspace/types/Task";
import {
  CircleTimer,
  CIRCUMFERENCE,
} from "@workspace/ui/components/Timer/CircleTimer";
import Image from "next/image";
import { SetStateAction, useState } from "react";

export default function PlayPage() {
  const [bgType, setBgType] = useState<"video" | "image">("video");
  const [bgLink, setBgLink] = useState<string>(
    "videos/lagoon_background_video_1.mp4",
  );

  const { isRunning, progress, currentTimeFormatted } = useTimer();

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <>
      <div className="fixed inset-0 -z-10">
        {bgType === "video" ? (
          <video
            src={`/${bgLink}`}
            autoPlay
            loop
            muted
            preload="none"
            className="absolute inset-0 w-full h-full object-cover"
          >
            {/* <source src="videos/lagoon_background_video.mp4" type="video/mp4" /> */}
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src={`/${bgLink}`}
            alt="Lagoon Background Image"
            fill
            className={`absolute `}
          />
        )}
      </div>
      <div className="h-screen w-screen bg-transparent">
        {/* Header Section */}
        <Header />

        {/* Main Content Area */}
        <div className="h-full w-full flex items-center justify-center">
          {/* Timer Card */}
          {/* <TimerCard /> */}

          <CircleTimer
            isRunning={isRunning}
            strokeDashoffset={strokeDashoffset}
            currentTimeFormatted={currentTimeFormatted}
          />
        </div>

        <Footer setBgType={setBgType} setBgLink={setBgLink} />
      </div>
    </>
  );
}
