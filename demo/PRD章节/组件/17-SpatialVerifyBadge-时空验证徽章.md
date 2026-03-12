# 17 - SpatialVerifyBadge 时空验证徽章

> **组件路径**: `components/ai/SpatialVerifyBadge/` | **使用页面**: 作业票详情页, 电子签名页 | **技术要点**: 内联轻量组件, 三态显示
> **关联**: [03-作业票详情页.md](../页面/03-作业票详情页.md) / [04-电子签名页.md](../页面/04-电子签名页.md) / Spatial-Temporal Agent

---

## 1. 组件定位

轻量内联组件，显示时空一致性智能体的验证状态。用于审批人现场审批前的位置校验和电子签名页顶部的验证状态展示。

## 2. Props / Events 接口

```typescript
interface SpatialVerifyResult {
  within_fence: boolean
  distance: number                // 米
  location_name: string           // 位置描述
  verified_at: string             // 验证时间
  fence_radius: number            // 围栏半径（米）
}

interface SpatialVerifyBadgeProps {
  result: SpatialVerifyResult | null  // null 表示未验证
  loading?: boolean
  showMap?: boolean               // 是否显示迷你地图（默认 false）
}

interface SpatialVerifyBadgeEvents {
  'verify': () => void            // 触发验证
  'view-map': () => void          // 查看地图详情
}
```

## 3. 视觉规格

### 三态显示

**验证中**:
```text
🤖 ⏳ 正在验证位置...
```

**验证通过**:
```text
🤖 ✅ 已到达现场 (距作业点 45m，围栏 100m)  验证时间: 09:15
```
- 背景: 浅绿色 `#F0F9EB`
- 文字: 绿色 `#67C23A`

**验证未通过**:
```text
🤖 ❌ 未到达现场 (距作业点 320m，围栏 100m)  请靠近作业点
```
- 背景: 浅红色 `#FEF0F0`
- 文字: 红色 `#F56C6C`

**未验证**:
```text
🤖 📍 点击验证位置
```
- 背景: 浅灰色 `#F5F7FA`

## 4. 交互行为

- 点击徽章触发位置验证（调用 Spatial-Temporal Agent）
- 验证通过: 解锁后续操作（审批按钮/签名按钮）
- 验证未通过: 后续操作按钮置灰，提示靠近作业点
- 可选: 点击查看迷你地图（显示审批人位置和作业点位置）

## 5. 使用场景

| 页面 | 位置 | 触发条件 |
|------|------|---------|
| 详情页 | 审批人点击"现场审批"后，ActionBlock 上方 | role === 'approver' && action === 'field-approve' |
| 电子签名页 | 页面顶部信息栏 | 审批人签名时 |

## 6. 与其他组件的关系

- 与 GeoFence 组件互补: GeoFence 用于监护人持续监测，SpatialVerifyBadge 用于审批人一次性验证
- 与 ActionBlock 配合: 验证未通过时禁用审批按钮
- 与 Signature 配合: 验证未通过时禁用签名

## 7. Mock 数据接口

```typescript
POST /api/spatial-temporal/verify-approval
Body: { permit_id: string, approver_id: string }
Response: SpatialVerifyResult
// Mock: 延迟 500ms，默认返回"通过"
// Demo 提供切换按钮: [模拟: 在场/不在场]
```

## 8. Demo 简化说明

| 完整产品功能 | Demo 简化方式 |
|-------------|-------------|
| 真实 GPS 定位 | 模拟坐标，提供手动切换按钮 |
| PostGIS 三维距离计算 | 预置距离值 |
| 围栏半径动态配置 | 固定 100m |
