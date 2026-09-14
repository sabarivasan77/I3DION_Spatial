export interface ActionDefinition {
  type: string;
  target_id?: string;
  target_name?: string;
  payload?: any;
  next_actions?: ActionDefinition[];
}

export interface ActionExecutionContext {
  variables: Record<string, any>;
  setVariable: (name: string, value: any) => void;
  navigate: (path: string) => void;
  openModal?: (modalId: string) => void;
  closeModal?: () => void;
  showNotification?: (message: string, type?: 'success' | 'error') => void;
  trigger3dCommand?: (cmd: string, payload?: any) => void;
}

export const actionEngine = {
  executeSequence: async (actions: ActionDefinition[], ctx: ActionExecutionContext): Promise<void> => {
    for (const action of actions) {
      await actionEngine.executeSingle(action, ctx);
    }
  },

  executeSingle: async (action: ActionDefinition, ctx: ActionExecutionContext): Promise<void> => {
    if (!action || !action.type) return;

    switch (action.type) {
      case 'navigate':
        if (action.target_id) ctx.navigate(`/omni-studio/editor/${action.target_id}`);
        else if (action.payload?.url) ctx.navigate(action.payload.url);
        break;

      case 'update_variable':
      case 'set_variable':
        if (action.payload?.name) {
          ctx.setVariable(action.payload.name, action.payload.value);
        }
        break;

      case 'open_modal':
        if (action.target_id && ctx.openModal) ctx.openModal(action.target_id);
        break;

      case 'close_modal':
        if (ctx.closeModal) ctx.closeModal();
        break;

      case 'show_notification':
        if (ctx.showNotification) {
          ctx.showNotification(action.payload?.message || 'Notification Action Executed', action.payload?.type || 'success');
        }
        break;

      case 'play_3d_anim':
        if (ctx.trigger3dCommand) ctx.trigger3dCommand('PLAY_ANIMATION', action.payload);
        break;

      case 'change_camera':
        if (ctx.trigger3dCommand) ctx.trigger3dCommand('CHANGE_CAMERA', action.payload);
        break;

      case 'explode_model':
        if (ctx.trigger3dCommand) ctx.trigger3dCommand('EXPLODE_MODEL', action.payload);
        break;

      case 'launch_ar':
        if (ctx.trigger3dCommand) ctx.trigger3dCommand('LAUNCH_AR', action.payload);
        break;

      case 'submit_enquiry':
        try {
          const token = localStorage.getItem('i3dion_token');
          if (token) {
            await fetch('/api/studio/actions/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ action: { type: 'submit_enquiry', payload: action.payload } })
            });
          }
          if (ctx.showNotification) ctx.showNotification('Enquiry submitted successfully!', 'success');
        } catch (err) {
          if (ctx.showNotification) ctx.showNotification('Failed to submit enquiry', 'error');
        }
        break;

      default:
        console.log('Action Executed:', action.type, action.payload);
        break;
    }

    if (Array.isArray(action.next_actions) && action.next_actions.length > 0) {
      await actionEngine.executeSequence(action.next_actions, ctx);
    }
  }
};
