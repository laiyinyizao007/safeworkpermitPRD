# 12 - SafetyChecklist 安全措施清单

> **组件路径**: `components/SafetyChecklist/` | **使用页面**: 详情页、新建页 | **技术要点**: 强制按序点击, 逐项确认+拍照
> **关联**: 参考文档 §7.2.2 人工确认清单
> **AI 集成**: KG Reasoning Agent（AI 推荐安全措施，一键采纳）

---

## 1. 组件定位

安全措施确认清单组件。支持两种模式：编辑模式（负责人填写）和确认模式（作业人/监护人逐项确认）。确认模式下支持强制按序点击和逐项拍照。

## 2. Props / Events 接口

```typescript
interface SafetyChecklistProps {
  items: ChecklistItem[]
  mode: 'edit' | 'confirm' | 'verify' | 'readonly'
  enforceOrder?: boolean       // 强制按序点击（默认 true）
  requirePhoto?: boolean       // 逐项拍照确认（监护人核查）
}

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
  value?: string | number      // 附加值（如灭火器数量）
  photo?: string               // 确认照片
  confirmedBy?: string         // 确认人
  confirmedAt?: string         // 确认时间
}

interface SafetyChecklistEvents {
  'update:items': (items: ChecklistItem[]) => void
  'item-confirm': (item: ChecklistItem) => void
  'all-confirmed': () => void
}
```

## 3. 视觉规格

| 模式 | 样式 |
|------|------|
| edit | 标准复选框 + 可选附加输入框 |
| confirm | 大号复选框(44×44px) + 确认按钮 + 确认人/时间 |
| verify | 复选框 + 拍照按钮 + 照片缩略图 |
| readonly | 灰色复选框 + 确认信息 |

- 未到当前项：置灰不可点击
- 当前项：蓝色高亮边框
- 已确认项：绿色 ✅ + 确认信息

## 4. 交互行为

**编辑模式（负责人）**:
- 标准复选框，可自由勾选/取消
- 部分项有附加输入（如灭火器数量）

#### 🤖 AI 推荐安全措施（KG Reasoning Agent）

在编辑模式下，清单上方展示"AI 推荐"卡片，由 KG Reasoning Agent 根据作业类型、作业区域和历史事故数据推荐额外安全措施：

```text
┌─ 🤖 AI 推荐安全措施（基于知识图谱分析）──────────────────┐
│ 根据「动火作业 + 1号储罐区」历史数据，建议增加以下措施：  │
│                                                            │
│ ☐ 配备防爆对讲机（储罐区通信安全）         [采纳] [忽略]  │
│ ☐ 设置可燃气体连续监测仪（自动报警）       [采纳] [忽略]  │
│ ☐ 准备应急堵漏工具（储罐区泄漏应急）       [采纳] [忽略]  │
│                                                            │
│ 📊 推荐依据: 1号储罐区近3年动火作业事故中，68%涉及通信    │
│    不畅，45%涉及泄漏未及时发现                             │
│                                              [全部采纳]    │
└────────────────────────────────────────────────────────────┘
```

- 点击 [采纳]：将该措施追加到安全措施清单末尾，标记 `🤖` 前缀表示 AI 推荐
- 点击 [忽略]：该推荐项淡出消失
- 点击 [全部采纳]：一次性追加所有推荐措施
- 已采纳的措施在清单中显示为 `🤖 配备防爆对讲机` 样式，可手动删除

**Mock 接口**：
```typescript
POST /api/kg-reasoning/recommend-safety
Body: { work_type: string, work_zone: string }
Response: {
  recommendations: {
    id: string,
    label: string,              // 措施名称
    reason: string,             // 推荐原因
    source: string,             // 知识来源（如"1号储罐区事故统计"）
    confidence: number          // 置信度 0-1
  }[]
}
// Mock: 延迟 800ms，根据 work_type + work_zone 返回 2-4 条预置推荐
```

**确认模式（作业人签到）**:
- 强制按序：前一项未勾选，后一项置灰
- 点击勾选后记录确认人和时间
- 全部勾选后触发 `all-confirmed`

**核查模式（监护人）**:
- 强制按序 + 每项需拍照确认
- 点击项目 → 弹出拍照 → 拍照后自动勾选
- 照片缩略图显示在项目右侧

## 5. 使用场景

| 页面 | 状态 | 角色 | 模式 |
|------|------|------|------|
| 新建作业票 | Draft | 负责人 | edit |
| 详情页 | Verify | 作业人 | confirm |
| 详情页 | Verify | 监护人 | verify（拍照） |
| 详情页 | 其他 | 其他角色 | readonly |

## 6. 与其他组件的关系

- FormRenderer 在字段类型为 `safetychecklist` 时渲染本组件
- PhotoUpload 在 verify 模式下内嵌用于逐项拍照

## 7. Demo 简化说明

| 完整产品功能 | Demo 简化方式 |
|-------------|-------------|
| 安全措施配置 | 预置 8 项动火作业安全措施 |
| 拍照确认 | 使用 PhotoUpload 组件（Base64 存储） |
| 数据持久化 | 不实现后端持久化，刷新后重置 |
| 🤖 AI 推荐安全措施 | Mock 实现：根据 work_type + work_zone 返回 2-4 条预置推荐，延迟 800ms；采纳后追加到清单末尾并标记 🤖 前缀 |
