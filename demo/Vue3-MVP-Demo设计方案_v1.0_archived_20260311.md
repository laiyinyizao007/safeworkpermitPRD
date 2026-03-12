# Vue 3 MVP Demo 设计方案

> **重要说明**: 本文档为设计方案文档,用于与设计师和程序员沟通需求,不包含实际代码实现。

## 项目背景

基于现有的作业票系统 PRD 文档,设计一个 Vue 3 的 MVP Demo 方案,用于与设计师和程序员沟通产品需求。Demo 将展示核心用户流程和关键功能,使用 Mock 数据,不需要真实后端。

## 核心目标

1. **可视化展示**:通过可交互的原型展示系统核心功能
2. **用户流程验证**:验证 3 个核心角色的完整操作流程
3. **沟通工具**:作为与设计师、程序员沟通的可视化工具
4. **快速迭代**:支持快速调整和演示

## 角色切换机制设计(已确认方案)

### 采用方案: 顶部快速切换

**设计思路**:
- 首页右上角显示当前角色(头像 + 姓名)
- 点击头像弹出下拉菜单
- 菜单中直接列出 3 个角色,点击即可切换
- 切换后自动刷新页面,进入对应角色的首页

**交互流程**:
```
┌─────────────────────────────────┐
│  作业票系统        [张工 ▼]     │  ← 点击头像
└─────────────────────────────────┘
                      ↓
              ┌─────────────────┐
              │ 当前: 张工       │
              │ 作业申请人       │
              ├─────────────────┤
              │ 切换角色:        │
              │ → 李主任(审批人) │
              │ → 王师傅(监护人) │
              ├─────────────────┤
              │ 退出登录         │
              └─────────────────┘
```

**页面布局示例**:
```
┌─────────────────────────────────────┐
│ 作业票系统    [🔔3]  [👷 张工 ▼]   │
├─────────────────────────────────────┤
│                                      │
│  待办事项 (5)                        │
│  ┌──────────┐ ┌──────────┐         │
│  │ 待审批 3 │ │ 待监护 2 │         │
│  └──────────┘ └──────────┘         │
│                                      │
│  快速入口                            │
│  [动火] [受限空间] [高处] [吊装]    │
│                                      │
└─────────────────────────────────────┘
```

**切换后的状态变化**:

| 切换前 | 切换后 | 页面变化 |
|--------|--------|----------|
| 张工(作业申请人) | 李主任(审批人) | 首页显示"待审批列表",快速入口隐藏 |
| 李主任(审批人) | 王师傅(监护人) | 首页显示"监护任务列表",快速入口隐藏 |
| 王师傅(监护人) | 张工(作业申请人) | 首页显示"我的作业",快速入口显示 |

**优势**:
1. ✅ 演示过程中可快速切换,无需返回登录页
2. ✅ 始终显示当前角色,避免混淆
3. ✅ 操作简单,符合用户习惯
4. ✅ 适合多次演示和客户体验

## Demo 范围界定

### 包含功能(In-Scope)

**核心流程**:
- ✅ 作业申请流程(动火作业为主)
- ✅ 审批流程(多级审批)
- ✅ 现场监护流程
- ✅ 作业状态查看

**关键页面**:
- ✅ 登录页(角色切换)
- ✅ 首页(待办事项、快速入口)
- ✅ 作业申请表单(动火作业)
- ✅ 审批页面(审批详情、电子签名)
- ✅ 监护页面(实时监控、异常上报)
- ✅ 作业列表(状态筛选、详情查看)

**元数据驱动表单展示**:
- ✅ 动态表单渲染(基于配置)
- ✅ 字段联动(条件显示/隐藏)
- ✅ 状态驱动 UI 变化(Draft/Verify/Executing/Closed)

### 不包含功能(Out-of-Scope)

- ❌ 真实后端 API 调用
- ❌ 数据库持久化
- ❌ 完整的 8 大作业类型(仅展示动火作业)
- ❌ 系统配置管理
- ❌ 统计报表
- ❌ IoT 设备集成
- ❌ SIMOPs 冲突检测算法实现

## 用户角色与流程设计

### 角色 1: 作业申请人(张工)

