import { useTimer } from "@workspace/features/Timer/hooks/useTimer";
import { type TimerConfig } from "@workspace/types/Timer";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  CircleTimer,
  CIRCUMFERENCE,
} from "@workspace/ui/components/Timer/CircleTimer";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

export default function TimerCard() {
  const {
    state,
    config,
    isRunning,
    canStart,
    currentTimeFormatted,
    progress,
    displayInfo,
    phaseDescription,
    pomodoroPhase,
    pomodoroSession,
    start,
    pause,
    reset,
    switchMode,
    updateConfig,
  } = useTimer();

  const totalTime = 1 * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Update settings only. Apply changes with the Reset button below
  const handleSettingChange = (
    timerType: keyof TimerConfig,
    setting: string,
    value: number,
  ) => {
    updateConfig({
      [timerType]: {
        ...config[timerType],
        [setting]: value,
      },
    } as Partial<TimerConfig>);
  };

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <Card className={cn("w-full max-w-lg max-h-full ")}>
      <CardHeader>
        <CardTitle>Multi-Timer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer display */}
        <div className="flex items-center justify-center text-3xl font-mono">
          {currentTimeFormatted}
        </div>

        {/* Circle Progress Timer */}
        <div className="flex items-center justify-center">
          <CircleTimer
            isRunning={isRunning}
            strokeDashoffset={strokeDashoffset}
            currentTimeFormatted={currentTimeFormatted}
          />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-center">
        <Button
          className="w-48 h-12 text-2xl rounded-3xl"
          onClick={() => {
            if (isRunning) {
              pause();
            } else {
              start();
            }
          }}
        >
          {isRunning ? "Pause" : "Play"}
        </Button>
      </CardFooter>
    </Card>
  );
}

const TimerSetting = ({
  config,
  handleSettingChange,
}: {
  config: {
    pomodoro: {
      workDuration: number;
      shortBreakDuration: number;
      longBreakDuration: number;
      sessionsUntilLongBreak: number;
    };
    stopwatch: {
      maxDuration?: number | undefined;
    };
    countdown: {
      duration: number;
    };
  };
  handleSettingChange: (
    timerType: keyof TimerConfig,
    setting: string,
    value: number,
  ) => void;
}) => {
  return (
    <>
      <Tabs defaultValue="pomodoro">
        <TabsList className="w-full">
          <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
          <TabsTrigger value="stopwatch">Stopwatch</TabsTrigger>
          <TabsTrigger value="countdown">Countdown</TabsTrigger>
        </TabsList>

        <TabsContent value="pomodoro">
          <div className="space-y-6 my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 m-2 gap-4">
              <div className="">
                <Label htmlFor="pomodoro-work-duration">Work duration</Label>
                <Input
                  id="pomodoro-work-duration"
                  type="number"
                  min={1}
                  defaultValue={config.pomodoro.workDuration}
                  onChange={(e) => {
                    const newWorkDuration = Number(e.target.value);
                    handleSettingChange(
                      "pomodoro",
                      "workDuration",
                      newWorkDuration,
                    );
                  }}
                />
              </div>
              <div className="">
                <Label htmlFor="pomodoro-short-break-duration">
                  Short break duration
                </Label>
                <Input
                  id="pomodoro-short-break-duration"
                  type="number"
                  min={1}
                  defaultValue={config.pomodoro.shortBreakDuration}
                  onChange={(e) => {
                    const newBreakDuration = Number(e.target.value);
                    handleSettingChange(
                      "pomodoro",
                      "shortBreakDuration",
                      newBreakDuration,
                    );
                  }}
                />
              </div>
              <div className="">
                <Label htmlFor="pomodoro-long-break-duration">
                  Long break duration
                </Label>
                <Input
                  id="pomodoro-long-break-duration"
                  type="number"
                  min={1}
                  defaultValue={config.pomodoro.longBreakDuration}
                  onChange={(e) => {
                    const newBreakDuration = Number(e.target.value);
                    handleSettingChange(
                      "pomodoro",
                      "longBreakDuration",
                      newBreakDuration,
                    );
                  }}
                />
              </div>
              <div className="">
                <Label htmlFor="pomodoro-session-until-long-break">
                  Work session until long break duration
                </Label>
                <Input
                  id="pomodoro-session-until-long-break"
                  type="number"
                  min={1}
                  defaultValue={config.pomodoro.sessionsUntilLongBreak}
                  onChange={(e) => {
                    const newSessionUntil = Number(e.target.value);
                    handleSettingChange(
                      "pomodoro",
                      "sessionsUntilLongBreak",
                      newSessionUntil,
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stopwatch">
          <div className="space-y-4 my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 m-2 gap-4">
              <div>
                <Label htmlFor="stopwatch-note">Stopwatch</Label>
                <div className="text-sm text-muted-foreground">
                  Stopwatch has no duration settings — it counts up from 0.
                </div>
              </div>
              <div>
                <Label htmlFor="stopwatch-reset-on-switch">
                  Reset on mode switch
                </Label>
                <input
                  id="stopwatch-reset-on-switch"
                  type="checkbox"
                  className="mt-2"
                  checked={false}
                  onChange={() => {
                    // placeholder: if you want to add a setting later,
                    // handleSettingChange("stopwatch", "resetOnSwitch", value)
                  }}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="countdown">
          <div className="space-y-6 my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 m-2 gap-4">
              <div>
                <Label htmlFor="countdown-duration">Duration (minutes)</Label>
                <Input
                  id="countdown-duration"
                  type="number"
                  min={1}
                  defaultValue={config.countdown.duration}
                  onChange={(e) => {
                    const newDuration = Number(e.target.value);
                    handleSettingChange("countdown", "duration", newDuration);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="countdown-autostop">Auto stop at 0</Label>
                <div className="text-sm text-muted-foreground">
                  Countdown stops automatically when it reaches zero.
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};
