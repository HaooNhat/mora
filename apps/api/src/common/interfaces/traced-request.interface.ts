import { Request } from 'express';

export interface TracedRequest extends Request {
  requestId: string;
  startTime: number;
}
