# 03 - Signature 电子签名

> **组件路径**: `components/Signature/` | **使用页面**: 电子签名页 | **技术要点**: Canvas API, 鼠标/触摸支持, Base64 导出

---

## 1. 组件定位

电子手写签名组件。支持鼠标和触摸输入，导出 Base64 PNG 图片。移动端支持横屏全屏模式。

## 2. Props / Events 接口

```typescript
interface SignatureProps {
  width?: number          // 画布宽度（默认 400）
  height?: number         // 画布高度（默认 200）
  lineWidth?: number      // 线条粗细（默认 3，作业人模式 5）
  lineColor?: string      // 线条颜色（默认 #000）
  fullscreen?: boolean    // 全屏模式（移动端横屏）
  signer?: { name: string, role: string }  // 签名人信息
}

interface SignatureEvents {
  'confirm': (data: { base64: string, timestamp: string }) => void
  'clear': () => void
  'cancel': () => void
}
```

## 3. 视觉规格

- 画布背景：白色，1px 灰色虚线边框
- 线条：黑色，3px（标准）/ 5px（作业人手套模式）
- 提示文字：画布中央浅灰色"请在此区域签名"
- 全屏模式：`position: fixed; inset: 0`，横屏锁定

## 4. 交互行为

- 触摸/鼠标按下开始绘制，移动时实时渲染笔迹
- [清除重签] 清空画布
- [确认签名] 导出 `canvas.toDataURL('image/png')` 并触发 `confirm` 事件
- 空白画布点击确认时提示"请先签名"

## 5. 使用场景

| 页面 | 触发时机 | 模式 |
|------|---------|------|
| 电子签名页 | 提交/审批/核查/验收时 | 全屏横屏 |
| 详情页内嵌 | PC 端审批签名 | 内嵌 400×200 |

## 6. 与其他组件的关系

- FormRenderer 在字段类型为 `signature` 时渲染本组件
- 签名数据通过 `formData` 回传给 FormRenderer

## 7. Demo 简化说明

- 不集成 CA 数字签名，仅手写
- 不实现签名防篡改验证
- 横屏锁定依赖浏览器支持，不支持时提示手动旋转
