import { LogicRule, TriggerType, LogicAction, LogicCondition } from '../types/logic';

export interface LogicEngineCallbacks {
  updateWidgetProps: (targetNodeId: string, props: Record<string, any>) => void;
  getWidgetProps: (targetNodeId: string) => Record<string, any> | undefined;
  navigateUrl?: (url: string) => void;
}

export class LogicEngineService {
  public evaluateTrigger(
    rules: LogicRule[],
    sourceNodeId: string,
    triggerType: TriggerType,
    callbacks: LogicEngineCallbacks
  ): number {
    let executedCount = 0;

    const matchingRules = rules.filter(
      (rule) =>
        rule.isEnabled &&
        rule.sourceNodeId === sourceNodeId &&
        rule.triggerType === triggerType
    );

    for (const rule of matchingRules) {
      const conditionsPassed = this.evaluateConditions(rule.conditions, callbacks);
      if (conditionsPassed) {
        this.executeActions(rule.actions, callbacks);
        executedCount++;
      }
    }

    return executedCount;
  }

  private evaluateConditions(
    conditions: LogicCondition[],
    callbacks: LogicEngineCallbacks
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const cond of conditions) {
      const props = callbacks.getWidgetProps(cond.targetNodeId);
      if (!props) return false;

      const currentValue = props[cond.propertyName];

      switch (cond.operator) {
        case 'EQUALS':
          if (currentValue !== cond.value) return false;
          break;
        case 'NOT_EQUALS':
          if (currentValue === cond.value) return false;
          break;
        case 'CONTAINS':
          if (
            typeof currentValue !== 'string' ||
            !currentValue.includes(String(cond.value))
          )
            return false;
          break;
        case 'GREATER_THAN':
          if (Number(currentValue) <= Number(cond.value)) return false;
          break;
        case 'LESS_THAN':
          if (Number(currentValue) >= Number(cond.value)) return false;
          break;
      }
    }

    return true;
  }

  private executeActions(
    actions: LogicAction[],
    callbacks: LogicEngineCallbacks
  ): void {
    for (const action of actions) {
      switch (action.type) {
        case 'SET_PROPERTY':
          if (action.propertyName) {
            callbacks.updateWidgetProps(action.targetNodeId, {
              [action.propertyName]: action.value,
            });
          }
          break;

        case 'TOGGLE_VISIBILITY':
          const currentProps = callbacks.getWidgetProps(action.targetNodeId) || {};
          const isCurrentlyHidden = currentProps.opacity === 0;
          callbacks.updateWidgetProps(action.targetNodeId, {
            opacity: isCurrentlyHidden ? 1 : 0,
          });
          break;

        case 'NAVIGATE_URL':
          if (action.value && callbacks.navigateUrl) {
            callbacks.navigateUrl(String(action.value));
          } else if (action.value) {
            window.open(String(action.value), '_blank');
          }
          break;

        case 'PLAY_ANIMATION':
        case 'FOCUS_CAMERA':
          console.log(`[LogicCraft Engine] Executing 3D Action: ${action.type}`, action);
          break;
      }
    }
  }
}

export const logicEngine = new LogicEngineService();
