// /**
//  * React Query Hooks for Projects
//  *
//  * Presentation Layer - React Query integration
//  * - Handles data fetching and caching
//  * - Optimistic updates
//  * - Automatic refetching
//  * - Error handling
//  */
//
// import {
//   useQuery,
//   useMutation,
//   useQueryClient,
//   type UseQueryOptions,
//   type UseMutationOptions,
// } from "@tanstack/react-query";
// import {
//   projectService,
//   ServiceError,
// } from "@workspace/infrastructure/services/project.service";
// import type { Project, Task, Subtask } from "@workspace/domain/project/types";
//
// // For project detail optimistic updates
// type ProjectDetailMutationContext = {
//   previousProject?: Project;
// };
//
// // For project list optimistic updates
// type ProjectListMutationContext = {
//   previousProjects?: Project[];
// };
//
// /**
//  * Query Keys Factory
//  * Centralized query key management
//  */
// export const projectKeys = {
//   all: ["projects"] as const,
//   lists: () => [...projectKeys.all, "list"] as const,
//   list: () => [...projectKeys.lists()] as const,
//   details: () => [...projectKeys.all, "detail"] as const,
//   detail: (id: string) => [...projectKeys.details(), id] as const,
//   tasks: (projectId: string) =>
//     [...projectKeys.all, "tasks", projectId] as const,
// };
//
// /* ================================
//    PROJECT QUERIES
// ================================ */
//
// /**
//  * Fetch all projects
//  */
// export function useProjects(
//   options?: Omit<
//     UseQueryOptions<Project[], ServiceError>,
//     "queryKey" | "queryFn"
//   >,
// ) {
//   return useQuery({
//     queryKey: projectKeys.list(),
//     queryFn: () => projectService.getAllProjects(),
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     ...options,
//   });
// }
//
// /**
//  * Fetch single project with all data
//  */
// export function useProject(
//   projectId: string | undefined,
//   options?: Omit<
//     UseQueryOptions<Project, ServiceError>,
//     "queryKey" | "queryFn"
//   >,
// ) {
//   return useQuery({
//     queryKey: projectKeys.detail(projectId!),
//     queryFn: () => projectService.getProjectById(projectId!),
//     enabled: !!projectId,
//     staleTime: 2 * 60 * 1000, // 2 minutes
//     ...options,
//   });
// }
//
// /**
//  * Fetch tasks for a project
//  */
// export function useProjectTasks(
//   projectId: string | undefined,
//   options?: Omit<UseQueryOptions<Task[], ServiceError>, "queryKey" | "queryFn">,
// ) {
//   return useQuery({
//     queryKey: projectKeys.tasks(projectId!),
//     queryFn: () => projectService.getTasksByProjectId(projectId!),
//     enabled: !!projectId,
//     staleTime: 1 * 60 * 1000, // 1 minute
//     ...options,
//   });
// }
//
// /* ================================
//    PROJECT MUTATIONS
// ================================ */
//
// /**
//  * Create project mutation
//  */
// export function useCreateProject(
//   options?: UseMutationOptions<Project, ServiceError, string>,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation({
//     mutationFn: (name: string) => projectService.createProject(name),
//     onSuccess: (newProject) => {
//       // Invalidate and refetch projects list
//       queryClient.invalidateQueries({ queryKey: projectKeys.list() });
//
//       // Optionally set the new project data in cache
//       queryClient.setQueryData(projectKeys.detail(newProject.id), newProject);
//     },
//     ...options,
//   });
// }
//
// /**
//  * Update project mutation
//  */
// export function useUpdateProject(
//   options?: UseMutationOptions<
//     Project,
//     ServiceError,
//     {
//       projectId: string;
//       updates: { name?: string; description?: string; color?: string };
//     }
//   >,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation<
//     Project,
//     ServiceError,
//     {
//       projectId: string;
//       updates: { name?: string; description?: string; color?: string };
//     },
//     ProjectDetailMutationContext
//   >({
//     mutationFn: ({ projectId, updates }) =>
//       projectService.updateProject(projectId, updates),
//
//     onMutate: async ({ projectId, updates }) => {
//       await queryClient.cancelQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//
//       const previousProject = queryClient.getQueryData<Project>(
//         projectKeys.detail(projectId),
//       );
//
//       if (previousProject) {
//         queryClient.setQueryData<Project>(projectKeys.detail(projectId), {
//           ...previousProject,
//           ...updates,
//         });
//       }
//
//       return { previousProject };
//     },
//
//     onError: (_error, { projectId }, context) => {
//       if (context?.previousProject) {
//         queryClient.setQueryData(
//           projectKeys.detail(projectId),
//           context.previousProject,
//         );
//       }
//     },
//   });
// }
//
// /**
//  * Delete project mutation
//  */
// export function useDeleteProject(
//   options?: UseMutationOptions<
//     void,
//     ServiceError,
//     string,
//     ProjectListMutationContext
//   >,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation<void, ServiceError, string, ProjectListMutationContext>({
//     mutationFn: (projectId: string) => projectService.deleteProject(projectId),
//
//     onMutate: async (projectId) => {
//       await queryClient.cancelQueries({
//         queryKey: projectKeys.list(),
//       });
//
//       const previousProjects = queryClient.getQueryData<Project[]>(
//         projectKeys.list(),
//       );
//
//       if (previousProjects) {
//         queryClient.setQueryData<Project[]>(
//           projectKeys.list(),
//           previousProjects.filter((p) => p.id !== projectId),
//         );
//       }
//
//       return { previousProjects };
//     },
//
//     onError: (_error, _projectId, context) => {
//       if (context?.previousProjects) {
//         queryClient.setQueryData(projectKeys.list(), context.previousProjects);
//       }
//     },
//
//     onSettled: () => {
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.list(),
//       });
//     },
//
//     ...options,
//   });
// }
//
// /* ================================
//    TASK MUTATIONS
// ================================ */
//
// /**
//  * Create task mutation
//  */
// export function useCreateTask(
//   options?: UseMutationOptions<
//     Task,
//     ServiceError,
//     {
//       projectId: string;
//       data: {
//         title: string;
//         icon?: string;
//         completed?: boolean;
//         deadline?: string;
//         urgent?: boolean;
//         important?: boolean;
//       };
//     }
//   >,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation({
//     mutationFn: ({ projectId, data }) =>
//       projectService.createTask(projectId, data),
//     onSuccess: (newTask, { projectId }) => {
//       // Invalidate project and tasks
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//       queryClient.invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
//     },
//     ...options,
//   });
// }
//
// /**
//  * Update task mutation
//  */
// export function useUpdateTask(
//   options?: UseMutationOptions<
//     Task,
//     ServiceError,
//     {
//       projectId: string;
//       taskId: string;
//       updates: Partial<Omit<Task, "id" | "subtasks">>;
//     },
//     ProjectDetailMutationContext
//   >,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation<
//     Task,
//     ServiceError,
//     {
//       projectId: string;
//       taskId: string;
//       updates: Partial<Omit<Task, "id" | "subtasks">>;
//     },
//     ProjectDetailMutationContext
//   >({
//     mutationFn: ({ taskId, updates }) =>
//       projectService.updateTask(taskId, updates),
//
//     onMutate: async ({ projectId, taskId, updates }) => {
//       await queryClient.cancelQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//
//       const previousProject = queryClient.getQueryData<Project>(
//         projectKeys.detail(projectId),
//       );
//
//       if (previousProject) {
//         const updatedProject: Project = {
//           ...previousProject,
//           tasks: previousProject.tasks.map((task) =>
//             task.id === taskId ? { ...task, ...updates } : task,
//           ),
//         };
//
//         queryClient.setQueryData<Project>(
//           projectKeys.detail(projectId),
//           updatedProject,
//         );
//       }
//
//       return { previousProject };
//     },
//
//     onError: (_error, { projectId }, context) => {
//       if (context?.previousProject) {
//         queryClient.setQueryData(
//           projectKeys.detail(projectId),
//           context.previousProject,
//         );
//       }
//     },
//
//     onSettled: (_data, _error, { projectId }) => {
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.tasks(projectId),
//       });
//     },
//
//     ...options,
//   });
// }
//
// /**
//  * Delete task mutation
//  */
// export function useDeleteTask(
//   options?: UseMutationOptions<
//     void,
//     ServiceError,
//     { projectId: string; taskId: string },
//     ProjectDetailMutationContext
//   >,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation<
//     void,
//     ServiceError,
//     { projectId: string; taskId: string },
//     ProjectDetailMutationContext
//   >({
//     mutationFn: ({ taskId }) => projectService.deleteTask(taskId),
//
//     onMutate: async ({ projectId, taskId }) => {
//       await queryClient.cancelQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//
//       const previousProject = queryClient.getQueryData<Project>(
//         projectKeys.detail(projectId),
//       );
//
//       if (previousProject) {
//         const updatedProject: Project = {
//           ...previousProject,
//           tasks: previousProject.tasks.filter((t) => t.id !== taskId),
//         };
//
//         queryClient.setQueryData<Project>(
//           projectKeys.detail(projectId),
//           updatedProject,
//         );
//       }
//
//       return { previousProject };
//     },
//
//     onError: (_error, { projectId }, context) => {
//       if (context?.previousProject) {
//         queryClient.setQueryData(
//           projectKeys.detail(projectId),
//           context.previousProject,
//         );
//       }
//     },
//
//     onSettled: (_data, _error, { projectId }) => {
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.tasks(projectId),
//       });
//     },
//
//     ...options,
//   });
// }
//
// /**
//  * Toggle task completion mutation
//  */
// export function useToggleTaskComplete(
//   options?: UseMutationOptions<
//     Task,
//     ServiceError,
//     { projectId: string; taskId: string; currentStatus: boolean },
//     ProjectDetailMutationContext
//   >,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation<
//     Task,
//     ServiceError,
//     { projectId: string; taskId: string; currentStatus: boolean },
//     ProjectDetailMutationContext
//   >({
//     mutationFn: ({ taskId, currentStatus }) =>
//       projectService.toggleTaskComplete(taskId, currentStatus),
//
//     onMutate: async ({ projectId, taskId }) => {
//       await queryClient.cancelQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//
//       const previousProject = queryClient.getQueryData<Project>(
//         projectKeys.detail(projectId),
//       );
//
//       if (previousProject) {
//         const updatedProject: Project = {
//           ...previousProject,
//           tasks: previousProject.tasks.map((task) =>
//             task.id === taskId ? { ...task, completed: !task.completed } : task,
//           ),
//         };
//
//         queryClient.setQueryData<Project>(
//           projectKeys.detail(projectId),
//           updatedProject,
//         );
//       }
//
//       return { previousProject };
//     },
//
//     onError: (_error, { projectId }, context) => {
//       if (context?.previousProject) {
//         queryClient.setQueryData(
//           projectKeys.detail(projectId),
//           context.previousProject,
//         );
//       }
//     },
//
//     onSettled: (_data, _error, { projectId }) => {
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//     },
//
//     ...options,
//   });
// }
//
// /* ================================
//    SUBTASK MUTATIONS
// ================================ */
//
// /**
//  * Create subtask mutation
//  */
// export function useCreateSubtask(
//   options?: UseMutationOptions<
//     Subtask,
//     ServiceError,
//     { projectId: string; taskId: string; title: string }
//   >,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation({
//     mutationFn: ({ taskId, title }) =>
//       projectService.createSubtask(taskId, title),
//     onSuccess: (newSubtask, { projectId }) => {
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//     },
//     ...options,
//   });
// }
//
// /**
//  * Update subtask mutation
//  */
// export function useUpdateSubtask(
//   options?: UseMutationOptions<
//     Subtask,
//     ServiceError,
//     {
//       projectId: string;
//       subtaskId: string;
//       updates: Partial<Omit<Subtask, "id">>;
//     }
//   >,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation({
//     mutationFn: ({ subtaskId, updates }) =>
//       projectService.updateSubtask(subtaskId, updates),
//     onSettled: (data, error, { projectId }) => {
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//     },
//     ...options,
//   });
// }
//
// /**
//  * Delete subtask mutation
//  */
// export function useDeleteSubtask(
//   options?: UseMutationOptions<
//     void,
//     ServiceError,
//     { projectId: string; subtaskId: string }
//   >,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation({
//     mutationFn: ({ subtaskId }) => projectService.deleteSubtask(subtaskId),
//     onSettled: (data, error, { projectId }) => {
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//     },
//     ...options,
//   });
// }
//
// /**
//  * Toggle subtask completion mutation
//  */
// export function useToggleSubtaskComplete(
//   options?: UseMutationOptions<
//     Subtask,
//     ServiceError,
//     { projectId: string; subtaskId: string; currentStatus: boolean }
//   >,
// ) {
//   const queryClient = useQueryClient();
//
//   return useMutation({
//     mutationFn: ({ subtaskId, currentStatus }) =>
//       projectService.toggleSubtaskComplete(subtaskId, currentStatus),
//     onSettled: (data, error, { projectId }) => {
//       queryClient.invalidateQueries({
//         queryKey: projectKeys.detail(projectId),
//       });
//     },
//     ...options,
//   });
// }
