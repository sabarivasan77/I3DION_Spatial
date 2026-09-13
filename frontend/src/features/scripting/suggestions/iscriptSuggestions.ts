import { AutocompleteSuggestion } from '../types/iscriptTypes';
import { useStudioStore } from '../../studio/store/useStudioStore';

export class IScriptSuggestions {
  public static getSuggestions(source: string, cursorOffset: number): AutocompleteSuggestion[] {
    const textBeforeCursor = source.slice(0, cursorOffset);
    const lastWordMatch = textBeforeCursor.match(/([a-zA-Z0-9_-]+)$/);
    const lastWord = lastWordMatch ? lastWordMatch[1].toLowerCase() : '';

    const experience = useStudioStore.getState().experience;
    const activeWidgets = experience?.widgets || [];

    const widgetSuggestions: AutocompleteSuggestion[] = activeWidgets.map((w) => ({
      label: w.id,
      kind: 'widget',
      detail: `${w.name || w.type} (${w.id})`,
      insertText: w.id,
    }));

    // If context is after "PLAY ANIMATION" or "ON"
    const is3DContext = /play\s+animation\s+"[^"]*"\s+on\s*$/i.test(textBeforeCursor) || /rotate\s+[a-zA-Z0-9_-]+\s+[xyz]\s+\d+\s+degrees\s+on\s*$/i.test(textBeforeCursor);
    if (is3DContext) {
      const models = activeWidgets.filter((w) => w.type === '3d-model-viewer' || w.type === '3d_viewer' || w.type === 'spatial_3d_viewer');
      return models.map((m) => ({
        label: m.id,
        kind: 'model',
        detail: `3D Model Viewer (${m.name || m.id})`,
        insertText: m.id,
      }));
    }

    // Default Keyword & Action Suggestions
    const baseKeywords: AutocompleteSuggestion[] = [
      { label: 'WHEN', kind: 'keyword', detail: 'Event trigger header', insertText: 'WHEN ' },
      { label: 'DO', kind: 'keyword', detail: 'Action block header', insertText: 'DO\n    ' },
      { label: 'SHOW', kind: 'action', detail: 'Make widget visible', insertText: 'SHOW ' },
      { label: 'HIDE', kind: 'action', detail: 'Hide widget from view', insertText: 'HIDE ' },
      { label: 'TOGGLE', kind: 'action', detail: 'Toggle widget visibility', insertText: 'TOGGLE ' },
      { label: 'SET TEXT OF', kind: 'action', detail: 'Update widget text content', insertText: 'SET TEXT OF ' },
      { label: 'PLAY ANIMATION', kind: 'action', detail: 'Play 3D model animation', insertText: 'PLAY ANIMATION "Open" ON ' },
      { label: 'PLAY TIMELINE', kind: 'action', detail: 'Play keyframe animation timeline', insertText: 'PLAY TIMELINE "Main Timeline"\n    ' },
      { label: 'PAUSE TIMELINE', kind: 'action', detail: 'Pause timeline playback', insertText: 'PAUSE TIMELINE "Main Timeline"\n    ' },
      { label: 'STOP TIMELINE', kind: 'action', detail: 'Stop and reset timeline', insertText: 'STOP TIMELINE "Main Timeline"\n    ' },
      { label: 'SEEK TIMELINE', kind: 'action', detail: 'Scrub timeline to timestamp', insertText: 'SEEK TIMELINE "Main Timeline" TO 2 SECONDS\n    ' },
      { label: 'SET TIMELINE SPEED', kind: 'action', detail: 'Set timeline playback speed', insertText: 'SET TIMELINE "Main Timeline" SPEED TO 1.5\n    ' },
      { label: 'ROTATE', kind: 'action', detail: 'Rotate 3D model', insertText: 'ROTATE Model_01 Y 90 DEGREES\n    ' },
      { label: 'SET CAMERA', kind: 'action', detail: 'Set 3D camera preset', insertText: 'SET CAMERA TO "Isometric" ON ' },
      { label: 'FOCUS OBJECT', kind: 'action', detail: 'Focus 3D mesh object', insertText: 'FOCUS OBJECT "Impeller_01" ON ' },
      { label: 'CALL CONNECTOR', kind: 'action', detail: 'Invoke DataBridge connector', insertText: 'CALL CONNECTOR "Product API"\n    ' },
      { label: 'WAIT', kind: 'action', detail: 'Asynchronous delay', insertText: 'WAIT 2 SECONDS\n    ' },
      { label: 'IF', kind: 'keyword', detail: 'Conditional branch', insertText: 'IF mode IS "demo"\nDO\n    ' },
      { label: 'SET VARIABLE', kind: 'action', detail: 'Store runtime variable', insertText: 'SET VARIABLE mode TO "demo"\n    ' },
    ];

    const all = [...baseKeywords, ...widgetSuggestions];

    if (!lastWord) return all;

    return all.filter((s) => s.label.toLowerCase().includes(lastWord) || (s.detail && s.detail.toLowerCase().includes(lastWord)));
  }
}
