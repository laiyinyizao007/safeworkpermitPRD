# API接口设计

> **文档版本**: v1.0 | **创建日期**: 2026-03-12
> **适用系统**: 作业票管理系统 | **设计模式**: RESTful API
> **关联文档**: [总览](./00-总览.md) | [数据模型与状态机](./05-数据模型与状态机.md) | [前端组件设计](./07-前端组件设计.md)

---

## 📋 API设计原则

### 核心原则

- **RESTful风格**：资源导向，使用标准HTTP方法（GET/POST/PUT/PATCH/DELETE）
- **版本控制**：URL路径包含版本号（如 `/api/v1/`）
- **统一响应格式**：成功和错误响应遵循统一结构
- **幂等性保证**：GET/PUT/DELETE操作幂等，POST操作非幂等
- **分页支持**：列表接口支持分页、排序、过滤
- **安全性**：所有接口需要认证，敏感操作需要授权

### 响应格式规范

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

// 错误响应
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

---

## 🔗 API端点总览

### 任务管理（Tasks）

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/tasks` | 创建任务 | ✅ |
| GET | `/api/v1/tasks` | 获取任务列表 | ✅ |
| GET | `/api/v1/tasks/{id}` | 获取任务详情 | ✅ |
| PUT | `/api/v1/tasks/{id}` | 更新任务 | ✅ |
| DELETE | `/api/v1/tasks/{id}` | 删除任务 | ✅ |
| PATCH | `/api/v1/tasks/{id}/status` | 更新任务状态 | ✅ |

### 智能推荐（Recommendations）

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/tasks/{id}/recommend-permits` | 获取作业表推荐 | ✅ |
| POST | `/api/v1/recommendations/feedback` | 提交推荐反馈 | ✅ |

### 依赖检测（Dependencies）

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/tasks/{id}/detect-dependencies` | 检测依赖关系 | ✅ |
| GET | `/api/v1/tasks/{id}/execution-order` | 获取执行顺序 | ✅ |
| POST | `/api/v1/tasks/{id}/validate-activation` | 验证激活条件 | ✅ |

### 作业表管理（Permits）

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/permits` | 创建作业表 | ✅ |
| GET | `/api/v1/permits/{id}` | 获取作业表详情 | ✅ |
| PUT | `/api/v1/permits/{id}` | 更新作业表 | ✅ |
| PATCH | `/api/v1/permits/{id}/status` | 更新作业表状态 | ✅ |
| POST | `/api/v1/permits/{id}/activate` | 激活作业表 | ✅ |
| POST | `/api/v1/permits/{id}/suspend` | 暂停作业表 | ✅ |
| POST | `/api/v1/permits/{id}/complete` | 完成作业表 | ✅ |

