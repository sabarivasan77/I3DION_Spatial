import { RecoverySnapshot } from '../types/collaborationTypes';
import { useStudioStore } from '../../store/useStudioStore';

const RECOVERY_KEY_PREFIX = 'i3dion_omnistudio_recovery_';

export class RecoveryManager {
  public flexSaveRecovery(experienceId: string, revision: number): void {
    try {
      const serialized = useStudioStore.getState().serializeExperience();
      const snapshot: RecoverySnapshot = {
        experienceId,
        timestamp: Date.now(),
        serializedExperience: serialized,
        revision,
      };
      localStorage.setItem(`${RECOVERY_KEY_PREFIX}${experienceId}`, JSON.stringify(snapshot));
    } catch (e) {
      console.warn('Failed to write recovery snapshot:', e);
    }
  }

  public getRecoverySnapshot(experienceId: string): RecoverySnapshot | null {
    try {
      const data = localStorage.getItem(`${RECOVERY_KEY_PREFIX}${experienceId}`);
      if (data) return JSON.parse(data) as RecoverySnapshot;
    } catch (e) {
      console.warn('Failed to parse recovery snapshot:', e);
    }
    return null;
  }

  public clearRecoverySnapshot(experienceId: string): void {
    localStorage.removeItem(`${RECOVERY_KEY_PREFIX}${experienceId}`);
  }
}

export const recoveryManager = new RecoveryManager();
