// export class TimeRangeVO {
//   private constructor(
//     private readonly start: Date,
//     private readonly end: Date,
//   ) {
//     if (end < start) {
//       throw new Error("End time must be after start time");
//     }
//   }
//
//   static create(start: Date, end: Date): TimeRangeVO {
//     return new TimeRangeVO(start, end);
//   }
//
//   get startTime(): Date {
//     return this.start;
//   }
//
//   get endTime(): Date {
//     return this.end;
//   }
//
//   get durationInMinutes(): number {
//     return (this.end.getTime() - this.start.getTime()) / 1000 / 60;
//   }
//
//   overlaps(other: TimeRangeVO): boolean {
//     return this.start < other.end && this.end > other.start;
//   }
// }
