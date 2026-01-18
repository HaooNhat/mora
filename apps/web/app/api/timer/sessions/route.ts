import { NextRequest, NextResponse } from "next/server";
import { container } from "@workspace/infrastructure/di/container";
import { StartTimerSessionDtoSchema } from "@workspace/application/dto/timer.dto";
import { z } from "zod";

// GET /api/timer/sessions?userId=xxx&startDate=xxx&endDate=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const useCase = container.getUserSessionsUseCase();
    const sessions = await useCase.execute(userId, startDate, endDate);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET /api/timer/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timer sessions" },
      { status: 500 },
    );
  }
}

// POST /api/timer/sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = StartTimerSessionDtoSchema.parse(body);

    const useCase = container.startTimerSessionUseCase();
    const result = await useCase.execute(validated);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("POST /api/timer/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to start timer session" },
      { status: 500 },
    );
  }
}
