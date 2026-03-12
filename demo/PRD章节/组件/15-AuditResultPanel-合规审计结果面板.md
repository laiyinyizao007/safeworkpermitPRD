# 15 - AuditResultPanel 合规审计结果面板

> **组件路径**: `components/ai/AuditResultPanel/` | **使用页面**: 作业票详情页 | **技术要点**: 逐项校验结果展示, 法规引用链接
> **关联**: [03-作业票详情页.md](../页面/03-作业票详情页.md) / Auditor Agent

---

## 1. 组件定位

作业票详情页中展示 AI 合规审计结果的面板。在 Submitted 状态下替换原有的静态"自动校验报告"区域，展示合规分数、逐项检查结果和法规引用。

## 2. Props / Events 接口

```typescript
interface AuditCheckItem {
  label: string                   // 检查项名称
  passed: boolean                 // 是否通过
  detail?: string                 // 不通过时的说明
  regulation_ref?: string         // 法规引用
}

interface AuditResultPanelProps {
  complianceScore: number         // 合规总分 0-100
  checkItems: AuditCheckItem[]    // 逐项检查结果
  suggestions?: string[]          // 改进建议列表
  auditTime?: string              // 审计时间
  compact?: boolean               // 紧凑模式（用于卡片内嵌）
}

interface AuditResultPanelEvents {
  'view-detail': () => void       // 查看完整报告
}
```

## 3. 视觉规格

```text
┌─ 🤖 AI 合规审计报告 ────────────────────────┐
│ 合规分数: 85/100  审计时间: 03-11 08:30      │
│                                                │
│ ✅ 人员资质: 全部有效                         │
│ ✅ 作业时间: 符合8小时限制                    │
│ 🔴 灭火器: 2具 (标准≥4具)                    │
│    📖 GB 30871-2022 §5.3.1                    │
│ ✅ JSA: 2个风险点已识别                       │
│ 🟡 建议: 增加可燃气体连续监测                 │
│                                                │
│ [查看完整报告]                                │
└────────────────────────────────────────────────┘
```

- 分数 ≥85: 绿色背景 `#F0F9EB`
- 分数 70-84: 黄色背景 `#FDF6EC`
- 分数 <70: 红色背景 `#FEF0F0`
- 通过项: ✅ 绿色文字
- 不通过项: 🔴 红色文字 + 法规引用链接
- 建议项: 🟡 黄色文字

## 4. 使用场景

| 条件 | 渲染 |
|------|------|
| status === 'Submitted' && role === 'safety_officer' | ✅ 完整渲染（左侧详情区） |
| status === 'Submitted' && 其他角色 | ✅ 紧凑模式（仅分数+通过/不通过数） |
| status === 'Approved' \|\| 'Verify' \|\| 'Executing' | ✅ 紧凑模式（历史记录） |
| status === 'Draft' | ❌ 不渲染 |

## 5. 与其他组件的关系

- 替换详情页 Submitted 状态下的静态"自动校验报告"
- 安全负责人 PC 端左右分栏时，显示在左侧详情区顶部

## 6. Mock 数据接口

```typescript
// 获取审计结果（随作业票详情一起返回）
GET /api/permits/:id
Response 扩展: {
  ...WorkPermit,
  ai_audit?: {
    compliance_score: number,
    check_items: AuditCheckItem[],
    suggestions: string[],
    audit_time: string
  }
}
```

## 7. Demo 简化说明

| 完整产品功能 | Demo 简化方式 |
|-------------|-------------|
| 实时合规审计 | 预置 Mock 审计结果，随作业票数据返回 |
| 法规引用链接 | 仅显示文字，不跳转到法规原文 |
| 完整报告页面 | 点击"查看完整报告"弹出 Dialog 展示详情 |