### 表单元数据（Schemas）

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/schemas/{permitType}` | 获取作业表Schema | ✅ |
| GET | `/api/v1/layouts/{permitType}` | 获取布局配置 | ✅ |

---

## 📐 核心接口详细设计

### 1. 创建任务

**端点**: `POST /api/v1/tasks`

**请求体**:

```typescript
interface CreateTaskRequest {
  taskName: string;
  taskType: 'maintenance' | 'construction' | 'emergency';
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
    floor?: string;
  };
  plannedStartTime: string; // ISO 8601
  plannedEndTime: string;   // ISO 8601
  taskDescription?: string;
  riskAssessment: {
    locationTypes: string[];
    mediumTypes: string[];
    characteristicGases?: string[];
    otherRisks?: string[];
  };
}
```

**响应**:

```typescript
interface CreateTaskResponse {
  success: true;
  data: {
    taskId: string;
    taskName: string;
    status: 'draft';
    createdAt: string;
    createdBy: string;
  };
  message: '任务创建成功';
  timestamp: string;
}
```

**错误码**:
- `TASK_NAME_REQUIRED` (400): 任务名称不能为空
- `INVALID_TIME_RANGE` (400): 结束时间必须晚于开始时间
- `INVALID_LOCATION` (400): 地理位置坐标无效
- `UNAUTHORIZED` (401): 未授权
- `FORBIDDEN` (403): 无权限创建任务

---

### 2. 获取作业表推荐

**端点**: `POST /api/v1/tasks/{id}/recommend-permits`

**请求体**:

```typescript
interface RecommendPermitsRequest {
  riskAssessment: {
    locationTypes: string[];
    mediumTypes: string[];
    characteristicGases?: string[];
    otherRisks?: string[];
  };
  taskType: string;
}
```

**响应**:

```typescript
interface RecommendPermitsResponse {
  success: true;
  data: {
    recommendations: Array<{
      permitType: PermitType;
      permitName: string;
      category: 'mandatory' | 'recommended' | 'optional';
      confidence: number;
      reasons: string[];
      sources: Array<'rule_engine' | 'ml_model'>;
      ruleId?: string;
    }>;
    executionTime: number; // 毫秒
  };
  timestamp: string;
}
```

**错误码**:
- `TASK_NOT_FOUND` (404): 任务不存在
- `INVALID_RISK_ASSESSMENT` (400): 风险辨识数据无效
- `RECOMMENDATION_ENGINE_ERROR` (500): 推荐引擎内部错误

---

### 3. 检测依赖关系

**端点**: `POST /api/v1/tasks/{id}/detect-dependencies`

**请求体**:

```typescript
interface DetectDependenciesRequest {
  permits: Array<{
    permitId: string;
    permitType: PermitType;
    location: GeoLocation;
    workArea?: Polygon;
  }>;
}
```

**响应**:

```typescript
interface DetectDependenciesResponse {
  success: true;
  data: {
    dependencies: {
      prerequisites: Array<{
        permitId: string;
        dependsOnPermitId: string;
        reason: string;
      }>;
      simopsConflicts: Array<{
        permitId: string;
        conflictPermitId: string;
        conflictType: 'vertical' | 'horizontal' | 'temporal';
        severity: 'prohibit' | 'warning';
        distance?: number;
        message: string;
      }>;
      conditionalDeps: Array<{
        permitId: string;
        condition: string;
        requiredAction: string;
      }>;
    };
    cyclicDependency: string[] | null;
    executionTime: number;
  };
  timestamp: string;
}
```

**错误码**:
- `TASK_NOT_FOUND` (404): 任务不存在
- `CYCLIC_DEPENDENCY_DETECTED` (400): 检测到循环依赖
- `INVALID_PERMIT_DATA` (400): 作业表数据无效

---

### 4. 获取执行顺序

**端点**: `GET /api/v1/tasks/{id}/execution-order`

**查询参数**:
- `includeCompleted` (boolean): 是否包含已完成的作业表，默认 false

**响应**:

```typescript
interface ExecutionOrderResponse {
  success: true;
  data: {
    order: Array<{
      sequence: number;
      permitId: string;
      permitType: PermitType;
      permitName: string;
      status: PermitStatus;
      dependencies: string[];
      conflicts: string[];
      estimatedStartTime?: string;
    }>;
    totalPermits: number;
    completedPermits: number;
  };
  timestamp: string;
}
```

**错误码**:
- `TASK_NOT_FOUND` (404): 任务不存在
- `NO_PERMITS_FOUND` (404): 任务中没有作业表

---

### 5. 激活作业表

**端点**: `POST /api/v1/permits/{id}/activate`

**请求体**:

```typescript
interface ActivatePermitRequest {
  taskId: string;
  allPermits: Permit[]; // 用于依赖检查
}
```

**响应**:

```typescript
interface ActivatePermitResponse {
  success: true;
  data: {
    permitId: string;
    status: 'active';
    validFrom: string;
    dependencyCheck: {
      satisfied: boolean;
      missingDeps: any[];
    };
    simopsCheck: {
      hasConflict: boolean;
      conflicts: any[];
    };
  };
  message: '作业表激活成功';
  timestamp: string;
}
```

**错误码**:
- `PERMIT_NOT_FOUND` (404): 作业表不存在
- `INVALID_STATUS_TRANSITION` (400): 状态转换不合法
- `DEPENDENCY_NOT_SATISFIED` (400): 前置依赖未满足
- `SIMOPS_CONFLICT` (400): 存在SIMOPS冲突

---

### 6. 获取表单Schema

**端点**: `GET /api/v1/schemas/{permitType}`

**路径参数**:
- `permitType`: 作业表类型（hotWork, confinedSpace等）

**查询参数**:
- `version` (string): Schema版本号，默认最新版本

**响应**:

```typescript
interface GetSchemaResponse {
  success: true;
  data: {
    permitType: PermitType;
    permitName: string;
    version: string;
    steps: StepSchema[];
    globalValidations?: ValidationRule[];
    metadata: {
      createdAt: string;
      updatedAt: string;
      author: string;
      description: string;
    };
  };
  timestamp: string;
}
```

**错误码**:
- `SCHEMA_NOT_FOUND` (404): Schema不存在
- `INVALID_PERMIT_TYPE` (400): 作业表类型无效

---

## 🔐 认证与授权

### 认证机制

**JWT Token认证**:

```typescript
// 请求头
Authorization: Bearer <JWT_TOKEN>

