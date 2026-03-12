# 06 - 技术架构与 Mock 数据

> **关联PRD**: [`04-系统架构设计.md`](../../产出/PRD章节/04-系统架构设计.md) / [`10-技术实现建议.md`](../../产出/PRD章节/10-技术实现建议.md)

---

## 1. 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4+ | 核心框架 |
| TypeScript | 5.x | 类型安全 |
| Element Plus | 2.5+ | PC 端 UI 组件库 |
| Vant | 4.x | 移动端 UI 组件库 |
| Vue Router | 4.x | 路由管理 |
| Pinia | 2.x | 状态管理 |
| Vite | 5.x | 构建工具 |
| ECharts | 5.4+ | 图表（看板/统计） |

**与 v1.0 的变化**：新增 Vant（移动端）和 ECharts（数据看板），支持 PC + 移动端双端。

## 2. 项目结构

> **核心理念**: 统一 UI 架构。页面按功能模块组织，不按角色拆分。权限差异通过 `permission.ts` 运行时计算。

```text
vue3-ptw-demo/
├── src/
│   ├── assets/                # 静态资源
│   ├── components/            # 通用组件
│   │   ├── FormRenderer/        # 动态表单渲染器（元数据驱动）
│   │   ├── ActionBlock/         # 动作块组件（按角色+状态渲染操作按钮）
│   │   ├── Signature/           # 电子签名组件
│   │   ├── PhotoUpload/         # 照片上传组件
│   │   ├── GasDetection/        # 气体检测录入组件
│   │   ├── EmergencyStop/       # 紧急叫停按钮
│   │   ├── StatusTag/           # 状态标签组件
│   │   ├── Timeline/            # 审批时间轴组件
│   │   ├── GeoFence/            # 地理围栏模拟组件
│   │   ├── RoleSwitcher/        # 角色切换组件
│   │   └── MonitorPanel/        # 监护面板组件（条件渲染）
│   ├── views/                 # 页面组件（按功能模块，非按角色）
│   │   ├── Home.vue             # 首页 - 待办中心（所有角色共享）
│   │   ├── permit/              # 作业票模块（统一 UI）
│   │   │   ├── Create/            # 新建作业票（分步表单）
│   │   │   └── Detail.vue         # 作业票详情页（核心页面，权限驱动）
│   │   └── admin/               # 管理后台（仅管理员）
│   │       ├── Overview.vue       # 系统概览仪表盘
│   │       ├── TemplateEditor.vue # 模板配置器
│   │       ├── WorkflowDesigner.vue # 工作流设计器
│   │       ├── PermissionMatrix.vue # 权限矩阵编辑器
│   │       ├── Analytics.vue      # 数据分析
│   │       └── AuditLog.vue       # 审计日志
│   ├── mock/                  # Mock 数据
│   │   ├── users.ts             # 用户数据（6人，可切换角色）
│   │   ├── workPermits.ts       # 作业票数据
│   │   ├── formMetadata.ts      # 表单元数据配置
│   │   ├── roleViewConfig.ts    # 角色视图权限配置
│   │   ├── gasDetection.ts      # 气体检测模拟数据
│   │   ├── auditLog.ts          # 审计日志数据
│   │   └── statistics.ts        # 统计数据
│   ├── router/                # 路由配置（统一入口）
│   │   └── index.ts
│   ├── stores/                # Pinia 状态管理
│   │   ├── user.ts              # 当前用户/角色（含角色切换）
│   │   ├── workPermit.ts        # 作业票状态
│   │   └── notification.ts      # 通知消息
│   ├── types/                 # TypeScript 类型定义
│   │   ├── user.ts
│   │   ├── workPermit.ts
│   │   ├── formMetadata.ts
│   │   └── permission.ts
│   └── utils/                 # 工具函数
│       ├── permission.ts        # 权限计算（role + state → 字段权限）
│       ├── validation.ts        # 表单校验
│       └── mock-timer.ts        # 模拟定时器（气体检测等）
├── public/
└── package.json
```

**路由设计（统一入口）**:

```typescript
const routes = [
  { path: '/', component: Home },           // 所有角色共享
  { path: '/permit/new', component: Create }, // 仅负责人/管理员
  { path: '/permit/:id', component: Detail }, // 所有角色（权限驱动）
  { path: '/admin', component: AdminLayout, meta: { role: 'admin' } }, // 仅管理员
]
```

## 3. Mock 数据设计

### 3.1 用户数据（users.ts）

