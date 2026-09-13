import React from 'react';
import { WidgetRendererProps } from '../../types/studio';
import { useLogicStore } from '../../../logic/store/useLogicStore';
import { logicEngine } from '../../../logic/engine/logicEngine';
import { useStudioStore } from '../../store/useStudioStore';

export const ButtonWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    label = 'Click Here',
    variant = 'primary',
    backgroundColor = '#2563eb',
    textColor = '#ffffff',
    borderRadius = 8,
    fullWidth = false,
  } = node.properties || {};

  const handleButtonClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      onSelect(e);
      return;
    }

    // In Preview Mode: Evaluate LogicCraft triggers
    e.stopPropagation();
    const rules = useLogicStore.getState().rules;
    const { updateWidgetProperties, experience } = useStudioStore.getState();

    logicEngine.evaluateTrigger(rules, node.id, 'ON_CLICK', {
      updateWidgetProps: (targetId, props) => updateWidgetProperties(targetId, props),
      getWidgetProps: (targetId) => {
        const targetNode = experience.widgets.find((w) => w.id === targetId);
        return targetNode ? targetNode.properties : undefined;
      },
    });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return { bg: '#475569', text: '#ffffff', border: 'none' };
      case 'outline':
        return { bg: 'transparent', text: '#2563eb', border: '1px solid #2563eb' };
      case 'ghost':
        return { bg: 'transparent', text: '#334155', border: 'none' };
      default:
        return { bg: backgroundColor, text: textColor, border: 'none' };
    }
  };

  const style = getVariantStyles();

  return (
    <div
      onClick={handleButtonClick}
      className={`inline-block transition-all ${fullWidth ? 'w-full' : ''} ${
        isSelected && !isPreview ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''
      }`}
    >
      <button
        type="button"
        style={{
          backgroundColor: style.bg,
          color: style.text,
          border: style.border,
          borderRadius: `${borderRadius}px`,
        }}
        className={`inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:opacity-90 active:scale-[0.98] ${
          fullWidth ? 'w-full' : ''
        }`}
      >
        {label}
      </button>
    </div>
  );
};

