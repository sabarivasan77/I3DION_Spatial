export type TokenType =
  | 'WHEN'
  | 'DO'
  | 'IS'
  | 'CLICKED'
  | 'LOADED'
  | 'SELECTED'
  | 'SUBMITTED'
  | 'PLAYING'
  | 'STARTS'
  | 'ENDS'
  | 'SHOW'
  | 'HIDE'
  | 'TOGGLE'
  | 'SET'
  | 'TEXT'
  | 'OF'
  | 'TO'
  | 'PLAY'
  | 'STOP'
  | 'PAUSE'
  | 'ANIMATION'
  | 'ON'
  | 'CAMERA'
  | 'FOCUS'
  | 'OBJECT'
  | 'OPEN'
  | 'HOTSPOT'
  | 'VIDEO'
  | 'NAVIGATE'
  | 'VARIABLE'
  | 'IF'
  | 'NOT'
  | 'GREATER'
  | 'LESS'
  | 'THAN'
  | 'TRUE'
  | 'FALSE'
  | 'WAIT'
  | 'SECONDS'
  | 'SECOND'
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'COMMENT'
  | 'NEWLINE'
  | 'OPERATOR'
  | 'EOF';

export interface TokenPosition {
  line: number;
  column: number;
  start: number;
  end: number;
}

export interface Token {
  type: TokenType;
  value: string;
  position: TokenPosition;
}

export type Severity = 'ERROR' | 'WARNING' | 'INFO';

export interface IScriptProblem {
  message: string;
  severity: Severity;
  line: number;
  column: number;
  start: number;
  end: number;
}

export interface AutocompleteSuggestion {
  label: string;
  kind: 'keyword' | 'widget' | 'model' | 'animation' | 'action' | 'snippet';
  detail?: string;
  insertText: string;
}

export interface IScriptDocument {
  version: number;
  languageVersion: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}
