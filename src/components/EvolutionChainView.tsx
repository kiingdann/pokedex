import { View, Text, Image } from 'react-native';
import type { EvolutionNode } from '../types/pokemon';
import { buildSpriteUrl } from '../utils/pokeUrl';

interface EvolutionChainViewProps {
  node: EvolutionNode;
}

// sprites get a bit bigger at each stage in the design (56 -> 72 -> 81),
// this approximates that without hardcoding a size per depth
function spriteSizeForDepth(depth: number): number {
  return Math.min(56 + depth * 16, 88);
}

function evolutionCondition(node: EvolutionNode): string | null {
  if (node.minLevel != null) return `Lv. ${node.minLevel}`;
  if (node.triggerName) return node.triggerName.replace(/-/g, ' ');
  return null;
}

// the chain is a tree (eevee branches into 8), but the design only shows a
// single horizontal row. instead of trying to draw branches, each full path
// from root to a leaf becomes its own row, stacked vertically
function flattenToPaths(node: EvolutionNode, prefix: EvolutionNode[] = []): EvolutionNode[][] {
  const path = [...prefix, node];
  if (node.evolvesTo.length === 0) return [path];
  return node.evolvesTo.flatMap((child) => flattenToPaths(child, path));
}

function EvolutionStage({ node, depth }: { node: EvolutionNode; depth: number }) {
  const condition = evolutionCondition(node);
  const size = spriteSizeForDepth(depth);

  return (
    <View className="items-center" style={{ width: 72 }}>
      <Image source={{ uri: buildSpriteUrl(node.speciesId) }} style={{ width: size, height: size }} resizeMode="contain" />
      <Text className="text-center font-outfit-semibold text-[10px] text-pokedex-ink">{node.speciesName}</Text>
      {condition && <Text className="text-center font-outfit-medium text-[8px] text-pokedex-levelText">{condition}</Text>}
    </View>
  );
}

function EvolutionRow({ path }: { path: EvolutionNode[] }) {
  return (
    <View className="w-full flex-row items-center">
      {path.map((node, index) => (
        // flex:1 on every wrapper but the first turns each gap between
        // stages into its own equal spacer, so the arrow inside centers
        // itself in that gap no matter how many stages there are (with
        // justify-between the arrow just sat next to whichever stage
        // rendered after it, which looked centered only by coincidence
        // when there happened to be 3 stages)
        <View key={node.speciesId} className="flex-row items-center" style={index > 0 ? { flex: 1 } : undefined}>
          {index > 0 && (
            <Text className="flex-1 text-center font-pixel text-base text-pokedex-ink">{'→'}</Text>
          )}
          <EvolutionStage node={node} depth={index} />
        </View>
      ))}
    </View>
  );
}

export function EvolutionChainView({ node }: EvolutionChainViewProps) {
  const paths = flattenToPaths(node);

  return (
    <View className="w-full gap-4 border border-pokedex-ink/10 bg-pokedex-panel p-[18px] opacity-90">
      {paths.map((path, index) => (
        // index is fine here, this list doesn't reorder within one render of a given chain
        <EvolutionRow key={index} path={path} />
      ))}
    </View>
  );
}
