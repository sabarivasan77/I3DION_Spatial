import { LogicRule } from '../../logic/types/logic';

export function generateIScript(rules: LogicRule[]): string {
  if (!rules || rules.length === 0) {
    return `// I3DION Script (iScript) Workspace
// Example syntax:
// WHEN widget_button_initial CLICK
// DO
//   SET widget_text_initial.content = "Hello World"
// END`;
  }

  let code = `// I3DION Script (iScript) - Bi-Directional Logic Rules (${rules.length} active)\n\n`;

  rules.forEach((rule) => {
    code += `// Rule: ${rule.name}\n`;
    code += `WHEN ${rule.sourceNodeId} ${rule.triggerType.replace('ON_', '')}\nDO\n`;

    rule.actions.forEach((act) => {
      if (act.type === 'SET_PROPERTY' && act.propertyName) {
        const valStr = typeof act.value === 'string' ? `"${act.value}"` : act.value;
        code += `  SET ${act.targetNodeId}.${act.propertyName} = ${valStr}\n`;
      } else if (act.type === 'TOGGLE_VISIBILITY') {
        code += `  TOGGLE_VISIBILITY ${act.targetNodeId}\n`;
      } else if (act.type === 'NAVIGATE_URL') {
        code += `  NAVIGATE "${act.value || ''}"\n`;
      } else {
        code += `  EXECUTE ${act.type} ${act.targetNodeId}\n`;
      }
    });

    code += `END\n\n`;
  });

  return code.trim();
}
