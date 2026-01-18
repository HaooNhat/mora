import { NextRequest, NextResponse } from "next/server";
import { container } from "@workspace/infrastructure/di/container";

// GET /api/suggestions/timer?userId=xxx
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

    const useCase = container.getTimerRecommendationUseCase();
    const recommendation = await useCase.execute(userId);

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("GET /api/suggestions/timer error:", error);
    return NextResponse.json(
      { error: "Failed to get timer recommendation" },
      { status: 500 },
    );
  }
}
