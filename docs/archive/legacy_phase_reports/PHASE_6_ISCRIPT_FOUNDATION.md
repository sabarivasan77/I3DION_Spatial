# Phase 6 — I3DION Script (iScript) Foundation & Visual/Text Synchronization Report

## 1. Objective
Create the foundation of **I3DION Script (iScript)**, a human-friendly visual instruction scripting language designed specifically for I3DION OmniStudio and LogicCraft. Enables non-programmers to write natural sentence commands (`WHEN Button_01 IS CLICKED DO PLAY ANIMATION "Open" ON Model_01`) with dual-directional visual/text synchronization.

## 2. Existing Systems Reviewed
Audited OmniStudio widget ecosystem, LogicCraft node registry, logic execution runtime, and template structures (`Template 01`, `Template 02`, `Template 03`). Ensured 100% backward compatibility and zero regression.

## 3. iScript Architecture
Structured language architecture under `frontend/src/features/scripting/`:
- `types/iscriptTypes.ts`: Tokens, AST node interfaces, problems, suggestions, and document types.
- `lexer/iscriptLexer.ts`: Case-insensitive deterministic tokenizer with line & column tracking.
- `parser/iscriptParser.ts`: Controlled recursive descent parser producing typed JSON ASTs.
- `ast/iscriptAst.ts`: JSON-serializable AST node structures (`ProgramNode`, `TriggerNode`, `ActionStatementNode`, `ConditionStatementNode`, `DelayStatementNode`, `VariableStatementNode`).
- `validation/iscriptValidator.ts`: AST & widget reference auditor mapping line/column diagnostics.
- `suggestions/iscriptSuggestions.ts`: Context-aware cursor autocomplete engine.
- `integration/logicCraftBridge.ts`: Canonical converter (`graphToIScript` and `iscriptToGraph`).
- `runtime/iscriptRuntimeAdapter.ts`: Translates iScript to LogicCraft runtime execution.
- `components/`: UI editor modal (`IScriptEditorModal.tsx`, `IScriptToolbar.tsx`, `IScriptEditor.tsx`, `IScriptSuggestions.tsx`, `IScriptProblems.tsx`).

## 4. Language Design
Designed human-readable sentence commands avoiding traditional programming syntax noise:
```iscript
# Product animation trigger
WHEN Button_01 IS CLICKED
DO
    PLAY ANIMATION "Open" ON Model_01
    WAIT 2 SECONDS
    SHOW Widget_02
```

## 5. Lexer
`IScriptLexer` tokenizes keywords, identifiers, strings, numbers, booleans, newlines, and comments (`# ...`) with line and column positions.

## 6. Parser
`IScriptParser` implements a controlled recursive descent parser mapping token streams into ASTs without dynamic code evaluation (`eval()` or `new Function()`).

## 7. AST
Typed AST nodes (`ProgramNode`, `TriggerNode`, `ActionStatementNode`, `ConditionStatementNode`, `DelayStatementNode`, `VariableStatementNode`) stored as JSON-safe data without function or DOM references.

## 8. Validation
`IScriptValidator` audits ASTs against active `useStudioStore` experience widgets, flagging missing targets or invalid 3D model action usages.

## 9. Error System
Friendly diagnostic errors with exact line and column locations (e.g. `"Line 3: SHOW needs a target widget identifier"`).

## 10. Autocomplete
Instant cursor autocomplete suggesting keywords, action commands, active OmniStudio widget IDs (`Button_01`, `Model_01`), animation names (`Open`), and camera presets.

## 11. Context Suggestions
Autocomplete suggestions update dynamically based on cursor position (e.g. suggesting 3D model viewers after `ON `).

## 12. Help System
Built-in command vocabulary reference sidebar in `IScriptEditorModal.tsx` detailing triggers, actions, and syntax rules.

## 13. Formatter
Deterministic formatting indents `DO` blocks, capitalizes keywords (`WHEN`, `DO`, `SHOW`, `HIDE`), and cleans up spacing without altering identifiers or comments.

## 14. Visual -> Script
`LogicCraftBridge.graphToIScript(graph)` converts visual LogicCraft node cards and connections into human-readable iScript sentences.

## 15. Script -> Visual
`LogicCraftBridge.iscriptToGraph(sourceText)` converts iScript code sentences into a visual node graph for LogicCraft.

## 16. Canonical Representation
Visual node graphs and iScript text convert through a shared intermediate AST representation, ensuring single source of truth.

## 17. Synchronization
Controlled live synchronization enables users to toggle between Visual Node Canvas and Text Script Editor.

## 18. Runtime Integration
`IScriptRuntimeAdapter.executeScript` parses iScript code into a canonical graph and executes it through the existing `runtimeEngine` and `actionRegistry`.

## 19. Variables
Supports `SET VARIABLE <name> TO <value>` executing through `useRuntimeStore` runtime variables without polluting `window`.

## 20. Conditions
Supports `IF <var> IS <val> DO <actions>` evaluated safely through controlled operators (`==`, `!=`, `>`, `<`).

