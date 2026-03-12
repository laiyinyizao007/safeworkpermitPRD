# 07 - StatusTag 状态标签

> **组件路径**: `components/StatusTag/` | **使用页面**: 详情页、首页 | **技术要点**: 颜色编码, 支持 8 种状态

---

## 1. 组件定位

作业票状态的可视化标签。颜色编码直观展示当前状态。

## 2. Props / Events 接口

```typescript
interface StatusTagProps {
  status: PermitStatus
  size?: 'small' | 'default' | 'large'   // 默认 default
}
```

## 3. 视觉规格

| 状态 | 颜色 | 文字 | 色值 |
|------|------|------|------|
| Draft | 灰色 | 草稿 | `#909399` |
| Submitted | 蓝色 | 待审核 | `#409EFF` |
| Rejected | 橙色 | 已退回 | `#E6A23C` |
| Approved | 紫色 | 待核查 | `#9C27B0` |
| Verify | 青色 | 核查中 | `#00BCD4` |
| Executing | 绿色 | 执行中 | `#67C23A` |
| PendingAcceptance | 黄色 | 待验收 | `#F9A825` |
| Closed | 深灰 | 已关闭 | `#606266` |
| Emergency | 红色 | 紧急中断 | `#F56C6C` |

- 样式：圆角 4px，内边距 4px 8px，字号 12px（small）/ 14px（default）/ 16px（large）

## 4. 交互行为

纯展示组件，无交互行为。

## 5. 使用场景

- 详情页顶部状态栏
- 首页待办卡片
- 审批时间轴节点

## 6. 与其他组件的关系

- ActionBlock 读取状态用于动作计算
- Timeline 使用本组件标注每个节点的状态

## 7. Demo 简化说明

无简化，完整实现。
