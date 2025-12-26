"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { AudioLinesIcon } from "@workspace/ui/components/lucide-animated-icons/audio-lines";
import { cn } from "@workspace/ui/lib/utils";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

interface MusicCardProps {
  className?: string;
}

/* -----------------------------
   MusicCard (Sample)
-------------------------------- */
export default function MusicCard({ className }: MusicCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  // const [frequencyData, setFrequencyData] = useState<number[]>([]);

  /* Fake audio visualization */
  // useEffect(() => {
  //   if (!isPlaying) return;
  //
  //   const interval = setInterval(() => {
  //     setFrequencyData(Array.from({ length: 32 }, () => Math.random()));
  //   }, 100);
  //
  //   return () => clearInterval(interval);
  // }, [isPlaying]);

  /* Fake progress */
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 0.2));
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AudioLinesIcon />
          Sample Music Player
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* <AudioVisualizer frequencyData={frequencyData} isPlaying={isPlaying} /> */}

        <ProgressBar
          progress={progress}
          onSeek={setProgress}
          currentTime="1:12"
          duration="3:45"
        />

        <div className="flex justify-center">
          <Button
            size="lg"
            className="rounded-full"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
        </div>

        <VolumeControl
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={setVolume}
          onToggleMute={() => setIsMuted(!isMuted)}
        />
      </CardContent>
    </Card>
  );
}

/* -----------------------------
   AudioVisualizer
-------------------------------- */
// function AudioVisualizer({
//   frequencyData,
//   isPlaying,
// }: {
//   frequencyData: number[];
//   isPlaying: boolean;
// }) {
//   if (!frequencyData.length) {
//     return (
//       <div className="h-16 bg-muted/30 rounded flex items-center justify-center">
//         No audio
//       </div>
//     );
//   }
//
//   return (
//     <div className="h-16 flex items-end justify-center gap-1 bg-gradient-to-t from-primary/20 to-transparent rounded p-2">
//       {frequencyData.slice(0, 32).map((value, index) => (
//         <div
//           key={index}
//           className={`w-1 bg-primary rounded-t transition-all ${
//             isPlaying ? "animate-pulse" : ""
//           }`}
//           style={{
//             height: `${Math.max(2, value * 48)}px`,
//             animationDelay: `${index * 20}ms`,
//           }}
//         />
//       ))}
//     </div>
//   );
// }

/* -----------------------------
   ProgressBar
-------------------------------- */
function ProgressBar({
  progress,
  onSeek,
  currentTime,
  duration,
}: {
  progress: number;
  onSeek: (percentage: number) => void;
  currentTime: string;
  duration: string;
}) {
  return (
    <div className="space-y-1">
      <div
        className="relative h-2 bg-muted rounded cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percentage = ((e.clientX - rect.left) / rect.width) * 100;
          onSeek(percentage);
        }}
      >
        <div
          className="absolute h-full bg-primary rounded"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{currentTime}</span>
        <span>{duration}</span>
      </div>
    </div>
  );
}

/* -----------------------------
   VolumeControl
-------------------------------- */
function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="ghost" onClick={onToggleMute}>
        {isMuted ? "Mute" : "Sound"}
      </Button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={isMuted ? 0 : volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
      />
    </div>
  );
}
