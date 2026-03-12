# 06 - EmergencyStop 紧急叫停

> **组件路径**: `components/EmergencyStop/` | **使用页面**: 详情页 | **技术要点**: 红色大按钮, 常驻底部, fixed 定位, 长按触发

---

## 1. 组件定位

紧急叫停按钮。监护人在核查和执行阶段可见，`position: fixed` 常驻底部，任何滚动位置可触达。长按 2 秒触发，防止误触。

## 2. Props / Events 接口

```typescript
interface EmergencyStopProps {
  permitId: string
  visible?: boolean        // 是否显示（默认 true）
  holdDuration?: number    // 长按时长（ms，默认 2000）
}

interface EmergencyStopEvents {
  'trigger': (payload: { reason: string, photo?: string }) => void
}
```

## 3. 视觉规格

- 按钮：红色背景 `#E53935`，白色文字，圆角 8px
- 尺寸：宽度 100%（减去左右 padding），高度 56px
- 定位：`position: fixed; bottom: 16px; left: 16px; right: 16px`
- 长按动画：按下后环形进度条 2 秒填满
- 文字："🔴 紧 急 叫 停（长按 2 秒触发）"

## 4. 交互行为

1. 长按按钮，环形进度条开始填充
2. 2 秒后触发，弹出确认弹窗
3. 弹窗内容：选择叫停原因（下拉）+ 拍照（可选）+ 备注
4. 确认后：作业票状态锁定为 Emergency，通知所有相关人员
5. 松手不足 2 秒：取消，进度条重置

## 5. 使用场景

| 状态 | 角色 | 可见性 |
|------|------|--------|
| Verify | 监护人 | ✅ 可见 |
| Executing | 监护人 | ✅ 可见 |
| 其他状态 | 任何角色 | ❌ 隐藏 |

## 6. 与其他组件的关系

- ActionBlock 在监护人 + Verify/Executing 状态时渲染本组件
- MonitorPanel 底部固定区域包含本组件

## 7. Demo 简化说明

- 叫停后状态变为 Emergency，所有操作锁定
- 通知使用 Toast 模拟，不实现真实推送
- 叫停原因预置 3 个选项：气体超标/人员受伤/设备故障
