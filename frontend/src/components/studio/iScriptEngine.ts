export interface iScriptStatement {
  type: 'CallExpression' | 'Assignment' | 'IfStatement';
  command?: string;
  args?: any[];
  varName?: string;
  value?: any;
  condition?: string;
  thenStatements?: iScriptStatement[];
}

export interface iScriptAST {
  type: 'Program';
  body: iScriptStatement[];
}

export const iScriptEngine = {
  tokenize: (code: string): string[] => {
    if (!code || typeof code !== 'string') return [];
    const tokens: string[] = [];
    const regex = /\s*("[^"]*"|'[^']*'|[a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|\{|\}|\(|\)|,|=|!=|>=|<=|>|<|\+|\-|\*|\/)\s*/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(code)) !== null) {
      if (match[1]) tokens.push(match[1]);
    }
    return tokens;
  },

  parse: (code: string): iScriptAST => {
    const statements: iScriptStatement[] = [];
    if (!code || !code.trim()) return { type: 'Program', body: statements };

    const lines = code.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('//')) continue;

      // Set(varName, value)
      const setMatch = line.match(/^Set\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*(.*)\s*\)$/i);
      if (setMatch) {
        statements.push({
          type: 'Assignment',
          varName: setMatch[1],
          value: setMatch[2].replace(/^["']|["']$/g, '')
        });
        continue;
      }

      // Navigate("ScreenName")
      const navMatch = line.match(/^Navigate\s*\(\s*["']?([^"']+)["']?\s*\)$/i);
      if (navMatch) {
        statements.push({
          type: 'CallExpression',
          command: 'Navigate',
          args: [navMatch[1]]
        });
        continue;
      }

      // Generic Command Call: CommandName("arg1", "arg2")
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

    return { type: 'Program', body: statements };
  },

  generateCode: (ast: iScriptAST): string => {
    if (!ast || !ast.body) return '';
    return ast.body.map(stmt => {
      if (stmt.type === 'Assignment') {
        return `Set(${stmt.varName}, "${stmt.value}")`;
      }
      if (stmt.type === 'CallExpression') {
        const formattedArgs = (stmt.args || []).map(a => typeof a === 'string' ? `"${a}"` : a).join(', ');
        return `${stmt.command}(${formattedArgs})`;
      }
      return '';
    }).filter(Boolean).join('\n');
  },

  convertLogicNodesToiScript: (nodes: any[]): string => {
    if (!Array.isArray(nodes) || nodes.length === 0) return '// No logic nodes configured\n';
    
    const lines: string[] = ['// Generated iScript from Visual Logic Blocks'];
    nodes.forEach(node => {
      if (node.action_type === 'navigate' || node.type === 'navigation') {
        lines.push(`Navigate("${node.target_id || 'ScreenMain'}")`);
      } else if (node.action_type === 'set_variable' || node.type === 'variable') {
        lines.push(`Set(${node.config?.varName || 'selectedProduct'}, "${node.config?.value || 'Active'}")`);
      } else if (node.action_type === 'play_3d_anim' || node.type === '3d') {
        lines.push(`PlayAnimation("${node.config?.animName || 'Exploded_View'}")`);
      } else if (node.action_type === 'submit_enquiry') {
        lines.push(`OpenEnquiry("${node.config?.productId || 'Product_01'}")`);
      } else if (node.action_type === 'next_page') {
        lines.push('NextPage()');
      } else if (node.action_type === 'previous_page') {
        lines.push('PreviousPage()');
      }
    });

    return lines.join('\n');
  }
};
