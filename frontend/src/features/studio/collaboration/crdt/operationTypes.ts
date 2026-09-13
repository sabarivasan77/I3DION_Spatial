import { CollaborativeOperation, OperationType } from '../types/realtimeTypes';

const generateUUID = () => `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const createOperationPacket = (
  experienceId: string,
  actorId: string,
  actorName: string,
  baseRevision: number,
  type: OperationType,
  targetId: string,
  payload: Record<string, any>
): CollaborativeOperation => {
  return {
    operationId: generateUUID(),
    experienceId,
    actorId,
    actorName,
    timestamp: Date.now(),
    baseRevision,
    type,
    targetId,
    payload,
  };
};

export interface PropertyLWWRecord {
  keypath: string; // e.g. "widgets.widget_01.properties.fontSize"
  value: any;
  timestamp: number;
  actorId: string;
}

export class LWWRegisterMap {
  private registers: Map<string, PropertyLWWRecord> = new Map();

  public update(keypath: string, value: any, timestamp: number, actorId: string): boolean {
    const existing = this.registers.get(keypath);
    if (!existing || timestamp > existing.timestamp || (timestamp === existing.timestamp && actorId > existing.actorId)) {
      this.registers.set(keypath, { keypath, value, timestamp, actorId });
      return true;
    }
    return false;
  }

  public getValue(keypath: string): any {
    return this.registers.get(keypath)?.value;
  }
}
