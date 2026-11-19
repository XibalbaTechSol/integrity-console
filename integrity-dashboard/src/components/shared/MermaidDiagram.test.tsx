import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MermaidDiagram } from './MermaidDiagram';

describe('MermaidDiagram component', () => {
  it('renders loading placeholder initially on server / initial render', () => {
    const html = renderToStaticMarkup(
      <MermaidDiagram
        source="flowchart TD\n  A --> B"
        title="Test Diagram"
        description="A test description"
      />
    );
    expect(html).toContain('Test Diagram');
    expect(html).toContain('A test description');
    expect(html).toContain('Rendering diagram...');
  });
});
