# 18 - DependencyEngine - 作业表依赖引擎

> **组件类型**: 核心业务组件 | **复杂度**: ⭐⭐⭐⭐⭐ | **优先级**: P0
> **关联文档**: [`分析内容/作业表依赖引擎详细设计方案.md`](../../../分析内容/作业表依赖引擎详细设计方案.md)

---

## 1. 组件概述

### 1.1 功能定位

作业表依赖引擎是任务-作业表双层架构的核心组件，负责：
- **前置依赖检查**：验证作业表之间的强制前置关系（如盲板抽堵→动火作业）
- **SIMOPS冲突检测**：检测同步作业的空间冲突（垂直/水平/时间）
- **条件性依赖评估**：根据作业类型/级别/场所触发额外要求（气体检测、方案编制等）
- **执行顺序计算**：基于DAG拓扑排序生成推荐执行顺序

### 1.2 Demo 简化策略

| 完整功能 | Demo 实现方式 |
|---------|-------------|
| DAG循环依赖检测 | ✅ 完整实现（前端算法） |
| 拓扑排序 | ✅ 完整实现（Kahn算法） |
| 垂直空间冲突 | ✅ 简化实现（基于高度差判断） |
| 水平空间冲突 | ⚠️ 简化实现（基于直线距离，不使用真实地理围栏） |
| 时间冲突 | ✅ 完整实现（基于时间间隔） |
| 条件性依赖 | ✅ 完整实现（基于规则引擎） |
| 依赖关系可视化 | ✅ 使用Mermaid图展示 |
| SIMOPS地图 | ❌ 不实现（用列表展示冲突） |

---

## 2. 组件接口设计

### 2.1 Props

```typescript
interface DependencyEngineProps {
  // 当前任务
  task: Task;

  // 任务下所有作业表
  permits: Permit[];

  // 当前活动的作业表（用于SIMOPS检测）
  activePermits?: Permit[];

  // 待验证的作业表
  targetPermit?: Permit;

  // 显示模式
  mode: 'validate' | 'visualize' | 'order';

  // 是否显示详细信息
  showDetails?: boolean;
}
```

### 2.2 Events

```typescript
interface DependencyEngineEvents {
  // 验证完成
  onValidated: (result: ValidationResult) => void;

  // 检测到冲突
  onConflictDetected: (conflicts: Conflict[]) => void;

  // 执行顺序计算完成
  onOrderCalculated: (order: string[]) => void;

  // 用户点击依赖节点
  onNodeClick: (permitId: string) => void;
}
```

### 2.3 核心数据结构

```typescript
// 验证结果
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  requiredActions: RequiredAction[];
  executionOrder: string[] | null;
}

// 验证错误
interface ValidationError {
  type: 'prerequisite' | 'cyclic_dependency' | 'simops_conflict';
  severity: 'error';
  message: string;
  details: any;
}

// 冲突信息
interface Conflict {
  conflictPermitId: string;
  conflictPermitName: string;
  conflictType: 'vertical' | 'horizontal' | 'temporal';
  severity: 'prohibit' | 'warning';
  distance?: number;
  message: string;
}

// 必需动作
interface RequiredAction {
  actionType: 'gas_detection' | 'plan_preparation' | 'guardian_assignment' | 'equipment_inspection';
  parameters: any;
  triggerTime: 'before_approval' | 'before_start' | 'during_work';
  reason: string;
}
```

---

## 3. UI 设计

### 3.1 验证模式（mode='validate'）

**场景**：作业负责人提交作业票时，系统自动验证依赖关系

```
┌─────────────────────────────────────────────┐
│ 📋 作业表依赖验证                              │
├─────────────────────────────────────────────┤
│                                             │
│ ✅ 前置依赖检查                               │
│    ✓ 盲板抽堵作业已完成                        │
│                                             │
│ ⚠️  SIMOPS冲突检测                            │
│    ⚠️  与"受限空间作业"距离12米，小于最小安全    │
│       距离15米                                │
│    [查看详情]                                 │
│                                             │
│ ✅ 条件性依赖评估                              │
│    ✓ 需要进行气体检测（LEL + O₂）              │
│    ✓ 需要配置1名监护人                         │
│                                             │
│ 📊 推荐执行顺序                               │
│    1️⃣ 盲板抽堵 → 2️⃣ 受限空间 → 3️⃣ 动火作业    │
│                                             │
│ [继续提交] [查看依赖图]                        │
└─────────────────────────────────────────────┘
```

