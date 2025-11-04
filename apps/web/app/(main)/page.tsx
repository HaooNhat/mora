"use client";

import BottomConfig from "@/components/Config/BottomConfig";
import type { Task } from "@workspace/types/Task";
import TimerCard from "@workspace/ui/components/Timer/TimerCard";
import Image from "next/image";
import { useState } from "react";

export default function PlayPage() {
  const [bgType, setBgType] = useState<"video" | "image">("image");
  const [bgLink, setBgLink] = useState<string>("images/cozy_workplace_1.jpg");

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  return (
    <>
      <div className="fixed inset-0 -z-10" aria-hidden="true">
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
            alt="Background Image"
            fill
            sizes="100vw"
            objectFit="cover"
            priority
            className={``}
          />
        )}
      </div>
      <section className="h-full w-full bg-transparent">
        {/* Main Content Area */}
        <div className="h-full w-full flex items-center justify-center">
          <TimerCard />
        </div>
      </section>
      <BottomConfig setBgType={setBgType} setBgLink={setBgLink} />
    </>
  );
}
