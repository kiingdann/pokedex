import { View, Text, Image } from 'react-native';
import type { EvolutionNode } from '../types/pokemon';
import { buildSpriteUrl } from '../utils/pokeUrl';

interface EvolutionChainViewProps {
  node: EvolutionNode;
  depth?: number;
}

function evolutionCondition(node: EvolutionNode): string | null {
  if (node.minLevel != null) return `Lv. ${node.minLevel}`;
  if (node.triggerName) return node.triggerName.replace(/-/g, ' ');
  return null;
}

// recursive because the chain itself is a tree (eevee branches into 8),
// each stage just renders itself then its children indented underneath
export function EvolutionChainView({ node, depth = 0 }: EvolutionChainViewProps) {
  const condition = evolutionCondition(node);

  return (
    <View style={{ marginLeft: depth * 16 }}>
      <View className="flex-row items-center gap-2 py-1">
        {depth > 0 && <Text className="text-gray-500">{'→'}</Text>}
        <Image source={{ uri: buildSpriteUrl(node.speciesId) }} className="h-10 w-10" resizeMode="contain" />
        <Text className="capitalize text-white">{node.speciesName}</Text>
        {condition && <Text className="text-xs text-gray-400">({condition})</Text>}
      </View>
      {node.evolvesTo.map((child) => (
        <EvolutionChainView key={child.speciesId} node={child} depth={depth + 1} />
      ))}
    </View>
  );
}
