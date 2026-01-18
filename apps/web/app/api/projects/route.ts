import { NextRequest, NextResponse } from "next/server";
import { container } from "@workspace/infrastructure/di/container";
import { CreateProjectDtoSchema } from "@workspace/application/dto/project.dto";
import { z } from "zod";

// GET /api/projects?userId=xxx
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

    const useCase = container.getUserProjectsUseCase();
    const projects = await useCase.execute(userId);

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

// POST /api/projects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = CreateProjectDtoSchema.parse(body);

    const useCase = container.createProjectUseCase();
    const result = await useCase.execute(validated);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
