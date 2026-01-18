import { NextRequest, NextResponse } from "next/server";
import { container } from "@workspace/infrastructure/di/container";
import { CompleteTimerSessionDtoSchema } from "@workspace/application/dto/timer.dto";
import { z } from "zod";

// POST /api/timer/sessions/[id]/complete
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const validated = CompleteTimerSessionDtoSchema.parse({
      ...body,
      sessionId: params.id,
    });

    const useCase = container.completeTimerSessionUseCase();
    await useCase.execute(validated);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("POST /api/timer/sessions/[id]/complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete timer session" },
      { status: 500 },
    );
  }
}
