# 13 - RiskSummary 风险摘要卡片

> **组件路径**: `components/RiskSummary/` | **使用页面**: 详情页 | **技术要点**: 审批人风险前置, 置顶展示
> **关联**: [03-统一界面设计.md](../03-统一界面设计.md) §6.4 / [16-ExpertConsensusPanel.md](./16-ExpertConsensusPanel-多专家共识面板.md)
> **AI 集成**: Multi-Expert Agent（多专家共识评估，嵌入展示）

---

## 1. 组件定位

审批人专属的风险摘要卡片。在审批状态下置顶展示，聚合风险等级、审核结论、自动校验结果和高风险项，帮助审批人快速决策。

## 2. Props / Events 接口

```typescript
interface RiskSummaryProps {
  permit: WorkPermit
  reviewResult?: {
    reviewer: string
    passed: boolean
    comment: string
  }
  validationResult?: {
    items: { label: string, passed: boolean, detail?: string }[]
  }
  jsaRisks?: JsaRisk[]
}
```

## 3. 视觉规格

```text
┌─ 风险摘要 ───────────────────────────────┐
│ 🔴 风险等级: 一级动火                     │
│ ✅ 安全审核: 赵六 已通过                  │
│ ✅ 自动校验: 全部合规                     │
│ ⚠️ 高风险项: 2个                          │
│   - 可燃气体泄漏风险                      │
│   - 火花引燃周边可燃物                    │
│                                           │
│ ┌─ 🤖 多专家共识评估 ─────────────────┐  │
│ │ 🧑‍🔬 安全工程师    🧑‍🏭 工艺专家    🧑‍⚖️ 法规顾问 │  │
│ │ 风险: 中高       风险: 中         风险: 中高  │  │
│ │ 关注: 储罐区     关注: 工艺流程   关注: GB30871│  │
│ │ 泄漏扩散风险     温控措施充分     §5.3 合规    │  │
│ │                                          │  │
│ │ 📋 共识结论: 风险可控，建议增加监测频率  │  │
│ │ 综合评分: 76/100  置信度: 87%            │  │
│ └──────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

- 背景：浅黄色 `#FFF8E1`（警示色）
- 边框：左侧 4px 橙色竖线
- 风险等级：红色加粗
- 合规项：绿色 ✅
- 高风险项：橙色 ⚠️ 列表
- 多专家共识区域：浅蓝色背景 `#E3F2FD`，三列等宽布局

## 4. 交互行为

- 纯展示组件
- 高风险项可点击展开详细描述
- 审核结论可点击查看完整审核意见

### 🤖 多专家共识评估（Multi-Expert Agent）

当作业票处于 Approved 状态时，RiskSummary 内嵌 ExpertConsensusPanel 组件，展示 Multi-Expert Agent 的三角色独立评估结果：

**三个专家角色**：

| 角色 | 评估维度 | 关注重点 |
|------|---------|---------|
| 安全工程师 | 现场安全风险 | 泄漏扩散、火灾爆炸、人员伤害 |
| 工艺专家 | 工艺流程合理性 | 温控措施、压力管控、物料相容性 |
| 法规顾问 | 法规合规性 | GB 30871、AQ 3064.1、地方法规 |

**交互**：
- 默认折叠，仅显示共识结论和综合评分
- 点击 [展开详情] 查看三列专家独立判断
- 每个专家列可点击查看完整评估报告

**Mock 接口**：
```typescript
POST /api/multi-expert/consensus
Body: { permit_id: string }
Response: {
  experts: {
    role: string,               // 专家角色
    risk_level: string,         // 风险判断（低/中/中高/高）
    focus: string,              // 关注重点
    summary: string,            // 评估摘要
    recommendations: string[]   // 建议列表
  }[],
  consensus: {
    conclusion: string,         // 共识结论
    score: number,              // 综合评分 0-100
    confidence: number          // 置信度 0-100
  }
}
// Mock: 延迟 1000ms，返回预置三专家评估结果
```

## 5. 使用场景

| 条件 | 渲染 |
|------|------|
| role === 'approver' && status === 'Approved' | ✅ 置顶渲染 |
| role === 'admin' | ✅ 渲染（非置顶） |
| 其他情况 | ❌ 不渲染 |

## 6. 与其他组件的关系

- 数据来源于 FormRenderer 的校验结果和 JSA 风险分析数据
- 与 ActionBlock 配合：审批人看到风险摘要后做出审批决策
- 内嵌 ExpertConsensusPanel：展示 Multi-Expert Agent 多专家共识评估结果

## 7. Demo 简化说明

| 完整产品功能 | Demo 简化方式 |
|-------------|-------------|
| 风险评估算法 | 风险数据来自预置 Mock，不实现真实算法 |
| 自动校验 | 校验结果为静态数据 |
| 🤖 多专家共识评估 | Mock 实现：返回预置三专家评估结果，延迟 1000ms；默认折叠仅显示共识结论，展开可查看三列独立判断 |
