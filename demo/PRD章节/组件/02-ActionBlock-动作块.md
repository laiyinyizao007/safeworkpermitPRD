# 02 - ActionBlock 动作块

> **组件路径**: `components/ActionBlock/` | **使用页面**: 详情页、首页 | **技术要点**: 角色+状态双维度动态渲染
> **关联**: [03-统一界面设计.md](../03-统一界面设计.md) §5.2 / [04-角色权限视图差异.md](../04-角色权限视图差异.md) §3

---

## 1. 组件定位

DOB NOW 理念的核心体现。页面底部固定操作区，根据当前角色和作业票状态动态渲染可用操作按钮。同一张票，不同角色看到不同的操作。

## 2. Props / Events 接口

```typescript
interface ActionBlockProps {
  role: string                    // 当前角色
  status: PermitStatus            // 当前作业票状态
  permitId: string                // 作业票 ID
  compact?: boolean               // 紧凑模式（用于首页卡片内）
}

interface ActionBlockEvents {
  'action': (action: ActionType, payload?: any) => void
}

type ActionType =
  | 'edit' | 'submit' | 'delete' | 'withdraw' | 'urge'
  | 'approve' | 'reject' | 'review-pass' | 'review-reject'
  | 'field-approve' | 'remote-approve'
  | 'verify-pass' | 'verify-reject'
  | 'checkin' | 'checkout' | 'report-abnormal'
  | 'gas-detect' | 'take-photo' | 'emergency-stop'
  | 'accept' | 'export-pdf' | 'copy-create'
  | 'resubmit'
```

## 3. 视觉规格

- 容器：`position: fixed; bottom: 0`，白色背景 + 顶部阴影
- 按钮排列：水平排列，主操作在右侧（primary 色），次操作在左侧
- 紧凑模式（首页卡片）：按钮缩小，内嵌在卡片底部
- 紧急叫停：红色大按钮，独占一行

## 4. 交互行为

### 4.1 渲染规则

```typescript
function getActions(role: string, status: PermitStatus): ActionConfig[] {
  return ACTION_MATRIX[status]?.[role] ?? []
}
```

### 4.2 完整动作矩阵

| 状态 | 负责人 | 作业人 | 监护人 | 安全负责人 | 审批人 |
|------|--------|--------|--------|-----------|--------|
| Draft | 编辑, 提交, 删除 | — | — | — | — |
| Submitted | 撤回, 催办 | — | — | 审核通过, 退回 | — |
| Rejected | 修改并重新提交 | — | — | — | — |
| Approved | — | — | — | — | 现场审批, 远程审批 |
| Verify | 补充材料 | 确认措施, 签到 | 核查通过, 退回, 🔴叫停 | — | — |
| Executing | — | 签退, 报告异常 | 录入检测, 拍照, 🔴叫停 | — | — |
| PendingAcceptance | 验收签字 | — | 验收签字 | — | — |
| Closed | 导出PDF, 复制新建 | — | — | 统计 | — |

## 5. 使用场景

| 页面 | 模式 | 说明 |
|------|------|------|
| 作业票详情页 | 完整模式 | 底部固定，显示所有可用操作 |
| 首页待办卡片 | 紧凑模式 | 内嵌在卡片底部，仅显示主操作 |

## 6. 与其他组件的关系

| 关联组件 | 关系 |
|---------|------|
| EmergencyStop | 当动作包含"紧急叫停"时，渲染 EmergencyStop 组件替代普通按钮 |
| StatusTag | 读取当前状态用于动作计算 |

## 7. Demo 简化说明

- 动作矩阵硬编码在前端，不从后端获取
- 操作确认使用 Element Plus `ElMessageBox.confirm`
- 操作执行后更新本地 Mock 数据状态
