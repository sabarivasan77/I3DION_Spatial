export const scriptService = {
  tokenize: (scriptText) => {
    if (!scriptText || typeof scriptText !== 'string') return [];
    const tokens = [];
    const regex = /\s*("[^"]*"|'[^']*'|[a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|\{|\}|\(|\)|,|=|!=|>=|<=|>|<|\+|\-|\*|\/)\s*/g;
    let match;
    while ((match = regex.exec(scriptText)) !== null) {
      if (match[1]) tokens.push(match[1]);
    }
    return tokens;
  },

  validateSyntax: (scriptText) => {
    if (!scriptText || typeof scriptText !== 'string' || !scriptText.trim()) {
      return { valid: true, errors: [], tokensCount: 0 };
    }

    const errors = [];
    const tokens = scriptService.tokenize(scriptText);
    let openParens = 0;
    let openBraces = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === '(') openParens++;
      if (token === ')') openParens--;
      if (token === '{') openBraces++;
      if (token === '}') openBraces--;

      if (openParens < 0) {
        errors.push(`Unexpected closing parenthesis ')' at token position ${i + 1}`);
        openParens = 0;
      }
      if (openBraces < 0) {
        errors.push(`Unexpected closing brace '}' at token position ${i + 1}`);
        openBraces = 0;
      }
    }

    if (openParens > 0) errors.push(`Unclosed parenthesis '(' detected (${openParens} missing ')')`);
    if (openBraces > 0) errors.push(`Unclosed block brace '{' detected (${openBraces} missing '}')`);

    return {
      valid: errors.length === 0,
      errors,
      tokensCount: tokens.length
    };
  },

  parseAST: (scriptText) => {
    const { valid, errors } = scriptService.validateSyntax(scriptText);
    if (!valid) throw new Error(`iScript syntax error: ${errors.join(', ')}`);

    const statements = [];
    const lines = scriptText.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('//')) continue;

      // Match command call: CommandName("arg1", "arg2")
      const callMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)$/);
      if (callMatch) {
        const command = callMatch[1];
        const rawArgs = callMatch[2];
        const args = rawArgs ? rawArgs.split(',').map(a => a.trim().replace(/^["']|["']$/g, '')) : [];
        statements.push({
          type: 'CallExpression',
          command,
          args
        });
      }
    }

    return {
      type: 'Program',
      body: statements
    };
  }
};
