// import { z } from "zod";
//
// /** Base schema for Subtask (all fields) */
// const SubtaskBaseSchema = z.object({
//   id: z.string().uuid(),
//
//   taskId: z.string().uuid(),
//   title: z.string().min(1),
//
//   completed: z.boolean(),
//   createdAt: z.date(),
//   updatedAt: z.date(),
// });
//
// /** Full schema with invariant: updatedAt >= createdAt */
// export const SubtaskSchema = SubtaskBaseSchema.refine(
//   (s) => s.updatedAt >= s.createdAt,
//   { message: "updatedAt cannot be before createdAt" },
// );
//
// /** Schema for creation input: omit system-generated fields */
// export const CreateSubtaskSchema = SubtaskBaseSchema.omit({
//   id: true,
//   completed: true,
//   createdAt: true,
//   updatedAt: true,
// });
//
// export type Subtask = z.infer<typeof SubtaskSchema>;
//
// export class SubtaskEntity {
//   private props: Subtask;
//
//   private constructor(props: Subtask) {
//     this.props = SubtaskSchema.parse(props);
//   }
//
//   /**
//    * Factory method to create a new Subtask
//    */
//   static create(input: unknown): SubtaskEntity {
//     const data = CreateSubtaskSchema.parse(input);
//
//     return new SubtaskEntity({
//       ...data,
//       id: crypto.randomUUID(),
//       completed: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });
//   }
//
//   /**
//    * Rehydrate Subtask from persisted data
//    */
//   static fromPersistence(input: unknown): SubtaskEntity {
//     const data = SubtaskSchema.parse(input);
//     return new SubtaskEntity(data);
//   }
//
//   /** Getters */
//   get id(): string {
//     return this.props.id;
//   }
//   get taskId(): string {
//     return this.props.taskId;
//   }
//   get title(): string {
//     return this.props.title;
//   }
//   get completed(): boolean {
//     return this.props.completed;
//   }
//
//   /** Mark subtask as completed */
//   markAsCompleted(): void {
//     this.props.completed = true;
//     this.props.updatedAt = new Date();
//   }
//
//   /** Mark subtask as incomplete */
//   markAsIncomplete(): void {
//     this.props.completed = false;
//     this.props.updatedAt = new Date();
//   }
//
//   /** Update the title */
//   updateTitle(title: string): void {
//     this.props.title = title;
//     this.props.updatedAt = new Date();
//   }
//
//   /** Serialize to plain object */
//   toJSON(): Subtask {
//     return { ...this.props };
//   }
// }