**用户画像**:
- 35岁,化工企业维修班组长
- 需要快速申请作业,实时查看审批进度

**核心流程**:
```
登录 → 首页 → 新建作业 → 选择作业类型(动火) → 填写基本信息
→ JSA 风险分析 → 上传现场照片 → 提交审批 → 查看审批进度
```

**关键页面**:
1. **首页**: 显示待办事项、快速入口、我的作业
2. **作业申请表单**: 分步填写(4步)
   - Step 1: 基础信息(作业区域、动火方式、作业时间)
   - Step 2: 人员信息(作业人员、监护人)
   - Step 3: 安全措施(灭火器、气体检测、警戒区域)
   - Step 4: 现场照片(至少3张)
3. **审批进度页**: 时间轴展示审批流程

### 角色 2: 审批人(李主任)

**用户画像**:
- 45岁,生产车间主任
- 需要快速审批,系统自动识别风险点

**核心流程**:
```
登录 → 首页(待审批列表) → 查看作业详情 → 查看风险分析
→ 查看现场照片 → 填写审批意见 → 电子签名 → 提交审批
```

**关键页面**:
1. **待审批列表**: 显示待审批作业票,按紧急程度排序
2. **审批详情页**:
   - 作业票基本信息(卡片展示)
   - 风险分析结果(高亮显示高风险)
   - 现场照片(轮播图)
   - 审批历史(时间轴)
   - 系统风险提示(红色警告框)
3. **审批操作区**:
   - 审批意见(同意/不同意)
   - 常用意见快捷选择
   - 电子签名(手写签名)

### 角色 3: 监护人(王师傅)

**用户画像**:
- 40岁,专职监护人
- 需要实时监控作业状态,发现异常立即上报

**核心流程**:
```
登录 → 首页(监护任务列表) → 到达现场签到 → 确认安全措施
→ 实时监控(气体浓度、作业时间) → 发现异常上报 → 作业完成验收
```

**关键页面**:
1. **监护任务列表**: 显示今日监护任务
2. **现场签到页**: 扫码或定位签到
3. **实时监控页**:
   - 气体浓度实时显示(模拟数据)
   - 作业时间倒计时
   - 异常上报按钮(一键拍照上报)
4. **完成验收页**: 检查清单逐项确认

## 技术架构

### 前端技术栈

- **框架**: Vue 3.4 + TypeScript
- **UI 组件库**: Element Plus 2.5
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **构建工具**: Vite 5
- **移动端适配**: Viewport + Flexible
- **图表**: ECharts 5.4(可选,用于首页数据展示)

### 项目结构

```
vue3-ptw-demo/
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 通用组件
│   │   ├── FormRenderer/  # 动态表单渲染器
│   │   ├── Signature/     # 电子签名组件
│   │   └── PhotoUpload/   # 照片上传组件
│   ├── views/           # 页面组件
│   │   ├── Login.vue
│   │   ├── Home.vue
│   │   ├── WorkPermit/
│   │   │   ├── Apply.vue      # 作业申请
│   │   │   ├── Approve.vue    # 审批页面
│   │   │   ├── Monitor.vue    # 监护页面
│   │   │   └── List.vue       # 作业列表
│   ├── mock/            # Mock 数据
│   │   ├── users.ts
│   │   ├── workPermits.ts
│   │   └── formMetadata.ts  # 元数据配置
│   ├── router/          # 路由配置
│   ├── stores/          # Pinia 状态管理
│   ├── types/           # TypeScript 类型定义
│   └── utils/           # 工具函数
├── public/
└── package.json
```

## Mock 数据设计

### 用户数据(users.ts)

```typescript
// 3 个角色的模拟用户
- 张工(作业申请人)
- 李主任(审批人)
- 王师傅(监护人)
```

### 作业票数据(workPermits.ts)

```typescript
// 不同状态的作业票
- Draft(草稿)
- Pending(待审批)
- Approved(已批准)
- Executing(进行中)
- Completed(已完成)
```

### 表单元数据(formMetadata.ts)

```typescript
// 动火作业票元数据配置
{
  formSchema: {}, // 字段定义
  layoutConfig: {}, // 布局配置
  constraintRules: {}, // 约束规则
  roleViewConfig: {} // 角色视图配置
}
```

