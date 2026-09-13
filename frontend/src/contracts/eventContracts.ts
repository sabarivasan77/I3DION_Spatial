export type TelemetryEventType =
  | 'view'
  | 'like'
  | 'save'
  | 'comment'
  | 'share'
  | 'enquiry'
  | 'ar_launch'
  | 'interactive_launch';

export interface TelemetryPayload {
  eventType: TelemetryEventType;
  productId?: string;
  productName?: string;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}
