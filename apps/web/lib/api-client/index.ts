export { api } from "./client";
export { ApiError } from "./errors";

// Re-export the generated schema types so consumers
// import from one place: @/lib/api-client
export type { components, paths, operations } from "./schema.d.ts";