## 实施建议(供程序员参考)

### 技术栈建议

- **框架**: Vue 3.4 + TypeScript
- **UI 组件库**: Element Plus 2.5
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **构建工具**: Vite 5
- **移动端适配**: Viewport + Flexible

### 开发阶段建议

**Phase 1: 项目初始化**
- 创建 Vue 3 + Vite 项目
- 安装依赖(Element Plus, Vue Router, Pinia)
- 配置 TypeScript
- 配置移动端适配
- 创建项目目录结构

**Phase 2: Mock 数据准备**
- 编写用户 Mock 数据
- 编写作业票 Mock 数据
- 编写表单元数据配置
- 创建 Mock API 服务

**Phase 3: 通用组件开发**
- 动态表单渲染器(FormRenderer)
- 电子签名组件(Signature)
- 照片上传组件(PhotoUpload)
- 状态标签组件(StatusTag)
- 时间轴组件(Timeline)

**Phase 4: 核心页面开发**
- 首页(待办事项、快速入口、角色切换)
- 作业申请页(分步表单)
- 审批页面(详情展示、审批操作)
- 监护页面(实时监控、异常上报)
- 作业列表页(状态筛选、详情查看)

**Phase 5: 用户流程串联**
- 完整流程测试(申请→审批→监护→完成)
- 状态流转逻辑
- 页面跳转优化

**Phase 6: UI/UX 优化**
- 移动端适配优化
- 交互动画
- 加载状态
- 错误提示

**Phase 7: Demo 演示准备**
- 准备演示脚本
- 准备演示数据
- 部署到演示环境

## 关键文件清单

### 需要创建的文件

1. **组件文件**:
   - `src/components/FormRenderer/index.vue` - 动态表单渲染器
   - `src/components/Signature/index.vue` - 电子签名组件
   - `src/components/PhotoUpload/index.vue` - 照片上传组件

2. **页面文件**:
   - `src/views/Login.vue` - 登录页
   - `src/views/Home.vue` - 首页
   - `src/views/WorkPermit/Apply.vue` - 作业申请
   - `src/views/WorkPermit/Approve.vue` - 审批页面
   - `src/views/WorkPermit/Monitor.vue` - 监护页面
   - `src/views/WorkPermit/List.vue` - 作业列表

3. **Mock 数据文件**:
   - `src/mock/users.ts` - 用户数据
   - `src/mock/workPermits.ts` - 作业票数据
   - `src/mock/formMetadata.ts` - 表单元数据

4. **类型定义文件**:
   - `src/types/user.ts` - 用户类型
   - `src/types/workPermit.ts` - 作业票类型
   - `src/types/formMetadata.ts` - 表单元数据类型

## 验收标准

### 功能验收

- 3 个角色可以通过顶部下拉菜单正常切换
- 作业申请流程完整可演示
- 审批流程完整可演示
- 监护流程完整可演示
- 状态流转逻辑清晰
- 动态表单渲染正确

### 体验验收

- 移动端适配良好
- 交互流畅,无卡顿
- 加载状态清晰
- 错误提示友好
- 视觉风格统一

### 演示验收

- 可以完整演示 3 个角色的核心流程
- 演示数据准备充分
- 演示脚本清晰
- 角色切换流畅自然

---

## 文档使用说明

本设计方案文档包含:

1. **角色切换机制设计** - 已确认采用方案 2(顶部快速切换)
2. **3 个完整的用户流程设计** - 包含流程图和关键交互点
3. **详细的 Demo PRD 文档** - 包含 5 大核心功能详细说明
4. **Mock 数据结构设计** - 用户数据、作业票数据、表单元数据
5. **UI/UX 设计规范** - 颜色、字体、间距、移动端适配
6. **技术实现思路** - 供程序员参考的实现建议

**使用方式**:
- 与设计师沟通: 重点查看"用户流程设计"和"UI/UX 设计规范"章节
- 与程序员沟通: 重点查看"Mock 数据设计"和"技术实现细节"章节
- 客户演示: 重点查看"Demo PRD 文档"和"用户流程设计"章节

