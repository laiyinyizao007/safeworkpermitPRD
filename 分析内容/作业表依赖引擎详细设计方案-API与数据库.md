# 作业表依赖引擎详细设计方案 - API与数据库设计

> 本文档是《作业表依赖引擎详细设计方案》的补充部分
> 包含：统一接口、REST API、数据库设计、前端可视化、实施建议

---

## 四、依赖引擎统一接口

### 4.1 核心服务类

```typescript
class PermitDependencyEngine {
  /**
   * 统一的依赖验证入口
   * @param permit 待验证的作业表
   * @param task 所属任务
   * @param allPermits 任务下所有作业表
   * @param activePermits 当前活动的作业表
   * @returns 验证结果
   */
  static validate(
    permit: Permit,
    task: Task,
    allPermits: Permit[],
    activePermits: Permit[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const requiredActions: RequiredAction[] = [];

    // 1. 前置依赖检查
    const prereqResult = PrerequisiteDependencyChecker.checkPrerequisites(
      permit,
      new Map(allPermits.map(p => [p.permitId, p]))
    );

    if (!prereqResult.satisfied) {
      errors.push({
        type: 'prerequisite',
        severity: 'error',
        message: '前置依赖未满足',
        details: prereqResult.missingDeps
      });
    }

    // 2. 循环依赖检查
    const cycle = PrerequisiteDependencyChecker.detectCyclicDependency(allPermits);
    if (cycle) {
      errors.push({
        type: 'cyclic_dependency',
        severity: 'error',
        message: '检测到循环依赖',
        details: { cycle }
      });
    }

    // 3. SIMOPS冲突检测
    const simopsResult = SimopsConflictDetector.checkConflicts(
      permit,
      activePermits
    );

    if (simopsResult.hasConflict) {
      for (const conflict of simopsResult.conflicts) {
        if (conflict.severity === 'prohibit') {
          errors.push({
            type: 'simops_conflict',
            severity: 'error',
            message: conflict.message,
            details: conflict
          });
        } else {
          warnings.push({
            type: 'simops_warning',
            severity: 'warning',
            message: conflict.message,
            details: conflict
          });
        }
      }
    }

    // 4. 条件性依赖评估
    const conditionalResult = ConditionalDependencyEvaluator.evaluate(
      permit,
      this.buildTaskContext(task)
    );

    requiredActions.push(...conditionalResult.requiredActions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredActions,
      executionOrder: this.calculateExecutionOrder(allPermits)
    };
  }

  /**
   * 计算作业表的推荐执行顺序
   */
  private static calculateExecutionOrder(permits: Permit[]): string[] | null {
    return PrerequisiteDependencyChecker.topologicalSort(permits);
  }

  /**
   * 构建任务上下文
   */
  private static buildTaskContext(task: Task): TaskContext {
    return {
      locationType: task.riskAssessment?.locationTypes || [],
      mediumType: task.riskAssessment?.mediumTypes || [],
      mediumCharacteristicGases: task.riskAssessment?.characteristicGases || []
    };
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  requiredActions: any[];
  executionOrder: string[] | null;
}

interface ValidationError {
  type: string;
  severity: 'error';
  message: string;
  details: any;
}

interface ValidationWarning {
  type: string;
  severity: 'warning';
  message: string;
  details: any;
}
```

### 4.2 REST API 设计

```typescript
// ========== API 端点 ==========

/**
 * POST /api/tasks/{taskId}/permits/validate
 * 验证作业表依赖关系
 */
interface ValidatePermitRequest {
  permit: Permit;
}

interface ValidatePermitResponse {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  requiredActions: Array<{
    actionType: string;
    parameters: any;
    triggerTime: string;
    reason: string;
  }>;
  executionOrder: string[];
}

/**
 * GET /api/tasks/{taskId}/permits/execution-order
 * 获取作业表推荐执行顺序
 */
interface GetExecutionOrderResponse {
  executionOrder: Array<{
    permitId: string;
    permitType: PermitType;
    permitName: string;
    dependencies: string[];
  }>;
  hasCycle: boolean;
  cycle?: string[];
}

/**
 * POST /api/tasks/{taskId}/permits/{permitId}/simops-check
 * 检查SIMOPS冲突
 */
interface SimopsCheckRequest {
  permitId: string;
}

interface SimopsCheckResponse {
  hasConflict: boolean;
  conflicts: Array<{
    conflictPermitId: string;
    conflictPermitName: string;
    conflictType: 'vertical' | 'horizontal' | 'temporal';
    severity: 'prohibit' | 'warning';
    distance?: number;
    message: string;
  }>;
}

/**
 * GET /api/tasks/{taskId}/dependency-graph
 * 获取依赖关系图（用于可视化）
 */
interface DependencyGraphResponse {
  nodes: Array<{
    id: string;
    type: PermitType;
    name: string;
    status: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: 'prerequisite' | 'conflict';
    label: string;
  }>;
}
```

