import { LogicRule } from '../../logic/types/logic';

export interface IScriptParseResult {
  success: boolean;
  rules: LogicRule[];
  errors: string[];
}

export interface IScriptToken {
  type: 'KEYWORD' | 'IDENTIFIER' | 'STRING' | 'EQUALS' | 'NUMBER' | 'NEWLINE';
  value: string;
  line: number;
}

export interface AutocompleteItem {
  label: string;
  kind: 'keyword' | 'widget' | 'property' | 'event';
  detail: string;
  snippet: string;
}