**文档位置**: `C:\Users\laiyi\.claude\plans\moonlit-percolating-knuth.md`

## 风险与应对建议

### 风险 1: 动态表单渲染复杂度高

**应对建议**:
- 先实现基础组件(文本、数字、日期、选择器)
- 复杂组件(签名、照片上传)单独封装
- 使用 Element Plus 现成组件降低开发难度

### 风险 2: 移动端适配工作量大

**应对建议**:
- 使用 Viewport + Flexible 方案
- 优先适配主流屏幕尺寸(375px, 414px)
- 使用 Element Plus 的响应式组件

### 风险 3: 演示数据准备不充分

**应对建议**:
- 提前准备 3 个角色的完整演示数据
- 准备不同状态的作业票数据(草稿、待审批、进行中、已完成)
- 准备演示脚本,确保流程顺畅

## 详细用户流程设计

### 流程 1: 作业申请完整流程(张工)

```mermaid
flowchart TD
    Start[打开 App] --> Login[登录<br/>选择角色:作业申请人]
    Login --> Home[首页<br/>显示待办事项、快速入口]
    Home --> SelectType[点击"动火作业"卡片]
    SelectType --> Step1[Step 1: 基础信息<br/>- 作业区域:储罐区<br/>- 动火方式:电焊<br/>- 作业时间:2026-03-10 08:00-18:00]
    Step1 --> Step2[Step 2: 人员信息<br/>- 作业人员:张三、李四<br/>- 监护人:王师傅系统推荐]
    Step2 --> Step3[Step 3: 安全措施<br/>- 灭火器:2具<br/>- 气体检测:已完成<br/>- 警戒区域:已设置]
    Step3 --> Step4[Step 4: 现场照片<br/>- 拍照上传3张<br/>- 系统自动压缩]
    Step4 --> Review[预览作业票<br/>检查信息完整性]
    Review --> Submit[提交审批]
    Submit --> Success[提交成功<br/>显示审批进度]
    Success --> Track[查看审批进度<br/>时间轴展示]
```

**关键交互点**:
1. **首页快速入口**: 8 大作业类型卡片,点击进入对应申请流程
2. **分步表单**: 进度条显示当前步骤(1/4, 2/4, 3/4, 4/4)
3. **智能推荐**: 监护人自动推荐(基于资质和可用性)
4. **实时校验**: 必填项未填写时,"下一步"按钮置灰
5. **照片上传**: 支持拍照和相册选择,最多 9 张,自动压缩
6. **提交反馈**: 提交成功后显示 Toast 提示,自动跳转到审批进度页

### 流程 2: 审批完整流程(李主任)

```mermaid
flowchart TD
    Start[打开 App] --> Login[登录<br/>选择角色:审批人]
    Login --> Home[首页<br/>显示待审批列表3条]
    Home --> SelectTicket[点击作业票#001<br/>动火作业 | 张工申请]
    SelectTicket --> ViewDetail[查看作业详情<br/>- 基本信息卡片<br/>- 风险分析结果<br/>- 现场照片轮播]
    ViewDetail --> CheckRisk[系统风险提示<br/>⚠️ 该区域有2个进行中作业]
    CheckRisk --> ViewHistory[查看审批历史<br/>时间轴展示]
    ViewHistory --> Decision{审批决策}
    Decision -->|同意| Approve[填写审批意见<br/>- 选择"符合要求"<br/>- 手写签名]
    Decision -->|不同意| Reject[填写审批意见<br/>- 选择"需补充材料"<br/>- 说明原因]
    Approve --> SubmitApprove[提交审批]
    Reject --> SubmitReject[提交审批]
    SubmitApprove --> Success[审批成功<br/>自动通知申请人]
    SubmitReject --> Success
    Success --> BackHome[返回首页<br/>待审批列表更新]
```

**关键交互点**:
1. **待审批列表**: 按紧急程度排序,显示作业类型、申请人、申请时间
2. **作业详情**: 卡片式展示,关键信息突出显示
3. **风险提示**: 红色警告框,显示 SIMOPs 冲突、资质过期等
4. **审批历史**: 时间轴展示,显示已审批节点和待审批节点
5. **常用意见**: 快捷选择(符合要求、需补充材料、不符合安全要求)
6. **电子签名**: 手写签名板,支持重写和清除
7. **提交反馈**: 审批成功后自动通知申请人(模拟推送)

