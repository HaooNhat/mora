import { z } from "zod";

// Music track schema
export const TrackSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Track title is required"),
  artist: z.string().min(1, "Artist name is required"),
  album: z.string().optional(),
  duration: z.number().min(0), // in seconds
  url: z.string().url(), // Audio file URL or streaming URL
  coverArt: z.string().url().optional(), // Album cover image URL
  genre: z.string().optional(),
  year: z.number().min(1900).max(2100).optional(),
  isLocal: z.boolean().default(false), // Local file vs streaming
  size: z.number().optional(), // File size in bytes
  bitrate: z.number().optional(), // Audio bitrate
  createdAt: z.date(),
});

export type Track = z.infer<typeof TrackSchema>;

// Playlist schema
export const PlaylistSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Playlist name is required"),
  description: z.string().optional(),
  trackIds: z.array(z.string().uuid()),
  isDefault: z.boolean().default(false), // System default playlists
  type: z
    .enum(["user", "focus", "ambient", "nature", "lofi", "classical"])
    .default("user"),
  coverArt: z.string().url().optional(),
  totalDuration: z.number().min(0).default(0), // Total playlist duration in seconds
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Playlist = z.infer<typeof PlaylistSchema>;

// Playback state schema
export const PlaybackStateSchema = z.object({
  isPlaying: z.boolean().default(false),
  currentTrackId: z.string().uuid().optional(),
  currentPlaylistId: z.string().uuid().optional(),
  currentTime: z.number().min(0).default(0), // Current playback position in seconds
  volume: z.number().min(0).max(1).default(0.7), // Volume level 0-1
  isMuted: z.boolean().default(false),
  isShuffled: z.boolean().default(false),
  repeatMode: z.enum(["off", "track", "playlist"]).default("off"),
  crossfadeEnabled: z.boolean().default(false),
  crossfadeDuration: z.number().min(0).max(10).default(2), // seconds
});

export type PlaybackState = z.infer<typeof PlaybackStateSchema>;

// Audio visualization data
export const AudioVisualizationSchema = z.object({
  frequencyData: z.array(z.number()),
  waveformData: z.array(z.number()),
  volume: z.number().min(0).max(1),
  isAnalyzing: z.boolean().default(false),
});

export type AudioVisualization = z.infer<typeof AudioVisualizationSchema>;

// Music settings schema
export const MusicSettingsSchema = z.object({
  autoPlay: z.boolean().default(true),
  showVisualizer: z.boolean().default(true),
  gaplesPlayback: z.boolean().default(true),
  fadeInOut: z.boolean().default(true),
  scrobbleEnabled: z.boolean().default(false), // Last.fm integration
  downloadQuality: z
    .enum(["low", "medium", "high", "lossless"])
    .default("high"),
  streamingQuality: z.enum(["low", "medium", "high"]).default("medium"),
  offlineMode: z.boolean().default(false),
});

export type MusicSettings = z.infer<typeof MusicSettingsSchema>;

// Focus session music preferences
export const FocusMusicPreferencesSchema = z.object({
  playlistId: z.string().uuid().optional(),
  volume: z.number().min(0).max(1).default(0.5),
  fadeInDuration: z.number().min(0).max(30).default(3),
  fadeOutDuration: z.number().min(0).max(30).default(3),
  pauseDuringBreaks: z.boolean().default(false),
  switchPlaylistOnBreak: z.boolean().default(false),
  breakPlaylistId: z.string().uuid().optional(),
});

export type FocusMusicPreferences = z.infer<typeof FocusMusicPreferencesSchema>;

// Music player error schema
export const MusicErrorSchema = z.object({
  code: z.enum([
    "TRACK_NOT_FOUND",
    "NETWORK_ERROR",
    "PERMISSION_DENIED",
    "UNSUPPORTED_FORMAT",
    "PLAYBACK_ERROR",
    "STORAGE_FULL",
  ]),
  message: z.string(),
  trackId: z.string().uuid().optional(),
  timestamp: z.date(),
});

export type MusicError = z.infer<typeof MusicErrorSchema>;

// Default focus playlists data
export const DEFAULT_FOCUS_PLAYLISTS = {
  lofi: {
    name: "Lo-Fi Hip Hop",
    description: "Chill beats for focused work",
    type: "lofi" as const,
    tracks: [
      { title: "Midnight City", artist: "Chillhop Essentials", duration: 180 },
      { title: "Coffee Shop", artist: "Study Vibes", duration: 210 },
      { title: "Rain on Window", artist: "Lo-Fi Collective", duration: 195 },
    ],
  },
  nature: {
    name: "Nature Sounds",
    description: "Relaxing nature ambience",
    type: "nature" as const,
    tracks: [
      { title: "Forest Rain", artist: "Nature Sounds", duration: 300 },
      { title: "Ocean Waves", artist: "Ambient Nature", duration: 360 },
      { title: "Mountain Stream", artist: "Peaceful Earth", duration: 240 },
    ],
  },
  classical: {
    name: "Classical Focus",
    description: "Instrumental classical music",
    type: "classical" as const,
    tracks: [
      { title: "Clair de Lune", artist: "Claude Debussy", duration: 300 },
      { title: "Gymnopédie No. 1", artist: "Erik Satie", duration: 210 },
      { title: "The Blue Danube", artist: "Johann Strauss II", duration: 540 },
    ],
  },
  ambient: {
    name: "Ambient Electronic",
    description: "Ethereal soundscapes",
    type: "ambient" as const,
    tracks: [
      { title: "Weightless", artist: "Marconi Union", duration: 485 },
      { title: "Deep Space", artist: "Stellardrone", duration: 420 },
      { title: "Porcelain", artist: "Moby", duration: 240 },
    ],
  },
} as const;

// Utility functions
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const getTrackProgress = (
  currentTime: number,
  duration: number,
): number => {
  return duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
};
