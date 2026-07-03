import { render, screen } from '@testing-library/react-native';
import { EvolutionChainView } from './EvolutionChainView';
import type { EvolutionNode } from '../types/pokemon';

function node(overrides: Partial<EvolutionNode>): EvolutionNode {
  return {
    speciesId: 1,
    speciesName: 'bulbasaur',
    minLevel: null,
    triggerName: null,
    evolvesTo: [],
    ...overrides,
  };
}

describe('EvolutionChainView', () => {
  it('renders a single stage with no arrow when there is no evolution', async () => {
    await render(<EvolutionChainView node={node({ speciesId: 1, speciesName: 'ditto' })} />);

    expect(screen.getByText('ditto')).toBeTruthy();
    expect(screen.queryByText('→')).toBeNull();
  });

  it('renders one arrow for a 2-stage chain, centered via a flex:1 spacer', async () => {
    const chain = node({
      speciesId: 23,
      speciesName: 'ekans',
      evolvesTo: [node({ speciesId: 24, speciesName: 'arbok', minLevel: 22 })],
    });

    await render(<EvolutionChainView node={chain} />);

    expect(screen.getByText('ekans')).toBeTruthy();
    expect(screen.getByText('arbok')).toBeTruthy();
    expect(screen.getByText('Lv. 22')).toBeTruthy();

    // this is the actual fix for the arrow-centering bug: the wrapper
    // around every stage after the first must be flex:1, so the arrow
    // (also flex:1 inside it) centers in an evenly sized gap. before the
    // fix this row used justify-between, which pushed the arrow right next
    // to the second stage instead of centering it between the two
    const arrows = screen.getAllByText('→');
    expect(arrows).toHaveLength(1);
    expect(arrows[0]?.parent?.props.style).toEqual({ flex: 1 });
  });

  it('renders two evenly-sized arrows for a 3-stage chain', async () => {
    const chain = node({
      speciesId: 1,
      speciesName: 'bulbasaur',
      evolvesTo: [
        node({
          speciesId: 2,
          speciesName: 'ivysaur',
          minLevel: 16,
          evolvesTo: [node({ speciesId: 3, speciesName: 'venusaur', minLevel: 32 })],
        }),
      ],
    });

    await render(<EvolutionChainView node={chain} />);

    const arrows = screen.getAllByText('→');
    expect(arrows).toHaveLength(2);
    for (const arrow of arrows) {
      expect(arrow.parent?.props.style).toEqual({ flex: 1 });
    }
  });

  it('renders a branching chain (eevee-style) as separate stacked rows', async () => {
    const chain = node({
      speciesId: 133,
      speciesName: 'eevee',
      evolvesTo: [
        node({ speciesId: 134, speciesName: 'vaporeon', triggerName: 'use-item' }),
        node({ speciesId: 135, speciesName: 'jolteon', triggerName: 'use-item' }),
      ],
    });

    await render(<EvolutionChainView node={chain} />);

    // "eevee" itself only shows up once even though it's the root of two
    // paths, but each branch gets its own row with its own arrow
    expect(screen.getAllByText('eevee')).toHaveLength(2);
    expect(screen.getByText('vaporeon')).toBeTruthy();
    expect(screen.getByText('jolteon')).toBeTruthy();
    expect(screen.getAllByText('→')).toHaveLength(2);
  });

  it('shows the trigger name (dashes replaced with spaces) when there is no min level', async () => {
    const chain = node({
      speciesId: 133,
      speciesName: 'eevee',
      evolvesTo: [node({ speciesId: 134, speciesName: 'vaporeon', triggerName: 'use-item' })],
    });

    await render(<EvolutionChainView node={chain} />);

    expect(screen.getByText('use item')).toBeTruthy();
  });

  it('shows no condition text when a stage has neither a level nor a trigger', async () => {
    const chain = node({
      speciesId: 1,
      speciesName: 'bulbasaur',
      evolvesTo: [node({ speciesId: 2, speciesName: 'ivysaur' })],
    });

    await render(<EvolutionChainView node={chain} />);

    expect(screen.queryByText(/Lv\./)).toBeNull();
  });
});
