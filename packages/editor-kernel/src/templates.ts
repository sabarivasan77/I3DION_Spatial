import { createBlankAppDefinition } from '../../contracts/src/catalogAppDefinition.ts';
import type { AppDefinitionContract } from '../../contracts/src/catalogAppDefinition.ts';

export interface CatalogTemplatePreset {
  id: string;
  name: string;
  description: string;
  theme: {
    preset: string;
    primary: string;
    secondary: string;
    font: string;
    radius: number;
    mode: 'light' | 'dark';
  };
  createCatalog(name: string): AppDefinitionContract;
}

export const catalogTemplates: CatalogTemplatePreset[] = [
  {
    id: 'industrial-light',
    name: 'Industrial Precision (Light)',
    description: 'Clean modern aesthetic tailored for precision manufacturing, components, and tools.',
    theme: {
      preset: 'industrial-light',
      primary: '#2563EB',
      secondary: '#0F172A',
      font: 'Inter',
      radius: 8,
      mode: 'light'
    },
    createCatalog: (name: string) => {
      const doc = createBlankAppDefinition(name);
      doc.theme = {
        preset: 'industrial-light',
        primary: '#2563EB',
        secondary: '#0F172A',
        font: 'Inter',
        radius: 8,
        mode: 'light'
      };
      return doc;
    }
  },
  {
    id: 'high-contrast-dark',
    name: 'Diagnostics & Telemetry (Dark)',
    description: 'High-contrast OLED dark theme with neon cyan accents, ideal for technical schematics and telemetry.',
    theme: {
      preset: 'high-contrast-dark',
      primary: '#06B6D4',
      secondary: '#020617',
      font: 'JetBrains Mono',
      radius: 4,
      mode: 'dark'
    },
    createCatalog: (name: string) => {
      const doc = createBlankAppDefinition(name);
      doc.theme = {
        preset: 'high-contrast-dark',
        primary: '#06B6D4',
        secondary: '#020617',
        font: 'JetBrains Mono',
        radius: 4,
        mode: 'dark'
      };
      return doc;
    }
  },
  {
    id: 'machinery-heavy',
    name: 'Heavy Equipment & Mining',
    description: 'Bold safety-amber and charcoal styling designed for heavy machinery, excavators, and generators.',
    theme: {
      preset: 'machinery-heavy',
      primary: '#D97706',
      secondary: '#1C1917',
      font: 'Roboto',
      radius: 6,
      mode: 'light'
    },
    createCatalog: (name: string) => {
      const doc = createBlankAppDefinition(name);
      doc.theme = {
        preset: 'machinery-heavy',
        primary: '#D97706',
        secondary: '#1C1917',
        font: 'Roboto',
        radius: 6,
        mode: 'light'
      };
      return doc;
    }
  },
  {
    id: 'minimal-aerospace',
    name: 'Minimal Aerospace & Defense',
    description: 'Crisp titanium white and deep navy with clean typography for aerospace and high-reliability systems.',
    theme: {
      preset: 'minimal-aerospace',
      primary: '#475569',
      secondary: '#0A0F1D',
      font: 'Outfit',
      radius: 12,
      mode: 'light'
    },
    createCatalog: (name: string) => {
      const doc = createBlankAppDefinition(name);
      doc.theme = {
        preset: 'minimal-aerospace',
        primary: '#475569',
        secondary: '#0A0F1D',
        font: 'Outfit',
        radius: 12,
        mode: 'light'
      };
      return doc;
    }
  }
];
