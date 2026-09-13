import { create } from 'zustand';
import { LogicRule, TriggerType, ActionType } from '../types/logic';

const generateRuleId = (): string => {
  return `rule_${Math.random().toString(36).substring(2, 9)}`;
};

const DEFAULT_RULES: LogicRule[] = [
  {
    id: 'rule_sample_01',
    name: 'Interactive CTA Text Swap',
    description: 'When the CTA button is clicked, update main title text.',
    triggerType: 'ON_CLICK',
    sourceNodeId: 'widget_button_initial',
    conditions: [],
    actions: [
      {
        id: 'act_01',
        type: 'SET_PROPERTY',
        targetNodeId: 'widget_text_initial',
        propertyName: 'content',
        value: '✨ Spatial Experience Launched Successfully!',
      },
      {
        id: 'act_02',
        type: 'SET_PROPERTY',
        targetNodeId: 'widget_text_initial',
        propertyName: 'color',
        value: '#2563eb',
      },
    ],
    isEnabled: true,
    createdAt: new Date().toISOString(),
  },
];

interface LogicState {
  rules: LogicRule[];
  activeRuleId: string | null;
  isLogicPanelOpen: boolean;

  createRule: (sourceNodeId: string, triggerType?: TriggerType) => string;
  updateRule: (id: string, updated: Partial<LogicRule>) => void;
  deleteRule: (id: string) => void;
  toggleRuleEnabled: (id: string) => void;
  openLogicPanel: (ruleId?: string | null) => void;
  closeLogicPanel: () => void;
  setRules: (rules: LogicRule[]) => void;
}

export const useLogicStore = create<LogicState>((set, get) => ({
  rules: DEFAULT_RULES,
  activeRuleId: null,
  isLogicPanelOpen: false,

  createRule: (sourceNodeId, triggerType = 'ON_CLICK') => {
    const newId = generateRuleId();
    const newRule: LogicRule = {
      id: newId,
      name: `Rule for ${sourceNodeId}`,
      description: 'Custom visual logic trigger rule',
      triggerType,
      sourceNodeId,
      conditions: [],
      actions: [
        {
          id: `act_${Math.random().toString(36).substring(2, 7)}`,
          type: 'SET_PROPERTY',
          targetNodeId: sourceNodeId,
          propertyName: 'content',
          value: 'Updated Value',
        },
      ],
      isEnabled: true,
      createdAt: new Date().toISOString(),
    };

    set({
      rules: [...get().rules, newRule],
      activeRuleId: newId,
    });

    return newId;
  },

  updateRule: (id, updated) => {
    set({
      rules: get().rules.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    });
  },

  deleteRule: (id) => {
    set({
      rules: get().rules.filter((r) => r.id !== id),
      activeRuleId: get().activeRuleId === id ? null : get().activeRuleId,
    });
  },

  toggleRuleEnabled: (id) => {
    set({
      rules: get().rules.map((r) =>
        r.id === id ? { ...r, isEnabled: !r.isEnabled } : r
      ),
    });
  },

  openLogicPanel: (ruleId = null) =>
    set({ isLogicPanelOpen: true, activeRuleId: ruleId }),

  closeLogicPanel: () => set({ isLogicPanelOpen: false }),

  setRules: (rules) => set({ rules }),
}));
