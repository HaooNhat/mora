import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Track,
  Playlist,
  PlaybackState,
  MusicSettings,
  MusicError,
  AudioVisualization,
} from "@workspace/types/Music";
import {
  DEFAULT_FOCUS_PLAYLISTS,
  formatDuration,
  getTrackProgress,
} from "@workspace/types/Music";

interface UseMusicOptions {
  autoPlay?: boolean;
  crossfadeEnabled?: boolean;
  visualizationEnabled?: boolean;
  onTrackChange?: (track: Track | null) => void;
  onPlaybackError?: (error: MusicError) => void;
  onPlaylistEnd?: () => void;
}

export function useMusic(options: UseMusicOptions = {}) {
  const {
    autoPlay = true,
    crossfadeEnabled = false,
    visualizationEnabled = true,
    onTrackChange,
    onPlaybackError,
    onPlaylistEnd,
  } = options;

  // State
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    volume: 0.7,
    isMuted: false,
    isShuffled: false,
    repeatMode: "off",
    crossfadeEnabled,
    crossfadeDuration: 2,
  });
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [settings, setSettings] = useState<MusicSettings>({
    autoPlay,
    showVisualizer: visualizationEnabled,
    gaplesPlayback: true,
    fadeInOut: true,
    scrobbleEnabled: false,
    downloadQuality: "high",
    streamingQuality: "medium",
    offlineMode: false,
  });
  const [error, setError] = useState<MusicError | null>(null);
  const [loading, setLoading] = useState(false);
  const [visualization, setVisualization] = useState<AudioVisualization>({
    frequencyData: [],
    waveformData: [],
    volume: 0,
    isAnalyzing: false,
  });

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Generate unique ID
  const generateId = useCallback(() => crypto.randomUUID(), []);

  // Initialize audio context for visualization
  const initializeAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioRef.current);
      const gainNode = audioContext.createGain();

      // Configure analyser
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      gainNodeRef.current = gainNode;

      // Set initial volume
      gainNode.gain.value = playbackState.volume;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  }, [playbackState.volume]);

  // Audio visualization animation loop
  const updateVisualization = useCallback(() => {
    if (!analyserRef.current || !settings.showVisualizer) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const waveformArray = new Uint8Array(bufferLength);

    analyserRef.current.getByteFrequencyData(dataArray);
    analyserRef.current.getByteTimeDomainData(waveformArray);

    // Convert to normalized arrays
    const frequencyData = Array.from(dataArray).map((value) => value / 255);
    const waveformData = Array.from(waveformArray).map(
      (value) => (value - 128) / 128,
    );

    // Calculate volume level
    const volume =
      frequencyData.reduce((sum, val) => sum + val, 0) / frequencyData.length;

    setVisualization({
      frequencyData,
      waveformData,
      volume,
      isAnalyzing: playbackState.isPlaying,
    });

    if (playbackState.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    }
  }, [playbackState.isPlaying, settings.showVisualizer]);

  // Load default focus playlists
  const loadDefaultPlaylists = useCallback(async () => {
    const defaultPlaylists: Playlist[] = [];
    const defaultTracks: Track[] = [];

    Object.entries(DEFAULT_FOCUS_PLAYLISTS).forEach(([key, playlist]) => {
      const playlistId = generateId();
      const trackIds: string[] = [];

      // Create tracks
      playlist.tracks.forEach((trackData) => {
        const trackId = generateId();
        trackIds.push(trackId);

        defaultTracks.push({
          id: trackId,
          title: trackData.title,
          artist: trackData.artist,
          duration: trackData.duration,
          url: `https://example.com/audio/${key}/${trackData.title.replace(/\s+/g, "-").toLowerCase()}.mp3`, // Mock URLs
          isLocal: false,
          createdAt: new Date(),
        });
      });

      // Create playlist
      defaultPlaylists.push({
        id: playlistId,
        name: playlist.name,
        description: playlist.description,
        trackIds,
        isDefault: true,
        type: playlist.type,
        totalDuration: playlist.tracks.reduce(
          (sum, track) => sum + track.duration,
          0,
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    setTracks((prev) => [...prev, ...defaultTracks]);
    setPlaylists((prev) => [...prev, ...defaultPlaylists]);
  }, [generateId]);

  // Load tracks and playlists from storage
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load from localStorage (replace with API calls in real app)
      const savedTracks = localStorage.getItem("music_tracks");
      const savedPlaylists = localStorage.getItem("music_playlists");
      const savedState = localStorage.getItem("music_playback_state");
      const savedSettings = localStorage.getItem("music_settings");

      if (savedTracks) {
        const parsedTracks = JSON.parse(savedTracks).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
        }));
        setTracks(parsedTracks);
      }

      if (savedPlaylists) {
        const parsedPlaylists = JSON.parse(savedPlaylists).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
        setPlaylists(parsedPlaylists);
      } else {
        // Load defaults if no playlists exist
        await loadDefaultPlaylists();
      }

      if (savedState) {
        setPlaybackState(JSON.parse(savedState));
      }

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Failed to load music data:", error);
    } finally {
      setLoading(false);
    }
  }, [loadDefaultPlaylists]);

  // Save data to storage
  const saveData = useCallback(() => {
    try {
      localStorage.setItem("music_tracks", JSON.stringify(tracks));
      localStorage.setItem("music_playlists", JSON.stringify(playlists));
      localStorage.setItem(
        "music_playback_state",
        JSON.stringify(playbackState),
      );
      localStorage.setItem("music_settings", JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save music data:", error);
    }
  }, [tracks, playlists, playbackState, settings]);

  // Create audio element
  const createAudioElement = useCallback(() => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";

    // Event listeners
    audio.addEventListener("loadstart", () => setLoading(true));
    audio.addEventListener("canplay", () => setLoading(false));
    audio.addEventListener("play", () => {
      setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
      if (!audioContextRef.current) {
        setTimeout(initializeAudioContext, 100);
      }
    });
    audio.addEventListener("pause", () => {
      setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
    });
    audio.addEventListener("ended", handleTrackEnd);
    audio.addEventListener("timeupdate", () => {
      setPlaybackState((prev) => ({ ...prev, currentTime: audio.currentTime }));
    });
    audio.addEventListener("error", (e) => {
      const error: MusicError = {
        code: "PLAYBACK_ERROR",
        message: `Audio playback failed: ${e.message || "Unknown error"}`,
        trackId: currentTrack?.id,
        timestamp: new Date(),
      };
      setError(error);
      onPlaybackError?.(error);
    });

    audioRef.current = audio;
    return audio;
  }, [currentTrack?.id, initializeAudioContext, onPlaybackError]);

  // Handle track end
  const handleTrackEnd = useCallback(() => {
    if (playbackState.repeatMode === "track") {
      // Repeat current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      // Move to next track - will be handled by nextTrack function
    }
  }, [playbackState.repeatMode]);

  // Play/pause functionality
  const play = useCallback(async () => {
    const audio = createAudioElement();
    if (!audio || !currentTrack) return;

    try {
      if (audio.src !== currentTrack.url) {
        audio.src = currentTrack.url;
        audio.load();
      }

      await audio.play();

      // Resume audio context if suspended
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Start visualization
      if (settings.showVisualizer && !animationFrameRef.current) {
        updateVisualization();
      }
    } catch (error) {
      const musicError: MusicError = {
        code: "PLAYBACK_ERROR",
        message: `Failed to play track: ${error}`,
        trackId: currentTrack.id,
        timestamp: new Date(),
      };
      setError(musicError);
      onPlaybackError?.(musicError);
    }
  }, [
    currentTrack,
    createAudioElement,
    settings.showVisualizer,
    updateVisualization,
    onPlaybackError,
  ]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setPlaybackState((prev) => ({ ...prev, currentTime: 0 }));

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Track navigation
  const playTrack = useCallback(
    async (track: Track, playlist?: Playlist) => {
      setCurrentTrack(track);
      setCurrentPlaylist(playlist || null);
      setPlaybackState((prev) => ({
        ...prev,
        currentTrackId: track.id,
        currentPlaylistId: playlist?.id,
        currentTime: 0,
      }));

      onTrackChange?.(track);

      if (autoPlay) {
        setTimeout(() => play(), 100);
      }
    },
    [autoPlay, play, onTrackChange],
  );

  const nextTrack = useCallback(() => {
    if (!currentPlaylist || !currentTrack) return;

    const currentIndex = currentPlaylist.trackIds.indexOf(currentTrack.id);
    let nextIndex = currentIndex + 1;

    if (nextIndex >= currentPlaylist.trackIds.length) {
      if (playbackState.repeatMode === "playlist") {
        nextIndex = 0;
      } else {
        stop();
        onPlaylistEnd?.();
        return;
      }
    }

    const nextTrackId = currentPlaylist.trackIds[nextIndex];
    const nextTrack = tracks.find((t) => t.id === nextTrackId);

    if (nextTrack) {
      playTrack(nextTrack, currentPlaylist);
    }
  }, [
    currentPlaylist,
    currentTrack,
    tracks,
    playbackState.repeatMode,
    stop,
    onPlaylistEnd,
    playTrack,
  ]);

  const previousTrack = useCallback(() => {
    if (!currentPlaylist || !currentTrack) return;

    const currentIndex = currentPlaylist.trackIds.indexOf(currentTrack.id);
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      if (playbackState.repeatMode === "playlist") {
        prevIndex = currentPlaylist.trackIds.length - 1;
      } else {
        return;
      }
    }

    const prevTrackId = currentPlaylist.trackIds[prevIndex];
    const prevTrack = tracks.find((t) => t.id === prevTrackId);

    if (prevTrack) {
      playTrack(prevTrack, currentPlaylist);
    }
  }, [
    currentPlaylist,
    currentTrack,
    tracks,
    playbackState.repeatMode,
    playTrack,
  ]);

  // Volume and settings
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setPlaybackState((prev) => ({ ...prev, volume: clampedVolume }));

    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clampedVolume;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setPlaybackState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
    if (audioRef.current) {
      audioRef.current.muted = !playbackState.isMuted;
    }
  }, [playbackState.isMuted]);

  const setRepeatMode = useCallback((mode: PlaybackState["repeatMode"]) => {
    setPlaybackState((prev) => ({ ...prev, repeatMode: mode }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setPlaybackState((prev) => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  const seek = useCallback(
    (time: number) => {
      if (audioRef.current && currentTrack) {
        const clampedTime = Math.max(0, Math.min(currentTrack.duration, time));
        audioRef.current.currentTime = clampedTime;
        setPlaybackState((prev) => ({ ...prev, currentTime: clampedTime }));
      }
    },
    [currentTrack],
  );

  // Playlist management
  const createPlaylist = useCallback(
    (name: string, description?: string): Playlist => {
      const playlist: Playlist = {
        id: generateId(),
        name,
        description,
        trackIds: [],
        isDefault: false,
        type: "user",
        totalDuration: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setPlaylists((prev) => [...prev, playlist]);
      return playlist;
    },
    [generateId],
  );

  const addToPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setPlaylists((prev) =>
        prev.map((playlist) => {
          if (
            playlist.id === playlistId &&
            !playlist.trackIds.includes(trackId)
          ) {
            const track = tracks.find((t) => t.id === trackId);
            return {
              ...playlist,
              trackIds: [...playlist.trackIds, trackId],
              totalDuration: playlist.totalDuration + (track?.duration || 0),
              updatedAt: new Date(),
            };
          }
          return playlist;
        }),
      );
    },
    [tracks],
  );

  const removeFromPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setPlaylists((prev) =>
        prev.map((playlist) => {
          if (playlist.id === playlistId) {
            const track = tracks.find((t) => t.id === trackId);
            return {
              ...playlist,
              trackIds: playlist.trackIds.filter((id) => id !== trackId),
              totalDuration: playlist.totalDuration - (track?.duration || 0),
              updatedAt: new Date(),
            };
          }
          return playlist;
        }),
      );
    },
    [tracks],
  );

  // Get current progress
  const progress = currentTrack
    ? getTrackProgress(playbackState.currentTime, currentTrack.duration)
    : 0;
  const formattedCurrentTime = formatDuration(playbackState.currentTime);
  const formattedDuration = currentTrack
    ? formatDuration(currentTrack.duration)
    : "0:00";

  // Initialize on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save data when state changes
  useEffect(() => {
    saveData();
  }, [saveData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    // State
    tracks,
    playlists,
    playbackState,
    currentTrack,
    currentPlaylist,
    settings,
    error,
    loading,
    visualization,
    progress,
    formattedCurrentTime,
    formattedDuration,

    // Playback controls
    play,
    pause,
    stop,
    playTrack,
    nextTrack,
    previousTrack,
    seek,

    // Volume controls
    setVolume,
    toggleMute,

    // Settings
    setRepeatMode,
    toggleShuffle,
    setSettings,

    // Playlist management
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,

    // Utils
    clearError: () => setError(null),
  };
}
