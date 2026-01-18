import { NextRequest, NextResponse } from "next/server";
import { container } from "@workspace/infrastructure/di/container";
import { CreateTaskDtoSchema } from "@workspace/application/dto/project.dto";
import { z } from "zod";

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateTaskDtoSchema.parse(body);

    const useCase = container.createTaskUseCase();
    const result = await useCase.execute(validated);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
