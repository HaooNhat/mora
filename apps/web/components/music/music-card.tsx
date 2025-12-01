"use client";

import { useMusic } from "@workspace/features/music/hooks/useMusic";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Headphones,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";

// Audio Visualizer Component
function AudioVisualizer({
  frequencyData,
  isPlaying,
}: {
  frequencyData: number[];
  isPlaying: boolean;
}) {
  if (!frequencyData.length) {
    return (
      <div className="h-16 bg-muted/30 rounded flex items-center justify-center">
        <Waves className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-16 flex items-end justify-center gap-1 bg-gradient-to-t from-primary/20 to-transparent rounded p-2">
      {frequencyData.slice(0, 32).map((value, index) => (
        <div
          key={index}
          className={`w-1 bg-gradient-to-t from-primary to-primary/60 rounded-t transition-all duration-75 ${
            isPlaying ? "animate-pulse" : ""
          }`}
          style={{
            height: `${Math.max(2, value * 48)}px`,
            animationDelay: `${index * 20}ms`,
          }}
        />
      ))}
    </div>
  );
}

// Progress Bar Component
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
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    setLocalProgress(percentage);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      onSeek(localProgress);
      setIsDragging(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className="relative h-2 bg-muted rounded cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded transition-all"
          style={{ width: `${localProgress}%` }}
        />
        <div
          className="absolute top-1/2 w-3 h-3 bg-primary rounded-full transform -translate-y-1/2 transition-all"
          style={{ left: `${localProgress}%`, marginLeft: "-6px" }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{currentTime}</span>
        <span>{duration}</span>
      </div>
    </div>
  );
}

// Volume Control Component
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
        {isMuted || volume === 0 ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      <div className="w-20">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-muted rounded appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(isMuted ? 0 : volume) * 100}%, hsl(var(--muted)) ${(isMuted ? 0 : volume) * 100}%, hsl(var(--muted)) 100%)`,
          }}
        />
      </div>
    </div>
  );
}

export default function MusicCard() {
  const {
    playlists,
    currentTrack,
    currentPlaylist,
    playbackState,
    visualization,
    progress,
    formattedCurrentTime,
    formattedDuration,
    loading,
    error,
    play,
    pause,
    nextTrack,
    previousTrack,
    playTrack,
    setVolume,
    toggleMute,
    setRepeatMode,
    toggleShuffle,
    seek,
    clearError,
  } = useMusic({
    visualizationEnabled: true,
  });

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(
    playlists[0] || null,
  );

  // Auto-select first playlist with tracks
  useEffect(() => {
    if (!selectedPlaylist && playlists.length > 0) {
      const playlistWithTracks = playlists.find((p) => p.trackIds.length > 0);
      setSelectedPlaylist(playlistWithTracks || playlists[0] || null);
    }
  }, [playlists, selectedPlaylist]);

  const handleSeek = (percentage: number) => {
    if (currentTrack) {
      const newTime = (percentage / 100) * currentTrack.duration;
      seek(newTime);
    }
  };

  const handlePlayPlaylist = (playlist: typeof selectedPlaylist) => {
    if (!playlist || playlist.trackIds.length === 0) return;

    // Find first track in playlist
    const firstTrackId = playlist.trackIds[0];
    // Note: In real implementation, you'd get track from tracks array
    // For now, we'll just select the playlist
    setSelectedPlaylist(playlist);
    setShowPlaylist(false);
  };

  const getRepeatIcon = () => {
    switch (playbackState.repeatMode) {
      case "track":
        return <Repeat1 className="h-4 w-4" />;
      case "playlist":
        return <Repeat className="h-4 w-4" />;
      default:
        return <Repeat className="h-4 w-4 opacity-50" />;
    }
  };

  const cycleRepeatMode = () => {
    const modes = ["off", "playlist", "track"] as const;
    const currentIndex = modes.indexOf(playbackState.repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex] as typeof playbackState.repeatMode;
    setRepeatMode(nextMode);
  };

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Music className="h-5 w-5" />
            Music Error
          </CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={clearError} variant="outline" className="w-full">
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Music Player
            </CardTitle>
            <CardDescription>
              {currentTrack
                ? `${currentTrack.title} - ${currentTrack.artist}`
                : "No track selected"}
            </CardDescription>
          </div>
          <CardAction>
            <Dialog open={showPlaylist} onOpenChange={setShowPlaylist}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Music className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Select Playlist</DialogTitle>
                  <DialogDescription>
                    Choose a focus playlist for your session
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        selectedPlaylist?.id === playlist.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => handlePlayPlaylist(playlist)}
                    >
                      <div className="font-medium">{playlist.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline">{playlist.type}</Badge>
                        <span>{playlist.trackIds.length} tracks</span>
                      </div>
                      {playlist.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {playlist.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Audio Visualizer */}
        <AudioVisualizer
          frequencyData={visualization.frequencyData}
          isPlaying={playbackState.isPlaying}
        />

        {/* Progress Bar */}
        {currentTrack && (
          <ProgressBar
            progress={progress}
            onSeek={handleSeek}
            currentTime={formattedCurrentTime}
            duration={formattedDuration}
          />
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="ghost" onClick={toggleShuffle}>
            <Shuffle
              className={`h-4 w-4 ${playbackState.isShuffled ? "" : "opacity-50"}`}
            />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={previousTrack}
            disabled={!currentTrack}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="lg"
            onClick={playbackState.isPlaying ? pause : play}
            disabled={!currentTrack || loading}
            className="rounded-full"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : playbackState.isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={nextTrack}
            disabled={!currentTrack}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button size="sm" variant="ghost" onClick={cycleRepeatMode}>
            {getRepeatIcon()}
          </Button>
        </div>

        {/* Volume Control */}
        <VolumeControl
          volume={playbackState.volume}
          isMuted={playbackState.isMuted}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
        />

        {/* Current Playlist Info */}
        {selectedPlaylist && (
          <div className="text-center">
            <Badge variant="outline">{selectedPlaylist.name}</Badge>
            {selectedPlaylist.trackIds.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {selectedPlaylist.trackIds.length} tracks •{" "}
                {Math.floor(selectedPlaylist.totalDuration / 60)}min
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