---

## 五、数据库设计

### 5.1 任务表（tasks）

```sql
CREATE TABLE tasks (
  task_id VARCHAR(36) PRIMARY KEY,
  task_name VARCHAR(200) NOT NULL,
  task_type ENUM('maintenance', 'construction', 'emergency') NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  planned_start_time DATETIME,
  planned_end_time DATETIME,
  status ENUM('draft', 'approved', 'active', 'completed', 'cancelled') NOT NULL,
  risk_assessment JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_planned_start (planned_start_time)
);
```

### 5.2 作业表（permits）

```sql
CREATE TABLE permits (
  permit_id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  permit_type ENUM('hotWork', 'confinedSpace', 'blindPlate', 'workAtHeight',
                   'lifting', 'tempElectricity', 'excavation', 'roadBreaking') NOT NULL,
  permit_level VARCHAR(50),
  permit_name VARCHAR(200) NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_altitude DECIMAL(8, 2),
  work_area JSON, -- Polygon数据
  applicant_id VARCHAR(36),
  approver_id VARCHAR(36),
  guardian_id VARCHAR(36),
  workflow JSON, -- 6步流程状态
  status ENUM('pending', 'approved', 'active', 'suspended', 'completed') NOT NULL,
  valid_from DATETIME,
  valid_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
  INDEX idx_task_id (task_id),
  INDEX idx_permit_type (permit_type),
  INDEX idx_status (status),
  INDEX idx_valid_period (valid_from, valid_until)
);
```

### 5.3 依赖关系表（permit_dependencies）

```sql
CREATE TABLE permit_dependencies (
  dependency_id VARCHAR(36) PRIMARY KEY,
  permit_id VARCHAR(36) NOT NULL,
  dependency_type ENUM('prerequisite', 'simops_conflict', 'conditional') NOT NULL,
  depends_on_permit_id VARCHAR(36),
  required_status VARCHAR(50),
  conflict_type VARCHAR(50),
  min_distance INT,
  min_time_gap INT,
  condition_rule JSON,
  required_action JSON,
  severity ENUM('prohibit', 'warning'),
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (permit_id) REFERENCES permits(permit_id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_permit_id) REFERENCES permits(permit_id) ON DELETE CASCADE,
  INDEX idx_permit_id (permit_id),
  INDEX idx_dependency_type (dependency_type)
);
```

### 5.4 依赖验证日志表（dependency_validation_logs）

```sql
CREATE TABLE dependency_validation_logs (
  log_id VARCHAR(36) PRIMARY KEY,
  permit_id VARCHAR(36) NOT NULL,
  validation_time DATETIME NOT NULL,
  is_valid BOOLEAN NOT NULL,
  errors JSON,
  warnings JSON,
  required_actions JSON,
  execution_order JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (permit_id) REFERENCES permits(permit_id) ON DELETE CASCADE,
  INDEX idx_permit_id (permit_id),
  INDEX idx_validation_time (validation_time)
);
```

---

## 六、前端可视化设计

### 6.1 依赖关系图可视化（基于Mermaid）

```mermaid
graph TD
    subgraph 任务：反应釜检修
        P1[盲板抽堵<br/>已完成]
        P2[受限空间<br/>进行中]
        P3[临时用电<br/>待审批]
        P4[动火作业<br/>待审批]
    end

    P1 -->|前置依赖| P2
    P1 -->|前置依赖| P4
    P2 -->|前置依赖| P3
    P2 -.->|SIMOPS冲突<br/>15米| P4

    style P1 fill:#90EE90
    style P2 fill:#FFD700
    style P3 fill:#D3D3D3
    style P4 fill:#D3D3D3
```

### 6.2 SIMOPS冲突地图可视化

```typescript
// 使用Leaflet.js或高德地图API
interface SimopsMapVisualization {
  // 1. 绘制作业区域
  drawWorkArea(permit: Permit, color: string): void;

  // 2. 绘制安全距离圈
  drawSafetyCircle(permit: Permit, radius: number): void;

  // 3. 标注冲突点
  markConflict(permit1: Permit, permit2: Permit, conflictType: string): void;

  // 4. 显示垂直空间关系
  showVerticalRelation(upperPermit: Permit, lowerPermit: Permit): void;
}
```

### 6.3 执行顺序甘特图

```typescript
// 使用Gantt.js或ECharts
interface ExecutionGanttChart {
  permits: Array<{
    permitId: string;
    permitName: string;
    startTime: Date;
    endTime: Date;
    dependencies: string[];
    status: string;
  }>;
}
```

---

## 七、实施建议

### 7.1 分阶段实施路线图

**Phase 1: 核心依赖引擎（2-3周）**
- 实现前置依赖检查（DAG验证、拓扑排序）
- 实现SIMOPS冲突检测（垂直、水平空间）
- 实现条件性依赖评估（气体检测、方案编制）
- 单元测试覆盖率 ≥ 85%