## 21. Delay
Supports `WAIT <num> SECONDS` executing asynchronous cancellable delays.

## 22. Sequence
Multiple actions within a `DO` block execute sequentially in written order.

## 23. Comments
Lines starting with `#` are preserved as comment nodes and ignored during runtime execution.

## 24. Type System
Controlled type checking verifying widget types (e.g. enforcing that 3D animation actions target a 3D Model Viewer widget).

## 25. Serialization
iScript documents persist as JSON objects containing `languageVersion`, `source`, and `ast`.

## 26. Versioning
Explicit `languageVersion: 1` schema tracking for future migration capabilities.

## 27. Security
Zero `eval()`, zero `new Function()`, zero dynamic script execution. Malicious input strings are parsed as plain invalid syntax text and never executed.

## 28. OmniStudio Integration
Reads widgets, models, camera presets, and animations from active `useStudioStore` experiences.

## 29. LogicCraft Integration
Reuses LogicCraft nodes, runtime engine, action registry, and validation.

## 30. Files Created
1. `frontend/src/features/scripting/types/iscriptTypes.ts`
2. `frontend/src/features/scripting/lexer/iscriptLexer.ts`
3. `frontend/src/features/scripting/ast/iscriptAst.ts`
4. `frontend/src/features/scripting/parser/iscriptParser.ts`
5. `frontend/src/features/scripting/validation/iscriptValidator.ts`
6. `frontend/src/features/scripting/suggestions/iscriptSuggestions.ts`
7. `frontend/src/features/scripting/integration/logicCraftBridge.ts`
8. `frontend/src/features/scripting/runtime/iscriptRuntimeAdapter.ts`
9. `frontend/src/features/scripting/components/IScriptToolbar.tsx`
10. `frontend/src/features/scripting/components/IScriptEditor.tsx`
11. `frontend/src/features/scripting/components/IScriptSuggestions.tsx`
12. `frontend/src/features/scripting/components/IScriptProblems.tsx`
13. `frontend/src/features/scripting/components/IScriptEditorModal.tsx`

## 31. Existing Files Modified
1. `frontend/src/features/studio/components/StudioHeader.tsx`
2. `frontend/src/features/studio/OmniStudioPage.tsx`

## 32. Dependencies
No new npm dependencies installed. Built using existing React, Zustand, Lucide React, and Tailwind CSS.

## 33. Tests
- Tested lexing, parsing, AST generation, validation, autocomplete, formatting, visual-to-script, script-to-visual, and execution test cases.

## 34. Typecheck
`npx tsc --noEmit` -> PASS (0 errors).

## 35. Build
`npm run build` -> PASS (built cleanly in 14.37s).

## 36. Regression Check
Verified all existing subsystems remain 100% operational:
- CatalogBuilder & Catalog
- 3D Viewer & AR Engine
- Product & Lead Management
- Authentication & RBAC
- OmniStudio Starter Templates & Widgets
- LogicCraft Visual Logic Engine & Runtime

## 37. Known Issues
None.

## 38. Technical Debt
None.

## 39. Deviations
None.

## 40. Missing Capabilities
None for Phase 6. DataBridge REST connectors and cloud execution belong to later phases.

## 41. Phase 7 Recommendations
- Add DataBridge connector bindings for external REST API triggers.
- Support step-by-step line execution breakpoint pause capabilities.

## 42. Acceptance Checklist
- [x] iScript feature exists inside I3DION
- [x] iScript editor exists
- [x] Lexer exists
- [x] Parser exists
- [x] Typed AST exists
- [x] Validator exists
- [x] Friendly errors exist
- [x] Line/column errors exist
- [x] Autocomplete exists
- [x] Context-aware suggestions exist
- [x] Widget suggestions exist
- [x] Model suggestions exist
- [x] Animation suggestions exist
- [x] Help exists
- [x] Quick action insertion exists
- [x] Formatter exists
- [x] Comments work
- [x] Variables work
- [x] Conditions work
- [x] Delay works
- [x] Sequence works
- [x] Script can run
- [x] Script uses LogicCraft runtime
- [x] Script does not duplicate runtime actions
- [x] Visual -> Script works
- [x] Script -> Visual representation works
- [x] Synchronization architecture exists
- [x] Runtime errors map to source lines
- [x] Serialization works
- [x] Versioning exists
- [x] Type validation exists
- [x] No eval()
- [x] No new Function()
- [x] No arbitrary JS execution
- [x] Existing OmniStudio works
- [x] Existing LogicCraft works
- [x] Existing 3D/AR works
- [x] Existing Catalog works
- [x] Existing Leads work
- [x] Existing Auth/RBAC works
- [x] Typecheck passes
- [x] Build passes
- [x] No unnecessary dependencies
- [x] No unrelated refactoring

## 43. Final Status
PHASE 6 ISCRIPT FOUNDATION & VISUAL/TEXT SYNCHRONIZATION — COMPLETE
