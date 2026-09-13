import { Token, TokenType, TokenPosition } from '../types/iscriptTypes';

const KEYWORDS: Record<string, TokenType> = {
  when: 'WHEN',
  do: 'DO',
  is: 'IS',
  clicked: 'CLICKED',
  loaded: 'LOADED',
  selected: 'SELECTED',
  submitted: 'SUBMITTED',
  playing: 'PLAYING',
  starts: 'STARTS',
  ends: 'ENDS',
  show: 'SHOW',
  hide: 'HIDE',
  toggle: 'TOGGLE',
  set: 'SET',
  text: 'TEXT',
  of: 'OF',
  to: 'TO',
  play: 'PLAY',
  stop: 'STOP',
  pause: 'PAUSE',
  animation: 'ANIMATION',
  on: 'ON',
  camera: 'CAMERA',
  focus: 'FOCUS',
  object: 'OBJECT',
  open: 'OPEN',
  hotspot: 'HOTSPOT',
  video: 'VIDEO',
  navigate: 'NAVIGATE',
  variable: 'VARIABLE',
  if: 'IF',
  not: 'NOT',
  greater: 'GREATER',
  less: 'LESS',
  than: 'THAN',
  true: 'TRUE',
  false: 'FALSE',
  wait: 'WAIT',
  seconds: 'SECONDS',
  second: 'SECOND',
};

export class IScriptLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.source.length) {
      const char = this.source[this.position];

      // Handle Newlines
      if (char === '\n') {
        tokens.push(this.createToken('NEWLINE', '\n', 1));
        this.position++;
        this.line++;
        this.column = 1;
        continue;
      }

      if (char === '\r') {
        this.position++;
        continue;
      }

      // Handle Whitespace
      if (/\s/.test(char)) {
        this.position++;
        this.column++;
        continue;
      }

      // Handle Comments (# ...)
      if (char === '#') {
        const startPos = this.position;
        let value = '';
        while (this.position < this.source.length && this.source[this.position] !== '\n') {
          value += this.source[this.position];
          this.position++;
        }
        tokens.push({
          type: 'COMMENT',
          value,
          position: {
            line: this.line,
            column: this.column,
            start: startPos,
            end: this.position,
          },
        });
        this.column += value.length;
        continue;
      }

      // Handle Quoted Strings ("...")
      if (char === '"' || char === "'") {
        const quoteChar = char;
        const startPos = this.position;
        const startCol = this.column;
        this.position++; // Skip opening quote
        let strVal = '';

        while (this.position < this.source.length && this.source[this.position] !== quoteChar) {
          if (this.source[this.position] === '\\' && this.position + 1 < this.source.length) {
            strVal += this.source[this.position + 1];
            this.position += 2;
          } else {
            strVal += this.source[this.position];
            this.position++;
          }
        }

        if (this.position < this.source.length && this.source[this.position] === quoteChar) {
          this.position++; // Skip closing quote
        }

        const length = this.position - startPos;
        tokens.push({
          type: 'STRING',
          value: strVal,
          position: {
            line: this.line,
            column: startCol,
            start: startPos,
            end: this.position,
          },
        });
        this.column += length;
        continue;
      }

      // Handle Numbers
      if (/[0-9]/.test(char)) {
        const startPos = this.position;
        const startCol = this.column;
        let numStr = '';
        while (this.position < this.source.length && /[0-9\.]/.test(this.source[this.position])) {
          numStr += this.source[this.position];
          this.position++;
        }
        tokens.push({
          type: 'NUMBER',
          value: numStr,
          position: {
            line: this.line,
            column: startCol,
            start: startPos,
            end: this.position,
          },
        });
        this.column += numStr.length;
        continue;
      }

      // Handle Identifiers & Keywords
      if (/[a-zA-Z_]/.test(char)) {
        const startPos = this.position;
        const startCol = this.column;
        let word = '';
        while (this.position < this.source.length && /[a-zA-Z0-9_-]/.test(this.source[this.position])) {
          word += this.source[this.position];
          this.position++;
        }

        const lower = word.toLowerCase();
        const kwType = KEYWORDS[lower];

        tokens.push({
          type: kwType ? kwType : lower === 'true' || lower === 'false' ? 'BOOLEAN' : 'IDENTIFIER',
          value: word,
          position: {
            line: this.line,
            column: startCol,
            start: startPos,
            end: this.position,
          },
        });
        this.column += word.length;
        continue;
      }

      // Fallback Unknown Char
      tokens.push(this.createToken('OPERATOR', char, 1));
      this.position++;
      this.column++;
    }

    tokens.push({
      type: 'EOF',
      value: '',
      position: {
        line: this.line,
        column: this.column,
        start: this.position,
        end: this.position,
      },
    });

    return tokens;
  }

  private createToken(type: TokenType, value: string, length: number): Token {
    const pos: TokenPosition = {
      line: this.line,
      column: this.column,
      start: this.position,
      end: this.position + length,
    };
    return { type, value, position: pos };
  }
}
