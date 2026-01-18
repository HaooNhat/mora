import { NextRequest, NextResponse } from "next/server";
import { container } from "@workspace/infrastructure/di/container";

// GET /api/suggestions/task?userId=xxx
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

    const useCase = container.getTaskSuggestionUseCase();
    const suggestion = await useCase.execute(userId);

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("GET /api/suggestions/task error:", error);
    return NextResponse.json(
      { error: "Failed to get task suggestion" },
      { status: 500 },
    );
  }
}
