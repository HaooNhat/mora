"use client";

import { ProjectList } from "@/components/features/projects/project-list";
import { TaskSuggestion } from "@/components/features/tasks/task-suggestion";
import { ArousalTracker } from "@/components/features/arousal/arousal-tracker";
import { useAuth } from "@/hooks/use-auth";
import { LoadingState } from "@/components/shared/loading-state";
// import { useProductivityReport } from "@/hooks/api/use-productivity";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  // Get today's productivity
  // const today = new Date().toISOString().split("T")[0];
  // const { data: productivity } = useProductivityReport(
  //   user?.id || "",
  //   today!,
  //   today!,
  // );

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (!user) {
    return <div>Please sign in</div>;
  }

  // if (productivity && "error" in productivity) {
  //   return <div className="text-red-500">{productivity.error}</div>;
  // }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.email}</p>
        </div>

        {/* {productivity && "report" in productivity && ( */}
        {/*   <div className="flex gap-4"> */}
        {/*     <div className="text-center"> */}
        {/*       <p className="text-2xl font-bold"> */}
        {/*         {productivity.report.totalFocusTime}m */}
        {/*       </p> */}
        {/*       <p className="text-xs text-muted-foreground">Focus Time</p> */}
        {/*     </div> */}
        {/*     <div className="text-center"> */}
        {/*       <p className="text-2xl font-bold"> */}
        {/*         {productivity.report.tasksCompleted} */}
        {/*       </p> */}
        {/*       <p className="text-xs text-muted-foreground">Tasks Done</p> */}
        {/*     </div> */}
        {/*   </div> */}
        {/* )} */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProjectList />
        </div>

        <div className="space-y-6">
          <ArousalTracker />
          <TaskSuggestion />
        </div>
      </div>
    </div>
  );
}
