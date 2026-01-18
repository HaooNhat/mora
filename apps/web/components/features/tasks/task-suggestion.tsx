"use client";

import { useTaskSuggestion } from "@/hooks/api/use-suggestions";
import { useAuthOld } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Lightbulb } from "lucide-react";
import { LoadingState } from "@/components/shared/loading-state";

export function TaskSuggestion() {
  const { user } = useAuthOld();
  const { data, isLoading } = useTaskSuggestion(user?.id || "");

  if (isLoading) {
    return <LoadingState />;
  }

  if (!data?.suggestion) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">
            No task suggestions available. Record your mood first!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { suggestion } = data;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Mora Suggests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold">{suggestion.task.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {suggestion.reason}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Confidence: {suggestion.confidence}%
          </span>
          <Button size="sm">Start Task</Button>
        </div>
      </CardContent>
    </Card>
  );
}
