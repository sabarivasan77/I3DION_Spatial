import { Token, TokenType, TokenPosition, IScriptProblem } from '../types/iscriptTypes';
import {
  ProgramNode,
  TriggerNode,
  StatementNode,
  ActionStatementNode,
  ConditionStatementNode,
  DelayStatementNode,
  VariableStatementNode,
  CommentNode,
} from '../ast/iscriptAst';
import { IScriptLexer } from '../lexer/iscriptLexer';

export class IScriptParser {
  private tokens: Token[] = [];
  private current: number = 0;
  public problems: IScriptProblem[] = [];

  public parse(source: string): ProgramNode {
    const lexer = new IScriptLexer(source);
    this.tokens = lexer.tokenize();
    this.current = 0;
    this.problems = [];

    const statements: (TriggerNode | StatementNode)[] = [];

    while (!this.isAtEnd()) {
      this.skipNewlines();
      if (this.isAtEnd()) break;

      const stmt = this.parseStatementOrTrigger();
      if (stmt) {
        statements.push(stmt);
      } else {
        // Skip current token to prevent infinite loop on syntax error
        this.advance();
      }
    }

    return {
      type: 'Program',
      version: 1,
      line: 1,
      column: 1,
      statements,
    };
  }

  private parseStatementOrTrigger(): TriggerNode | StatementNode | null {
    const token = this.peek();

    if (token.type === 'COMMENT') {
      this.advance();
      return {
        type: 'Comment',
        text: token.value,
        line: token.position.line,
        column: token.position.column,
      } as CommentNode;
    }

    if (token.type === 'WHEN') {
      return this.parseTrigger();
    }

    if (token.type === 'IF') {
      return this.parseCondition();
    }

    if (token.type === 'WAIT') {
      return this.parseDelay();
    }

    if (token.type === 'SET' && this.checkNext('VARIABLE')) {
      return this.parseVariable();
    }

    return this.parseAction();
  }

  private parseTrigger(): TriggerNode | null {
    const whenToken = this.consume('WHEN', 'Expected "WHEN" at start of trigger statement.');
    if (!whenToken) return null;

    const targetToken = this.consume('IDENTIFIER', 'Expected widget identifier after "WHEN".');
    const targetId = targetToken ? targetToken.value : 'widget_001';

    let eventType = 'widget_click';
    if (this.match('IS')) {
      if (this.match('CLICKED')) {
        eventType = 'widget_click';
      } else if (this.match('LOADED')) {
        eventType = 'model_loaded';
      } else if (this.match('SELECTED')) {
        eventType = 'model_object_selected';
      }
    } else if (this.match('STARTS')) {
      this.match('PLAYING');
      eventType = 'video_play';
    } else if (this.match('ENDS')) {
      this.match('PLAYING');
      eventType = 'video_ended';
    }

    this.skipNewlines();
    this.match('DO');
    this.skipNewlines();

    const body: StatementNode[] = [];
    while (!this.isAtEnd() && !this.check('WHEN')) {
      this.skipNewlines();
      if (this.isAtEnd() || this.check('WHEN')) break;
      const stmt = this.parseStatementOrTrigger();
      if (stmt && stmt.type !== 'Trigger') {
        body.push(stmt as StatementNode);
      } else if (stmt && stmt.type === 'Trigger') {
        // Trigger inside trigger is not allowed, stop body parsing
        break;
      }
    }

    return {
      type: 'Trigger',
      eventType,
      targetWidgetId: targetId,
      body,
      line: whenToken.position.line,
      column: whenToken.position.column,
    };
  }

