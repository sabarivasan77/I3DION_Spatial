export type ASTNodeType =
  | 'Program'
  | 'Trigger'
  | 'Action'
  | 'Condition'
  | 'Delay'
  | 'Variable'
  | 'Comment';

export interface BaseASTNode {
  type: ASTNodeType;
  line: number;
  column: number;
}

export interface ActionStatementNode extends BaseASTNode {
  type: 'Action';
  actionType: string;
  targetWidgetId?: string;
  animationName?: string;
  cameraPreset?: string;
  objectId?: string;
  hotspotId?: string;
  text?: string;
  variableName?: string;
  value?: any;
  destination?: string;
}

export interface ConditionStatementNode extends BaseASTNode {
  type: 'Condition';
  variableName: string;
  operator: string;
  value: any;
  thenActions: ActionStatementNode[];
  elseActions?: ActionStatementNode[];
}

export interface DelayStatementNode extends BaseASTNode {
  type: 'Delay';
  durationSeconds: number;
}

export interface VariableStatementNode extends BaseASTNode {
  type: 'Variable';
  name: string;
  value: any;
}

export interface CommentNode extends BaseASTNode {
  type: 'Comment';
  text: string;
}

export type StatementNode =
  | ActionStatementNode
  | ConditionStatementNode
  | DelayStatementNode
  | VariableStatementNode
  | CommentNode;

export interface TriggerNode extends BaseASTNode {
  type: 'Trigger';
  eventType: string; // e.g. 'widget_click', 'model_loaded', 'hotspot_click'
  targetWidgetId?: string;
  objectId?: string;
  body: StatementNode[];
}

export interface ProgramNode extends BaseASTNode {
  type: 'Program';
  version: number;
  statements: (TriggerNode | StatementNode)[];
}
