import { ProgramNode, TriggerNode, StatementNode, ActionStatementNode } from '../ast/iscriptAst';
import { IScriptProblem } from '../types/iscriptTypes';
import { useStudioStore } from '../../studio/store/useStudioStore';

export class IScriptValidator {
  public static validate(program: ProgramNode, parserProblems: IScriptProblem[] = []): IScriptProblem[] {
    const problems: IScriptProblem[] = [...parserProblems];
    const experience = useStudioStore.getState().experience;
    const activeWidgets = experience?.widgets || [];
    const validWidgetIds = new Set(activeWidgets.map((w) => w.id));

    // Traverse program statements
    program.statements.forEach((stmt) => {
      if (stmt.type === 'Trigger') {
        const trigger = stmt as TriggerNode;
        if (trigger.targetWidgetId && !validWidgetIds.has(trigger.targetWidgetId) && validWidgetIds.size > 0) {
          problems.push({
            message: `Widget "${trigger.targetWidgetId}" was not found in active OmniStudio experience.`,
            severity: 'WARNING',
            line: trigger.line,
            column: trigger.column,
            start: 0,
            end: 0,
          });
        }

        trigger.body.forEach((bodyStmt) => this.validateStatement(bodyStmt, validWidgetIds, activeWidgets, problems));
      } else {
        this.validateStatement(stmt as StatementNode, validWidgetIds, activeWidgets, problems);
      }
    });

    return problems;
  }

  private static validateStatement(
    stmt: StatementNode,
    validWidgetIds: Set<string>,
    activeWidgets: any[],
    problems: IScriptProblem[]
  ): void {
    if (stmt.type === 'Action') {
      const act = stmt as ActionStatementNode;

      if (act.targetWidgetId && !validWidgetIds.has(act.targetWidgetId) && validWidgetIds.size > 0) {
        problems.push({
          message: `Action target widget "${act.targetWidgetId}" does not exist on canvas.`,
          severity: 'WARNING',
          line: act.line,
          column: act.column,
          start: 0,
          end: 0,
        });
      }

      // Check 3D Model specific actions
      if (['play_animation', 'stop_animation', 'pause_animation', 'set_camera', 'focus_object'].includes(act.actionType)) {
        const targetWidget = activeWidgets.find((w) => w.id === act.targetWidgetId);
        if (targetWidget && targetWidget.type !== '3d_viewer' && targetWidget.type !== 'spatial_3d_viewer') {
          problems.push({
            message: `Widget "${act.targetWidgetId}" is a ${targetWidget.type}, not a 3D Model Viewer.`,
            severity: 'ERROR',
            line: act.line,
            column: act.column,
            start: 0,
            end: 0,
          });
        }
      }
    }
  }
}
