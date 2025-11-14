"use client";

import ConfigDock from "@/components/Dock/ConfigDock";
import Header from "@/components/Header/Header";
import TimerCard from "@workspace/ui/components/Timer/TimerCard";
import Image from "next/image";
import { useState } from "react";

export type BgTypes = "color" | "video" | "image";

export default function PlayPage() {
  const [bgType, setBgType] = useState<BgTypes>("image");
  const [bgLink, setBgLink] = useState<string>("images/cozy-work-room.jpg");

  return (
    <>
      <div className="flex flex-col h-dvh md:h-screen">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="fixed inset-0 -z-10" aria-hidden="true">
            {/* {bgType === "color" && ( */}
            {/*   <div className={`absolute inset-0 w-full h-full`}></div> */}
            {/* )} */}
            {bgType === "image" && (
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
            {bgType === "video" && (
              <video
                src={`/${bgLink}`}
                autoPlay
                loop
                muted
                preload="none"
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source
                  src="videos/lagoon_background_video.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          <section className="h-full w-full flex items-center justify-center">
            <TimerCard />
          </section>
        </main>
        <ConfigDock setBgType={setBgType} setBgLink={setBgLink} />
      </div>
    </>
  );
}