### 流程 3: 监护完整流程(王师傅)

```mermaid
flowchart TD
    Start[打开 App] --> Login[登录<br/>选择角色:监护人]
    Login --> Home[首页<br/>显示今日监护任务2条]
    Home --> SelectTask[点击监护任务<br/>动火作业#001 | 08:00开始]
    SelectTask --> CheckIn[到达现场签到<br/>- 扫码签到<br/>- 定位验证]
    CheckIn --> ConfirmSafety[确认安全措施<br/>- 灭火器到位✓<br/>- 警戒区域设置✓<br/>- 气体检测合格✓]
    ConfirmSafety --> StartMonitor[开始监护<br/>进入实时监控页面]
    StartMonitor --> Monitor[实时监控<br/>- 气体浓度:5.2% LEL<br/>- 作业时间:已进行2小时<br/>- 监护人在岗✓]
    Monitor --> CheckAbnormal{发现异常?}
    CheckAbnormal -->|是| ReportAbnormal[异常上报<br/>- 一键拍照<br/>- 自动定位<br/>- 填写描述]
    CheckAbnormal -->|否| Continue[继续监护]
    ReportAbnormal --> Alert[系统告警<br/>通知安全管理员]
    Alert --> Continue
    Continue --> CheckComplete{作业完成?}
    CheckComplete -->|否| Monitor
    CheckComplete -->|是| Verify[完成验收<br/>- 现场清理✓<br/>- 设备归位✓<br/>- 无遗留隐患✓]
    Verify --> Sign[签字确认]
    Sign --> Complete[监护完成<br/>作业票状态更新]
```

**关键交互点**:
1. **监护任务列表**: 显示今日任务,按时间排序
2. **现场签到**: 扫码或定位签到,防止脱岗
3. **安全措施确认**: 检查清单逐项确认
4. **实时监控**: 气体浓度实时显示(模拟数据),作业时间倒计时
5. **异常上报**: 一键拍照上报,自动定位,填写描述
6. **完成验收**: 检查清单逐项确认
7. **签字确认**: 手写签名

## Demo PRD 文档

### 产品名称

作业票系统 Vue 3 MVP Demo

### 产品定位

一个可交互的原型 Demo,用于展示作业票系统的核心功能和用户流程,作为与设计师、程序员沟通的可视化工具。

### 目标用户

- **产品经理**: 验证产品需求和用户流程
- **设计师**: 理解交互逻辑和视觉风格
- **程序员**: 理解技术实现和数据结构
- **客户**: 演示产品核心功能

### 核心功能

#### 1. 角色切换登录

**功能描述**: 支持 3 个角色快速切换登录,无需真实账号密码。

**交互设计**:
- 登录页显示 3 个角色卡片(作业申请人、审批人、监护人)
- 点击卡片直接登录,进入对应角色的首页
- 首页右上角显示当前角色,支持退出登录

**Mock 数据**:
```typescript
const users = [
  { id: 1, name: '张工', role: 'applicant', avatar: '/avatars/zhang.jpg' },
  { id: 2, name: '李主任', role: 'approver', avatar: '/avatars/li.jpg' },
  { id: 3, name: '王师傅', role: 'monitor', avatar: '/avatars/wang.jpg' }
]
```

#### 2. 作业申请(动火作业)

**功能描述**: 分步填写动火作业申请表单,支持字段联动和实时校验。

**表单结构**:

**Step 1: 基础信息**
- 作业区域(下拉选择): 储罐区、装置区、办公区
- 动火方式(单选): 电焊、气焊、气割、其他
- 作业时间(日期时间选择器): 开始时间、结束时间
- 作业内容(文本域): 描述作业内容

**Step 2: 人员信息**
- 作业人员(多选): 从人员列表选择,需持证
- 监护人(单选): 系统推荐,需持证

**Step 3: 安全措施**
- 灭火器数量(数字输入): ≥2 具
- 气体检测(复选框): 可燃气体、氧气、有毒气体
- 警戒区域(复选框): 已设置
- 可燃物清理(复选框): 已清理

