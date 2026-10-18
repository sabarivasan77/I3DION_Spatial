/**
 * Omni Engine Circuit IR Runtime Interpreter (Phase P8)
 * Executes compiled Circuit IR deterministically across Engine Editor and Catalog Player.
 * Dispatches ecosystem side effects (Core Leads, Lens Analytics, Flow Outbox).
 */

import { pool } from '../../db/pool.js';

export async function interpretCircuitIR(circuitIR, eventTrigger, eventPayload = {}, initialContext = {}) {
  if (!circuitIR || !circuitIR.instructions) {
    throw new Error('Invalid or missing Circuit IR');
  }

  const instructions = circuitIR.instructions;
  const entrypoints = circuitIR.entrypoints || {};

  // Find matching entrypoint
  const specificKey = eventPayload?.targetId 
    ? `${eventTrigger}:${eventPayload.targetId}`
    : null;

  let startNodeIds = (specificKey && entrypoints[specificKey]) || entrypoints[eventTrigger] || [];

  if (startNodeIds.length === 0) {
    return {
      executed: false,
      reason: `No entrypoint found for trigger: ${eventTrigger}`,
      trace: []
    };
  }

  const context = {
    variables: { ...(initialContext.variables || {}) },
    sceneState: {
      activeAnimation: null,
      activeVariant: null,
      explodedFactor: 0,
      visibleCards: [],
      quoteBasket: [],
      ...(initialContext.sceneState || {})
    },
    sideEffects: {
      leads: [],
      analyticsEvents: [],
      flowEvents: []
    }
  };

  const trace = [];
  const queue = [...startNodeIds];
  const maxSteps = 100;
  let stepsCount = 0;

  while (queue.length > 0) {
    stepsCount++;
    if (stepsCount > maxSteps) {
      console.warn('[Circuit Execution Warning] Max execution step limit (100) reached; breaking.');
      break;
    }

    const nodeId = queue.shift();
    const inst = instructions[nodeId];
    if (!inst) continue;

    trace.push({ step: stepsCount, nodeId, chipId: inst.chipId, category: inst.category });

    // Execute instruction semantics
    switch (inst.chipId) {
      case 'on_object_click':
      case 'on_hotspot_click':
      case 'on_scene_loaded':
        // Event pass-through
        break;

      case 'play_animation':
        context.sceneState.activeAnimation = inst.params.clipName || 'default_action';
        break;

      case 'set_material':
      case 'set_variant':
        context.sceneState.activeVariant = inst.params.variantId || inst.params.color || 'variant_selected';
        break;

      case 'explode_view':
        context.sceneState.explodedFactor = inst.params.factor !== undefined ? inst.params.factor : 1.0;
        break;

      case 'show_spec_card':
        context.sceneState.visibleCards.push({
          title: inst.params.title || 'Technical Specifications',
          specs: inst.params.specs || {}
        });
        break;

      case 'add_to_quote':
        context.sceneState.quoteBasket.push({
          productId: inst.params.productId || eventPayload.targetId,
          quantity: inst.params.quantity || 1
        });
        break;

      case 'submit_lead':
        context.sideEffects.leads.push({
          name: inst.params.name || eventPayload.name || 'Anonymous Prospect',
          email: inst.params.email || eventPayload.email || 'lead@circuits.test',
          phone: inst.params.phone || eventPayload.phone || '+91 98765 43210',
          source: 'circuits_3d_viewer'
        });
        break;

      case 'track_event':
        context.sideEffects.analyticsEvents.push({
          eventName: inst.params.eventName || 'viewer.3d_interacted',
          payload: inst.params.payload || { objectId: eventPayload.targetId }
        });
        break;

      case 'emit_flow_event':
        context.sideEffects.flowEvents.push({
          eventType: inst.params.eventType || 'rfq.submitted',
          data: inst.params.data || { trigger: inst.chipId, targetId: eventPayload.targetId }
        });
        break;

      case 'set_variable':
        if (inst.params.varName) {
          context.variables[inst.params.varName] = inst.params.value;
        }
        break;

      default:
        // Generic chip execution
        break;
    }

    // Traverse next steps
    if (Array.isArray(inst.nextSteps)) {
      for (const nextId of inst.nextSteps) {
        queue.push(nextId);
      }
    }
  }

  // Persist Flow events into Outbox if organizationId is present
  if (initialContext.organizationId && context.sideEffects.flowEvents.length > 0) {
    for (const evt of context.sideEffects.flowEvents) {
      await pool.query(
        `INSERT INTO flow_event_outbox (organization_id, event_type, payload, status)
         VALUES ($1, $2, $3, 'pending')`,
        [initialContext.organizationId, evt.eventType, JSON.stringify(evt.data)]
      ).catch(e => console.warn('Circuits Outbox insert error:', e.message));
    }
  }

  return {
    executed: true,
    stepsExecuted: stepsCount,
    trace,
    finalState: context.sceneState,
    variables: context.variables,
    sideEffects: context.sideEffects
  };
}