  private parseAction(): ActionStatementNode | null {
    const token = this.peek();

    if (token.type === 'SHOW') {
      this.advance();
      const targetToken = this.consume('IDENTIFIER', 'Expected target widget identifier after "SHOW".');
      return {
        type: 'Action',
        actionType: 'show_widget',
        targetWidgetId: targetToken ? targetToken.value : undefined,
        line: token.position.line,
        column: token.position.column,
      };
    }

    if (token.type === 'HIDE') {
      this.advance();
      const targetToken = this.consume('IDENTIFIER', 'Expected target widget identifier after "HIDE".');
      return {
        type: 'Action',
        actionType: 'hide_widget',
        targetWidgetId: targetToken ? targetToken.value : undefined,
        line: token.position.line,
        column: token.position.column,
      };
    }

    if (token.type === 'TOGGLE') {
      this.advance();
      const targetToken = this.consume('IDENTIFIER', 'Expected target widget identifier after "TOGGLE".');
      return {
        type: 'Action',
        actionType: 'toggle_visibility',
        targetWidgetId: targetToken ? targetToken.value : undefined,
        line: token.position.line,
        column: token.position.column,
      };
    }

    if (token.type === 'SET' && this.checkNext('TEXT')) {
      this.advance(); // SET
      this.advance(); // TEXT
      this.match('OF');
      const targetToken = this.consume('IDENTIFIER', 'Expected target text widget identifier.');
      this.match('TO');
      const textToken = this.consume('STRING', 'Expected text string in quotes after "TO".');
      return {
        type: 'Action',
        actionType: 'set_text',
        targetWidgetId: targetToken ? targetToken.value : undefined,
        text: textToken ? textToken.value : '',
        line: token.position.line,
        column: token.position.column,
      };
    }

    if (token.type === 'PLAY' && this.checkNext('ANIMATION')) {
      this.advance(); // PLAY
      this.advance(); // ANIMATION
      const animToken = this.consume('STRING', 'Expected animation name in quotes after "PLAY ANIMATION".');
      this.match('ON');
      const modelToken = this.consume('IDENTIFIER', 'Expected target 3D model widget identifier.');
      return {
        type: 'Action',
        actionType: 'play_animation',
        animationName: animToken ? animToken.value : 'Open',
        targetWidgetId: modelToken ? modelToken.value : undefined,
        line: token.position.line,
        column: token.position.column,
      };
    }

    if (token.type === 'STOP' && this.checkNext('ANIMATION')) {
      this.advance(); // STOP
      this.advance(); // ANIMATION
      this.match('ON');
      const modelToken = this.consume('IDENTIFIER', 'Expected target 3D model widget identifier.');
      return {
        type: 'Action',
        actionType: 'stop_animation',
        targetWidgetId: modelToken ? modelToken.value : undefined,
        line: token.position.line,
        column: token.position.column,
      };
    }

    if (token.type === 'PAUSE' && this.checkNext('ANIMATION')) {
      this.advance(); // PAUSE
      this.advance(); // ANIMATION
      this.match('ON');
      const modelToken = this.consume('IDENTIFIER', 'Expected target 3D model widget identifier.');
      return {
        type: 'Action',
        actionType: 'pause_animation',
        targetWidgetId: modelToken ? modelToken.value : undefined,
        line: token.position.line,
        column: token.position.column,
      };
    }

    if (token.type === 'FOCUS' && this.checkNext('OBJECT')) {
      this.advance(); // FOCUS
      this.advance(); // OBJECT
      const objToken = this.consume('STRING', 'Expected object ID in quotes after "FOCUS OBJECT".');
      this.match('ON');
      const modelToken = this.consume('IDENTIFIER', 'Expected target 3D model widget identifier.');
      return {
        type: 'Action',
        actionType: 'focus_object',
        objectId: objToken ? objToken.value : 'Impeller_01',
        targetWidgetId: modelToken ? modelToken.value : undefined,
        line: token.position.line,
        column: token.position.column,
      };
    }

    if (token.type === 'SET' && this.checkNext('CAMERA')) {
      this.advance(); // SET
      this.advance(); // CAMERA
      const presetToken = this.consume('STRING', 'Expected camera preset name in quotes after "SET CAMERA".');
      this.match('ON');
      const modelToken = this.consume('IDENTIFIER', 'Expected target 3D model widget identifier.');
      return {
        type: 'Action',
        actionType: 'set_camera',
        cameraPreset: presetToken ? presetToken.value : 'Front',
        targetWidgetId: modelToken ? modelToken.value : undefined,
        line: token.position.line,
        column: token.position.column,
      };
    }

    if (token.type === 'NAVIGATE') {
      this.advance();
      this.match('TO');
      const destToken = this.consume('STRING', 'Expected route destination string in quotes.');
      return {
        type: 'Action',
        actionType: 'navigate',
        destination: destToken ? destToken.value : '/',
        line: token.position.line,
        column: token.position.column,
      };
    }

    // Unrecognized Action Statement
    this.addProblem(`Unrecognized instruction "${token.value}"`, 'ERROR', token.position);
    return null;
  }