**Step 4: 现场照片**
- 照片上传(图片上传): 至少 3 张,最多 9 张
- 支持拍照和相册选择
- 自动压缩

**字段联动规则**:
- 作业区域选择"储罐区"时,动火方式自动限制为"电焊"
- 气体检测未勾选时,显示警告提示
- 照片数量 < 3 时,"提交"按钮置灰

**状态流转**:
- Draft(草稿): 可编辑,可保存草稿
- Pending(待审批): 已提交,不可编辑
- Approved(已批准): 审批通过,可查看
- Rejected(已拒绝): 审批拒绝,可修改重新提交

#### 3. 审批流程

**功能描述**: 查看作业票详情,填写审批意见,电子签名,提交审批。

**页面结构**:

**作业票详情**:
- 基本信息卡片: 作业类型、申请人、申请时间、作业区域
- 人员信息卡片: 作业人员、监护人
- 安全措施卡片: 灭火器、气体检测、警戒区域
- 现场照片: 轮播图展示

**风险提示**:
- SIMOPs 冲突: 该区域有 2 个进行中作业
- 资质过期: 作业人员李四的焊工证将于 7 天后过期
- 天气预警: 明日有雨,建议调整作业时间

**审批历史**:
- 时间轴展示: 已审批节点(绿色)、当前节点(橙色)、待审批节点(灰色)
- 显示审批人、审批时间、审批意见

**审批操作**:
- 审批意见(单选): 同意、不同意
- 常用意见(快捷选择): 符合要求、需补充材料、不符合安全要求
- 自定义意见(文本域): 填写详细意见
- 电子签名(手写签名板): 手写签名,支持重写和清除

**提交反馈**:
- 审批成功: 显示 Toast 提示,自动通知申请人(模拟推送)
- 审批失败: 显示错误提示

#### 4. 现场监护

**功能描述**: 现场签到,实时监控,异常上报,完成验收。

**页面结构**:

**现场签到**:
- 扫码签到: 扫描现场设备码(模拟)
- 定位验证: 显示当前位置,验证是否在作业区域内

**实时监控**:
- 气体浓度: 实时显示(模拟数据),超标时红色警告
- 作业时间: 倒计时显示,超时提醒
- 监护人状态: 在岗/脱岗

**异常上报**:
- 一键拍照: 拍照上传
- 自动定位: 显示当前位置
- 填写描述: 文本域填写异常描述
- 提交上报: 自动通知安全管理员(模拟推送)

**完成验收**:
- 检查清单: 现场清理、设备归位、无遗留隐患
- 签字确认: 手写签名

#### 5. 作业列表

**功能描述**: 查看所有作业票,支持状态筛选和详情查看。

**页面结构**:

**筛选条件**:
- 状态筛选: 全部、草稿、待审批、已批准、进行中、已完成
- 时间筛选: 今日、本周、本月、自定义

**列表展示**:
- 作业票卡片: 显示作业类型、申请人、申请时间、状态
- 状态标签: 不同颜色标识不同状态
- 点击卡片: 进入详情页

**详情页**:
- 显示作业票完整信息
- 显示审批历史
- 显示监护记录(如有)

### 元数据驱动表单展示

#### 表单元数据配置

**formSchema(字段定义)**:
```json
{
  "work_zone": {
    "type": "select",
    "label": "作业区域",
    "required": true,
    "options": ["储罐区", "装置区", "办公区"]
  },
  "work_method": {
    "type": "radio",
    "label": "动火方式",
    "required": true,
    "options": ["电焊", "气焊", "气割", "其他"]
  },
  "fire_extinguishers": {
    "type": "number",
    "label": "灭火器数量",
    "required": true,
    "min": 2
  }
}
```

**layoutConfig(布局配置)**:
```json
{
  "cards": [
    {
      "title": "基础信息",
      "fields": ["work_zone", "work_method", "work_time"]
    },
    {
      "title": "安全措施",
      "fields": ["fire_extinguishers", "gas_detection"]
    }
  ]
}
```

