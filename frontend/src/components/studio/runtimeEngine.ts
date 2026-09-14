/**
 * OmniStudio Comprehensive Application Runtime Engine
 * Handles multi-screen navigation, scoped variables, parameters, actions, 3D controls, and lead form submissions
 */
import { studioApi, StudioProject } from '../../api/studioApi';

export interface RuntimeState {
  activeScreenId: string;
  screenParams: Record<string, any>;
  navHistory: { screenId: string; params: Record<string, any> }[];
  variables: {
    global: Record<string, any>;
    screen: Record<string, Record<string, any>>;
    component: Record<string, Record<string, any>>;
    parameter: Record<string, any>;
  };
  notifications: { id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[];
  activeModalId: string | null;
  active3dAnimation: Record<string, string>; // compId -> animName
  cameraPresets: Record<string, string>;     // compId -> presetName
}

export class OmniRuntimeEngine {
  project: StudioProject;
  state: RuntimeState;
  listeners: (() => void)[] = [];

  constructor(project: StudioProject) {
    this.project = project;
    const doc = project.project_document || { screens: [], components: [], variables: [] };
    const initialScreen = (doc.screens || []).find((s: any) => s.is_initial) || doc.screens[0];
    const initialScreenId = initialScreen ? initialScreen.id : 'screen-1';

    // Initialize variables from project definition
    const globalVars: Record<string, any> = {};
    (doc.variables || []).forEach((v: any) => {
      globalVars[v.name] = v.default_value ?? null;
    });

    this.state = {
      activeScreenId: initialScreenId,
      screenParams: {},
      navHistory: [{ screenId: initialScreenId, params: {} }],
      variables: {
        global: globalVars,
        screen: {},
        component: {},
        parameter: {}
      },
      notifications: [],
      activeModalId: null,
      active3dAnimation: {},
      cameraPresets: {}
    };
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l());
  }

  // --- NAVIGATION CONTROLS ---
  navigateTo(screenIdOrName: string, params: Record<string, any> = {}) {
    const doc = this.project.project_document || { screens: [] };
    const target = (doc.screens || []).find((s: any) => s.id === screenIdOrName || s.name === screenIdOrName);
    const targetId = target ? target.id : screenIdOrName;

    this.state.activeScreenId = targetId;
    this.state.screenParams = params;
    this.state.variables.parameter = params;
    this.state.navHistory.push({ screenId: targetId, params });
    this.notify();

    // Track analytics event
    studioApi.trackRuntimeAnalytics({
      project_id: this.project.id,
      event_type: 'screen_view',
      target_id: targetId,
      target_name: target ? target.name : screenIdOrName,
      metadata: params
    }).catch(() => {});
  }

  goBack() {
    if (this.state.navHistory.length > 1) {
      this.state.navHistory.pop();
      const prev = this.state.navHistory[this.state.navHistory.length - 1];
      this.state.activeScreenId = prev.screenId;
      this.state.screenParams = prev.params;
      this.state.variables.parameter = prev.params;
      this.notify();
    }
  }

  goHome() {
    const doc = this.project.project_document || { screens: [] };
    const initial = (doc.screens || []).find((s: any) => s.is_initial) || doc.screens[0];
    if (initial) {
      this.navigateTo(initial.id);
    }
  }

  // --- VARIABLE CONTROLS ---
  setVariable(name: string, value: any, scope: 'global' | 'screen' | 'component' = 'global', targetId?: string) {
    if (scope === 'global') {
      this.state.variables.global[name] = value;
    } else if (scope === 'screen') {
      const scrId = targetId || this.state.activeScreenId;
      if (!this.state.variables.screen[scrId]) this.state.variables.screen[scrId] = {};
      this.state.variables.screen[scrId][name] = value;
    } else if (scope === 'component' && targetId) {
      if (!this.state.variables.component[targetId]) this.state.variables.component[targetId] = {};
      this.state.variables.component[targetId][name] = value;
    }
    this.notify();
  }

  getVariable(name: string, scope?: string): any {
    if (scope === 'parameter' || (!scope && name in this.state.variables.parameter)) return this.state.variables.parameter[name];
    const scrVars = this.state.variables.screen[this.state.activeScreenId] || {};
    if (scope === 'screen' || (!scope && name in scrVars)) return scrVars[name];
    if (name in this.state.variables.global) return this.state.variables.global[name];
    return null;
  }

  // --- 3D & AR CONTROLS ---
  play3dAnimation(compId: string, animName: string) {
    this.state.active3dAnimation[compId] = animName;
    this.notify();
    this.showNotification(`Playing 3D animation: ${animName}`, 'info');
  }