### 3.2 可视化模式（mode='visualize'）

**场景**：系统管理员查看任务的完整依赖关系图

```
┌─────────────────────────────────────────────┐
│ 🔗 任务依赖关系图                              │
├─────────────────────────────────────────────┤
│                                             │
│  [Mermaid 依赖关系图]                         │
│                                             │
│  盲板抽堵 ──→ 受限空间                         │
│     │                                       │
│     └──────→ 动火作业                         │
│                                             │
│  临时用电 ──→ 受限空间                         │
│                                             │
│  受限空间 ⊥ 动火作业 (15米冲突)                 │
│                                             │
│ 图例：                                       │
│ ──→ 前置依赖  ⊥ SIMOPS冲突                    │
│ 🟢 已完成  🟡 进行中  ⚪ 待审批                 │
│                                             │
│ [导出图片] [全屏查看]                          │
└─────────────────────────────────────────────┘
```

### 3.3 执行顺序模式（mode='order'）

**场景**：安全负责人查看推荐的作业执行顺序

```
┌─────────────────────────────────────────────┐
│ 📅 推荐执行顺序                               │
├─────────────────────────────────────────────┤
│                                             │
│ 1️⃣ 盲板抽堵作业                               │
│    └─ 依赖：无                                │
│    └─ 预计时长：2小时                          │
│    └─ 状态：✅ 已完成                          │
│                                             │
│ 2️⃣ 受限空间作业                               │
│    └─ 依赖：盲板抽堵（已满足）                  │
│    └─ 预计时长：4小时                          │
│    └─ 状态：🟡 进行中                          │
│                                             │
│ 3️⃣ 临时用电作业                               │
│    └─ 依赖：受限空间审批通过                    │
│    └─ 预计时长：1小时                          │
│    └─ 状态：⚪ 待审批                          │
│                                             │
│ 4️⃣ 动火作业                                  │
│    └─ 依赖：盲板抽堵、受限空间（已满足）         │
│    └─ 冲突：与受限空间保持15米距离              │
│    └─ 预计时长：3小时                          │
│    └─ 状态：⚪ 待审批                          │
│                                             │
│ ⚠️  注意：动火作业与受限空间存在SIMOPS冲突       │
│                                             │
│ [调整顺序] [导出计划]                          │
└─────────────────────────────────────────────┘
```

---

## 4. 核心算法实现（Demo简化版）

### 4.1 前置依赖检查

```typescript
// 检查前置依赖是否满足
function checkPrerequisites(
  permit: Permit,
  allPermits: Map<string, Permit>
): { satisfied: boolean; missingDeps: any[] } {
  const missingDeps = [];

  for (const prereq of permit.dependencies.prerequisites) {
    const depPermit = allPermits.get(prereq.dependsOnPermitId);

    if (!depPermit || depPermit.status !== prereq.requiredStatus) {
      missingDeps.push({
        permitId: prereq.dependsOnPermitId,
        permitType: prereq.dependsOnPermitType,
        currentStatus: depPermit?.status || 'not_found',
        requiredStatus: prereq.requiredStatus,
        reason: prereq.reason
      });
    }
  }

  return {
    satisfied: missingDeps.length === 0,
    missingDeps
  };
}

// DAG循环依赖检测（DFS算法）
function detectCyclicDependency(permits: Permit[]): string[] | null {
  const graph = buildDependencyGraph(permits);
  const visited = new Set<string>();
  const recStack = new Set<string>();

  for (const permitId of graph.keys()) {
    const cycle = dfsDetectCycle(permitId, graph, visited, recStack, []);
    if (cycle) return cycle;
  }

  return null;
}

// 拓扑排序（Kahn算法）
function topologicalSort(permits: Permit[]): string[] | null {
  const graph = buildDependencyGraph(permits);
  const inDegree = new Map<string, number>();
  const queue: string[] = [];
  const result: string[] = [];

  // 初始化入度
  for (const [permitId, deps] of graph.entries()) {
    if (!inDegree.has(permitId)) inDegree.set(permitId, 0);
    for (const dep of deps) {
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
    }
  }

  // 找到所有入度为0的节点
  for (const [permitId, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(permitId);
  }

  // Kahn算法
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const neighbor of graph.get(current) || []) {
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return result.length === graph.size ? result : null;
}
```

### 4.2 SIMOPS冲突检测（Demo简化版）