// Token结构
interface JWTPayload {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  exp: number; // 过期时间戳
  iat: number; // 签发时间戳
}
```

### 权限控制

**基于角色的访问控制（RBAC）**:

| 角色 | 权限 |
|------|------|
| 作业负责人 | 创建任务、创建作业表、填写表单 |
| 作业人 | 查看任务、填写指定步骤 |
| 监护人 | 查看任务、填写监护记录 |
| 安全负责人 | 查看所有任务、审批作业表 |
| 审批人 | 查看任务、审批作业表 |
| 系统管理员 | 所有权限 |

**权限检查示例**:

```typescript
// 中间件伪代码
function checkPermission(requiredPermission: string) {
  return (req, res, next) => {
    const user = req.user; // 从JWT解析
    if (!user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限执行此操作'
        }
      });
    }
    next();
  };
}

// 使用示例
router.post('/api/v1/tasks',
  authenticate,
  checkPermission('task:create'),
  createTask
);
```

---

## ⚠️ 错误码定义

### 通用错误码（1000-1999）

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| `INVALID_REQUEST` | 400 | 请求参数无效 |
| `UNAUTHORIZED` | 401 | 未授权 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

### 任务相关错误码（2000-2999）

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| `TASK_NOT_FOUND` | 404 | 任务不存在 |
| `TASK_NAME_REQUIRED` | 400 | 任务名称不能为空 |
| `INVALID_TIME_RANGE` | 400 | 时间范围无效 |
| `INVALID_LOCATION` | 400 | 地理位置无效 |
| `TASK_STATUS_INVALID` | 400 | 任务状态无效 |

### 作业表相关错误码（3000-3999）

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| `PERMIT_NOT_FOUND` | 404 | 作业表不存在 |
| `INVALID_STATUS_TRANSITION` | 400 | 状态转换不合法 |
| `DEPENDENCY_NOT_SATISFIED` | 400 | 前置依赖未满足 |
| `SIMOPS_CONFLICT` | 400 | SIMOPS冲突 |
| `WORKFLOW_INCOMPLETE` | 400 | 六步流程未完成 |

### 推荐引擎错误码（4000-4999）

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| `INVALID_RISK_ASSESSMENT` | 400 | 风险辨识数据无效 |
| `RECOMMENDATION_ENGINE_ERROR` | 500 | 推荐引擎错误 |
| `ML_MODEL_UNAVAILABLE` | 503 | ML模型不可用 |

### 依赖检测错误码（5000-5999）

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| `CYCLIC_DEPENDENCY_DETECTED` | 400 | 循环依赖 |
| `INVALID_PERMIT_DATA` | 400 | 作业表数据无效 |
| `GEOFENCING_ERROR` | 500 | 地理围栏计算错误 |

---

## 📊 分页与过滤

### 分页参数

所有列表接口支持以下查询参数：

```typescript
interface PaginationParams {
  page?: number;      // 页码，从1开始，默认1
  pageSize?: number;  // 每页数量，默认20，最大100
  sortBy?: string;    // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序方向，默认desc
}
```

### 分页响应格式

```typescript
interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  timestamp: string;
}
```

### 过滤参数示例

```typescript
// 获取任务列表
GET /api/v1/tasks?status=active&taskType=maintenance&page=1&pageSize=20

// 响应
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2026-03-12T07:00:00.000Z"
}
```

---

## 🔗 相关文档

- **上一篇**：[数据模型与状态机](./05-数据模型与状态机.md)
- **下一篇**：[前端组件设计](./07-前端组件设计.md)
- **参考**：[作业表依赖引擎详细设计方案](../../分析内容/作业表依赖引擎详细设计方案.md)
