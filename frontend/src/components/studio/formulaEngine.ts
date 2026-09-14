export interface FormulaContext {
  variables?: Record<string, any>;
  component?: Record<string, any>;
  vault?: Record<string, any>;
  user?: Record<string, any>;
}

export const formulaEngine = {
  evaluate: (expression: any, context: FormulaContext = {}): any => {
    if (expression === undefined || expression === null) return '';
    if (typeof expression !== 'string') return expression;

    const trimmed = expression.trim();
    if (!trimmed.startsWith('=')) return expression;

    const formula = trimmed.slice(1).trim();

    try {
      // IF(condition, trueVal, falseVal)
      if (formula.toUpperCase().startsWith('IF(') && formula.endsWith(')')) {
        const argsStr = formula.slice(3, -1);
        const args = formulaEngine.splitArgs(argsStr);
        if (args.length >= 2) {
          const conditionRes = formulaEngine.evalCondition(args[0], context);
          return conditionRes
            ? formulaEngine.resolve(args[1], context)
            : args[2] ? formulaEngine.resolve(args[2], context) : '';
        }
      }

      // SWITCH(expr, val1, res1, val2, res2, defaultVal)
      if (formula.toUpperCase().startsWith('SWITCH(') && formula.endsWith(')')) {
        const argsStr = formula.slice(7, -1);
        const args = formulaEngine.splitArgs(argsStr);
        if (args.length >= 3) {
          const target = formulaEngine.resolve(args[0], context);
          for (let i = 1; i < args.length - 1; i += 2) {
            const matchVal = formulaEngine.resolve(args[i], context);
            if (target === matchVal) {
              return formulaEngine.resolve(args[i + 1], context);
            }
          }
          if (args.length % 2 === 0) {
            return formulaEngine.resolve(args[args.length - 1], context);
          }
        }
      }

      // CONCAT(str1, str2, ...)
      if (formula.toUpperCase().startsWith('CONCAT(') && formula.endsWith(')')) {
        const argsStr = formula.slice(7, -1);
        const args = formulaEngine.splitArgs(argsStr);
        return args.map(a => String(formulaEngine.resolve(a, context))).join('');
      }

      // LOWER(str) / UPPER(str)
      if (formula.toUpperCase().startsWith('LOWER(') && formula.endsWith(')')) {
        const inner = formula.slice(6, -1);
        return String(formulaEngine.resolve(inner, context)).toLowerCase();
      }
      if (formula.toUpperCase().startsWith('UPPER(') && formula.endsWith(')')) {
        const inner = formula.slice(6, -1);
        return String(formulaEngine.resolve(inner, context)).toUpperCase();
      }

      // TODAY() / NOW()
      if (formula.toUpperCase() === 'TODAY()') return new Date().toISOString().split('T')[0];
      if (formula.toUpperCase() === 'NOW()') return new Date().toISOString();

      return formulaEngine.resolve(formula, context);
    } catch (err: any) {
      console.error('Formula Evaluation Error:', err);
      return `#ERROR: ${err?.message || 'Invalid Formula'}`;
    }
  },

  splitArgs: (str: string): string[] => {
    const args: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let parenDepth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === stringChar && inString) {
        inString = false;
        current += char;
      } else if (char === '(' && !inString) {
        parenDepth++;
        current += char;
      } else if (char === ')' && !inString) {
        parenDepth--;
        current += char;
      } else if (char === ',' && !inString && parenDepth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) args.push(current.trim());
    return args;
  },

  resolve: (token: string, context: FormulaContext): any => {
    const trimmed = token.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    if (!isNaN(Number(trimmed))) return Number(trimmed);
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Resolve context property (e.g. variables.selectedProduct)
    const keys = trimmed.split('.');
    let curr: any = context;
    for (const key of keys) {
      if (curr && typeof curr === 'object' && key in curr) {
        curr = curr[key];
      } else {
        return trimmed;
      }
    }
    return curr;
  },

  evalCondition: (condStr: string, context: FormulaContext): boolean => {
    const ops = ['!=', '=', '>=', '<=', '>', '<'];
    for (const op of ops) {
      if (condStr.includes(op)) {
        const parts = condStr.split(op);
        const left = formulaEngine.resolve(parts[0], context);
        const right = formulaEngine.resolve(parts[1], context);
        switch (op) {
          case '=': return left == right;
          case '!=': return left != right;
          case '>=': return Number(left) >= Number(right);
          case '<=': return Number(left) <= Number(right);
          case '>': return Number(left) > Number(right);
          case '<': return Number(left) < Number(right);
        }
      }
    }
    return Boolean(formulaEngine.resolve(condStr, context));
  }
};