```typescript
// 检查SIMOPS冲突
function checkSimopsConflicts(
  newPermit: Permit,
  activePermits: Permit[]
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const activePermit of activePermits) {
    // 1. 垂直空间冲突（简化：仅基于高度差）
    if (checkVerticalConflict(newPermit, activePermit)) {
      conflicts.push({
        conflictPermitId: activePermit.permitId,
        conflictPermitName: activePermit.permitName,
        conflictType: 'vertical',
        severity: 'prohibit',
        message: `${newPermit.permitType}作业下方禁止进行${activePermit.permitType}作业`
      });
    }

    // 2. 水平空间冲突（简化：基于直线距离）
    const distance = calculateDistance(
      newPermit.location,
      activePermit.location
    );
    const minDistance = getMinSafeDistance(newPermit.permitType, activePermit.permitType);

    if (minDistance && distance < minDistance) {
      conflicts.push({
        conflictPermitId: activePermit.permitId,
        conflictPermitName: activePermit.permitName,
        conflictType: 'horizontal',
        severity: minDistance === 0 ? 'prohibit' : 'warning',
        distance,
        message: `距离${distance.toFixed(1)}米，小于最小安全距离${minDistance}米`
      });
    }

    // 3. 时间冲突
    const timeConflict = checkTemporalConflict(newPermit, activePermit);
    if (timeConflict) conflicts.push(timeConflict);
  }

  return conflicts;
}

// 简化的距离计算（Demo用直线距离代替Haversine公式）
function calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
  const dx = loc1.latitude - loc2.latitude;
  const dy = loc1.longitude - loc2.longitude;
  return Math.sqrt(dx * dx + dy * dy) * 111000; // 粗略转换为米
}

// 最小安全距离规则矩阵
function getMinSafeDistance(type1: PermitType, type2: PermitType): number | null {
  const rules = {
    'hotWork-confinedSpace': 15,
    'confinedSpace-hotWork': 15,
    'hotWork-excavation': 10,
    'excavation-hotWork': 10,
    'roadBreaking-hotWork': 0, // 0表示禁止
    'hotWork-roadBreaking': 0
  };

  return rules[`${type1}-${type2}`] || null;
}
```

### 4.3 条件性依赖评估

```typescript
// 评估条件性依赖
function evaluateConditionalDeps(
  permit: Permit,
  context: TaskContext
): RequiredAction[] {
  const requiredActions: RequiredAction[] = [];

  // 1. 气体检测要求
  if (needsGasDetection(permit, context)) {
    requiredActions.push({
      actionType: 'gas_detection',
      parameters: getGasDetectionParams(permit.permitType),
      triggerTime: 'before_start',
      reason: `${permit.permitType}作业必须进行气体检测`
    });
  }

  // 2. 方案编制要求
  if (needsSpecialPlan(permit)) {
    requiredActions.push({
      actionType: 'plan_preparation',
      parameters: { planReviewLevel: '技术负责人' },
      triggerTime: 'before_approval',
      reason: `${permit.permitType}作业必须编制专项作业方案`
    });
  }

  // 3. 监护人配置要求
  const guardianConfig = getGuardianRequirements(permit.permitType);
  if (guardianConfig) {
    requiredActions.push({
      actionType: 'guardian_assignment',
      parameters: guardianConfig,
      triggerTime: 'before_approval',
      reason: `${permit.permitType}作业需要配置${guardianConfig.minCount}名监护人`
    });
  }

  return requiredActions;
}

// 气体检测规则
function getGasDetectionParams(permitType: PermitType) {
  const rules = {
    hotWork: { gasTypes: ['LEL', 'O2'], retestInterval: 120 },
    confinedSpace: { gasTypes: ['O2', 'H2S', 'CO', 'LEL'], retestInterval: 30 },
    blindPlate: { gasTypes: ['LEL'], retestInterval: 60 }
  };
  return rules[permitType];
}
```

---

## 5. Mock 数据示例

### 5.1 任务依赖配置

