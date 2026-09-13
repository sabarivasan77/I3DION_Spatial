import { LogicCraftBridge } from '../integration/logicCraftBridge';
import { IScriptValidator } from '../validation/iscriptValidator';
import { IScriptParser } from '../parser/iscriptParser';
import { runtimeEngine } from '../../logic/runtime/runtimeEngine';
import { useRuntimeStore } from '../../logic/runtime/runtimeContext';
import { IScriptProblem } from '../types/iscriptTypes';

export class IScriptRuntimeAdapter {
  public static executeScript(sourceText: string): { success: boolean; problems: IScriptProblem[] } {
    // 1. Convert iScript text to canonical LogicCraft graph
    const { graph, problems: parseProblems } = LogicCraftBridge.iscriptToGraph(sourceText);

    // 2. Validate AST and Widget References
    const parser = new IScriptParser();
    const program = parser.parse(sourceText);
    const validationProblems = IScriptValidator.validate(program, parseProblems);

    const hasErrors = validationProblems.some((p) => p.severity === 'ERROR');
    if (hasErrors) {
      useRuntimeStore.getState().addLog(
        'ERROR',
        `iScript compilation failed: ${validationProblems.map((p) => `Line ${p.line}: ${p.message}`).join('; ')}`
      );
      return { success: false, problems: validationProblems };
    }

    // 3. Initialize Runtime Engine
    const initialized = runtimeEngine.initialize(graph);
    if (!initialized) {
      return { success: false, problems: validationProblems };
    }

    useRuntimeStore.getState().setMode('PREVIEW');
    useRuntimeStore.getState().addLog('SUCCESS', `iScript program executed successfully through LogicCraft runtime.`);

    return { success: true, problems: validationProblems };
  }
}
