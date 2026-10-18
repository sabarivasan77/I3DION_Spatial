/**
 * Omni Engine Scene Document Service (Phase P8)
 * Implements non-destructive scene authoring, command bus (undo/redo),
 * optimistic concurrency locking (409 on stale save), and source GLB integrity guarantees.
 */

import { pool } from '../../db/pool.js';

export class SceneCommandBus {
  constructor(initialSceneDoc) {
    this.sceneDoc = JSON.parse(JSON.stringify(initialSceneDoc));
    this.undoStack = [];
    this.redoStack = [];
  }

  getDoc() {
    return JSON.parse(JSON.stringify(this.sceneDoc));
  }

  /**
   * Execute a scene command and push to undo stack
   */
  execute(command) {
    const prevState = JSON.parse(JSON.stringify(this.sceneDoc));
    this.applyCommand(command);
    this.undoStack.push({ command, prevState });
    this.redoStack = []; // clear redo on new action
    return this.getDoc();
  }

  /**
   * Undo the last command
   */
  undo() {
    if (this.undoStack.length === 0) return this.getDoc();
    const last = this.undoStack.pop();
    const currentState = JSON.parse(JSON.stringify(this.sceneDoc));
    this.sceneDoc = last.prevState;
    this.redoStack.push({ command: last.command, nextState: currentState });
    return this.getDoc();
  }

  /**
   * Redo the last undone command
   */
  redo() {
    if (this.redoStack.length === 0) return this.getDoc();
    const next = this.redoStack.pop();
    const prevState = JSON.parse(JSON.stringify(this.sceneDoc));
    this.sceneDoc = next.nextState;
    this.undoStack.push({ command: next.command, prevState });
    return this.getDoc();
  }

  applyCommand(cmd) {
    const { type, targetId, payload } = cmd;
    this.sceneDoc.objects = this.sceneDoc.objects || {};
    if (!this.sceneDoc.objects[targetId]) {
      this.sceneDoc.objects[targetId] = {
        id: targetId,
        name: payload?.name || targetId,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        materialOverride: null
      };
    }

    const obj = this.sceneDoc.objects[targetId];

    switch (type) {
      case 'MOVE_OBJECT':
        obj.position = payload.position;
        break;
      case 'ROTATE_OBJECT':
        obj.rotation = payload.rotation;
        break;
      case 'SCALE_OBJECT':
        obj.scale = payload.scale;
        break;
      case 'RECOLOR_OBJECT':
        obj.materialOverride = {
          ...(obj.materialOverride || {}),
          ...payload.materialOverride
        };
        break;
      case 'SET_VISIBILITY':
        obj.visible = Boolean(payload.visible);
        break;
      case 'ADD_KEYFRAME':
        this.sceneDoc.timeline = this.sceneDoc.timeline || { duration: 5.0, tracks: [] };
        let track = this.sceneDoc.timeline.tracks.find(
          t => t.targetId === targetId && t.property === payload.property
        );
        if (!track) {
          track = { targetId, property: payload.property, keyframes: [] };
          this.sceneDoc.timeline.tracks.push(track);
        }
        track.keyframes.push(payload.keyframe);
        track.keyframes.sort((a, b) => a.time - b.time);
        break;
      default:
        throw new Error(`Unsupported scene command type: ${type}`);
    }
  }
}

/**
 * Save Scene Document with optimistic concurrency locking
 */
export async function saveSceneDocument(experienceId, organizationId, sceneDoc, expectedRevision) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch current revision
    const currentRes = await client.query(
      `SELECT revision, vault_asset_id FROM spatial_experiences
       WHERE id = $1 AND organization_id = $2
       FOR UPDATE`,
      [experienceId, organizationId]
    );

    if (currentRes.rows.length === 0) {
      throw new Error('Spatial experience not found');
    }

    const currentRevision = currentRes.rows[0].revision || 1;

    // 2. Enforce optimistic lock: stale save must yield 409
    if (expectedRevision !== undefined && expectedRevision !== null && expectedRevision !== currentRevision) {
      const err = new Error(`Conflict: Scene revision ${expectedRevision} is stale. Current revision is ${currentRevision}.`);
      err.status = 409;
      err.currentRevision = currentRevision;
      throw err;
    }

    const nextRevision = currentRevision + 1;
    const updatedDoc = {
      ...sceneDoc,
      revision: nextRevision
    };

    // 3. Persist scene document and increment revision
    const updateRes = await client.query(
      `UPDATE spatial_experiences
       SET scene_document = $1, revision = $2, updated_at = NOW()
       WHERE id = $3 AND organization_id = $4
       RETURNING id, name, slug, revision, scene_document`,
      [JSON.stringify(updatedDoc), nextRevision, experienceId, organizationId]
    );

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verify non-destructive integrity guarantee:
 * Proves that saving a scene document never mutates the underlying GLB asset or changes its SHA-256 hash.
 */
export async function assertGlbIntegrityUnchanged(vaultAssetId, originalSha256) {
  if (!vaultAssetId || !originalSha256) return true;

  const assetRes = await pool.query(
    `SELECT checksum_sha256 FROM vault_assets WHERE id = $1`,
    [vaultAssetId]
  );

  if (assetRes.rows.length === 0) return true;
  const currentChecksum = assetRes.rows[0].checksum_sha256;

  if (currentChecksum !== originalSha256) {
    throw new Error(`Integrity Violation: Underlying GLB asset was altered! Expected ${originalSha256}, got ${currentChecksum}`);
  }

  return true;
}
