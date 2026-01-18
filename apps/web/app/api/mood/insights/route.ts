import { NextRequest, NextResponse } from "next/server";
import { container } from "@workspace/infrastructure/di/container";

// GET /api/mood/insights?userId=xxx&startDate=xxx&endDate=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!userId || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "userId, startDate, and endDate are required" },
        { status: 400 },
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const useCase = container.getMoodInsightsUseCase();
    const insights = await useCase.execute(userId, startDate, endDate);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("GET /api/mood/insights error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mood insights" },
      { status: 500 },
    );
  }
}
