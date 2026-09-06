import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { createTowerParts, type TowerSectionId } from './tower-geometry';

export interface ExplorerView { section: TowerSectionId | null; piece: string | null; explosion: number; isolated: boolean; labels: boolean; autoRotate: boolean; wireframe: boolean }
type RegisteredTool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute(input: unknown): unknown };
type ModelDocument = Document & { modelContext?: { registerTool(tool: RegisteredTool, options: { signal: AbortSignal }): void | Promise<void> } };
const allParts = createTowerParts();
const sectionIds = [...new Set(allParts.map(p => p.section))];

export function validateView(input: unknown): ExplorerView {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected an explorer view object.');
  const p = input as Record<string, unknown>;
  for (const key of Object.keys(p)) if (!['section', 'piece', 'explosion', 'isolated', 'labels', 'autoRotate', 'wireframe'].includes(key)) throw new Error(`Unknown field: ${key}`);
  if (p.section !== null && !sectionIds.includes(p.section as TowerSectionId)) throw new Error('Unknown section.');
  if (p.piece !== null && !allParts.some(part => part.id === p.piece && part.section === p.section)) throw new Error('Piece must belong to the selected section.');
  if (typeof p.explosion !== 'number' || !Number.isFinite(p.explosion) || p.explosion < 0 || p.explosion > 100) throw new Error('Explosion must be between 0 and 100.');
  for (const key of ['isolated', 'labels', 'autoRotate', 'wireframe']) if (typeof p[key] !== 'boolean') throw new Error(`${key} must be a boolean.`);
  if (p.isolated && !p.section) throw new Error('Select a section before isolation.');
  return p as unknown as ExplorerView;
}

export function useExplorerTools(view: ExplorerView, apply: (view: ExplorerView) => void) {
  const current = useRef({ view, apply }); current.current = { view, apply };
  useEffect(() => {
    const context = (document as ModelDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools: RegisteredTool[] = [
      { name: 'read_tower_explorer', title: 'Read Tokyo Tower explorer', description: 'Read current view, valid sections and selectable piece IDs.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => ({ view: current.current.view, sections: sectionIds, pieces: allParts.map(p => ({ id: p.id, section: p.section, name: p.name })) }) },
      { name: 'configure_tower_view', title: 'Configure Tokyo Tower view', description: 'Update visible selection, isolation, explosion, labels, rotation and wireframe. Changes only the local viewer.', inputSchema: { type: 'object', properties: { section: { enum: [null, ...sectionIds] }, piece: { type: ['string', 'null'] }, explosion: { type: 'number', minimum: 0, maximum: 100 }, isolated: { type: 'boolean' }, labels: { type: 'boolean' }, autoRotate: { type: 'boolean' }, wireframe: { type: 'boolean' } }, required: ['section', 'piece', 'explosion', 'isolated', 'labels', 'autoRotate', 'wireframe'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { const next = validateView(input); flushSync(() => current.current.apply(next)); return { view: current.current.view }; } },
    ];
    for (const tool of tools) { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional browser capability; visible controls remain available. */ } }
    return () => lifecycle.abort();
  }, []);
}
