import { NextRequest, NextResponse } from "next/server";
import { container } from "@workspace/infrastructure/di/container";
import { RecordArousalDtoSchema } from "@workspace/application/dto/mood.dto";
import { z } from "zod";

// GET /api/mood?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const useCase = container.getCurrentArousalUseCase();
    const mood = await useCase.execute(userId);

    return NextResponse.json({ mood });
  } catch (error) {
    console.error("GET /api/mood error:", error);
    return NextResponse.json(
      { error: "Failed to fetch current mood" },
      { status: 500 },
    );
  }
}

// POST /api/mood
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RecordArousalDtoSchema.parse(body);

    const useCase = container.recordArousalUseCase();
    const result = await useCase.execute(validated);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("POST /api/mood error:", error);
    return NextResponse.json(
      { error: "Failed to record mood" },
      { status: 500 },
    );
  }
}
