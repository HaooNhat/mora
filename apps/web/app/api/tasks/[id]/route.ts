import { NextRequest, NextResponse } from "next/server";
import { container } from "@workspace/infrastructure/di/container";

// POST /api/tasks/[id]/complete
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const useCase = container.completeTaskUseCase();
    await useCase.execute(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/tasks/[id]/complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete task" },
      { status: 500 },
    );
  }
}