```typescript
const mockTask: Task = {
  taskId: 'task-001',
  taskName: '反应釜内部检修',
  permits: [
    {
      permitId: 'permit-001',
      permitType: 'blindPlate',
      permitName: 'R-101反应釜盲板抽堵',
      status: 'completed',
      location: { latitude: 31.2304, longitude: 121.4737, altitude: 0 },
      dependencies: {
        prerequisites: [],
        simopsConflicts: [],
        conditionalRequirements: []
      }
    },
    {
      permitId: 'permit-002',
      permitType: 'confinedSpace',
      permitName: 'R-101反应釜受限空间作业',
      status: 'active',
      location: { latitude: 31.2304, longitude: 121.4737, altitude: 0 },
      dependencies: {
        prerequisites: [
          {
            dependsOnPermitId: 'permit-001',
            dependsOnPermitType: 'blindPlate',
            requiredStatus: 'completed',
            reason: '能量隔离要求'
          }
        ],
        simopsConflicts: [
          {
            conflictWithPermitType: 'hotWork',
            conflictType: 'horizontal',
            minDistance: 15,
            severity: 'prohibit'
          }
        ],
        conditionalRequirements: [
          {
            condition: { ruleType: 'gas_detection' },
            requiredAction: {
              actionType: 'gas_detection',
              parameters: { gasTypes: ['O2', 'H2S', 'CO', 'LEL'], retestInterval: 30 }
            },
            triggerTime: 'before_start'
          }
        ]
      }
    },
    {
      permitId: 'permit-003',
      permitType: 'hotWork',
      permitName: 'R-101反应釜动火作业',
      status: 'pending',
      location: { latitude: 31.2305, longitude: 121.4738, altitude: 0 }, // 距离受限空间12米
      dependencies: {
        prerequisites: [
          {
            dependsOnPermitId: 'permit-001',
            dependsOnPermitType: 'blindPlate',
            requiredStatus: 'completed',
            reason: '能量隔离要求'
          }
        ],
        simopsConflicts: [],
        conditionalRequirements: []
      }
    }
  ]
};
```

---

## 6. 使用场景

### 6.1 场景1：作业负责人提交作业票

```vue
<template>
  <DependencyEngine
    :task="currentTask"
    :permits="allPermits"
    :targetPermit="newPermit"
    mode="validate"
    :showDetails="true"
    @onValidated="handleValidated"
    @onConflictDetected="handleConflict"
  />
</template>

<script setup>
const handleValidated = (result) => {
  if (!result.isValid) {
    // 显示错误信息，阻止提交
    showErrors(result.errors);
  } else if (result.warnings.length > 0) {
    // 显示警告，询问是否继续
    confirmSubmit(result.warnings);
  } else {
    // 验证通过，提交作业票
    submitPermit();
  }
};

const handleConflict = (conflicts) => {
  // 显示SIMOPS冲突详情
  showConflictDialog(conflicts);
};
</script>
```

### 6.2 场景2：系统管理员查看依赖关系图

```vue
<template>
  <DependencyEngine
    :task="selectedTask"
    :permits="taskPermits"
    mode="visualize"
    @onNodeClick="handleNodeClick"
  />
</template>

<script setup>
const handleNodeClick = (permitId) => {
  // 跳转到作业票详情页
  router.push(`/permits/${permitId}`);
};
</script>
```

### 6.3 场景3：安全负责人查看执行顺序

```vue
<template>
  <DependencyEngine
    :task="currentTask"
    :permits="allPermits"
    mode="order"
    @onOrderCalculated="handleOrderCalculated"
  />
</template>

<script setup>
const handleOrderCalculated = (order) => {
  // 保存推荐执行顺序
  saveExecutionOrder(order);
};
</script>
```

---

## 7. 视觉规格

### 7.1 颜色规范

| 元素 | 颜色 | 说明 |
|------|------|------|
| 验证通过 | `#52c41a` | 绿色，表示依赖满足 |
| 警告 | `#faad14` | 橙色，表示SIMOPS冲突警告 |
| 错误 | `#f5222d` | 红色，表示依赖未满足或禁止冲突 |
| 前置依赖箭头 | `#1890ff` | 蓝色实线箭头 |
| SIMOPS冲突线 | `#f5222d` | 红色虚线 |
| 已完成节点 | `#52c41a` | 绿色圆圈 |
| 进行中节点 | `#faad14` | 橙色圆圈 |
| 待审批节点 | `#d9d9d9` | 灰色圆圈 |

### 7.2 图标

- ✅ 验证通过：`<CheckCircleOutlined />`
- ⚠️ 警告：`<ExclamationCircleOutlined />`
- ❌ 错误：`<CloseCircleOutlined />`
- 🔗 依赖关系：`<LinkOutlined />`
- 📊 执行顺序：`<OrderedListOutlined />`
- 🗺️ 空间冲突：`<EnvironmentOutlined />`

---

## 8. 交互行为

### 8.1 验证流程

