import { NextRequest, NextResponse } from "next/server";
import { container } from "@workspace/infrastructure/di/container";
import {
  MoodTypeSchema,
  EnergyLevelSchema,
} from "@workspace/domain/entities/mood-entry.entity";
import { z } from "zod";

// GET /api/tasks/by-mood?userId=xxx&mood=xxx&energy=3
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const mood = searchParams.get("mood");
    const energyStr = searchParams.get("energy");

    if (!userId || !mood || !energyStr) {
      return NextResponse.json(
        { error: "userId, mood, and energy are required" },
        { status: 400 },
      );
    }

    const validatedMood = MoodTypeSchema.parse(mood);
    const validatedEnergy = EnergyLevelSchema.parse(parseInt(energyStr));

    const useCase = container.getTasksByMoodUseCase();
    const tasks = await useCase.execute(userId, validatedMood, validatedEnergy);

    return NextResponse.json({ tasks });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("GET /api/tasks/by-mood error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks by mood" },
      { status: 500 },
    );
  }
}