```typescript
export interface User {
  id: number
  name: string
  role: 'applicant' | 'worker' | 'supervisor' | 'reviewer' | 'approver' | 'admin'
  roleName: string
  avatar: string
  department: string
  position: string
  phone: string
  certificates?: Certificate[]
}

export const users: User[] = [
  {
    id: 1, name: '张三', role: 'applicant', roleName: '作业负责人',
    department: '维修班组', position: '施工班组长', phone: '138****1001',
    certificates: [{ name: '安全管理人员证', expiry: '2027-06-30', status: 'valid' }]
  },
  {
    id: 2, name: '李四', role: 'worker', roleName: '作业人',
    department: '维修班组', position: '电焊工', phone: '138****1002',
    certificates: [{ name: '电焊工操作证', expiry: '2026-12-31', status: 'valid' }]
  },
  {
    id: 3, name: '王五', role: 'supervisor', roleName: '监护人',
    department: '安全科', position: '专职监护人', phone: '138****1003',
    certificates: [{ name: '动火监护人证', expiry: '2027-03-15', status: 'valid' }]
  },
  {
    id: 4, name: '赵六', role: 'reviewer', roleName: '安全负责人',
    department: '安全科', position: '安全科专员', phone: '139****1004'
  },
  {
    id: 5, name: '孙七', role: 'approver', roleName: '审批人',
    department: '生产车间', position: '车间主任', phone: '139****1005'
  },
  {
    id: 6, name: '陈工', role: 'admin', roleName: '系统管理员',
    department: '信息科', position: '系统工程师', phone: '139****1006'
  }
]
```

### 3.2 作业票数据（workPermits.ts）

```typescript
export type PermitStatus = 'Draft' | 'Submitted' | 'Verify' | 'Executing' | 'Closed' | 'Emergency'

export interface WorkPermit {
  id: string
  type: 'hotWork' | 'confinedSpace' | 'heightWork' | 'lifting' | 'tempElectric' | 'excavation' | 'roadBlock' | 'blindPlate'
  typeName: string
  level: 'special' | 'level1' | 'level2'
  status: PermitStatus
  applicant: { id: number; name: string }
  workers: { id: number; name: string; certified: boolean }[]
  supervisor: { id: number; name: string; certified: boolean }
  reviewer: { id: number; name: string }
  approver: { id: number; name: string }
  workZone: string
  workLocation: { lat: number; lng: number; name: string }
  workMethod: string[]
  workTime: { start: string; end: string }
  workContent: string
  safetyMeasures: SafetyMeasure[]
  jsaRisks: JsaRisk[]
  photos: string[]
  gasDetections: GasDetection[]
  approvalHistory: ApprovalRecord[]
  monitorLog: MonitorLogEntry[]
  applyTime: string
  isEmergency: boolean
}

// 预置不同状态的作业票，覆盖完整生命周期
export const workPermits: WorkPermit[] = [
  // WP-001: 待审批（演示审核/审批流程）
  // WP-002: 核查中（演示监护人核查）
  // WP-003: 执行中（演示监护面板/作业人签退）
  // WP-004: 已关闭（演示历史查看）
  // WP-005: 草稿（演示编辑/提交）
  // WP-006: 已退回（演示修改重提交）
  // WP-007: 紧急中断（演示紧急叫停）
  // WP-008: 紧急待审批（演示紧急审批通道）
]
```

### 3.3 表单元数据（formMetadata.ts）

```typescript
export interface FieldPermission {
  visible: boolean
  editable: boolean
  can_approve?: boolean
}

export interface FieldConfig {
  key: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'daterange' | 'userselect' | 'imageupload' | 'signature' | 'gasdetection' | 'jsa' | 'safetychecklist'
  label: string
  required: boolean
  permissions: Record<string, FieldPermission>  // role -> permission
  stateOverride: Record<string, Record<string, Partial<FieldPermission>>>  // state -> role -> override
  options?: string[]
  min?: number
  max?: number
  constraints?: Record<string, any>
}

export const hotWorkMetadata = {
  formSchema: { /* 字段定义，含角色权限 */ },
  layoutConfig: {
    cards: [
      { title: '基础信息', fields: ['work_zone', 'work_location', 'work_level', 'work_method', 'work_time', 'work_content', 'site_photos'] },
      { title: '人员信息', fields: ['workers', 'supervisor', 'reviewer', 'approver'] },
      { title: '安全措施', fields: ['safety_checklist', 'jsa_analysis', 'emergency_plan'] },
      { title: '气体检测', fields: ['gas_detection_records'] },
      { title: '审批意见', fields: ['review_comments', 'approval_comments'] },
      { title: '签名', fields: ['signatures'] }
    ]
  },
  constraintRules: {
    work_method: { visibleIf: "data.work_zone == '储罐区'", options: ['电焊'] },
    gas_detection: { requiredIf: "data.work_zone == '储罐区'" },
    work_time: { maxDuration: 8, unit: 'hour' },
    fire_extinguishers: {
      special: { min: 6 }, level1: { min: 4 }, level2: { min: 2 }
    }
  },
  roleViewConfig: {
    applicant: { defaultView: 'edit', hiddenFields: ['gas_detection_records', 'approval_comments'] },
    worker: { defaultView: 'confirm', visibleFields: ['basic_info', 'safety_measures', 'signature'] },
    supervisor: { defaultView: 'verify', editableFields: ['gas_detection_records', 'photos', 'signature'] },
    reviewer: { defaultView: 'review', editableFields: ['review_comments'] },
    approver: { defaultView: 'approve', editableFields: ['approval_comments', 'signature'] },
    admin: { defaultView: 'full', allEditable: true }
  }
}
```