1. 用户点击"提交审批"按钮
2. 系统调用 `DependencyEngine.validate()`
3. 显示验证进度（前置依赖 → SIMOPS冲突 → 条件性依赖）
4. 如果有错误，显示错误列表，阻止提交
5. 如果有警告，显示确认对话框，用户选择是否继续
6. 验证通过，提交作业票

### 8.2 依赖图交互

1. 鼠标悬停节点，显示作业票详细信息（Tooltip）
2. 点击节点，跳转到作业票详情页
3. 点击依赖箭头，显示依赖原因（如"能量隔离要求"）
4. 点击冲突线，显示冲突详情（如"距离12米，小于最小安全距离15米"）
5. 支持缩放和拖拽（使用 Mermaid 的交互功能）

### 8.3 执行顺序调整

1. 显示推荐执行顺序列表
2. 用户可以拖拽调整顺序（但不能违反前置依赖）
3. 调整后实时验证是否满足依赖关系
4. 如果违反依赖，显示错误提示并恢复原顺序

---

## 9. 技术实现要点

### 9.1 算法库

```typescript
// utils/dependencyEngine.ts
export class DependencyEngine {
  static validate(task: Task, permits: Permit[], targetPermit: Permit): ValidationResult;
  static detectCycle(permits: Permit[]): string[] | null;
  static topologicalSort(permits: Permit[]): string[] | null;
  static checkSimopsConflicts(permit: Permit, activePermits: Permit[]): Conflict[];
  static evaluateConditionalDeps(permit: Permit, context: TaskContext): RequiredAction[];
}
```

### 9.2 Mermaid 图生成

```typescript
// utils/mermaidGenerator.ts
export function generateDependencyGraph(permits: Permit[]): string {
  let mermaid = 'graph TD\n';

  // 添加节点
  for (const permit of permits) {
    const statusColor = getStatusColor(permit.status);
    mermaid += `  ${permit.permitId}[${permit.permitName}]\n`;
    mermaid += `  style ${permit.permitId} fill:${statusColor}\n`;
  }

  // 添加前置依赖箭头
  for (const permit of permits) {
    for (const prereq of permit.dependencies.prerequisites) {
      mermaid += `  ${prereq.dependsOnPermitId} -->|前置依赖| ${permit.permitId}\n`;
    }
  }

  // 添加SIMOPS冲突线
  for (const permit of permits) {
    for (const conflict of permit.dependencies.simopsConflicts) {
      mermaid += `  ${permit.permitId} -.->|SIMOPS冲突| ${conflict.conflictWithPermitId}\n`;
    }
  }

  return mermaid;
}
```

### 9.3 性能优化

- **缓存依赖图**：任务创建后缓存依赖图，避免重复计算
- **增量验证**：作业表状态变更时仅重新验证受影响的依赖关系
- **Web Worker**：大规模SIMOPS检测使用Web Worker异步处理

---

## 10. 验收标准

### 10.1 功能验收

- [ ] 前置依赖检查：能正确识别未满足的前置依赖
- [ ] 循环依赖检测：能检测并提示循环依赖
- [ ] 拓扑排序：能生成正确的执行顺序
- [ ] 垂直空间冲突：能检测吊装/高处作业下方的冲突
- [ ] 水平空间冲突：能检测距离小于最小安全距离的冲突
- [ ] 时间冲突：能检测时间间隔不满足要求的冲突
- [ ] 条件性依赖：能根据作业类型/级别触发气体检测、方案编制等要求
- [ ] 依赖图可视化：能正确渲染Mermaid依赖关系图
- [ ] 执行顺序展示：能清晰展示推荐执行顺序和依赖关系

### 10.2 性能验收

- [ ] 10个作业表的依赖验证 < 100ms
- [ ] 依赖图渲染 < 500ms
- [ ] 拓扑排序 < 50ms

### 10.3 交互验收

- [ ] 验证错误能清晰展示，用户能理解原因
- [ ] 依赖图节点可点击，能跳转到详情页
- [ ] 执行顺序可拖拽调整（不违反依赖）
- [ ] 冲突详情能展开查看

---

## 11. 与其他组件的关系

| 组件 | 关系 | 说明 |
|------|------|------|
| FormRenderer | 被调用 | 提交作业票时调用依赖引擎验证 |
| GeoFence | 数据提供 | 提供作业位置数据用于SIMOPS检测 |
| GasDetection | 被触发 | 条件性依赖评估触发气体检测要求 |
| SafetyChecklist | 被触发 | 条件性依赖评估触发安全措施要求 |
| Timeline | 展示 | 在审批时间轴中展示依赖验证结果 |

---

**文档结束**
