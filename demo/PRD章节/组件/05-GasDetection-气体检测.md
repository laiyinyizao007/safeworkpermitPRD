# 05 - GasDetection 气体检测

> **组件路径**: `components/GasDetection/` | **使用页面**: 详情页 | **技术要点**: 数字键盘优先, 标准值对比, 超标报警
> **AI 集成**: KG Reasoning Agent（异常模式检测提示）

---

## 1. 组件定位

气体检测数值录入组件。监护人在核查和执行阶段录入可燃气体、氧气、有毒气体浓度，系统自动与标准值对比并报警。

## 2. Props / Events 接口

```typescript
interface GasDetectionProps {
  records: GasRecord[]           // 已有检测记录
  standards: GasStandard[]       // 标准值配置
  readonly?: boolean             // 只读模式
  autoReminder?: boolean         // 定时提醒（执行阶段）
  reminderInterval?: number      // 提醒间隔（分钟，默认 30）
}

interface GasRecord {
  time: string
  combustible: number    // 可燃气体 %LEL
  oxygen: number         // 氧气 %
  toxic: number          // 有毒气体 ppm
  operator: string       // 检测人
  isNormal: boolean      // 是否合格
}

interface GasStandard {
  name: string
  unit: string
  min?: number
  max?: number
  alarmThreshold: number
}

interface GasDetectionEvents {
  'submit': (record: GasRecord) => void
  'alarm': (type: string, value: number) => void
}
```

## 3. 视觉规格

- 数值输入：大号数字键盘（移动端 `inputmode="decimal"`）
- 合格：绿色数值 + ✅
- 超标：红色数值 + 🔴 + 震动提醒
- 历史记录：时间轴列表，最新在上

## 4. 交互行为

- 录入数值后自动与标准值对比
- 超标时：红色高亮 + 震动 + 弹窗警告"XX超标，请立即处理"
- 定时提醒：执行阶段每30分钟弹窗提醒录入
- 模拟自动采集按钮：点击后随机生成合理范围内的数值

### 🤖 AI 异常模式检测（KG Reasoning Agent）

当录入 ≥3 条检测记录后，系统自动分析数值变化趋势，在检测记录列表上方展示 AI 提示卡片：

| 检测模式 | AI 提示内容 | 样式 |
|---------|-----------|------|
| 数值持续上升 | "⚠️ 可燃气体浓度呈上升趋势（5.2→8.1→12.3%LEL），建议增加检测频率或排查泄漏源" | 橙色警告卡片 |
| 数值波动异常 | "⚠️ 氧气浓度波动异常（20.8→18.2→21.5%），建议检查通风设备运行状态" | 橙色警告卡片 |
| 数值稳定正常 | "✅ 各项气体指标稳定，当前作业环境安全" | 绿色信息卡片 |
| 接近阈值 | "🟡 有毒气体浓度接近阈值（当前 7.5ppm / 阈值 10ppm），建议加强监测" | 黄色提醒卡片 |

AI 提示卡片可点击 [忽略] 关闭，关闭后本次检测周期内不再显示同类提示。

## 5. 使用场景

| 页面 | 状态 | 角色 | 模式 |
|------|------|------|------|
| 详情页 | Verify | 监护人 | 可录入 |
| 详情页 | Executing | 监护人 | 可录入 + 定时提醒 |
| 详情页 | 任意 | 安全负责人 | 只读 + 校验标注 |
| 详情页 | 任意 | 其他角色 | 只读或隐藏 |

## 6. 与其他组件的关系

- FormRenderer 在字段类型为 `gasdetection` 时渲染本组件
- MonitorPanel 内嵌本组件用于执行阶段定时录入

## 7. Demo 简化说明

| 完整产品功能 | Demo 简化方式 |
|-------------|-------------|
| 标准值配置 | 硬编码：可燃 <25%LEL，氧气 19.5-23.5%，有毒 <10ppm |
| 自动采集 | 随机数生成，偶尔触发超标演示 |
| 定时提醒 | 使用 `setInterval`，不实现后台推送 |
| 🤖 AI 异常模式检测 | Mock 实现：根据已录入记录的数值变化趋势（上升/波动/稳定/接近阈值）返回预置提示文案，延迟 500ms 模拟分析过程 |
