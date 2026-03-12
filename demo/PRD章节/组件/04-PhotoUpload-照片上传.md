# 04 - PhotoUpload 照片上传

> **组件路径**: `components/PhotoUpload/` | **使用页面**: 新建页、详情页 | **技术要点**: 拍照/相册, 自动压缩, 水印(时间+GPS)
> **关联**: 参考文档 §7.2.2 拍照卡点

---

## 1. 组件定位

照片上传组件，支持拍照和相册选择。可配置为约束卡点模式：强制实时拍摄、最少张数、自动水印。

## 2. Props / Events 接口

```typescript
interface PhotoUploadProps {
  photos: string[]              // 已上传照片 URL 列表
  maxCount?: number             // 最大张数（默认 9）
  minCount?: number             // 最少张数（约束卡点）
  forceCamera?: boolean         // 强制拍照（禁止相册选择）
  watermark?: WatermarkConfig   // 水印配置
  compress?: boolean            // 自动压缩（默认 true）
  readonly?: boolean            // 只读模式
}

interface WatermarkConfig {
  time?: boolean       // 时间水印
  gps?: boolean        // GPS 坐标水印
  ticketId?: string    // 作业票编号水印
}

interface PhotoUploadEvents {
  'update:photos': (urls: string[]) => void
  'upload': (file: File) => void
  'delete': (index: number) => void
  'preview': (index: number) => void
}
```

## 3. 视觉规格

- 照片缩略图：80×80px 圆角方块
- 添加按钮：虚线边框 + "+" 图标
- 水印：右下角半透明白色文字，12px
- 只读模式：无添加按钮，点击可放大预览

## 4. 交互行为

- 点击 "+" 按钮：`forceCamera=true` 时直接调用相机，否则弹出选择（拍照/相册）
- 拍照后自动压缩（目标 < 500KB）并添加水印
- 长按/右键删除已上传照片
- 点击缩略图全屏预览（支持左右滑动）
- 约束卡点：未达到 `minCount` 时阻断表单提交

## 5. 使用场景

| 页面 | 状态 | 模式 |
|------|------|------|
| 新建作业票 Step 2 | Draft | 上传模式，至少3张，仅限拍照 |
| 详情页（监护人核查） | Verify | 上传模式，逐项拍照确认 |
| 详情页（监护人执行） | Executing | 上传模式，拍照记录 |
| 详情页（其他角色） | 任意 | 只读预览模式 |

## 6. 与其他组件的关系

- FormRenderer 在字段类型为 `imageupload` 时渲染本组件
- MonitorPanel 内嵌本组件用于监护拍照

## 7. Demo 简化说明

- 照片存储为 Base64 在前端内存，不上传真实服务器
- 水印使用 Canvas 叠加文字，不实现 GPS 真实坐标（使用模拟坐标）
- AI 识别（安全帽、灭火器）不实现
- 压缩使用 `canvas.toBlob` 简单实现
