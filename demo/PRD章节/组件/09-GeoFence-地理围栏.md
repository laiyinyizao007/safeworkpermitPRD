# 09 - GeoFence 地理围栏

> **组件路径**: `components/GeoFence/` | **使用页面**: 详情页 | **技术要点**: 模拟定位, 可手动切换在场/不在场
> **关联**: 参考文档 §7.2.2 电子围栏约束卡点 / [17-SpatialVerifyBadge.md](./17-SpatialVerifyBadge-时空验证徽章.md)
> **AI 集成**: Spatial-Temporal Agent（时空一致性验证）

---

## 1. 组件定位

地理围栏模拟组件。在审批和核查阶段校验操作人是否在作业现场范围内。Demo 中使用模拟定位数据，可手动切换状态。

## 2. Props / Events 接口

```typescript
interface GeoFenceProps {
  center: { lat: number, lng: number, name: string }  // 围栏中心（作业地点）
  radius: number                                        // 围栏半径（米）
  required?: boolean                                    // 是否强制校验
  tolerance?: number                                    // 偏移容忍度（米，默认 10）
}

interface GeoFenceEvents {
  'status-change': (inRange: boolean, distance: number) => void
  'check': (result: { inRange: boolean, distance: number, location: string }) => void
}
```

## 3. 视觉规格

- 在场：绿色标签 "📍 已到达现场（距作业点 XXm）"
- 不在场：红色标签 "⚠️ 未到达现场（距作业点 XXm），请靠近后操作"
- Demo 切换按钮：蓝色小按钮 "[模拟: 切换位置]"

## 4. 交互行为

- 组件加载时自动检测位置（Demo 使用模拟数据）
- 不在围栏内时：表单操作按钮置灰，提示靠近作业点
- 在围栏内时：正常操作
- Demo 特有：点击 "[模拟: 切换位置]" 按钮在"在场/不在场"间切换

**约束卡点逻辑**:
```typescript
if (distance > radius + tolerance) {
  disableAllFields()
  showError(`您距离作业点${distance}米，请靠近作业点再进行操作`)
} else {
  enableAllFields()
}
```

### 🤖 时空一致性验证（Spatial-Temporal Agent）

在审批人现场审批（Approved 状态）和监护人核查（Verify 状态）时，GeoFence 组件内嵌 SpatialVerifyBadge，展示 Spatial-Temporal Agent 的验证结果：

**验证内容**：
- GPS 定位是否在围栏范围内
- 当前时间是否在作业计划时间窗口内
- 人员身份是否与作业票指定人员一致

**展示位置**：在围栏状态标签右侧内联显示 SpatialVerifyBadge

```text
📍 已到达现场（距作业点 35m）  [🤖 时空验证 ✅ 通过]
```

或

```text
⚠️ 未到达现场（距作业点 250m）  [🤖 时空验证 ❌ 未通过: 超出围栏范围]
```

**Mock 接口**：
```typescript
POST /api/spatial-temporal/verify
Body: { permit_id: string, location: { lat, lng }, timestamp: string, operator_id: string }
Response: {
  passed: boolean,
  checks: {
    geo_in_range: boolean,      // GPS 在围栏内
    time_in_window: boolean,    // 时间在计划窗口内
    identity_match: boolean     // 人员身份匹配
  },
  message?: string              // 未通过时的原因说明
}
// Mock: 延迟 500ms，根据模拟位置状态返回对应结果
```

## 5. 使用场景

| 状态 | 角色 | 用途 |
|------|------|------|
| Approved | 审批人 | 现场审批时校验（一级及以上强制） |
| Verify | 监护人 | 现场核查时校验 |
| Executing | 监护人 | GPS 自动打卡（每30分钟） |

## 6. 与其他组件的关系

- FormRenderer 在约束规则包含地理围栏时渲染本组件
- MonitorPanel 使用本组件进行 GPS 自动打卡

## 7. Demo 简化说明

| 完整产品功能 | Demo 简化方式 |
|-------------|-------------|
| 真实 GPS 定位 | 使用模拟坐标，不调用真实 GPS |
| 围栏配置 | 围栏半径固定 100m（一级动火） |
| 位置切换 | 提供手动切换按钮方便演示 |
| 🤖 时空一致性验证 | Mock 实现：根据模拟位置状态返回预置验证结果，SpatialVerifyBadge 内联展示；点击可查看 3 项检查明细 |
