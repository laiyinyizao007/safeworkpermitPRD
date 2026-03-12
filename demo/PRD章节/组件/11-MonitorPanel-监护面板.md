# 11 - MonitorPanel 监护面板

> **组件路径**: `components/MonitorPanel/` | **使用页面**: 详情页 | **技术要点**: 条件渲染, 内嵌多个子组件
> **关联**: [03-统一界面设计.md](../03-统一界面设计.md) §5.4, §6.2
> **AI 集成**: Spatial-Temporal Agent（AI 在场监测，WebSocket 实时推送）

---

## 1. 组件定位

监护人在执行阶段的专属面板。展示作业进度、人员状态、气体检测倒计时和监护日志。内嵌 GasDetection、EmergencyStop、PhotoUpload 等子组件。仅当角色为监护人且状态为 Executing 时渲染。

## 2. Props / Events 接口

```typescript
interface MonitorPanelProps {
  permit: WorkPermit              // 当前作业票
  currentRole: string             // 当前角色（仅 supervisor 时渲染）
  gasDetectionInterval?: number   // 气体检测间隔（分钟，默认 30）
}

interface MonitorPanelEvents {
  'gas-submit': (record: GasRecord) => void
  'photo-upload': (photo: string) => void
  'emergency-stop': (payload: { reason: string }) => void
  'gps-checkin': (location: { lat: number, lng: number }) => void
}
```

## 3. 视觉规格

```text
┌─ 监护面板 ───────────────────────────────┐
│ 🟢 作业中  已持续: 02:35  剩余: 01:25    │
│ ████████████░░░░  65%                     │
│                                           │
│ 👷 作业人员: 张三 🟢在岗  李四 🟢在岗    │
│                                           │
│ 🧪 气体检测  上次: 10:00                  │
│ 可燃 5.2%  氧气 20.8%  有毒 0ppm         │
│ ⏰ 下次检测倒计时: 01:25                  │
│                                           │
│ ┌─ 🤖 AI 在场监测 ─────────────────────┐ │
│ │ 实时状态  更新: 10:31                 │ │
│ │ 👷 张三  📍 12m  🟢在岗  ⏱ 02:35    │ │
│ │ 👷 李四  📍 8m   🟢在岗  ⏱ 02:35    │ │
│ │ 👷 王五  📍 156m 🔴离岗  ⏱ 00:15    │ │
│ │ ⚠️ 王五已离开围栏范围超过15分钟       │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ 📋 监护日志                               │
│ 10:31 🤖 AI检测: 王五离开围栏(156m)      │
│ 10:30 📍 GPS确认在岗                      │
│ 10:00 🧪 气体检测录入                     │
│                                           │
│ [录入检测] [拍照记录]                     │
│ ┌─────────────────────────────────────┐  │
│ │  🔴 紧 急 叫 停（长按 2 秒触发）    │  │
│ └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

## 4. 交互行为

- 作业进度条：根据计划时间自动计算百分比
- 人员状态：🟢在岗 / 🔴离岗（模拟数据）
- 气体检测倒计时：到期自动弹窗提醒 + 震动
- GPS 自动打卡：每 30 分钟自动记录（模拟）
- 监护日志：自动生成，按时间倒序
- 低功耗设计：减少动画，降低刷新频率

### 🤖 AI 在场监测（Spatial-Temporal Agent）

在监护面板中嵌入"AI 在场监测"子区域，通过 WebSocket 实时推送作业人员的位置状态：

**展示内容**（每个人员一行）：
- 人员姓名 + 距作业点距离 + 在岗/离岗状态 + 持续时间
- 离岗人员红色高亮，并在下方显示警告提示

**告警规则**：
| 条件 | 告警 |
|------|------|
| 人员离开围栏范围 | 🟡 黄色提示"XX已离开围栏范围" |
| 离开超过 15 分钟 | 🔴 红色警告"XX已离开围栏范围超过15分钟" |
| 所有人员离岗 | 🔴 紧急警告"所有作业人员已离岗，建议暂停作业" |

**WebSocket 接口**：
```typescript
// 实时人员位置推送
WS /ws/monitoring/{permit_id}
Message: {
  type: 'personnel_status',
  data: {
    operator_id: string,
    name: string,
    distance: number,           // 距作业点距离 (m)
    in_range: boolean,          // 是否在围栏内
    duration_minutes: number,   // 在岗/离岗持续时间
    last_update: string         // 最后更新时间
  }[]
}
// Mock: 使用 setInterval 每 10 秒推送一次模拟数据
// 默认 2 人在岗 + 1 人离岗，可通过 Demo 按钮切换状态
```

**AI 事件自动写入监护日志**：
- 人员离岗/返岗事件自动记录到监护日志，前缀 🤖 标识为 AI 检测

## 5. 使用场景

| 条件 | 渲染 |
|------|------|
| role === 'supervisor' && status === 'Executing' | ✅ 渲染 |
| 其他情况 | ❌ 不渲染 |

## 6. 与其他组件的关系

| 子组件 | 用途 |
|--------|------|
| GasDetection | 气体检测录入区域 |
| EmergencyStop | 底部紧急叫停按钮 |
| PhotoUpload | 拍照记录功能 |
| GeoFence | GPS 自动打卡 |

## 7. Demo 简化说明

| 完整产品功能 | Demo 简化方式 |
|-------------|-------------|
| 进度条 | 基于 Mock 时间计算 |
| 人员状态 | 静态 Mock 数据 |
| GPS 打卡 | 使用模拟坐标 |
| 定时提醒 | 使用 `setInterval` |
| 🤖 AI 在场监测 | Mock 实现：`setInterval` 每 10 秒推送模拟人员位置数据，默认 2 人在岗 + 1 人离岗；提供 [模拟: 人员离岗/返岗] 按钮切换状态 |