  setCameraPreset(compId: string, presetName: string) {
    this.state.cameraPresets[compId] = presetName;
    this.notify();
    this.showNotification(`Camera preset changed to ${presetName}`, 'info');
  }

  launchAR(modelUrl?: string) {
    const info = modelUrl ? ` (${modelUrl})` : '';
    this.showNotification(`Launching WebXR / AR Experience${info}...`, 'success');
  }

  // --- NOTIFICATIONS & MODALS ---
  showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const notif = { id: `notif-${Date.now()}`, message, type };
    this.state.notifications.push(notif);
    this.notify();
    setTimeout(() => {
      this.state.notifications = this.state.notifications.filter(n => n.id !== notif.id);
      this.notify();
    }, 4000);
  }

  openModal(modalId: string) {
    this.state.activeModalId = modalId;
    this.notify();
  }

  closeModal() {
    this.state.activeModalId = null;
    this.notify();
  }

  // --- ACTION EXECUTION ENGINE ---
  async executeAction(actionDef: any, contextItem?: any) {
    if (!actionDef || !actionDef.type) return;

    switch (actionDef.type) {
      case 'navigate':
        this.navigateTo(actionDef.target_id || actionDef.target_name, actionDef.params || {});
        break;

      case 'back':
        this.goBack();
        break;

      case 'home':
        this.goHome();
        break;

      case 'set_variable':
        this.setVariable(actionDef.var_name, actionDef.var_value, actionDef.scope || 'global');
        break;

      case 'play_3d_anim':
        this.play3dAnimation(actionDef.target_comp_id || 'viewer3d', actionDef.anim_name || 'Default');
        break;

      case 'change_camera':
        this.setCameraPreset(actionDef.target_comp_id || 'viewer3d', actionDef.preset_name || 'Front');
        break;

      case 'launch_ar':
        this.launchAR(actionDef.model_url);
        break;

      case 'open_modal':
        this.openModal(actionDef.modal_id);
        break;

      case 'close_modal':
        this.closeModal();
        break;

      case 'submit_enquiry': {
        const payload = {
          product_id: contextItem?.id || actionDef.product_id || null,
          full_name: actionDef.full_name || this.getVariable('userName') || 'Client Lead',
          email: actionDef.email || this.getVariable('userEmail') || 'lead@client.com',
          phone: actionDef.phone || '',
          message: actionDef.message || 'Product Inquiry from OmniStudio Experience',
          company_name: actionDef.company || ''
        };
        try {
          await studioApi.executeAction({ type: 'submit_enquiry', payload });
          this.showNotification('Enquiry submitted successfully! Our technical team will reach out.', 'success');
        } catch (err) {
          this.showNotification('Failed to submit enquiry. Please try again.', 'error');
        }
        break;
      }

      case 'create_record': {
        try {
          const datasetKey = actionDef.dataset_key || 'vault_products';
          const newRec = await studioApi.createRecord(datasetKey, actionDef.payload || {});
          this.showNotification(`Record created successfully in ${datasetKey}`, 'success');
          if (actionDef.target_variable) {
            this.setVariable(actionDef.target_variable, newRec);
          }
        } catch (err: any) {
          this.showNotification(`Failed to create record: ${err?.message || 'Error'}`, 'error');
        }
        break;
      }

      case 'update_record': {
        try {
          const datasetKey = actionDef.dataset_key || 'vault_products';
          const recId = actionDef.record_id || contextItem?.id;
          if (recId) {
            const updated = await studioApi.updateRecord(datasetKey, recId, actionDef.payload || {});
            this.showNotification(`Record updated successfully`, 'success');
          }
        } catch (err: any) {
          this.showNotification(`Failed to update record: ${err?.message || 'Error'}`, 'error');
        }
        break;
      }

      case 'delete_record': {
        try {
          const datasetKey = actionDef.dataset_key || 'vault_products';
          const recId = actionDef.record_id || contextItem?.id;
          if (recId) {
            await studioApi.deleteRecord(datasetKey, recId);
            this.showNotification(`Record deleted/archived successfully`, 'success');
          }
        } catch (err: any) {
          this.showNotification(`Failed to delete record`, 'error');
        }
        break;
      }

      case 'open_url':
        if (actionDef.url) {
          window.open(actionDef.url, '_blank');
        }
        break;

      default:
        this.showNotification(`Executed action: ${actionDef.type}`, 'info');
        break;
    }
  }
}
