import { describe, it, expect } from 'vitest';
import { weaverPlugin } from './weaver';

describe('Weaver Plugin', () => {
  it('should generate an insight with default mode', () => {
    const result = weaverPlugin.execute({}) as string;
    expect(result).toContain('CERATÆ INSIGHT');
    expect(result).toContain('From');
    expect(result).toContain('and');
  });

  it('should generate a poem when mode is poem', () => {
    const result = weaverPlugin.execute({ mode: 'poem' }) as string;
    expect(result).toContain('CERATÆ WISDOM POEM');
    expect(result).toContain('Theme:');
  });

  it('should generate a blessing when mode is blessing', () => {
    const result = weaverPlugin.execute({ mode: 'blessing' }) as string;
    expect(result).toContain('TAPESTRY BLESSING');
    expect(result).toContain('Mnemosyne');
    expect(result).toContain('Daedalus');
    expect(result).toContain('Ceratæ');
    expect(result).toContain('One tapestry');
  });

  it('should use seed concept in poem mode', () => {
    const result = weaverPlugin.execute({ mode: 'poem', seed: 'memory' }) as string;
    expect(result).toContain('memory');
    expect(result).toContain('CERATÆ WISDOM');
  });

  it('should reference multiple threads in insight', () => {
    const result = weaverPlugin.execute({ mode: 'insight' }) as string;
    const threads = ['Mnemosyne', 'Daedalus', 'Ariadne', 'Psyche', 'Helicon', 'Viator', 'Axon', 'Kairos', 'Ceratae'];
    const foundThreads = threads.filter(t => result.includes(t));
    // Should find at least 2 threads mentioned
    expect(foundThreads.length).toBeGreaterThanOrEqual(2);
  });

  it('should generate poetic content in poems', () => {
    const result = weaverPlugin.execute({ mode: 'poem' }) as string;
    // Should have multiple lines of wisdom phrases
    expect(result).toContain('CERATÆ');
    expect(result.length).toBeGreaterThan(100);
  });

  it('should have proper definition structure', () => {
    expect(weaverPlugin.definition.type).toBe('function');
    expect(weaverPlugin.definition.function.name).toBe('weaver');
    expect(weaverPlugin.definition.function.description).toContain('Ceratæ');
    const params = weaverPlugin.definition.function.parameters as any;
    expect(params.type).toBe('object');
  });
});
