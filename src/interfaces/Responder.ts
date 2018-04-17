import { Response } from 'express';
export interface Responder {
  sendOperationSuccess(): void;
  sendOperationError(error?: string, status?: number): void;
  sendObject(object: any): void;

  writeStream(): Response;
}
