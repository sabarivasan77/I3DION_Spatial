import { z } from 'zod';

export type BlockCategory =
  | 'layout'
  | 'content'
  | 'product'
  | 'interaction'
  | 'navigation'
  | 'data';

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface BlockPort {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  direction: 'in' | 'out';
  label: string;
}

export interface BlockDef<TProps = Record<string, unknown>> {
  type: string;
  title: string;
  description: string;
  category: BlockCategory;
  icon: string;
  isContainer: boolean;
  capacityLimit?: number;
  accepts?: (childType: string) => boolean;
  propsSchema: z.ZodType<TProps>;
  defaultProps: TProps;
  ports?: BlockPort[];
  validate?: (props: TProps) => ValidationError[];
}
