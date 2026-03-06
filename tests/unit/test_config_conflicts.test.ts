import { beforeAll, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

type NormalizedConfig = {
  enabledAgents: string[];
  agentSettings: Record<string, unknown>;
  chunkSize: number;
  chunkOverlap: number;
  storageMode: string;
  [key: string]: unknown;
};

let normalizeConfig: (config: any) => NormalizedConfig;

function extractFunction(source: string, functionName: string): string {
  const sourceFile = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === functionName) {
      return statement.getFullText(sourceFile);
    }
  }
  throw new Error(`Unable to find function ${functionName} in index.ts`);
}

beforeAll(() => {
  const indexPath = path.resolve(__dirname, '../../index.ts');
  const source = fs.readFileSync(indexPath, 'utf-8');
  const normalizeAgentSettingsSource = extractFunction(source, 'normalizeAgentSettings');
  const normalizeConfigSource = extractFunction(source, 'normalizeConfig');
  const runtimeTs = `let warnedAllowCrossAgentRetrievalDeprecation = false;\n${normalizeAgentSettingsSource}\n${normalizeConfigSource}\nmodule.exports = { normalizeConfig };`;
  const transpiled = ts.transpileModule(runtimeTs, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: 'normalizeConfig.runtime.ts',
  }).outputText;

  const generatedDir = path.resolve(__dirname, '../validation/.generated');
  const generatedFile = path.join(generatedDir, 'normalizeConfig.runtime.conflicts.cjs');
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(generatedFile, transpiled, 'utf-8');

  const req = createRequire(import.meta.url);
  normalizeConfig = (req(generatedFile) as { normalizeConfig: typeof normalizeConfig }).normalizeConfig;
});

describe('config conflict detection: official memory vs memu-engine', () => {
  it('warns when official memorySearch and memu memory slot are both enabled', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    normalizeConfig({
      agents: {
        defaults: {
          memorySearch: {
            enabled: true,
          },
        },
      },
      plugins: {
        slots: {
          memory: 'memu-engine',
        },
      },
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Official Memory System Conflict'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('agents.defaults.memorySearch.enabled=true'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('plugins.slots.memory="memu-engine"'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('set "agents.defaults.memorySearch.enabled": false'));
    warnSpy.mockRestore();
  });

  it('does not warn when official memorySearch is disabled', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    normalizeConfig({
      agents: {
        defaults: {
          memorySearch: {
            enabled: false,
          },
        },
      },
      plugins: {
        slots: {
          memory: 'memu-engine',
        },
      },
    });

    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('Official Memory System Conflict'));
    warnSpy.mockRestore();
  });

  it('does not warn when memory slot is not memu-engine', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    normalizeConfig({
      agents: {
        defaults: {
          memorySearch: {
            enabled: true,
          },
        },
      },
      plugins: {
        slots: {
          memory: 'official-memory',
        },
      },
    });

    expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('Official Memory System Conflict'));
    warnSpy.mockRestore();
  });

  it('warns for deprecated allowCrossAgentRetrieval and fills missing agentSettings', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const config = normalizeConfig({
      enabledAgents: ['trial'],
      allowCrossAgentRetrieval: false,
      agentSettings: {
        trial: {
          memoryEnabled: false,
          searchEnabled: true,
          searchableStores: ['self'],
        },
      },
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("'allowCrossAgentRetrieval' is deprecated"));
    expect(config.agentSettings.main).toEqual({
      memoryEnabled: true,
      searchEnabled: true,
      searchableStores: ['self'],
    });
    expect(config.agentSettings.trial).toEqual({
      memoryEnabled: false,
      searchEnabled: true,
      searchableStores: ['self'],
    });
    warnSpy.mockRestore();
  });

  it('throws for invalid chunk inputs in the conflict harness too', () => {
    expect(() => normalizeConfig({ chunkSize: 0 })).toThrow(/Invalid chunkSize/);
    expect(() => normalizeConfig({ chunkOverlap: -1 })).toThrow(/Invalid chunkOverlap/);
    expect(() => normalizeConfig({ chunkSize: 64, chunkOverlap: 64 })).toThrow(
      /chunkOverlap must be less than chunkSize/
    );
  });
});
