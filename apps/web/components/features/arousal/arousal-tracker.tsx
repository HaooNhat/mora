"use client";

import { useState } from "react";
import { useCurrentArousal, useRecordArousal } from "@/hooks/api/use-arousal";
import { useAuthOld } from "@/hooks/use-auth";
import { MOOD_CONFIGS } from "@workspace/domain/mood/types";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { LoadingState } from "@/components/shared/loading-state";

export function ArousalTracker() {
  const { user } = useAuthOld();
  const { data: currentArousal, isLoading } = useCurrentArousal(user?.id || "");
  const recordMood = useRecordArousal();

  const [selectedArousal, setSelectedMood] = useState<string | null>(null);

  const handleRecordMood = () => {
    if (!user?.id || !selectedArousal) return;

    recordMood.mutate({
      userId: user.id,
      arousal: selectedArousal,
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are you feeling?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Grid */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(MOOD_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedMood(key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                selectedArousal === key
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              <span className="text-3xl">{config.icon}</span>
              <span className="text-sm font-medium">{config.label}</span>
            </button>
          ))}
        </div>

        {/* Energy Level */}

        <Button
          onClick={handleRecordMood}
          disabled={!selectedArousal || recordMood.isPending}
          className="w-full"
        >
          {recordMood.isPending ? "Recording..." : "Record Mood"}
        </Button>
      </CardContent>
    </Card>
  );
}
