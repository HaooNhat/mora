// "use client";
//
// import { Button } from "@workspace/ui/components/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@workspace/ui/components/card";
// import { AudioLinesIcon } from "@workspace/ui/components/lucide-animated-icons/audio-lines";
// import { cn } from "@workspace/ui/lib/utils";
// import {
//   Loader2,
//   Music,
//   Pause,
//   Play,
//   SkipBack,
//   SkipForward,
// } from "lucide-react";
// import { useCallback, useEffect, useRef, useState } from "react";
//
// interface Track {
//   id: string;
//   title: string;
//   artist: string;
//   url: string;
//   duration: number;
// }
//
// interface MusicCardProps {
//   className?: string;
// }
//
// /**
//  * Complete Music Player with audio controls and visualization
//  * Supports local audio files and streaming URLs
//  */
// export default function MusicCard({ className }: MusicCardProps) {
//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const animationRef = useRef<number>(0);
//   const [isHovered, setIsHovered] = useState<boolean>(false);
//
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [volume, setVolume] = useState(0.7);
//   const [isMuted, setIsMuted] = useState(false);
//   const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
//
//   // Sample playlist - replace with your own tracks
//   const [playlist] = useState<Track[]>([
//     {
//       id: "1",
//       title: "Lofi Study Session",
//       artist: "Chill Beats",
//       url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
//       duration: 354,
//     },
//     {
//       id: "2",
//       title: "Ambient Focus",
//       artist: "Calm Waves",
//       url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
//       duration: 302,
//     },
//     {
//       id: "3",
//       title: "Test",
//       artist: "Calm Waves",
//       url: "",
//       duration: 302,
//     },
//   ]);
//
//   const currentTrack = playlist[currentTrackIndex];
//
//   // Initialize audio element
//   useEffect(() => {
//     const audio = new Audio();
//     audioRef.current = audio;
//     audio.volume = volume;
//
//     const handleLoadStart = () => setIsLoading(true);
//     const handleCanPlay = () => setIsLoading(false);
//     const handleLoadedMetadata = () => setDuration(audio.duration);
//     const handleEnded = () => {
//       setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
//     };
//
//     audio.addEventListener("loadstart", handleLoadStart);
//     audio.addEventListener("canplay", handleCanPlay);
//     audio.addEventListener("loadedmetadata", handleLoadedMetadata);
//     audio.addEventListener("ended", handleEnded);
//
//     return () => {
//       audio.pause();
//       audio.removeEventListener("loadstart", handleLoadStart);
//       audio.removeEventListener("canplay", handleCanPlay);
//       audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
//       audio.removeEventListener("ended", handleEnded);
//       if (animationRef.current) {
//         cancelAnimationFrame(animationRef.current);
//       }
//     };
//   }, [playlist.length, volume]);
//
//   // Load track when index changes
//   useEffect(() => {
//     if (audioRef.current && currentTrack) {
//       audioRef.current.src = currentTrack.url;
//       audioRef.current.load();
//       setCurrentTime(0);
//
//       if (isPlaying) {
//         audioRef.current.play().catch(console.error);
//       }
//     }
//   }, [currentTrackIndex, currentTrack, isPlaying]);
//
//   // Update progress
//   const updateProgress = useCallback(() => {
//     if (audioRef.current && isPlaying) {
//       setCurrentTime(audioRef.current.currentTime);
//       animationRef.current = requestAnimationFrame(updateProgress);
//     }
//   }, [isPlaying]);
//
//   useEffect(() => {
//     if (isPlaying) {
//       animationRef.current = requestAnimationFrame(updateProgress);
//     }
//     return () => {
//       if (animationRef.current) {
//         cancelAnimationFrame(animationRef.current);
//       }
//     };
//   }, [isPlaying, updateProgress]);
//
//   const handlePlayPause = useCallback(() => {
//     if (!audioRef.current) return;
//
//     if (isPlaying) {
//       audioRef.current.pause();
//       setIsPlaying(false);
//     } else {
//       audioRef.current.play().catch(console.error);
//       setIsPlaying(true);
//     }
//   }, [isPlaying]);
//
//   const handleNext = useCallback(() => {
//     setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
//   }, [playlist.length]);
//
//   const handlePrevious = useCallback(() => {
//     if (currentTime > 3) {
//       if (audioRef.current) {
//         audioRef.current.currentTime = 0;
//       }
//     } else {
//       setCurrentTrackIndex(
//         (prev) => (prev - 1 + playlist.length) % playlist.length,
//       );
//     }
//   }, [currentTime, playlist.length]);
//
//   const handleSeek = useCallback(
//     (percentage: number) => {
//       if (audioRef.current) {
//         const newTime = (percentage / 100) * duration;
//         audioRef.current.currentTime = newTime;
//         setCurrentTime(newTime);
//       }
//     },
//     [duration],
//   );
//
//   const handleVolumeChange = useCallback((newVolume: number) => {
//     setVolume(newVolume);
//     if (audioRef.current) {
//       audioRef.current.volume = newVolume;
//     }
//     if (newVolume > 0) {
//       setIsMuted(false);
//     }
//   }, []);
//
//   const handleToggleMute = useCallback(() => {
//     if (audioRef.current) {
//       if (isMuted) {
//         audioRef.current.volume = volume;
//         setIsMuted(false);
//       } else {
//         audioRef.current.volume = 0;
//         setIsMuted(true);
//       }
//     }
//   }, [isMuted, volume]);
//
//   const formatTime = (seconds: number): string => {
//     if (!isFinite(seconds)) return "0:00";
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins}:${secs.toString().padStart(2, "0")}`;
//   };
//
//   const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
//
//   const ProgressBar = () => {
//     return (
//       <>
//         <div className="space-y-1">
//           <div
//             className="relative h-2 bg-muted rounded-full cursor-pointer group"
//             onClick={(e) => {
//               const rect = e.currentTarget.getBoundingClientRect();
//               const percentage = ((e.clientX - rect.left) / rect.width) * 100;
//               handleSeek(Math.max(0, Math.min(100, percentage)));
//             }}
//           >
//             <div
//               className="absolute h-full bg-primary rounded-full transition-all"
//               style={{ width: `${progress}%` }}
//             ></div>
//             <div
//               className="absolute w-3 h-3 bg-primary rounded-full top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
//               style={{
//                 left: `${progress}%`,
//                 transform: "translate(-50%, -50%)",
//               }}
//             ></div>
//           </div>
//           <div className="flex justify-between text-xs text-muted-foreground">
//             <span>{formatTime(currentTime)}</span>
//             <span>{formatTime(duration)}</span>
//           </div>
//         </div>
//       </>
//     );
//   };
//
//   return (
//     <Card
//       onMouseEnter={() => {
//         setIsHovered(true);
//       }}
//       onMouseLeave={() => {
//         setIsHovered(false);
//       }}
//       className={cn("w-full max-w-md", className)}
//     >
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <AudioLinesIcon isHovered={isHovered} />
//           Music Player
//         </CardTitle>
//       </CardHeader>
//
//       <CardContent className="space-y-4">
//         {/* Track Info */}
//         <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
//           <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center shrink-0">
//             <Music className="w-6 h-6 text-primary" />
//           </div>
//           <div className="flex-1 min-w-0">
//             <p className="font-medium truncate">{currentTrack?.title}</p>
//             <p className="text-sm text-muted-foreground truncate">
//               {currentTrack?.artist}
//             </p>
//
//             <ProgressBar />
//           </div>
//         </div>
//
//         {/* Audio Visualizer */}
//         {/* <div className="h-16 flex items-end justify-center gap-1 bg-gradient-to-t from-primary/10 to-transparent rounded-lg p-2"> */}
//         {/*   {frequencyData.map((value, index) => ( */}
//         {/*     <div */}
//         {/*       key={index} */}
//         {/*       className={cn( */}
//         {/*         "w-1 bg-primary rounded-t transition-all", */}
//         {/*         isPlaying && "animate-pulse", */}
//         {/*       )} */}
//         {/*       style={{ */}
//         {/*         height: `${Math.max(4, value * 48)}px`, */}
//         {/*         animationDelay: `${index * 20}ms`, */}
//         {/*         animationDuration: "800ms", */}
//         {/*       }} */}
//         {/*     ></div> */}
//         {/*   ))} */}
//         {/* </div> */}
//
//         {/* Playback Controls */}
//         <div className="flex items-center justify-center gap-2">
//           <Button
//             size="sm"
//             variant="ghost"
//             onClick={handlePrevious}
//             disabled={isLoading}
//             className="rounded-full"
//           >
//             <SkipBack className="w-4 h-4" />
//           </Button>
//
//           <Button
//             size="lg"
//             className="rounded-full size-10"
//             onClick={handlePlayPause}
//             disabled={isLoading}
//           >
//             {isLoading ? (
//               <Loader2 className="w-6 h-6 animate-spin" />
//             ) : isPlaying ? (
//               <Pause className="w-6 h-6" />
//             ) : (
//               <Play className="w-6 h-6" />
//             )}
//           </Button>
//
//           <Button
//             size="sm"
//             variant="ghost"
//             onClick={handleNext}
//             disabled={isLoading}
//             className="rounded-full"
//           >
//             <SkipForward className="w-4 h-4" />
//           </Button>
//         </div>
//
//         {/* Volume Control */}
//         {/* <div className="flex items-center gap-3"> */}
//         {/*   <Button */}
//         {/*     size="sm" */}
//         {/*     variant="ghost" */}
//         {/*     onClick={handleToggleMute} */}
//         {/*     className="shrink-0" */}
//         {/*   > */}
//         {/*     {isMuted || volume === 0 ? ( */}
//         {/*       <VolumeX className="w-4 h-4" /> */}
//         {/*     ) : ( */}
//         {/*       <Volume2 className="w-4 h-4" /> */}
//         {/*     )} */}
//         {/*   </Button> */}
//         {/*   <div className="flex-1 relative"> */}
//         {/*     <input */}
//         {/*       type="range" */}
//         {/*       min={0} */}
//         {/*       max={1} */}
//         {/*       step={0.01} */}
//         {/*       value={isMuted ? 0 : volume} */}
//         {/*       onChange={(e) => handleVolumeChange(Number(e.target.value))} */}
//         {/*       className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0" */}
//         {/*     /> */}
//         {/*   </div> */}
//         {/*   <span className="text-xs text-muted-foreground w-8 text-right"> */}
//         {/*     {Math.round((isMuted ? 0 : volume) * 100)}% */}
//         {/*   </span> */}
//         {/* </div> */}
//       </CardContent>
//     </Card>
//   );
// }
