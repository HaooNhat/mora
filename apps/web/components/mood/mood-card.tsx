"use client";

import {
  MOOD_CONFIGS,
  getSmartSuggestions,
  type EnergyLevel,
  type MoodType,
  type SmartSuggestion,
} from "@workspace/core/mood/types";
import { useTimerStore } from "@workspace/frontend/stores/timer-store";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { Check, Lightbulb, Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface MoodCardProps {
  className?: string;
}

export default function MoodCard({ className }: MoodCardProps) {
  const [currentMood, setCurrentMood] = useState<MoodType>("neutral");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(3);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);

  const updateConfig = useTimerStore((state) => state.updateConfig);

  // Update suggestions when mood or energy changes
  useEffect(() => {
    const currentHour = new Date().getHours();
    const newSuggestions = getSmartSuggestions(
      currentMood,
      energyLevel,
      currentHour,
    );
    setSuggestions(newSuggestions);
  }, [currentMood, energyLevel]);

  const handleMoodSelect = (mood: MoodType) => {
    setCurrentMood(mood);
    setShowMoodSelector(false);
    // TODO: Save to localStorage or database
  };

  const handleApplyTimerPreset = (
    workDuration: number,
    breakDuration: number,
  ) => {
    updateConfig({
      pomodoro: {
        workDuration,
        shortBreakDuration: breakDuration,
        longBreakDuration: breakDuration * 3,
        sessionsUntilLongBreak: 4,
      },
    });
  };

  const moodConfig = MOOD_CONFIGS[currentMood];

  return (
    <>
      <Card className={cn("w-full max-w-md", className)}>
        {/* Mood Aura Effect */}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-40 blur-xl transition-colors duration-1000"
          style={{ backgroundColor: moodConfig.auraColor }}
        />

        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Mood Check
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          {/* Current Mood Display - Clickable */}
          <button
            onClick={() => setShowMoodSelector(true)}
            className={cn(
              "w-full p-4 rounded-xl border-2 transition-all duration-500",
              "bg-gradient-to-br hover:scale-[1.02] active:scale-[0.98]",
            )}
            style={{
              borderColor: moodConfig.color,
              backgroundImage: `linear-gradient(135deg, ${moodConfig.auraColor}, transparent)`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{moodConfig.icon}</span>
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-sm mb-1">
                  {moodConfig.label}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {moodConfig.description}
                </p>
                <p className="text-xs italic">
                  &quot;{moodConfig.motivationalQuote}&quot;
                </p>
              </div>
            </div>
          </button>

          {/* Energy Level */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Energy: {energyLevel}/5
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergyLevel(level as EnergyLevel)}
                  className={cn(
                    "flex-1 h-2 rounded-full transition-all",
                    level <= energyLevel ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Smart Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Suggestions
                </h4>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {suggestions.slice(0, 1).map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium mb-1">
                          {suggestion.title}
                        </h5>
                        <p className="text-xs text-muted-foreground mb-2">
                          {suggestion.description}
                        </p>
                        <p className="text-xs text-primary">
                          💡 {suggestion.reason}
                        </p>
                      </div>
                      {suggestion.action?.type === "apply_timer_preset" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleApplyTimerPreset(
                              suggestion.action!.data.workDuration,
                              suggestion.action!.data.breakDuration,
                            )
                          }
                          className="shrink-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mood Selector Dialog */}
      <Dialog open={showMoodSelector} onOpenChange={setShowMoodSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {Object.entries(MOOD_CONFIGS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleMoodSelect(key as MoodType)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  "hover:scale-105 active:scale-95",
                  currentMood === key
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/50 hover:bg-background/80",
                )}
              >
                <span className="text-3xl">{config.icon}</span>
                <span className="text-sm font-medium">{config.label}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {config.description}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
