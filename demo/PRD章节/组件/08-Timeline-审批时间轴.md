# 08 - Timeline 审批时间轴

> **组件路径**: `components/Timeline/` | **使用页面**: 详情页 | **技术要点**: 已完成/进行中/待处理三态

---

## 1. 组件定位

作业票审批流程的可视化时间轴。展示从创建到关闭的完整流转历史，每个节点标注操作人、时间和意见。

## 2. Props / Events 接口

```typescript
interface TimelineProps {
  records: ApprovalRecord[]
  currentStatus: PermitStatus
}

interface ApprovalRecord {
  status: PermitStatus
  action: string          // 操作名称
  operator: string        // 操作人
  time: string            // 操作时间
  comment?: string        // 意见/备注
  result?: 'pass' | 'reject' | 'pending'
}
```

## 3. 视觉规格

| 节点状态 | 图标 | 颜色 |
|---------|------|------|
| 已完成 | ✅ 实心圆 | 绿色 `#67C23A` |
| 进行中 | ⏳ 脉冲动画圆 | 蓝色 `#409EFF` |
| 待处理 | ○ 空心圆 | 灰色 `#C0C4CC` |
| 退回 | 🔴 实心圆 | 红色 `#F56C6C` |

- 连接线：2px 实线（已完成）/ 虚线（待处理）
- 节点间距：48px

## 4. 交互行为

- 纯展示组件
- 点击节点可展开/折叠详细意见
- 退回节点特殊标注退回原因

## 5. 使用场景

详情页状态进度条区域，所有角色可见。

## 6. 与其他组件的关系

- StatusTag 用于标注每个节点的状态

## 7. Demo 简化说明

无简化，完整实现。预置数据覆盖完整流转历史。
