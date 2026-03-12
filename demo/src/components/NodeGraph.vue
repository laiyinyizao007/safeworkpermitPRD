<template>
  <div class="node-graph">
    <svg :width="width" :height="height">
      <g v-for="edge in edges" :key="`${edge.from}-${edge.to}`">
        <line
          :x1="getNodePosition(edge.from).x"
          :y1="getNodePosition(edge.from).y"
          :x2="getNodePosition(edge.to).x"
          :y2="getNodePosition(edge.to).y"
          stroke="#999"
          stroke-width="2"
        />
      </g>
      <g v-for="node in nodes" :key="node.nodeId">
        <rect
          :x="node.position.x - 60"
          :y="node.position.y - 30"
          width="120"
          height="60"
          :fill="getNodeColor(node)"
          stroke="#333"
          stroke-width="2"
          rx="8"
        />
        <text
          :x="node.position.x"
          :y="node.position.y"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#fff"
          font-size="12"
        >
          {{ getNodeLabel(node.nodeRef) }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Node {
  nodeId: string;
  nodeRef: string;
  position: { x: number; y: number };
}

interface Edge {
  from: string;
  to: string;
  condition?: string;
}

const props = defineProps<{
  nodes: Node[];
  edges: Edge[];
  currentNode?: string;
  width?: number;
  height?: number;
}>();

const width = computed(() => props.width || 1800);
const height = computed(() => props.height || 300);

const getNodePosition = (nodeId: string) => {
  return props.nodes.find(n => n.nodeId === nodeId)?.position || { x: 0, y: 0 };
};

const getNodeColor = (node: Node) => {
  if (node.nodeId === props.currentNode) return '#4CAF50';
  return '#2196F3';
};

const getNodeLabel = (nodeRef: string) => {
  return nodeRef.split('-')[1] || nodeRef;
};
</script>

<style scoped>
.node-graph {
  overflow-x: auto;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}
</style>
