# 16 - ExpertConsensusPanel 多专家共识面板

> **组件路径**: `components/ai/ExpertConsensusPanel/` | **使用页面**: 作业票详情页 | **技术要点**: 三列并排展示, 共识可视化
> **关联**: [03-作业票详情页.md](../页面/03-作业票详情页.md) / [13-RiskSummary.md](./13-RiskSummary-风险摘要卡片.md) / Multi-Expert Agent

---

## 1. 组件定位

审批人在 Approved 状态下查看的多专家 AI 评估面板。嵌入 RiskSummary 卡片内部，三列并排展示三个 AI 专家角色的独立判断，底部显示共识结论和分歧点。

## 2. Props / Events 接口

```typescript
interface ExpertJudgment {
  role: string                    // 专家角色名
  icon: string                    // 角色图标
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  assessment: string              // 评估结论
  key_points: string[]            // 关键要点
  confidence: number              // 置信度 0-1
}

interface ExpertConsensusPanelProps {
  judgments: ExpertJudgment[]      // 专家判断列表（通常 3 个）
  consensusType: 'unanimous' | 'majority' | 'no_consensus'
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  consensusScore: number           // 一致性分数 0-1
  finalRecommendation: string      // 综合建议
  dissentingOpinions?: string[]    // 分歧意见
}

interface ExpertConsensusPanelEvents {
  'view-detail': (role: string) => void  // 查看某专家详细评估
}
```

## 3. 视觉规格

### 3.1 PC 端（三列并排）

```text
┌─ 🤖 多专家评估 (一致性: 87%) ────────────────────────────┐
│                                                            │
│ ┌─ 🛡️ 安全工程师 ──┐ ┌─ ⚙️ 工艺专家 ────┐ ┌─ 🔥 消防 ─┐│
│ │ 🟡 中风险         │ │ 🟡 中风险         │ │ 🟠 高风险  ││
│ │ 置信度: 92%       │ │ 置信度: 88%       │ │ 置信度: 78%││
│ │                   │ │                   │ │            ││
│ │ · 措施基本到位    │ │ · 工艺条件可控    │ │ · 建议增加 ││
│ │ · 人员资质合格    │ │ · 设备状态良好    │ │   消防备勤 ││
│ │ · 应急预案完整    │ │ · 通风系统正常    │ │ · 灭火器偏少││
│ └───────────────────┘ └───────────────────┘ └────────────┘│
│                                                            │
│ 📋 综合建议: 可批准，建议增加消防备勤                      │
│ ⚠️ 分歧: 消防专家认为灭火器数量偏少                       │
└────────────────────────────────────────────────────────────┘
```

### 3.2 移动端（纵向堆叠 + 可折叠）

```text
┌─ 🤖 多专家评估 (87%) ──────────────────┐
│ 📋 综合: 可批准，建议增加消防备勤       │
│                                          │
│ 🛡️ 安全工程师  🟡中  92%  [展开 ▼]     │
│ ⚙️ 工艺专家    🟡中  88%  [展开 ▼]     │
│ 🔥 消防专家    🟠高  78%  [展开 ▼]     │
│                                          │
│ ⚠️ 分歧: 消防专家认为灭火器数量偏少    │
└──────────────────────────────────────────┘
```

### 3.3 共识类型颜色

| 类型 | 颜色 | 说明 |
|------|------|------|
| unanimous (全票一致) | 绿色 `#67C23A` | 三个专家完全一致 |
| majority (多数一致) | 橙色 `#E6A23C` | 2/3 一致，标记分歧 |
| no_consensus (无共识) | 红色 `#F56C6C` | 完全分歧，需人工审核 |

## 4. 使用场景

| 条件 | 渲染 |
|------|------|
| role === 'approver' && status === 'Approved' | ✅ 完整渲染（嵌入 RiskSummary） |
| role === 'admin' | ✅ 完整渲染 |
| 其他 | ❌ 不渲染 |

## 5. 与其他组件的关系

- 嵌入 RiskSummary 卡片内部（RiskSummary 底部新增区域）
- 与 ActionBlock 配合：审批人看到评估后做出审批决策

## 6. Mock 数据接口

```typescript
POST /api/multi-expert/consensus
Body: { permit_id: string }
Response: {
  overall_risk: string,
  consensus_type: string,
  consensus_score: number,
  expert_judgments: ExpertJudgment[],
  final_recommendation: string,
  dissenting_opinions?: string[]
}
// Mock: 延迟 800ms，返回预置三专家评估结果
```

## 7. Demo 简化说明

| 完整产品功能 | Demo 简化方式 |
|-------------|-------------|
| 3 个 LLM 实例独立推理 | 预置 Mock 评估结果 |
| 共识算法实时计算 | 静态一致性分数 |
| 专家详细报告 | 点击展开显示要点列表，不跳转独立页面 |
