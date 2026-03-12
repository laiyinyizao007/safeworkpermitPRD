<template>
  <div class="execution-monitor">
    <h3>节点执行状态</h3>
    <div class="timeline">
      <div
        v-for="event in executionEvents"
        :key="event.id"
        :class="['event', event.type]"
      >
        <div class="event-icon">
          <span v-if="event.type === 'start'">▶</span>
          <span v-else-if="event.type === 'complete'">✓</span>
          <span v-else>✗</span>
        </div>
        <div class="event-content">
          <div class="event-title">{{ event.nodeId }}</div>
          <div class="event-time">{{ formatTime(event.timestamp) }}</div>
          <div v-if="event.error" class="event-error">{{ event.error }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface ExecutionEvent {
  id: string;
  nodeId: string;
  type: 'start' | 'complete' | 'error';
  timestamp: number;
  error?: string;
}

const props = defineProps<{
  executor: any;
}>();

const executionEvents = ref<ExecutionEvent[]>([]);

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

const handleNodeStart = (data: any) => {
  executionEvents.value.push({
    id: `${data.nodeId}-${Date.now()}`,
    nodeId: data.nodeId,
    type: 'start',
    timestamp: Date.now()
  });
};

const handleNodeComplete = (data: any) => {
  executionEvents.value.push({
    id: `${data.nodeId}-${Date.now()}`,
    nodeId: data.nodeId,
    type: 'complete',
    timestamp: Date.now()
  });
};

const handleNodeError = (data: any) => {
  executionEvents.value.push({
    id: `${data.nodeId}-${Date.now()}`,
    nodeId: data.nodeId,
    type: 'error',
    timestamp: Date.now(),
    error: data.error?.message
  });
};

onMounted(() => {
  if (props.executor) {
    props.executor.on('nodeStart', handleNodeStart);
    props.executor.on('nodeComplete', handleNodeComplete);
    props.executor.on('nodeError', handleNodeError);
  }
});

onUnmounted(() => {
  if (props.executor) {
    props.executor.off('nodeStart', handleNodeStart);
    props.executor.off('nodeComplete', handleNodeComplete);
    props.executor.off('nodeError', handleNodeError);
  }
});
</script>

<style scoped>
.execution-monitor {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.timeline {
  margin-top: 16px;
}

.event {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.event.start {
  background: #e3f2fd;
}

.event.complete {
  background: #e8f5e9;
}

.event.error {
  background: #ffebee;
}

.event-icon {
  font-size: 20px;
}

.event-content {
  flex: 1;
}

.event-title {
  font-weight: 600;
}

.event-time {
  font-size: 12px;
  color: #666;
}

.event-error {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
}
</style>