**Phase 2: API与数据库（1-2周）**
- 设计并实现REST API
- 创建数据库表结构
- 实现依赖关系CRUD操作
- API集成测试

**Phase 3: 前端可视化（2-3周）**
- 依赖关系图可视化
- SIMOPS冲突地图
- 执行顺序甘特图
- 用户交互优化

**Phase 4: 集成与优化（1-2周）**
- 与现有作业票系统集成
- 性能优化（缓存、索引）
- 用户验收测试
- 文档完善

### 7.2 关键技术选型

| 组件 | 推荐技术 | 理由 |
|------|---------|------|
| 后端框架 | Spring Boot / Node.js + Express | 成熟稳定，生态丰富 |
| 数据库 | MySQL 8.0+ / PostgreSQL | 支持JSON字段，事务完整性 |
| 缓存 | Redis | 高性能，支持复杂数据结构 |
| 地图服务 | 高德地图API / Leaflet.js | 国内地图服务，支持地理围栏 |
| 图可视化 | Mermaid.js / D3.js | 声明式语法，易于维护 |
| 前端框架 | Vue 3 / React | 组件化开发，状态管理 |

### 7.3 性能优化建议

1. **依赖图缓存**：任务创建后缓存依赖图，避免重复计算
2. **空间索引**：使用PostGIS或MySQL Spatial扩展优化地理查询
3. **异步验证**：大规模SIMOPS检测使用消息队列异步处理
4. **增量更新**：作业表状态变更时仅重新验证受影响的依赖关系

### 7.4 测试策略

**单元测试**：
- DAG检测算法（循环依赖、拓扑排序）
- SIMOPS冲突检测（垂直、水平、时间）
- 条件性依赖评估（各类规则）

**集成测试**：
- API端点测试
- 数据库事务测试
- 依赖引擎与作业票系统集成

**场景测试**：
- 反应釜检修场景（4个作业表）
- 换热器大修场景（并行作业）
- 紧急抢修场景（时间约束）

---

## 八、附录

### 8.1 依赖关系配置示例

```json
{
  "taskId": "task-001",
  "taskName": "反应釜内部检修",
  "permits": [
    {
      "permitId": "permit-001",
      "permitType": "blindPlate",
      "permitName": "R-101反应釜盲板抽堵",
      "dependencies": {
        "prerequisites": [],
        "simopsConflicts": [],
        "conditionalRequirements": [
          {
            "condition": {
              "ruleType": "gas_detection",
              "conditions": {
                "mediumType": ["可燃"]
              }
            },
            "requiredAction": {
              "actionType": "gas_detection",
              "parameters": {
                "gasTypes": ["LEL", "H2"],
                "retestInterval": 60
              }
            },
            "triggerTime": "before_start"
          }
        ]
      }
    },
    {
      "permitId": "permit-002",
      "permitType": "confinedSpace",
      "permitName": "R-101反应釜受限空间作业",
      "dependencies": {
        "prerequisites": [
          {
            "dependsOnPermitId": "permit-001",
            "dependsOnPermitType": "blindPlate",
            "requiredStatus": "completed",
            "reason": "能量隔离要求"
          }
        ],
        "simopsConflicts": [
          {
            "conflictWithPermitType": "hotWork",
            "conflictType": "horizontal",
            "minDistance": 15,
            "severity": "prohibit"
          }
        ],
        "conditionalRequirements": [
          {
            "condition": {
              "ruleType": "gas_detection",
              "conditions": {
                "permitType": ["confinedSpace"]
              }
            },
            "requiredAction": {
              "actionType": "gas_detection",
              "parameters": {
                "gasTypes": ["O2", "H2S", "CO", "LEL"],
                "retestInterval": 30
              }
            },
            "triggerTime": "before_start"
          },
          {
            "condition": {
              "ruleType": "guardian_config",
              "conditions": {
                "permitType": ["confinedSpace"]
              }
            },
            "requiredAction": {
              "actionType": "guardian_assignment",
              "parameters": {
                "guardianCount": 2,
                "certificationRequired": true
              }
            },
            "triggerTime": "before_approval"
          }
        ]
      }
    }
  ]
}
```

### 8.2 错误码定义

| 错误码 | 错误类型 | 说明 |
|-------|---------|------|
| DEP_001 | 前置依赖未满足 | 依赖的作业表状态不符合要求 |
| DEP_002 | 循环依赖 | 检测到作业表之间的循环依赖 |
| DEP_003 | SIMOPS垂直冲突 | 垂直空间存在禁止的作业冲突 |
| DEP_004 | SIMOPS水平冲突 | 水平距离小于最小安全距离 |
| DEP_005 | SIMOPS时间冲突 | 时间间隔不满足要求 |
| DEP_006 | 条件性依赖未满足 | 必须的气体检测/方案编制等未完成 |

---

**文档结束**