  private parseCondition(): ConditionStatementNode | null {
    const ifToken = this.consume('IF', 'Expected "IF".');
    if (!ifToken) return null;

    const varToken = this.consume('IDENTIFIER', 'Expected variable name after "IF".');
    let operator = '==';
    if (this.match('IS')) {
      if (this.match('NOT')) operator = '!=';
      else if (this.match('GREATER')) {
        this.match('THAN');
        operator = '>';
      } else if (this.match('LESS')) {
        this.match('THAN');
        operator = '<';
      }
    }

    const valToken = this.advance();
    let val: any = valToken ? valToken.value : '';
    if (valToken?.type === 'NUMBER') val = Number(val);
    if (valToken?.type === 'BOOLEAN') val = val === 'true';

    this.skipNewlines();
    this.match('DO');
    this.skipNewlines();

    const thenActions: ActionStatementNode[] = [];
    while (!this.isAtEnd() && !this.check('WHEN') && !this.check('IF')) {
      this.skipNewlines();
      if (this.isAtEnd() || this.check('WHEN') || this.check('IF')) break;
      const act = this.parseAction();
      if (act) thenActions.push(act);
      else break;
    }

    return {
      type: 'Condition',
      variableName: varToken ? varToken.value : 'mode',
      operator,
      value: val,
      thenActions,
      line: ifToken.position.line,
      column: ifToken.position.column,
    };
  }

  private parseDelay(): DelayStatementNode | null {
    const waitToken = this.consume('WAIT', 'Expected "WAIT".');
    if (!waitToken) return null;

    const numToken = this.consume('NUMBER', 'Expected number of seconds after "WAIT".');
    this.match('SECONDS') || this.match('SECOND');

    return {
      type: 'Delay',
      durationSeconds: numToken ? Number(numToken.value) : 1,
      line: waitToken.position.line,
      column: waitToken.position.column,
    };
  }

  private parseVariable(): VariableStatementNode | null {
    const setToken = this.consume('SET', 'Expected "SET".');
    if (!setToken) return null;

    this.consume('VARIABLE', 'Expected "VARIABLE".');
    const varToken = this.consume('IDENTIFIER', 'Expected variable name.');
    this.match('TO');

    const valToken = this.advance();
    let val: any = valToken ? valToken.value : '';
    if (valToken?.type === 'NUMBER') val = Number(val);
    if (valToken?.type === 'BOOLEAN') val = val === 'true';

    return {
      type: 'Variable',
      name: varToken ? varToken.value : 'myVar',
      value: val,
      line: setToken.position.line,
      column: setToken.position.column,
    };
  }

  // --- Helper Parser Utility Methods ---
  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', position: { line: 1, column: 1, start: 0, end: 0 } };
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkNext(type: TokenType): boolean {
    if (this.current + 1 >= this.tokens.length) return false;
    return this.tokens[this.current + 1].type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.tokens[this.current - 1];
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, errorMessage: string): Token | null {
    if (this.check(type)) return this.advance();
    this.addProblem(errorMessage, 'ERROR', this.peek().position);
    return null;
  }

  private skipNewlines(): void {
    while (this.check('NEWLINE')) {
      this.advance();
    }
  }

  private addProblem(message: string, severity: 'ERROR' | 'WARNING' | 'INFO', pos: TokenPosition): void {
    this.problems.push({
      message,
      severity,
      line: pos.line,
      column: pos.column,
      start: pos.start,
      end: pos.end,
    });
  }
}