**constraintRules(约束规则)**:
```json
{
  "work_method": {
    "visibleIf": "data.work_zone == '储罐区'",
    "options": ["电焊"]
  },
  "gas_detection": {
    "requiredIf": "data.work_zone == '储罐区'"
  }
}
```

#### 动态表单渲染器

**核心功能**:
- 根据元数据配置动态生成表单
- 支持字段联动(条件显示/隐藏)
- 支持实时校验
- 支持状态驱动 UI 变化

**实现思路**:
```vue
<template>
  <el-form :model="formData" :rules="rules">
    <el-card v-for="card in layoutConfig.cards" :key="card.title">
      <template #header>{{ card.title }}</template>
      <el-form-item
        v-for="field in card.fields"
        :key="field"
        :label="formSchema[field].label"
        :prop="field"
        v-show="isFieldVisible(field)"
      >
        <component
          :is="getFieldComponent(field)"
          v-model="formData[field]"
          v-bind="getFieldProps(field)"
        />
      </el-form-item>
    </el-card>
  </el-form>
</template>
```

### UI/UX 设计规范

#### 颜色规范

- **主色**: #409EFF(Element Plus 默认蓝色)
- **成功**: #67C23A(绿色)
- **警告**: #E6A23C(橙色)
- **危险**: #F56C6C(红色)
- **信息**: #909399(灰色)

#### 状态颜色

- **Draft(草稿)**: #909399(灰色)
- **Pending(待审批)**: #E6A23C(橙色)
- **Approved(已批准)**: #67C23A(绿色)
- **Executing(进行中)**: #409EFF(蓝色)
- **Completed(已完成)**: #67C23A(绿色)
- **Rejected(已拒绝)**: #F56C6C(红色)

#### 字体规范

- **标题**: 18px, 加粗
- **正文**: 14px, 常规
- **辅助文字**: 12px, 浅灰色

#### 间距规范

- **卡片间距**: 16px
- **表单项间距**: 16px
- **按钮间距**: 12px

#### 移动端适配

- **设计稿**: 375px(iPhone X)
- **适配方案**: Viewport + Flexible
- **断点**: <768px(手机), 768px-1024px(平板), >1024px(PC)

### 技术实现细节

#### 动态表单渲染器

**核心逻辑**:
1. 加载元数据配置(formSchema, layoutConfig, constraintRules)
2. 根据 layoutConfig 生成卡片和字段
3. 根据 formSchema 生成表单项和校验规则
4. 根据 constraintRules 处理字段联动
5. 根据当前状态控制字段权限

**字段联动实现**:
```typescript
// 判断字段是否可见
const isFieldVisible = (fieldKey: string) => {
  const rule = constraintRules[fieldKey]?.visibleIf
  if (!rule) return true
  return evalExpression(rule, formData)
}

// 表达式求值(简化版)
const evalExpression = (expr: string, data: any) => {
  // 例如: "data.work_zone == '储罐区'"
  return new Function('data', `return ${expr}`)(data)
}
```

#### 电子签名组件

**实现思路**:
- 使用 Canvas API 实现手写签名
- 支持鼠标和触摸事件
- 支持重写和清除
- 导出为 Base64 图片

**核心代码**:
```typescript
const canvas = ref<HTMLCanvasElement>()
const ctx = ref<CanvasRenderingContext2D>()
let isDrawing = false

const startDrawing = (e: MouseEvent | TouchEvent) => {
  isDrawing = true
  const { x, y } = getPosition(e)
  ctx.value?.beginPath()
  ctx.value?.moveTo(x, y)
}

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing) return
  const { x, y } = getPosition(e)
  ctx.value?.lineTo(x, y)
  ctx.value?.stroke()
}

const stopDrawing = () => {
  isDrawing = false
}

const clear = () => {
  ctx.value?.clearRect(0, 0, canvas.value!.width, canvas.value!.height)
}

const getBase64 = () => {
  return canvas.value?.toDataURL('image/png')
}
```

#### 照片上传组件

**实现思路**:
- 使用 Element Plus 的 Upload 组件
- 支持拍照和相册选择
- 自动压缩(使用 Canvas API)
- 限制数量(3-9 张)