## 4. 动态表单渲染器

> 详细设计见 [01-FormRenderer-动态表单渲染器.md](./组件/01-FormRenderer-动态表单渲染器.md)

核心流程：加载元数据 → 计算字段权限（role + status） → 渲染卡片和字段 → 处理字段联动 → 控制可见性和可编辑性。

## 5. 通用组件设计

> 每个组件的详细设计（Props/Events 接口、视觉规格、交互行为）已拆分为独立文件，见 [`组件/`](./组件/) 目录。

| 组件 | 用途 | 详细文档 |
|------|------|---------|
| FormRenderer | 动态表单渲染（元数据驱动 + 权限控制） | [01-FormRenderer](./组件/01-FormRenderer-动态表单渲染器.md) |
| ActionBlock | 动作块（角色+状态动态渲染操作按钮） | [02-ActionBlock](./组件/02-ActionBlock-动作块.md) |
| Signature | 电子签名（Canvas API，鼠标/触摸） | [03-Signature](./组件/03-Signature-电子签名.md) |
| PhotoUpload | 照片上传（拍照/相册，水印，压缩） | [04-PhotoUpload](./组件/04-PhotoUpload-照片上传.md) |
| GasDetection | 气体检测录入（标准值对比，超标报警） | [05-GasDetection](./组件/05-GasDetection-气体检测.md) |
| EmergencyStop | 紧急叫停（红色大按钮，fixed 底部） | [06-EmergencyStop](./组件/06-EmergencyStop-紧急叫停.md) |
| StatusTag | 状态标签（颜色编码，9 种状态） | [07-StatusTag](./组件/07-StatusTag-状态标签.md) |
| Timeline | 审批时间轴（已完成/进行中/待处理三态） | [08-Timeline](./组件/08-Timeline-审批时间轴.md) |
| GeoFence | 地理围栏模拟（约束卡点） | [09-GeoFence](./组件/09-GeoFence-地理围栏.md) |
| RoleSwitcher | 角色切换（6 角色下拉菜单） | [10-RoleSwitcher](./组件/10-RoleSwitcher-角色切换.md) |
| MonitorPanel | 监护面板（执行状态条件渲染） | [11-MonitorPanel](./组件/11-MonitorPanel-监护面板.md) |
| SafetyChecklist | 安全措施清单（强制按序确认） | [12-SafetyChecklist](./组件/12-SafetyChecklist-安全措施清单.md) |
| RiskSummary | 风险摘要卡片（审批人风险前置） | [13-RiskSummary](./组件/13-RiskSummary-风险摘要卡片.md) |

## 6. 路由设计（统一入口）

> **核心理念**: 路由按功能模块组织，不按角色拆分。所有角色共享同一套路由，权限差异在页面内部通过 `roleViewConfig` 运行时计算。

```typescript
const routes = [
  { path: '/login', component: Login },
  // 统一业务页面（所有角色共享）
  { path: '/', component: Home },                  // 首页 - 待办中心（按角色过滤数据）
  { path: '/permit/new', component: Create },       // 新建作业票（仅负责人/管理员可见）
  { path: '/permit/:id', component: Detail },       // 作业票详情（核心页面，权限驱动）
  // 系统管理后台（仅管理员可见 — 唯一的角色专属功能模块）
  { path: '/admin', component: AdminLayout, meta: { role: 'admin' }, children: [
    { path: '', component: AdminOverview },           // 系统概览仪表盘
    { path: 'template', component: TemplateEditor },  // 模板配置器
    { path: 'workflow', component: WorkflowDesigner }, // 工作流设计器
    { path: 'permission', component: PermissionMatrix }, // 权限矩阵编辑器
    { path: 'analytics', component: Analytics },      // 数据分析
    { path: 'audit', component: AuditLog },           // 审计日志
  ]},
]
```

**说明**: 与第 2 节的路由设计一致。角色差异不体现在路由层面，而是在 `Detail.vue` 内部根据 `role + status` 动态渲染字段和操作按钮。
