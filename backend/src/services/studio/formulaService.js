export const formulaService = {
  evaluate: (expression, context = {}) => {
    if (!expression || typeof expression !== 'string') return expression;
    const trimmed = expression.trim();

    if (!trimmed.startsWith('=')) return expression;
    const formulaStr = trimmed.slice(1).trim();

    try {
      // IF(condition, trueVal, falseVal)
      if (formulaStr.toUpperCase().startsWith('IF(') && formulaStr.endsWith(')')) {
        const inner = formulaStr.slice(3, -1);
        const parts = formulaService.splitArguments(inner);
        if (parts.length >= 2) {
          const conditionResult = formulaService.evaluateCondition(parts[0], context);
          return conditionResult ? formulaService.resolveValue(parts[1], context) : (parts[2] ? formulaService.resolveValue(parts[2], context) : '');
        }
      }

      // SWITCH(expr, val1, res1, val2, res2, defaultVal)
      if (formulaStr.toUpperCase().startsWith('SWITCH(') && formulaStr.endsWith(')')) {
        const inner = formulaStr.slice(7, -1);
        const parts = formulaService.splitArguments(inner);
        if (parts.length >= 3) {
          const target = formulaService.resolveValue(parts[0], context);
          for (let i = 1; i < parts.length - 1; i += 2) {
            const matchVal = formulaService.resolveValue(parts[i], context);
            if (target === matchVal) {
              return formulaService.resolveValue(parts[i + 1], context);
            }
          }
          if (parts.length % 2 === 0) {
            return formulaService.resolveValue(parts[parts.length - 1], context);
          }
        }
      }

      // CONCAT(a, b, c)
      if (formulaStr.toUpperCase().startsWith('CONCAT(') && formulaStr.endsWith(')')) {
        const inner = formulaStr.slice(7, -1);
        const parts = formulaService.splitArguments(inner);
        return parts.map(p => formulaService.resolveValue(p, context)).join('');
      }

      // LOWER(str) / UPPER(str)
      if (formulaStr.toUpperCase().startsWith('LOWER(') && formulaStr.endsWith(')')) {
        const inner = formulaStr.slice(6, -1);
        return String(formulaService.resolveValue(inner, context)).toLowerCase();
      }
      if (formulaStr.toUpperCase().startsWith('UPPER(') && formulaStr.endsWith(')')) {
        const inner = formulaStr.slice(6, -1);
        return String(formulaService.resolveValue(inner, context)).toUpperCase();
      }

      // TODAY() / NOW()
      if (formulaStr.toUpperCase() === 'TODAY()') return new Date().toISOString().split('T')[0];
      if (formulaStr.toUpperCase() === 'NOW()') return new Date().toISOString();

      return formulaService.resolveValue(formulaStr, context);
    } catch (err) {
      console.error('Formula Evaluation Error:', err);
      return `#ERROR: ${err.message}`;
    }
  },

  splitArguments: (str) => {
    const args = [];
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

  resolveValue: (token, context) => {
    const trimmed = token.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    if (!isNaN(Number(trimmed))) return Number(trimmed);
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Resolve context property (e.g. variables.selectedProduct.name)
    const keys = trimmed.split('.');
    let curr = context;
    for (const key of keys) {
      if (curr && typeof curr === 'object' && key in curr) {
        curr = curr[key];
      } else {
        return trimmed; // Fallback string if key path not found
      }
    }
    return curr;
  },

  evaluateCondition: (conditionStr, context) => {
    const operators = ['!=', '=', '>=', '<=', '>', '<'];
    for (const op of operators) {
      if (conditionStr.includes(op)) {
        const parts = conditionStr.split(op);
        const left = formulaService.resolveValue(parts[0], context);
        const right = formulaService.resolveValue(parts[1], context);
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
    return Boolean(formulaService.resolveValue(conditionStr, context));
  }
};