**核心代码**:
```typescript
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        // 压缩到最大宽度 800px
        const maxWidth = 800
        const scale = maxWidth / img.width
        canvas.width = maxWidth
        canvas.height = img.height * scale

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8)
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}
```

### Mock 数据详细设计

#### 用户数据(users.ts)

```typescript
export const users = [
  {
    id: 1,
    name: '张工',
    role: 'applicant',
    avatar: '/avatars/zhang.jpg',
    department: '维修班组',
    position: '班组长',
    phone: '13800138001'
  },
  {
    id: 2,
    name: '李主任',
    role: 'approver',
    avatar: '/avatars/li.jpg',
    department: '生产车间',
    position: '车间主任',
    phone: '13800138002'
  },
  {
    id: 3,
    name: '王师傅',
    role: 'monitor',
    avatar: '/avatars/wang.jpg',
    department: '安全科',
    position: '专职监护人',
    phone: '13800138003'
  }
]
```

#### 作业票数据(workPermits.ts)

```typescript
export const workPermits = [
  {
    id: 'WP001',
    type: 'hotWork',
    typeName: '动火作业',
    applicant: { id: 1, name: '张工' },
    status: 'pending',
    statusName: '待审批',
    applyTime: '2026-03-10 08:00:00',
    workZone: '储罐区',
    workMethod: '电焊',
    workTime: {
      start: '2026-03-10 08:00:00',
      end: '2026-03-10 18:00:00'
    },
    workers: [
      { id: 1, name: '张三', certified: true },
      { id: 2, name: '李四', certified: true }
    ],
    supervisor: { id: 3, name: '王师傅', certified: true },
    safetyMeasures: {
      fireExtinguishers: 2,
      gasDetection: true,
      warningArea: true,
      combustibleCleared: true
    },
    photos: [
      '/photos/site1.jpg',
      '/photos/site2.jpg',
      '/photos/site3.jpg'
    ],
    approvalHistory: [
      {
        approver: { id: 2, name: '李主任' },
        status: 'pending',
        time: null,
        opinion: null,
        signature: null
      }
    ]
  }
]
```

#### 表单元数据(formMetadata.ts)

```typescript
export const hotWorkMetadata = {
  formSchema: {
    work_zone: {
      type: 'select',
      label: '作业区域',
      required: true,
      options: ['储罐区', '装置区', '办公区']
    },
    work_method: {
      type: 'radio',
      label: '动火方式',
      required: true,
      options: ['电焊', '气焊', '气割', '其他']
    },
    work_time: {
      type: 'datetimerange',
      label: '作业时间',
      required: true
    },
    workers: {
      type: 'userselect',
      label: '作业人员',
      required: true,
      multiple: true,
      certificateRequired: true
    },
    supervisor: {
      type: 'userselect',
      label: '监护人',
      required: true,
      certificateRequired: true
    },
    fire_extinguishers: {
      type: 'number',
      label: '灭火器数量',
      required: true,
      min: 2,
      unit: '具'
    },
    gas_detection: {
      type: 'checkbox',
      label: '气体检测',
      required: true
    },
    warning_area: {
      type: 'checkbox',
      label: '警戒区域',
      required: true
    },
    combustible_cleared: {
      type: 'checkbox',
      label: '可燃物清理',
      required: true
    },
    site_photos: {
      type: 'imageupload',
      label: '现场照片',
      required: true,
      minCount: 3,
      maxCount: 9
    }
  },
  layoutConfig: {
    cards: [
      {
        title: '基础信息',
        fields: ['work_zone', 'work_method', 'work_time']
      },
      {
        title: '人员信息',
        fields: ['workers', 'supervisor']
      },
      {
        title: '安全措施',
        fields: ['fire_extinguishers', 'gas_detection', 'warning_area', 'combustible_cleared']
      },
      {
        title: '现场照片',
        fields: ['site_photos']
      }
    ]
  },
  constraintRules: {
    work_method: {
      visibleIf: "data.work_zone == '储罐区'",
      options: ['电焊']
    },
    gas_detection: {
      requiredIf: "data.work_zone == '储罐区'"
    }
  }
}
```

## 下一步行动

1. 与用户确认 Demo 范围和优先级
2. 确认技术栈选型
3. 开始 Phase 1: 项目初始化
