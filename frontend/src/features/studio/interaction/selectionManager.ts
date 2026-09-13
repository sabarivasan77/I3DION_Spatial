import { useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';

export const useStudioKeyboardShortcuts = () => {
  const {
    selectedWidgetId,
    selectedWidgetIds,
    deleteSelectedWidgets,
    duplicateWidget,
    copyWidget,
    pasteWidget,
    undo,
    redo,
    selectWidget,
    experience,
  } = useStudioStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing inside input or textarea elements
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Select All (Ctrl/Cmd + A)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const allIds = experience.widgets.map((w) => w.id);
        if (allIds.length > 0) {
          allIds.forEach((id) => selectWidget(id, true));
        }
        return;
      }

      // Undo (Ctrl/Cmd + Z)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo (Ctrl/Cmd + Y or Shift+Ctrl+Z)
      if ((isCmdOrCtrl && e.key.toLowerCase() === 'y') || (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        redo();
        return;
      }

      // Copy (Ctrl/Cmd + C)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (selectedWidgetId) copyWidget(selectedWidgetId);
        return;
      }

      // Paste (Ctrl/Cmd + V)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteWidget();
        return;
      }

      // Duplicate (Ctrl/Cmd + D)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedWidgetId) duplicateWidget(selectedWidgetId);
        return;
      }

      // Delete (Delete / Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWidgetIds.length > 0) {
          e.preventDefault();
          deleteSelectedWidgets();
        }
        return;
      }

      // Deselect (Escape)
      if (e.key === 'Escape') {
        e.preventDefault();
        selectWidget(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedWidgetId,
    selectedWidgetIds,
    deleteSelectedWidgets,
    duplicateWidget,
    copyWidget,
    pasteWidget,
    undo,
    redo,
    selectWidget,
    experience.widgets,
  ]);
};
