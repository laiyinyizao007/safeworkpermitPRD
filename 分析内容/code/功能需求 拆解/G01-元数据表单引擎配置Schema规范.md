# G-01 元数据表单引擎 — 配置 Schema 规范

> 版本：v1.0 | 基于积木化拆解方案第四层页面架构
> 核心原则：8种作业共用一套渲染引擎，差异全在配置层

---

## 1. 配置包总体结构

每种作业类型对应一个完整的配置包（PermitConfig），前端通过 `GET /api/metadata/{workType}` 获取：

```json
{
  "workType": "hot_work",
  "version": "1.0.0",
  "displayName": "动火作业",
  "icon": "fire",
  "color": "#FF4D4F",

  "classification": { ... },
  "form_schema": { ... },
  "personnel_config": { ... },
  "gas_detection_config": { ... },
  "checklist_config": { ... },
  "approval_flow": { ... },
  "constraint_rules": { ... },
  "role_view_config": { ... }
}
```

---

## 2. 各配置块 Schema 定义

### 2.1 classification — 作业分级配置

控制作业等级的自动判定逻辑和对应的审批层级、有效期。

```json
{
  "classification": {
    "enabled": true,
    "field_key": "work_level",
    "label": "作业等级",
    "levels": [
      {
        "value": "special",
        "label": "特级",
        "condition": "（由具体作业类型定义）",
        "validity_hours": 8,
        "approval_chain": ["unit_leader", "safety_dept", "company_leader"],
        "special_requirements": ["continuous_gas_monitoring", "video_recording"]
      },
      {
        "value": "level_1",
        "label": "一级",
        "condition": "...",
        "validity_hours": 8,
        "approval_chain": ["unit_leader", "safety_dept"]
      },
      {
        "value": "level_2",
        "label": "二级",
        "condition": "...",
        "validity_hours": 72,
        "approval_chain": ["unit_leader"]
      }
    ]
  }
}
```

### 2.2 form_schema — 表单字段定义

Schema-Layout-Instance 三层分离中的 Schema 层。按阶段（stage）组织字段分组（section）。

```json
{
  "form_schema": {
    "stages": {
      "apply": {
        "sections": [
          {
            "id": "basic_info",
            "title": "基本信息",
            "fields": [
              {
                "key": "work_location",
                "type": "text",
                "label": "作业地点",
                "required": true,
                "placeholder": "具体到装置/区域"
              },
              {
                "key": "planned_start",
                "type": "datetime",
                "label": "计划开始时间",
                "required": true,
                "constraints": {
                  "min_advance_hours": 24,
                  "message": "作业申请需提前至少1天"
                }
              },
              {
                "key": "planned_duration",
                "type": "number",
                "label": "预计时长(小时)",
                "required": true,
                "min": 0.5,
                "max": 72
              }
            ]
          },
          {
            "id": "work_specific",
            "title": "作业专项信息",
            "fields": "（由具体作业类型定义，见第3章）"
          }
        ]
      },
      "measures": {
        "sections": [
          {
            "id": "safety_checklist",
            "title": "安全措施确认",
            "type": "checklist",
            "enforce_order": true,
            "items": "（由具体作业类型定义）"
          }
        ]
      },
      "acceptance": {
        "sections": [
          {
            "id": "acceptance_checklist",
            "title": "完工验收",
            "type": "checklist",
            "items": "（由具体作业类型定义）"
          }
        ]
      }
    }
  }
}
```

**字段类型（type）枚举：**

| type | 说明 | 特有属性 |
| ---- | ---- | -------- |
| `text` | 单行文本 | `maxLength`, `pattern` |
| `textarea` | 多行文本 | `maxLength`, `rows` |
| `number` | 数字输入 | `min`, `max`, `unit`, `precision` |
| `select` | 单选下拉 | `options[]`, `allow_custom` |
| `multi_select` | 多选 | `options[]`, `min_select`, `max_select` |
| `datetime` | 日期时间 | `min_advance_hours`, `max_future_days` |
| `photo` | 拍照上传 | `source: "camera_only"`, `max_count`, `watermark: true` |
| `file` | 文件上传 | `accept`, `max_size_mb` |
| `signature` | 电子签名 | `signer_role`, `geo_fence_required` |
| `person_picker` | 人员选择器 | `role_filter`, `cert_required[]` |
| `area_picker` | 区域选择器 | `area_types[]` |
| `equipment_picker` | 设备选择器 | `equipment_type`, `cert_check` |
| `checklist` | 检查清单 | `enforce_order`, `photo_required`, `geo_fence` |
| `dynamic_table` | 动态明细表 | `columns[]`, `min_rows`, `max_rows` |
| `calculated` | 计算字段 | `expression`, `display_only` |
| `hidden` | 隐藏域 | `default_value`, `auto_fill` |

### 2.3 personnel_config — 人员角色配置

定义该作业类型涉及的角色、资质要求和系统行为。

```json
{
  "personnel_config": {
    "roles": [
      {
        "role_key": "applicant",
        "label": "作业申请人",
        "required": true,
        "max_count": 1,
        "cert_required": [],
        "description": "提出作业需求"
      },
      {
        "role_key": "responsible_person",
        "label": "作业负责人",
        "required": true,
        "max_count": 1,
        "cert_required": [],
        "description": "组织实施、协调现场"
      },
      {
        "role_key": "worker",
        "label": "作业人",
        "required": true,
        "max_count": 10,
        "cert_required": "（由具体作业类型定义）",
        "description": "执行具体操作"
      },
      {
        "role_key": "guardian",
        "label": "监护人",
        "required": true,
        "max_count": 3,
        "cert_required": ["guardian_cert"],
        "geo_fence_radius_m": 15,
        "absence_alarm": true,
        "description": "全程现场监护，不得擅离"
      },
      {
        "role_key": "approver",
        "label": "审批人",
        "required": true,
        "max_count": 3,
        "cert_required": [],
        "geo_fence_radius_m": 5,
        "description": "现场审批签字"
      },
      {
        "role_key": "safety_briefer",
        "label": "安全交底人",
        "required": true,
        "max_count": 1,
        "cert_required": [],
        "description": "交底危险因素和安全措施"
      },
      {
        "role_key": "acceptance_person",
        "label": "完工验收人",
        "required": true,
        "max_count": 1,
        "cert_required": [],
        "description": "现场验收确认"
      }
    ],
    "extra_roles": "（由具体作业类型定义，如气体检测人、起重机司机等）"
  }
}
```

### 2.4 gas_detection_config — 气体检测配置

仅动火、受限空间、盲板抽堵（按介质）启用。

```json
{
  "gas_detection_config": {
    "enabled": false,
    "fields": [],
    "retest_interval_min": null,
    "continuous_monitoring": false,
    "pre_work_window_min": null
  }
}
```

启用时的字段结构：

```json
{
  "fields": [
    {
      "key": "lel_value",
      "label": "可燃气体浓度",
      "unit": "%LEL",
      "type": "number",
      "precision": 1,
      "threshold": { "max": 20, "alarm_message": "可燃气体超标，禁止作业" },
      "standard_ref": "GB 30871-2022"
    }
  ]
}
```

### 2.5 checklist_config — 安全措施检查清单

```json
{
  "checklist_config": {
    "pre_work": {
      "title": "作业前安全措施确认",
      "enforce_order": true,
      "geo_fence_required": true,
      "items": [
        {
          "id": "item_01",
          "text": "（由具体作业类型定义）",
          "photo_required": false,
          "responsible_role": "guardian"
        }
      ]
    },
    "acceptance": {
      "title": "完工验收检查",
      "items": [
        {
          "id": "acc_01",
          "text": "（由具体作业类型定义）",
          "photo_required": true
        }
      ]
    }
  }
}
```

### 2.6 approval_flow — 审批流程配置

由 C-01 审批流程引擎消费，根据分级规则动态确定审批链。

```json
{
  "approval_flow": {
    "rules": [
      {
        "condition": "work_level == 'special'",
        "chain": ["unit_leader", "safety_dept", "company_leader"],
        "timeout_hours": 4,
        "escalation": "safety_dept_manager"
      }
    ],
    "delegate_enabled": true,
    "geo_fence_required": true,
    "signature_required": true
  }
}
```

### 2.7 constraint_rules — 约束规则配置

```json
{
  "constraint_rules": {
    "field_constraints": [
      {
        "type": "visibility",
        "target": "gas_detection_section",
        "expression": "gas_detection_config.enabled == true"
      },
      {
        "type": "required_if",
        "target": "lifting_plan_file",
        "expression": "work_level in ['special', 'level_1']",
        "message": "一级及以上作业必须上传作业方案"
      }
    ],
    "execution_constraints": {
      "photo_source": "camera_only",
      "photo_watermark": { "gps": true, "timestamp": true, "person": true },
      "geo_fence_for_checklist": true,
      "retest_on_interruption_min": 30
    }
  }
}
```

---

## 3. 八种作业完整配置包

> 以下为每种作业类型的完整 PermitConfig 配置包。通用字段（基本信息、人员通用角色等）在各配置中省略重复定义，仅展示**差异化部分**。

### 3.1 动火作业（hot_work）

```json
{
  "workType": "hot_work",
  "version": "1.0.0",
  "displayName": "动火作业",
  "icon": "fire",
  "color": "#FF4D4F",

  "classification": {
    "enabled": true,
    "field_key": "fire_level",
    "label": "动火等级",
    "levels": [
      {
        "value": "special",
        "label": "特级动火",
        "condition": "在生产运行的易燃易爆生产装置、输送管道、储罐、容器等部位及其他特殊危险场所",
        "validity_hours": 8,
        "approval_chain": ["unit_leader", "safety_dept", "company_leader"],
        "special_requirements": ["continuous_gas_monitoring", "video_recording", "fire_truck_standby"]
      },
      {
        "value": "level_1",
        "label": "一级动火",
        "condition": "在易燃易爆场所进行的除特级以外的动火作业",
        "validity_hours": 8,
        "approval_chain": ["unit_leader", "safety_dept"]
      },
      {
        "value": "level_2",
        "label": "二级动火",
        "condition": "在禁火区内进行的除特级、一级以外的动火作业",
        "validity_hours": 72,
        "approval_chain": ["unit_leader"]
      }
    ]
  },

  "form_schema": {
    "stages": {
      "apply": {
        "sections": [
          {
            "id": "basic_info",
            "title": "基本信息",
            "fields": [
              { "key": "work_location", "type": "area_picker", "label": "作业地点", "required": true, "area_types": ["production", "storage", "pipeline"] },
              { "key": "planned_start", "type": "datetime", "label": "计划开始时间", "required": true, "constraints": { "min_advance_hours": 24 } },
              { "key": "planned_duration", "type": "number", "label": "预计时长(小时)", "required": true, "min": 0.5, "max": 72 },
              { "key": "fire_level", "type": "calculated", "label": "动火等级", "expression": "auto_classify()", "display_only": true }
            ]
          },
          {
            "id": "work_specific",
            "title": "动火专项信息",
            "fields": [
              { "key": "fire_method", "type": "select", "label": "动火方式", "required": true, "options": [
                { "value": "welding", "label": "焊接" },
                { "value": "cutting", "label": "切割" },
                { "value": "grinding", "label": "打磨" },
                { "value": "other", "label": "其他" }
              ]},
              { "key": "fire_method_detail", "type": "text", "label": "动火方式说明", "required": false, "maxLength": 200 },
              { "key": "fire_point_description", "type": "textarea", "label": "动火点描述", "required": true, "placeholder": "描述动火点周围环境、可燃物分布", "maxLength": 500 },
              { "key": "isolation_measures", "type": "multi_select", "label": "隔离措施", "required": true, "options": [
                { "value": "blind_plate", "label": "盲板隔离" },
                { "value": "drain_clean", "label": "倒空清洗" },
                { "value": "replace", "label": "置换" },
                { "value": "water_seal", "label": "水封（不可替代盲板）" }
              ]},
              { "key": "fire_equipment", "type": "multi_select", "label": "消防器材配备", "required": true, "min_select": 1, "options": [
                { "value": "extinguisher", "label": "灭火器(≥2具)" },
                { "value": "fire_hose", "label": "消防水带" },
                { "value": "fire_blanket", "label": "防火毯" },
                { "value": "fire_truck", "label": "消防车（特级动火）" }
              ]},
              { "key": "surrounding_flammable", "type": "checklist", "label": "周围环境确认", "enforce_order": false, "items": [
                { "id": "fl_01", "text": "15m内无可燃液体排放" },
                { "id": "fl_02", "text": "30m内无可燃气体排放" },
                { "id": "fl_03", "text": "周围可燃物已清理" }
              ]}
            ]
          }
        ]
      },
      "measures": {
        "sections": [
          {
            "id": "gas_detection",
            "title": "气体检测",
            "type": "gas_detection",
            "fields": "见 gas_detection_config"
          },
          {
            "id": "safety_checklist",
            "title": "安全措施确认",
            "type": "checklist",
            "enforce_order": true,
            "items": "见 checklist_config.pre_work"
          }
        ]
      },
      "acceptance": {
        "sections": [
          {
            "id": "acceptance_checklist",
            "title": "完工验收",
            "type": "checklist",
            "items": "见 checklist_config.acceptance"
          }
        ]
      }
    }
  },

  "personnel_config": {
    "roles": [
      { "role_key": "applicant", "label": "作业申请人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "responsible_person", "label": "作业负责人", "required": true, "max_count": 1, "cert_required": [], "description": "有动火作业管理经验" },
      { "role_key": "worker", "label": "动火人", "required": true, "max_count": 5, "cert_required": ["welder_cert"], "description": "持有特种作业操作证（焊工证等）" },
      { "role_key": "guardian", "label": "监护人", "required": true, "max_count": 3, "cert_required": ["guardian_cert"], "geo_fence_radius_m": 15, "absence_alarm": true },
      { "role_key": "gas_detector", "label": "气体检测人", "required": true, "max_count": 2, "cert_required": ["gas_detection_cert"], "description": "持有气体检测资格证" },
      { "role_key": "safety_briefer", "label": "安全交底人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "approver", "label": "审批人", "required": true, "max_count": 3, "cert_required": [], "geo_fence_radius_m": 5 },
      { "role_key": "acceptance_person", "label": "完工验收人", "required": true, "max_count": 1, "cert_required": [] }
    ]
  },

  "gas_detection_config": {
    "enabled": true,
    "pre_work_window_min": 30,
    "retest_interval_min": 120,
    "continuous_monitoring": "fire_level == 'special'",
    "fields": [
      {
        "key": "lel_value",
        "label": "可燃气体浓度",
        "unit": "%LEL",
        "type": "number",
        "precision": 1,
        "threshold": {
          "max_condition": "explosion_lower_limit >= 4 ? 0.5 : 0.2",
          "alarm_message": "可燃气体超标，禁止动火"
        },
        "standard_ref": "GB 30871-2022"
      },
      {
        "key": "o2_value",
        "label": "氧含量",
        "unit": "%",
        "type": "number",
        "precision": 1,
        "threshold": { "min": 19.5, "max": 21, "alarm_message": "氧含量异常" },
        "standard_ref": "GB 30871-2022"
      },
      {
        "key": "toxic_value",
        "label": "有毒气体浓度",
        "unit": "mg/m³",
        "type": "number",
        "precision": 2,
        "threshold": { "max": "MAC_value", "alarm_message": "有毒气体超标" }
      }
    ]
  },

  "checklist_config": {
    "pre_work": {
      "title": "动火作业前安全措施确认",
      "enforce_order": true,
      "geo_fence_required": true,
      "items": [
        { "id": "hw_01", "text": "盲板隔离已到位（不能用阀门代替）", "photo_required": true, "responsible_role": "guardian" },
        { "id": "hw_02", "text": "设备已倒空、清洗、置换", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "hw_03", "text": "气体检测合格", "photo_required": true, "responsible_role": "gas_detector" },
        { "id": "hw_04", "text": "消防器材已配备到位（灭火器≥2具）", "photo_required": true, "responsible_role": "guardian" },
        { "id": "hw_05", "text": "15m内无可燃液体排放", "photo_required": false, "responsible_role": "guardian" },
        { "id": "hw_06", "text": "30m内无可燃气体排放", "photo_required": false, "responsible_role": "guardian" },
        { "id": "hw_07", "text": "周围可燃物已清理", "photo_required": true, "responsible_role": "guardian" },
        { "id": "hw_08", "text": "动火人持有效焊工证", "photo_required": false, "responsible_role": "guardian" },
        { "id": "hw_09", "text": "个体防护装备齐全（面罩/防护服/手套）", "photo_required": false, "responsible_role": "guardian" },
        { "id": "hw_10", "text": "安全交底已完成，全员签字确认", "photo_required": false, "responsible_role": "safety_briefer" }
      ]
    },
    "acceptance": {
      "title": "动火作业完工验收",
      "items": [
        { "id": "hw_acc_01", "text": "动火点已完全熄灭", "photo_required": true },
        { "id": "hw_acc_02", "text": "现场已清理干净", "photo_required": true },
        { "id": "hw_acc_03", "text": "周围无遗留火种", "photo_required": false },
        { "id": "hw_acc_04", "text": "安全设施已恢复", "photo_required": false },
        { "id": "hw_acc_05", "text": "盲板已拆除或恢复原状", "photo_required": true }
      ]
    }
  },

  "approval_flow": {
    "rules": [
      {
        "condition": "fire_level == 'special'",
        "chain": ["unit_leader", "safety_dept", "company_leader"],
        "timeout_hours": 4,
        "escalation": "safety_dept_manager"
      },
      {
        "condition": "fire_level == 'level_1'",
        "chain": ["unit_leader", "safety_dept"],
        "timeout_hours": 8,
        "escalation": "safety_dept_manager"
      },
      {
        "condition": "fire_level == 'level_2'",
        "chain": ["unit_leader"],
        "timeout_hours": 24,
        "escalation": "safety_dept"
      }
    ],
    "delegate_enabled": true,
    "geo_fence_required": true,
    "signature_required": true
  },

  "constraint_rules": {
    "field_constraints": [
      { "type": "required_if", "target": "fire_equipment.fire_truck", "expression": "fire_level == 'special'", "message": "特级动火必须配备消防车" },
      { "type": "required_if", "target": "work_plan_file", "expression": "fire_level == 'special'", "message": "特级动火必须上传作业方案" },
      { "type": "visibility", "target": "continuous_monitoring_panel", "expression": "fire_level == 'special'" }
    ],
    "execution_constraints": {
      "photo_source": "camera_only",
      "photo_watermark": { "gps": true, "timestamp": true, "person": true },
      "geo_fence_for_checklist": true,
      "retest_on_interruption_min": 30,
      "special_fire_video_recording": true,
      "isolation_zone_radius_m": { "liquid": 15, "gas": 30 }
    }
  }
}
```

### 3.2 受限空间作业（confined_space）

```json
{
  "workType": "confined_space",
  "version": "1.0.0",
  "displayName": "受限空间作业",
  "icon": "box",
  "color": "#722ED1",

  "classification": {
    "enabled": false,
    "comment": "受限空间作业不分级，统一按高风险管理"
  },

  "form_schema": {
    "stages": {
      "apply": {
        "sections": [
          {
            "id": "basic_info",
            "title": "基本信息",
            "fields": [
              { "key": "work_location", "type": "area_picker", "label": "作业地点", "required": true, "area_types": ["vessel", "tank", "pipeline", "pit", "sewer"] },
              { "key": "planned_start", "type": "datetime", "label": "计划开始时间", "required": true, "constraints": { "min_advance_hours": 24 } },
              { "key": "planned_duration", "type": "number", "label": "预计时长(小时)", "required": true, "min": 0.5, "max": 24 }
            ]
          },
          {
            "id": "work_specific",
            "title": "受限空间专项信息",
            "fields": [
              { "key": "space_type", "type": "select", "label": "受限空间类型", "required": true, "options": [
                { "value": "vessel", "label": "容器" },
                { "value": "tank", "label": "储罐" },
                { "value": "reactor", "label": "反应器" },
                { "value": "tower", "label": "塔器" },
                { "value": "pipeline", "label": "管道" },
                { "value": "pit", "label": "地坑/地下室" },
                { "value": "sewer", "label": "下水道/沟渠" },
                { "value": "other", "label": "其他" }
              ]},
              { "key": "space_volume", "type": "number", "label": "空间容积(m³)", "required": true, "min": 0.1 },
              { "key": "entry_exit_count", "type": "number", "label": "出入口数量", "required": true, "min": 1, "max": 10 },
              { "key": "previous_medium", "type": "multi_select", "label": "原存介质", "required": true, "options": [
                { "value": "flammable_gas", "label": "可燃气体" },
                { "value": "toxic_gas", "label": "有毒气体" },
                { "value": "flammable_liquid", "label": "可燃液体" },
                { "value": "corrosive", "label": "腐蚀性介质" },
                { "value": "inert_gas", "label": "惰性气体" },
                { "value": "none", "label": "无危险介质" }
              ]},
              { "key": "energy_isolation", "type": "checklist", "label": "能源隔离确认", "enforce_order": true, "items": [
                { "id": "ei_01", "text": "电气隔离（切断电源、挂牌上锁）" },
                { "id": "ei_02", "text": "管道隔离（盲板/断开）" },
                { "id": "ei_03", "text": "机械隔离（锁定转动部件）" },
                { "id": "ei_04", "text": "物料隔离（排空/清洗/置换）" }
              ]},
              { "key": "ventilation_method", "type": "select", "label": "通风方式", "required": true, "options": [
                { "value": "natural", "label": "自然通风" },
                { "value": "forced", "label": "强制通风" },
                { "value": "both", "label": "自然+强制" }
              ]},
              { "key": "rescue_equipment", "type": "multi_select", "label": "应急救援装备", "required": true, "min_select": 2, "options": [
                { "value": "scba", "label": "正压式空气呼吸器" },
                { "value": "lifeline", "label": "安全绳/救生索" },
                { "value": "tripod", "label": "三脚架救援系统" },
                { "value": "first_aid", "label": "急救箱" },
                { "value": "communication", "label": "通讯设备" }
              ]},
              { "key": "max_persons_inside", "type": "number", "label": "同时进入最大人数", "required": true, "min": 1, "max": 5 }
            ]
          }
        ]
      },
      "measures": {
        "sections": [
          {
            "id": "gas_detection",
            "title": "气体检测",
            "type": "gas_detection",
            "fields": "见 gas_detection_config"
          },
          {
            "id": "safety_checklist",
            "title": "安全措施确认",
            "type": "checklist",
            "enforce_order": true,
            "items": "见 checklist_config.pre_work"
          }
        ]
      },
      "acceptance": {
        "sections": [
          {
            "id": "personnel_count",
            "title": "人员清点",
            "fields": [
              { "key": "exit_headcount", "type": "number", "label": "出场人数", "required": true },
              { "key": "headcount_match", "type": "calculated", "label": "人数核对", "expression": "exit_headcount == entry_headcount", "display_only": true }
            ]
          },
          {
            "id": "acceptance_checklist",
            "title": "完工验收",
            "type": "checklist",
            "items": "见 checklist_config.acceptance"
          }
        ]
      }
    }
  },

  "personnel_config": {
    "roles": [
      { "role_key": "applicant", "label": "作业申请人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "responsible_person", "label": "作业负责人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "worker", "label": "作业人", "required": true, "max_count": 5, "cert_required": [], "description": "进入受限空间的作业人员" },
      { "role_key": "guardian", "label": "监护人", "required": true, "max_count": 3, "cert_required": ["guardian_cert"], "geo_fence_radius_m": 10, "absence_alarm": true, "description": "在受限空间外全程监护" },
      { "role_key": "gas_detector", "label": "气体检测人", "required": true, "max_count": 2, "cert_required": ["gas_detection_cert"] },
      { "role_key": "rescue_person", "label": "应急救援人员", "required": true, "max_count": 3, "cert_required": ["rescue_cert"], "description": "持有救援资质，随时待命" },
      { "role_key": "safety_briefer", "label": "安全交底人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "approver", "label": "审批人", "required": true, "max_count": 3, "cert_required": [], "geo_fence_radius_m": 5 },
      { "role_key": "acceptance_person", "label": "完工验收人", "required": true, "max_count": 1, "cert_required": [] }
    ]
  },

  "gas_detection_config": {
    "enabled": true,
    "pre_work_window_min": 30,
    "retest_interval_min": 30,
    "continuous_monitoring": true,
    "fields": [
      { "key": "o2_value", "label": "氧含量", "unit": "%", "type": "number", "precision": 1, "threshold": { "min": 19.5, "max": 23.5, "alarm_message": "氧含量异常，禁止进入" }, "standard_ref": "GB 30871-2022" },
      { "key": "lel_value", "label": "可燃气体浓度", "unit": "%LEL", "type": "number", "precision": 1, "threshold": { "max": 1, "alarm_message": "可燃气体超标" }, "standard_ref": "GB 30871-2022" },
      { "key": "h2s_value", "label": "硫化氢浓度", "unit": "ppm", "type": "number", "precision": 1, "threshold": { "max": 10, "alarm_message": "硫化氢超标，禁止进入" }, "standard_ref": "GBZ 2.1" },
      { "key": "co_value", "label": "一氧化碳浓度", "unit": "ppm", "type": "number", "precision": 1, "threshold": { "max": 24, "alarm_message": "一氧化碳超标" }, "standard_ref": "GBZ 2.1" }
    ]
  },

  "checklist_config": {
    "pre_work": {
      "title": "受限空间作业前安全措施确认",
      "enforce_order": true,
      "geo_fence_required": true,
      "items": [
        { "id": "cs_01", "text": "能源隔离已完成（电气/管道/机械/物料）", "photo_required": true, "responsible_role": "responsible_person" },
        { "id": "cs_02", "text": "受限空间已清洗/置换", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "cs_03", "text": "通风设备已安装并运行", "photo_required": true, "responsible_role": "guardian" },
        { "id": "cs_04", "text": "气体检测合格（O₂/H₂S/CO/LEL）", "photo_required": true, "responsible_role": "gas_detector" },
        { "id": "cs_05", "text": "应急救援装备已就位（呼吸器/救生索/三脚架）", "photo_required": true, "responsible_role": "rescue_person" },
        { "id": "cs_06", "text": "应急救援人员已到位", "photo_required": false, "responsible_role": "rescue_person" },
        { "id": "cs_07", "text": "通讯设备已测试正常", "photo_required": false, "responsible_role": "guardian" },
        { "id": "cs_08", "text": "进入人员已佩戴安全带/救生索", "photo_required": true, "responsible_role": "guardian" },
        { "id": "cs_09", "text": "出入口畅通无阻", "photo_required": true, "responsible_role": "guardian" },
        { "id": "cs_10", "text": "安全交底已完成，全员签字确认", "photo_required": false, "responsible_role": "safety_briefer" },
        { "id": "cs_11", "text": "进入人员登记（姓名/时间）", "photo_required": false, "responsible_role": "guardian" }
      ]
    },
    "acceptance": {
      "title": "受限空间作业完工验收",
      "items": [
        { "id": "cs_acc_01", "text": "所有人员已撤出受限空间", "photo_required": false },
        { "id": "cs_acc_02", "text": "人员清点完毕，人数一致", "photo_required": false },
        { "id": "cs_acc_03", "text": "工具材料已全部带出", "photo_required": true },
        { "id": "cs_acc_04", "text": "受限空间已封闭或恢复原状", "photo_required": true },
        { "id": "cs_acc_05", "text": "能源隔离已解除", "photo_required": false },
        { "id": "cs_acc_06", "text": "现场已清理干净", "photo_required": true }
      ]
    }
  },

  "approval_flow": {
    "rules": [
      {
        "condition": "true",
        "chain": ["unit_leader", "safety_dept"],
        "timeout_hours": 8,
        "escalation": "safety_dept_manager"
      }
    ],
    "delegate_enabled": true,
    "geo_fence_required": true,
    "signature_required": true
  },

  "constraint_rules": {
    "field_constraints": [
      { "type": "required_if", "target": "rescue_equipment", "expression": "true", "message": "受限空间作业必须配备应急救援装备" },
      { "type": "required_if", "target": "rescue_person", "expression": "true", "message": "受限空间作业必须指定应急救援人员" },
      { "type": "validation", "target": "max_persons_inside", "expression": "max_persons_inside <= 5", "message": "同时进入人数不得超过5人" }
    ],
    "execution_constraints": {
      "photo_source": "camera_only",
      "photo_watermark": { "gps": true, "timestamp": true, "person": true },
      "geo_fence_for_checklist": true,
      "retest_on_interruption_min": 30,
      "personnel_tracking": true,
      "entry_exit_log": true,
      "continuous_ventilation": true
    }
  }
}
```

### 3.3 盲板抽堵作业（blind_plate）

```json
{
  "workType": "blind_plate",
  "version": "1.0.0",
  "displayName": "盲板抽堵作业",
  "icon": "disconnect",
  "color": "#FA8C16",

  "classification": {
    "enabled": false,
    "comment": "盲板抽堵作业不分级，按介质危险性管理"
  },

  "form_schema": {
    "stages": {
      "apply": {
        "sections": [
          {
            "id": "basic_info",
            "title": "基本信息",
            "fields": [
              { "key": "work_location", "type": "area_picker", "label": "作业地点", "required": true },
              { "key": "planned_start", "type": "datetime", "label": "计划开始时间", "required": true, "constraints": { "min_advance_hours": 24 } },
              { "key": "planned_duration", "type": "number", "label": "预计时长(小时)", "required": true, "min": 0.5, "max": 24 }
            ]
          },
          {
            "id": "work_specific",
            "title": "盲板抽堵专项信息",
            "fields": [
              { "key": "operation_type", "type": "select", "label": "操作类型", "required": true, "options": [
                { "value": "insert", "label": "抽盲板（恢复管道连通）" },
                { "value": "remove", "label": "堵盲板（隔离管道）" }
              ]},
              { "key": "blind_plate_id", "type": "equipment_picker", "label": "盲板编号", "required": true, "equipment_type": "blind_plate", "description": "从盲板台账中选择" },
              { "key": "pipeline_info", "type": "text", "label": "管道信息", "required": true, "placeholder": "管道编号/名称/规格" },
              { "key": "medium_type", "type": "select", "label": "管道介质", "required": true, "options": [
                { "value": "flammable_gas", "label": "可燃气体" },
                { "value": "toxic_gas", "label": "有毒气体" },
                { "value": "flammable_liquid", "label": "可燃液体" },
                { "value": "corrosive", "label": "腐蚀性介质" },
                { "value": "steam", "label": "蒸汽" },
                { "value": "water", "label": "水" },
                { "value": "other", "label": "其他" }
              ]},
              { "key": "medium_temperature", "type": "number", "label": "介质温度(℃)", "required": true, "unit": "℃" },
              { "key": "medium_pressure", "type": "number", "label": "介质压力(MPa)", "required": true, "unit": "MPa", "precision": 2 },
              { "key": "pipe_diameter", "type": "number", "label": "管道直径(mm)", "required": true, "unit": "mm" },
              { "key": "depressurize_confirm", "type": "checklist", "label": "泄压降温确认", "enforce_order": true, "items": [
                { "id": "dp_01", "text": "管道已泄压至安全压力" },
                { "id": "dp_02", "text": "管道已降温至安全温度" },
                { "id": "dp_03", "text": "残余介质已排放/置换" }
              ]},
              { "key": "blind_plate_photo_before", "type": "photo", "label": "作业前盲板照片", "required": true, "source": "camera_only", "max_count": 3, "watermark": true }
            ]
          }
        ]
      },
      "measures": {
        "sections": [
          {
            "id": "safety_checklist",
            "title": "安全措施确认",
            "type": "checklist",
            "enforce_order": true,
            "items": "见 checklist_config.pre_work"
          }
        ]
      },
      "acceptance": {
        "sections": [
          {
            "id": "acceptance_checklist",
            "title": "完工验收",
            "type": "checklist",
            "items": "见 checklist_config.acceptance"
          },
          {
            "id": "blind_plate_after",
            "title": "盲板状态确认",
            "fields": [
              { "key": "blind_plate_photo_after", "type": "photo", "label": "作业后盲板照片", "required": true, "source": "camera_only", "max_count": 3, "watermark": true },
              { "key": "blind_plate_status_update", "type": "select", "label": "盲板台账状态更新", "required": true, "options": [
                { "value": "inserted", "label": "已抽出（管道连通）" },
                { "value": "removed", "label": "已堵上（管道隔离）" }
              ]}
            ]
          }
        ]
      }
    }
  },

  "personnel_config": {
    "roles": [
      { "role_key": "applicant", "label": "作业申请人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "responsible_person", "label": "作业负责人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "worker", "label": "作业人", "required": true, "max_count": 5, "cert_required": [], "description": "执行盲板抽堵操作" },
      { "role_key": "guardian", "label": "监护人", "required": true, "max_count": 3, "cert_required": ["guardian_cert"], "geo_fence_radius_m": 15, "absence_alarm": true },
      { "role_key": "safety_briefer", "label": "安全交底人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "approver", "label": "审批人", "required": true, "max_count": 3, "cert_required": [], "geo_fence_radius_m": 5 },
      { "role_key": "acceptance_person", "label": "完工验收人", "required": true, "max_count": 1, "cert_required": [] }
    ]
  },

  "gas_detection_config": {
    "enabled": true,
    "enabled_condition": "medium_type in ['flammable_gas', 'toxic_gas', 'flammable_liquid']",
    "pre_work_window_min": 30,
    "retest_interval_min": 60,
    "continuous_monitoring": false,
    "fields": [
      { "key": "lel_value", "label": "可燃气体浓度", "unit": "%LEL", "type": "number", "precision": 1, "threshold": { "max": 20, "alarm_message": "可燃气体超标" } },
      { "key": "toxic_value", "label": "有毒气体浓度", "unit": "ppm", "type": "number", "precision": 1, "threshold": { "max": "MAC_value", "alarm_message": "有毒气体超标" } }
    ]
  },

  "checklist_config": {
    "pre_work": {
      "title": "盲板抽堵作业前安全措施确认",
      "enforce_order": true,
      "geo_fence_required": true,
      "items": [
        { "id": "bp_01", "text": "管道已泄压至安全压力", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "bp_02", "text": "管道已降温至安全温度", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "bp_03", "text": "残余介质已排放/置换", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "bp_04", "text": "盲板编号与台账一致", "photo_required": true, "responsible_role": "guardian" },
        { "id": "bp_05", "text": "作业工具齐全（扳手/撬棒/密封垫等）", "photo_required": false, "responsible_role": "worker" },
        { "id": "bp_06", "text": "个体防护装备齐全", "photo_required": false, "responsible_role": "guardian" },
        { "id": "bp_07", "text": "气体检测合格（如涉及危险介质）", "photo_required": true, "responsible_role": "gas_detector" },
        { "id": "bp_08", "text": "安全交底已完成", "photo_required": false, "responsible_role": "safety_briefer" }
      ]
    },
    "acceptance": {
      "title": "盲板抽堵作业完工验收",
      "items": [
        { "id": "bp_acc_01", "text": "盲板抽堵操作已完成", "photo_required": true },
        { "id": "bp_acc_02", "text": "法兰连接密封良好，无泄漏", "photo_required": true },
        { "id": "bp_acc_03", "text": "盲板台账已更新", "photo_required": false },
        { "id": "bp_acc_04", "text": "作业前后照片对比确认", "photo_required": true },
        { "id": "bp_acc_05", "text": "现场已清理干净", "photo_required": true }
      ]
    }
  },

  "approval_flow": {
    "rules": [
      {
        "condition": "medium_type in ['flammable_gas', 'toxic_gas']",
        "chain": ["unit_leader", "safety_dept"],
        "timeout_hours": 8,
        "escalation": "safety_dept_manager"
      },
      {
        "condition": "true",
        "chain": ["unit_leader"],
        "timeout_hours": 24,
        "escalation": "safety_dept"
      }
    ],
    "delegate_enabled": true,
    "geo_fence_required": true,
    "signature_required": true
  },

  "constraint_rules": {
    "field_constraints": [
      { "type": "required_if", "target": "gas_detection_section", "expression": "medium_type in ['flammable_gas', 'toxic_gas', 'flammable_liquid']", "message": "涉及危险介质必须进行气体检测" },
      { "type": "validation", "target": "medium_pressure", "expression": "medium_pressure <= 0", "message": "作业前管道压力必须降至0" }
    ],
    "execution_constraints": {
      "photo_source": "camera_only",
      "photo_watermark": { "gps": true, "timestamp": true, "person": true },
      "geo_fence_for_checklist": true,
      "blind_plate_ledger_sync": true,
      "before_after_photo_compare": true
    }
  }
}
```

### 3.4 高处作业（work_at_height）

```json
{
  "workType": "work_at_height",
  "version": "1.0.0",
  "displayName": "高处作业",
  "icon": "arrow-up",
  "color": "#1890FF",

  "classification": {
    "enabled": true,
    "field_key": "height_level",
    "label": "高处作业等级",
    "auto_classify_field": "work_height",
    "levels": [
      {
        "value": "level_1",
        "label": "一级高处作业",
        "condition": "work_height >= 2 && work_height < 5",
        "validity_hours": 72,
        "approval_chain": ["unit_leader"]
      },
      {
        "value": "level_2",
        "label": "二级高处作业",
        "condition": "work_height >= 5 && work_height < 15",
        "validity_hours": 72,
        "approval_chain": ["unit_leader", "safety_dept"]
      },
      {
        "value": "level_3",
        "label": "三级高处作业",
        "condition": "work_height >= 15 && work_height < 30",
        "validity_hours": 24,
        "approval_chain": ["unit_leader", "safety_dept"]
      },
      {
        "value": "special",
        "label": "特级高处作业",
        "condition": "work_height >= 30",
        "validity_hours": 8,
        "approval_chain": ["unit_leader", "safety_dept", "company_leader"],
        "special_requirements": ["detailed_work_plan", "emergency_rescue_plan"]
      }
    ]
  },

  "form_schema": {
    "stages": {
      "apply": {
        "sections": [
          {
            "id": "basic_info",
            "title": "基本信息",
            "fields": [
              { "key": "work_location", "type": "area_picker", "label": "作业地点", "required": true },
              { "key": "planned_start", "type": "datetime", "label": "计划开始时间", "required": true, "constraints": { "min_advance_hours": 24 } },
              { "key": "planned_duration", "type": "number", "label": "预计时长(小时)", "required": true, "min": 0.5, "max": 72 }
            ]
          },
          {
            "id": "work_specific",
            "title": "高处作业专项信息",
            "fields": [
              { "key": "work_height", "type": "number", "label": "作业高度(m)", "required": true, "min": 2, "unit": "m", "precision": 1 },
              { "key": "height_level", "type": "calculated", "label": "作业等级", "expression": "auto_classify(work_height)", "display_only": true },
              { "key": "work_content", "type": "select", "label": "作业内容", "required": true, "options": [
                { "value": "install", "label": "安装" },
                { "value": "maintain", "label": "维修" },
                { "value": "inspect", "label": "检查" },
                { "value": "clean", "label": "清洁" },
                { "value": "paint", "label": "涂装" },
                { "value": "other", "label": "其他" }
              ]},
              { "key": "platform_type", "type": "select", "label": "作业平台类型", "required": true, "options": [
                { "value": "scaffold", "label": "脚手架" },
                { "value": "aerial_platform", "label": "高空作业平台" },
                { "value": "ladder", "label": "梯子" },
                { "value": "roof", "label": "屋顶/平台" },
                { "value": "structure", "label": "钢结构" },
                { "value": "other", "label": "其他" }
              ]},
              { "key": "fall_protection", "type": "multi_select", "label": "防坠落措施", "required": true, "min_select": 1, "options": [
                { "value": "safety_belt", "label": "安全带" },
                { "value": "safety_net", "label": "安全网" },
                { "value": "guardrail", "label": "护栏" },
                { "value": "lifeline", "label": "安全绳/生命线" },
                { "value": "hole_cover", "label": "孔洞盖板" }
              ]},
              { "key": "weather_check", "type": "checklist", "label": "天气条件确认", "enforce_order": false, "items": [
                { "id": "wc_01", "text": "风力小于5级" },
                { "id": "wc_02", "text": "无雨雪天气" },
                { "id": "wc_03", "text": "无雷电天气" },
                { "id": "wc_04", "text": "能见度良好" }
              ]},
              { "key": "ground_warning", "type": "checklist", "label": "地面警示", "enforce_order": false, "items": [
                { "id": "gw_01", "text": "已设置警戒区域" },
                { "id": "gw_02", "text": "已设置警示标志" },
                { "id": "gw_03", "text": "已安排地面监护" }
              ]}
            ]
          }
        ]
      },
      "measures": {
        "sections": [
          {
            "id": "safety_checklist",
            "title": "安全措施确认",
            "type": "checklist",
            "enforce_order": true,
            "items": "见 checklist_config.pre_work"
          }
        ]
      },
      "acceptance": {
        "sections": [
          {
            "id": "acceptance_checklist",
            "title": "完工验收",
            "type": "checklist",
            "items": "见 checklist_config.acceptance"
          }
        ]
      }
    }
  },

  "personnel_config": {
    "roles": [
      { "role_key": "applicant", "label": "作业申请人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "responsible_person", "label": "作业负责人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "worker", "label": "作业人", "required": true, "max_count": 10, "cert_required": ["height_work_cert"], "description": "持有高处作业操作证" },
      { "role_key": "guardian", "label": "监护人", "required": true, "max_count": 3, "cert_required": ["guardian_cert"], "geo_fence_radius_m": 15, "absence_alarm": true },
      { "role_key": "safety_briefer", "label": "安全交底人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "approver", "label": "审批人", "required": true, "max_count": 3, "cert_required": [], "geo_fence_radius_m": 5 },
      { "role_key": "acceptance_person", "label": "完工验收人", "required": true, "max_count": 1, "cert_required": [] }
    ]
  },

  "gas_detection_config": {
    "enabled": false
  },

  "checklist_config": {
    "pre_work": {
      "title": "高处作业前安全措施确认",
      "enforce_order": true,
      "geo_fence_required": true,
      "items": [
        { "id": "wh_01", "text": "作业平台/脚手架搭设牢固", "photo_required": true, "responsible_role": "responsible_person" },
        { "id": "wh_02", "text": "安全带已检查完好", "photo_required": false, "responsible_role": "guardian" },
        { "id": "wh_03", "text": "安全网/护栏已安装", "photo_required": true, "responsible_role": "guardian" },
        { "id": "wh_04", "text": "天气条件适宜（风力<5级、无雨雪雷电）", "photo_required": false, "responsible_role": "guardian" },
        { "id": "wh_05", "text": "地面警戒区域已设置", "photo_required": true, "responsible_role": "guardian" },
        { "id": "wh_06", "text": "工具已系防坠绳", "photo_required": false, "responsible_role": "worker" },
        { "id": "wh_07", "text": "作业人员身体状况良好（无高血压/心脏病/恐高症）", "photo_required": false, "responsible_role": "guardian" },
        { "id": "wh_08", "text": "个体防护装备齐全（安全帽/安全带/防滑鞋）", "photo_required": false, "responsible_role": "guardian" },
        { "id": "wh_09", "text": "安全交底已完成", "photo_required": false, "responsible_role": "safety_briefer" }
      ]
    },
    "acceptance": {
      "title": "高处作业完工验收",
      "items": [
        { "id": "wh_acc_01", "text": "作业人员已安全撤离高处", "photo_required": false },
        { "id": "wh_acc_02", "text": "工具材料已全部带下", "photo_required": false },
        { "id": "wh_acc_03", "text": "临时设施已拆除或固定", "photo_required": true },
        { "id": "wh_acc_04", "text": "地面警戒已解除", "photo_required": false },
        { "id": "wh_acc_05", "text": "现场已清理干净", "photo_required": true }
      ]
    }
  },

  "approval_flow": {
    "rules": [
      {
        "condition": "height_level == 'special'",
        "chain": ["unit_leader", "safety_dept", "company_leader"],
        "timeout_hours": 4,
        "escalation": "safety_dept_manager"
      },
      {
        "condition": "height_level in ['level_2', 'level_3']",
        "chain": ["unit_leader", "safety_dept"],
        "timeout_hours": 8,
        "escalation": "safety_dept_manager"
      },
      {
        "condition": "height_level == 'level_1'",
        "chain": ["unit_leader"],
        "timeout_hours": 24,
        "escalation": "safety_dept"
      }
    ],
    "delegate_enabled": true,
    "geo_fence_required": true,
    "signature_required": true
  },

  "constraint_rules": {
    "field_constraints": [
      { "type": "required_if", "target": "work_plan_file", "expression": "height_level == 'special'", "message": "特级高处作业必须上传作业方案" },
      { "type": "required_if", "target": "emergency_plan_file", "expression": "height_level == 'special'", "message": "特级高处作业必须上传应急预案" },
      { "type": "validation", "target": "weather_check", "expression": "wind_speed < 5", "message": "风力≥5级禁止高处作业" }
    ],
    "execution_constraints": {
      "photo_source": "camera_only",
      "photo_watermark": { "gps": true, "timestamp": true, "person": true },
      "geo_fence_for_checklist": true,
      "weather_monitoring": true,
      "wind_speed_alarm_threshold": 5
    }
  }
}
```

### 3.5 吊装作业（hoisting）

```json
{
  "workType": "hoisting",
  "version": "1.0.0",
  "displayName": "吊装作业",
  "icon": "build",
  "color": "#13C2C2",

  "classification": {
    "enabled": true,
    "field_key": "hoisting_level",
    "label": "吊装等级",
    "auto_classify_field": "lifting_weight",
    "levels": [
      {
        "value": "level_1",
        "label": "一级吊装",
        "condition": "lifting_weight > 100",
        "validity_hours": 8,
        "approval_chain": ["unit_leader", "safety_dept", "company_leader"],
        "special_requirements": ["lifting_plan", "emergency_plan"]
      },
      {
        "value": "level_2",
        "label": "二级吊装",
        "condition": "lifting_weight >= 40 && lifting_weight <= 100",
        "validity_hours": 24,
        "approval_chain": ["unit_leader", "safety_dept"],
        "special_requirements": ["lifting_plan"]
      },
      {
        "value": "level_3",
        "label": "三级吊装",
        "condition": "lifting_weight < 40",
        "validity_hours": 72,
        "approval_chain": ["unit_leader"]
      }
    ]
  },

  "form_schema": {
    "stages": {
      "apply": {
        "sections": [
          {
            "id": "basic_info",
            "title": "基本信息",
            "fields": [
              { "key": "work_location", "type": "area_picker", "label": "作业地点", "required": true },
              { "key": "planned_start", "type": "datetime", "label": "计划开始时间", "required": true, "constraints": { "min_advance_hours": 24 } },
              { "key": "planned_duration", "type": "number", "label": "预计时长(小时)", "required": true, "min": 0.5, "max": 24 }
            ]
          },
          {
            "id": "work_specific",
            "title": "吊装专项信息",
            "fields": [
              { "key": "lifting_object", "type": "text", "label": "吊装物品名称", "required": true },
              { "key": "lifting_weight", "type": "number", "label": "吊装重量(吨)", "required": true, "min": 0.1, "unit": "吨", "precision": 1 },
              { "key": "lifting_dimensions", "type": "text", "label": "吊装物尺寸(长×宽×高)", "required": true, "placeholder": "如：3m×2m×1.5m" },
              { "key": "hoisting_level", "type": "calculated", "label": "吊装等级", "expression": "auto_classify(lifting_weight)", "display_only": true },
              { "key": "crane_type", "type": "equipment_picker", "label": "起重机型号", "required": true, "equipment_type": "crane", "cert_check": true },
              { "key": "rated_capacity", "type": "number", "label": "额定起重量(吨)", "required": true, "unit": "吨" },
              { "key": "working_radius", "type": "number", "label": "工作半径(m)", "required": true, "unit": "m" },
              { "key": "lifting_path", "type": "textarea", "label": "吊装路径描述", "required": true, "placeholder": "起吊点→移动路径→落点" },
              { "key": "lifting_points", "type": "number", "label": "吊点数量", "required": true, "min": 1, "max": 8 },
              { "key": "dual_crane", "type": "select", "label": "是否双机抬吊", "required": true, "options": [
                { "value": "no", "label": "否（单机吊装）" },
                { "value": "yes", "label": "是（双机抬吊）" }
              ]},
              { "key": "warning_zone_radius", "type": "number", "label": "警戒区域半径(m)", "required": true, "min": 10, "unit": "m", "default_value": 10 },
              { "key": "weather_check", "type": "checklist", "label": "天气条件确认", "enforce_order": false, "items": [
                { "id": "wc_01", "text": "风力小于5级" },
                { "id": "wc_02", "text": "无雨雪天气" }
              ]}
            ]
          }
        ]
      },
      "measures": {
        "sections": [
          {
            "id": "equipment_check",
            "title": "设备检查",
            "type": "checklist",
            "enforce_order": true,
            "items": [
              { "id": "ec_01", "text": "起重机机械部分检查合格（制动器/限位器/钢丝绳/吊钩/滑轮）", "photo_required": true },
              { "id": "ec_02", "text": "起重机电气部分检查合格（控制系统/安全装置）", "photo_required": false },
              { "id": "ec_03", "text": "吊具检查合格（钢丝绳/吊钩/卸扣/吊带）", "photo_required": true },
              { "id": "ec_04", "text": "地面承载力满足要求", "photo_required": false },
              { "id": "ec_05", "text": "空载试运行正常", "photo_required": false }
            ]
          },
          {
            "id": "safety_checklist",
            "title": "安全措施确认",
            "type": "checklist",
            "enforce_order": true,
            "items": "见 checklist_config.pre_work"
          }
        ]
      },
      "acceptance": {
        "sections": [
          {
            "id": "acceptance_checklist",
            "title": "完工验收",
            "type": "checklist",
            "items": "见 checklist_config.acceptance"
          }
        ]
      }
    }
  },

  "personnel_config": {
    "roles": [
      { "role_key": "applicant", "label": "作业申请人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "responsible_person", "label": "作业负责人", "required": true, "max_count": 1, "cert_required": [], "description": "有吊装作业管理经验" },
      { "role_key": "crane_operator", "label": "起重机司机", "required": true, "max_count": 2, "cert_required": ["crane_operator_cert"], "description": "持有起重机操作证" },
      { "role_key": "rigger", "label": "司索工", "required": true, "max_count": 4, "cert_required": ["rigger_cert"], "description": "持有司索工操作证" },
      { "role_key": "signal_person", "label": "信号指挥人员", "required": true, "max_count": 2, "cert_required": ["signal_cert"], "description": "持有指挥证" },
      { "role_key": "guardian", "label": "监护人", "required": true, "max_count": 3, "cert_required": ["guardian_cert"], "geo_fence_radius_m": 15, "absence_alarm": true },
      { "role_key": "ground_guard", "label": "地面警戒人员", "required": true, "max_count": 4, "cert_required": [], "description": "设置警戒区域，禁止无关人员进入" },
      { "role_key": "safety_briefer", "label": "安全交底人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "approver", "label": "审批人", "required": true, "max_count": 3, "cert_required": [], "geo_fence_radius_m": 5 },
      { "role_key": "acceptance_person", "label": "完工验收人", "required": true, "max_count": 1, "cert_required": [] }
    ]
  },

  "gas_detection_config": {
    "enabled": false
  },

  "checklist_config": {
    "pre_work": {
      "title": "吊装作业前安全措施确认",
      "enforce_order": true,
      "geo_fence_required": true,
      "items": [
        { "id": "hs_01", "text": "吊装方案已审核（一级/二级必须）", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "hs_02", "text": "起重机检查合格", "photo_required": true, "responsible_role": "crane_operator" },
        { "id": "hs_03", "text": "吊具检查合格", "photo_required": true, "responsible_role": "rigger" },
        { "id": "hs_04", "text": "地面承载力满足要求", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "hs_05", "text": "警戒区域已设置", "photo_required": true, "responsible_role": "ground_guard" },
        { "id": "hs_06", "text": "天气条件适宜（风力<5级、无雨雪）", "photo_required": false, "responsible_role": "guardian" },
        { "id": "hs_07", "text": "信号指挥人员到位", "photo_required": false, "responsible_role": "signal_person" },
        { "id": "hs_08", "text": "试吊完成（离地10-20cm检查平衡）", "photo_required": true, "responsible_role": "signal_person" },
        { "id": "hs_09", "text": "安全交底已完成", "photo_required": false, "responsible_role": "safety_briefer" }
      ]
    },
    "acceptance": {
      "title": "吊装作业完工验收",
      "items": [
        { "id": "hs_acc_01", "text": "吊装物已安全就位", "photo_required": true },
        { "id": "hs_acc_02", "text": "吊具已摘除", "photo_required": false },
        { "id": "hs_acc_03", "text": "起重机已恢复安全状态", "photo_required": false },
        { "id": "hs_acc_04", "text": "警戒区域已解除", "photo_required": false },
        { "id": "hs_acc_05", "text": "现场已清理干净", "photo_required": true }
      ]
    }
  },

  "approval_flow": {
    "rules": [
      {
        "condition": "hoisting_level == 'level_1'",
        "chain": ["unit_leader", "safety_dept", "company_leader"],
        "timeout_hours": 4,
        "escalation": "safety_dept_manager"
      },
      {
        "condition": "hoisting_level == 'level_2'",
        "chain": ["unit_leader", "safety_dept"],
        "timeout_hours": 8,
        "escalation": "safety_dept_manager"
      },
      {
        "condition": "hoisting_level == 'level_3'",
        "chain": ["unit_leader"],
        "timeout_hours": 24,
        "escalation": "safety_dept"
      }
    ],
    "delegate_enabled": true,
    "geo_fence_required": true,
    "signature_required": true
  },

  "constraint_rules": {
    "field_constraints": [
      { "type": "required_if", "target": "lifting_plan_file", "expression": "hoisting_level in ['level_1', 'level_2']", "message": "一级/二级吊装必须上传吊装方案" },
      { "type": "required_if", "target": "emergency_plan_file", "expression": "hoisting_level == 'level_1'", "message": "一级吊装必须上传应急预案" },
      { "type": "validation", "target": "dual_crane_load", "expression": "dual_crane == 'yes' ? each_load <= rated_capacity * 0.8 : true", "message": "双机抬吊时各承受载荷≤80%额定能力" },
      { "type": "validation", "target": "crane_cert", "expression": "crane_inspection_valid == true", "message": "起重机检验证必须在有效期内" }
    ],
    "execution_constraints": {
      "photo_source": "camera_only",
      "photo_watermark": { "gps": true, "timestamp": true, "person": true },
      "geo_fence_for_checklist": true,
      "weather_monitoring": true,
      "wind_speed_alarm_threshold": 5,
      "overload_monitoring": true,
      "warning_zone_geo_fence": true
    }
  }
}
```

### 3.6 临时用电作业（temporary_electrical）

```json
{
  "workType": "temporary_electrical",
  "version": "1.0.0",
  "displayName": "临时用电作业",
  "icon": "thunderbolt",
  "color": "#FAAD14",

  "classification": {
    "enabled": false,
    "comment": "临时用电作业不分级"
  },

  "form_schema": {
    "stages": {
      "apply": {
        "sections": [
          {
            "id": "basic_info",
            "title": "基本信息",
            "fields": [
              { "key": "work_location", "type": "area_picker", "label": "用电地点", "required": true },
              { "key": "planned_start", "type": "datetime", "label": "计划开始时间", "required": true, "constraints": { "min_advance_hours": 24 } },
              { "key": "planned_duration", "type": "number", "label": "预计用电时长(小时)", "required": true, "min": 1, "max": 720 }
            ]
          },
          {
            "id": "work_specific",
            "title": "临时用电专项信息",
            "fields": [
              { "key": "power_purpose", "type": "textarea", "label": "用电目的", "required": true, "placeholder": "说明临时用电的具体用途" },
              { "key": "power_source", "type": "text", "label": "电源接入点", "required": true, "placeholder": "配电箱编号/位置" },
              { "key": "voltage_level", "type": "select", "label": "电压等级", "required": true, "options": [
                { "value": "220v", "label": "220V" },
                { "value": "380v", "label": "380V" },
                { "value": "other", "label": "其他" }
              ]},
              { "key": "max_power", "type": "number", "label": "最大用电功率(kW)", "required": true, "unit": "kW" },
              { "key": "cable_length", "type": "number", "label": "电缆长度(m)", "required": true, "unit": "m" },
              { "key": "cable_spec", "type": "text", "label": "电缆规格", "required": true, "placeholder": "如：YC 3×4+1×2.5" },
              { "key": "electrical_plan", "type": "file", "label": "用电方案", "required": true, "accept": ".pdf,.doc,.docx,.jpg,.png" },
              { "key": "leakage_protector", "type": "checklist", "label": "漏电保护确认", "enforce_order": false, "items": [
                { "id": "lp_01", "text": "漏电保护器已安装" },
                { "id": "lp_02", "text": "漏电保护器动作灵敏" },
                { "id": "lp_03", "text": "接地保护完好" }
              ]},
              { "key": "explosion_proof", "type": "select", "label": "是否在防爆区域", "required": true, "options": [
                { "value": "yes", "label": "是（需使用防爆电气设备）" },
                { "value": "no", "label": "否" }
              ]}
            ]
          }
        ]
      },
      "measures": {
        "sections": [
          {
            "id": "safety_checklist",
            "title": "安全措施确认",
            "type": "checklist",
            "enforce_order": true,
            "items": "见 checklist_config.pre_work"
          }
        ]
      },
      "acceptance": {
        "sections": [
          {
            "id": "acceptance_checklist",
            "title": "完工验收",
            "type": "checklist",
            "items": "见 checklist_config.acceptance"
          }
        ]
      }
    }
  },

  "personnel_config": {
    "roles": [
      { "role_key": "applicant", "label": "作业申请人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "responsible_person", "label": "作业负责人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "electrician", "label": "电工", "required": true, "max_count": 3, "cert_required": ["electrician_cert"], "description": "持有电工操作证" },
      { "role_key": "guardian", "label": "监护人", "required": true, "max_count": 3, "cert_required": ["guardian_cert"], "geo_fence_radius_m": 15, "absence_alarm": true },
      { "role_key": "safety_briefer", "label": "安全交底人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "approver", "label": "审批人", "required": true, "max_count": 3, "cert_required": [], "geo_fence_radius_m": 5 },
      { "role_key": "acceptance_person", "label": "完工验收人", "required": true, "max_count": 1, "cert_required": [] }
    ]
  },

  "gas_detection_config": {
    "enabled": false
  },

  "checklist_config": {
    "pre_work": {
      "title": "临时用电作业前安全措施确认",
      "enforce_order": true,
      "geo_fence_required": true,
      "items": [
        { "id": "te_01", "text": "用电方案已审核", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "te_02", "text": "电源接入点确认安全", "photo_required": true, "responsible_role": "electrician" },
        { "id": "te_03", "text": "电缆敷设规范（无破损/无裸露/无浸水）", "photo_required": true, "responsible_role": "electrician" },
        { "id": "te_04", "text": "漏电保护器安装并测试正常", "photo_required": true, "responsible_role": "electrician" },
        { "id": "te_05", "text": "接地保护完好", "photo_required": false, "responsible_role": "electrician" },
        { "id": "te_06", "text": "防爆区域使用防爆电气设备（如适用）", "photo_required": true, "responsible_role": "electrician" },
        { "id": "te_07", "text": "警示标志已设置", "photo_required": true, "responsible_role": "guardian" },
        { "id": "te_08", "text": "安全交底已完成", "photo_required": false, "responsible_role": "safety_briefer" }
      ]
    },
    "acceptance": {
      "title": "临时用电作业完工验收",
      "items": [
        { "id": "te_acc_01", "text": "临时用电设备已断电", "photo_required": false },
        { "id": "te_acc_02", "text": "电缆已拆除回收", "photo_required": true },
        { "id": "te_acc_03", "text": "电源接入点已恢复原状", "photo_required": true },
        { "id": "te_acc_04", "text": "现场已清理干净", "photo_required": true }
      ]
    }
  },

  "approval_flow": {
    "rules": [
      {
        "condition": "explosion_proof == 'yes'",
        "chain": ["unit_leader", "safety_dept"],
        "timeout_hours": 8,
        "escalation": "safety_dept_manager"
      },
      {
        "condition": "true",
        "chain": ["unit_leader"],
        "timeout_hours": 24,
        "escalation": "safety_dept"
      }
    ],
    "delegate_enabled": true,
    "geo_fence_required": true,
    "signature_required": true
  },

  "constraint_rules": {
    "field_constraints": [
      { "type": "required_if", "target": "explosion_proof_equipment_list", "expression": "explosion_proof == 'yes'", "message": "防爆区域必须列出防爆电气设备清单" },
      { "type": "validation", "target": "leakage_protector", "expression": "all_checked == true", "message": "漏电保护器必须安装并测试正常" }
    ],
    "execution_constraints": {
      "photo_source": "camera_only",
      "photo_watermark": { "gps": true, "timestamp": true, "person": true },
      "geo_fence_for_checklist": true,
      "electrical_monitoring": true,
      "overtime_alarm": true,
      "current_temperature_monitoring": true
    }
  }
}
```

### 3.7 动土作业（excavation）

```json
{
  "workType": "excavation",
  "version": "1.0.0",
  "displayName": "动土作业",
  "icon": "tool",
  "color": "#8B4513",

  "classification": {
    "enabled": false,
    "comment": "动土作业不分级"
  },

  "form_schema": {
    "stages": {
      "apply": {
        "sections": [
          {
            "id": "basic_info",
            "title": "基本信息",
            "fields": [
              { "key": "work_location", "type": "area_picker", "label": "动土地点", "required": true },
              { "key": "planned_start", "type": "datetime", "label": "计划开始时间", "required": true, "constraints": { "min_advance_hours": 24 } },
              { "key": "planned_duration", "type": "number", "label": "预计时长(小时)", "required": true, "min": 1, "max": 720 }
            ]
          },
          {
            "id": "work_specific",
            "title": "动土专项信息",
            "fields": [
              { "key": "excavation_purpose", "type": "textarea", "label": "动土目的", "required": true },
              { "key": "excavation_range", "type": "text", "label": "动土范围(长×宽×深)", "required": true, "placeholder": "如：10m×5m×2m" },
              { "key": "excavation_length", "type": "number", "label": "长度(m)", "required": true, "unit": "m" },
              { "key": "excavation_width", "type": "number", "label": "宽度(m)", "required": true, "unit": "m" },
              { "key": "excavation_depth", "type": "number", "label": "深度(m)", "required": true, "unit": "m" },
              { "key": "underground_pipeline", "type": "checklist", "label": "地下管线确认", "enforce_order": true, "items": [
                { "id": "up_01", "text": "已查阅地下管线图纸" },
                { "id": "up_02", "text": "已使用探测设备探测" },
                { "id": "up_03", "text": "已标识地下管线位置" },
                { "id": "up_04", "text": "已通知相关管线管理部门" }
              ]},
              { "key": "pipeline_drawing", "type": "file", "label": "地下管线图纸", "required": true, "accept": ".pdf,.dwg,.jpg,.png" },
              { "key": "detection_equipment", "type": "text", "label": "探测设备", "required": true, "placeholder": "管线探测仪型号" },
              { "key": "affected_departments", "type": "multi_select", "label": "涉及部门", "required": true, "options": [
                { "value": "production", "label": "生产部门" },
                { "value": "equipment", "label": "设备部门" },
                { "value": "electrical", "label": "电气部门" },
                { "value": "instrument", "label": "仪表部门" },
                { "value": "fire", "label": "消防部门" },
                { "value": "other", "label": "其他" }
              ]},
              { "key": "soil_support", "type": "select", "label": "是否需要支护", "required": true, "options": [
                { "value": "yes", "label": "是" },
                { "value": "no", "label": "否" }
              ]}
            ]
          }
        ]
      },
      "measures": {
        "sections": [
          {
            "id": "safety_checklist",
            "title": "安全措施确认",
            "type": "checklist",
            "enforce_order": true,
            "items": "见 checklist_config.pre_work"
          }
        ]
      },
      "acceptance": {
        "sections": [
          {
            "id": "acceptance_checklist",
            "title": "完工验收",
            "type": "checklist",
            "items": "见 checklist_config.acceptance"
          }
        ]
      }
    }
  },

  "personnel_config": {
    "roles": [
      { "role_key": "applicant", "label": "作业申请人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "responsible_person", "label": "作业负责人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "worker", "label": "作业人", "required": true, "max_count": 10, "cert_required": [] },
      { "role_key": "guardian", "label": "监护人", "required": true, "max_count": 3, "cert_required": ["guardian_cert"], "geo_fence_radius_m": 15, "absence_alarm": true },
      { "role_key": "safety_briefer", "label": "安全交底人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "approver", "label": "审批人", "required": true, "max_count": 3, "cert_required": [], "geo_fence_radius_m": 5 },
      { "role_key": "acceptance_person", "label": "完工验收人", "required": true, "max_count": 1, "cert_required": [] }
    ]
  },

  "gas_detection_config": {
    "enabled": false
  },

  "checklist_config": {
    "pre_work": {
      "title": "动土作业前安全措施确认",
      "enforce_order": true,
      "geo_fence_required": true,
      "items": [
        { "id": "ex_01", "text": "地下管线图纸已确认", "photo_required": true, "responsible_role": "responsible_person" },
        { "id": "ex_02", "text": "管线探测已完成", "photo_required": true, "responsible_role": "responsible_person" },
        { "id": "ex_03", "text": "地下管线已标识", "photo_required": true, "responsible_role": "responsible_person" },
        { "id": "ex_04", "text": "相关部门已通知", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "ex_05", "text": "动土范围已标定", "photo_required": true, "responsible_role": "guardian" },
        { "id": "ex_06", "text": "支护措施已落实（如需要）", "photo_required": true, "responsible_role": "responsible_person" },
        { "id": "ex_07", "text": "警示标志已设置", "photo_required": true, "responsible_role": "guardian" },
        { "id": "ex_08", "text": "安全交底已完成", "photo_required": false, "responsible_role": "safety_briefer" }
      ]
    },
    "acceptance": {
      "title": "动土作业完工验收",
      "items": [
        { "id": "ex_acc_01", "text": "动土作业已完成", "photo_required": true },
        { "id": "ex_acc_02", "text": "地下管线未受损", "photo_required": true },
        { "id": "ex_acc_03", "text": "回填或支护已完成", "photo_required": true },
        { "id": "ex_acc_04", "text": "地面已恢复或设置围挡", "photo_required": true },
        { "id": "ex_acc_05", "text": "现场已清理干净", "photo_required": true }
      ]
    }
  },

  "approval_flow": {
    "rules": [
      {
        "condition": "true",
        "chain": ["unit_leader", "safety_dept"],
        "timeout_hours": 24,
        "escalation": "safety_dept_manager"
      }
    ],
    "delegate_enabled": true,
    "geo_fence_required": true,
    "signature_required": true
  },

  "constraint_rules": {
    "field_constraints": [
      { "type": "required_if", "target": "pipeline_drawing", "expression": "true", "message": "动土作业必须提供地下管线图纸" },
      { "type": "required_if", "target": "support_plan", "expression": "soil_support == 'yes'", "message": "需要支护时必须提供支护方案" }
    ],
    "execution_constraints": {
      "photo_source": "camera_only",
      "photo_watermark": { "gps": true, "timestamp": true, "person": true },
      "geo_fence_for_checklist": true,
      "pipeline_proximity_alarm": true,
      "depth_monitoring": true
    }
  }
}
```

### 3.8 断路作业（road_closure）

```json
{
  "workType": "road_closure",
  "version": "1.0.0",
  "displayName": "断路作业",
  "icon": "stop",
  "color": "#F5222D",

  "classification": {
    "enabled": false,
    "comment": "断路作业不分级"
  },

  "form_schema": {
    "stages": {
      "apply": {
        "sections": [
          {
            "id": "basic_info",
            "title": "基本信息",
            "fields": [
              { "key": "work_location", "type": "area_picker", "label": "断路地点", "required": true },
              { "key": "planned_start", "type": "datetime", "label": "计划开始时间", "required": true, "constraints": { "min_advance_hours": 24 } },
              { "key": "planned_duration", "type": "number", "label": "预计时长(小时)", "required": true, "min": 1, "max": 720 }
            ]
          },
          {
            "id": "work_specific",
            "title": "断路专项信息",
            "fields": [
              { "key": "closure_reason", "type": "textarea", "label": "断路原因", "required": true },
              { "key": "road_name", "type": "text", "label": "道路名称/编号", "required": true },
              { "key": "closure_range", "type": "text", "label": "断路范围", "required": true, "placeholder": "从XX路口到XX路口" },
              { "key": "closure_length", "type": "number", "label": "断路长度(m)", "required": true, "unit": "m" },
              { "key": "detour_plan", "type": "textarea", "label": "绕行方案", "required": true, "placeholder": "描述车辆和人员的绕行路线" },
              { "key": "traffic_plan", "type": "textarea", "label": "交通组织方案", "required": true, "placeholder": "描述交通疏导措施" },
              { "key": "warning_signs", "type": "checklist", "label": "警示标志设置", "enforce_order": false, "items": [
                { "id": "ws_01", "text": "提前100m设置警示标志" },
                { "id": "ws_02", "text": "设置绕行指示标志" },
                { "id": "ws_03", "text": "夜间设置反光标志/警示灯" },
                { "id": "ws_04", "text": "设置路障/隔离设施" }
              ]},
              { "key": "emergency_channel", "type": "select", "label": "应急通道是否保留", "required": true, "options": [
                { "value": "yes", "label": "是（已确认应急通道畅通）" },
                { "value": "no", "label": "否（已制定替代应急方案）" }
              ]},
              { "key": "detour_map", "type": "file", "label": "绕行路线图", "required": true, "accept": ".pdf,.jpg,.png" }
            ]
          }
        ]
      },
      "measures": {
        "sections": [
          {
            "id": "safety_checklist",
            "title": "安全措施确认",
            "type": "checklist",
            "enforce_order": true,
            "items": "见 checklist_config.pre_work"
          }
        ]
      },
      "acceptance": {
        "sections": [
          {
            "id": "acceptance_checklist",
            "title": "完工验收",
            "type": "checklist",
            "items": "见 checklist_config.acceptance"
          }
        ]
      }
    }
  },

  "personnel_config": {
    "roles": [
      { "role_key": "applicant", "label": "作业申请人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "responsible_person", "label": "作业负责人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "worker", "label": "作业人", "required": true, "max_count": 10, "cert_required": [] },
      { "role_key": "guardian", "label": "监护人", "required": true, "max_count": 3, "cert_required": ["guardian_cert"], "geo_fence_radius_m": 15, "absence_alarm": true },
      { "role_key": "safety_briefer", "label": "安全交底人", "required": true, "max_count": 1, "cert_required": [] },
      { "role_key": "approver", "label": "审批人", "required": true, "max_count": 3, "cert_required": [], "geo_fence_radius_m": 5 },
      { "role_key": "acceptance_person", "label": "完工验收人", "required": true, "max_count": 1, "cert_required": [] }
    ]
  },

  "gas_detection_config": {
    "enabled": false
  },

  "checklist_config": {
    "pre_work": {
      "title": "断路作业前安全措施确认",
      "enforce_order": true,
      "geo_fence_required": true,
      "items": [
        { "id": "rc_01", "text": "绕行方案已制定并通知相关方", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "rc_02", "text": "交通组织方案已落实", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "rc_03", "text": "提前100m设置警示标志", "photo_required": true, "responsible_role": "guardian" },
        { "id": "rc_04", "text": "绕行指示标志已设置", "photo_required": true, "responsible_role": "guardian" },
        { "id": "rc_05", "text": "路障/隔离设施已设置", "photo_required": true, "responsible_role": "guardian" },
        { "id": "rc_06", "text": "夜间反光标志/警示灯已设置（如适用）", "photo_required": true, "responsible_role": "guardian" },
        { "id": "rc_07", "text": "应急通道已确认畅通", "photo_required": false, "responsible_role": "responsible_person" },
        { "id": "rc_08", "text": "安全交底已完成", "photo_required": false, "responsible_role": "safety_briefer" }
      ]
    },
    "acceptance": {
      "title": "断路作业完工验收",
      "items": [
        { "id": "rc_acc_01", "text": "道路已恢复通行", "photo_required": true },
        { "id": "rc_acc_02", "text": "路面已修复平整", "photo_required": true },
        { "id": "rc_acc_03", "text": "警示标志/路障已拆除", "photo_required": true },
        { "id": "rc_acc_04", "text": "绕行指示已撤除", "photo_required": false },
        { "id": "rc_acc_05", "text": "现场已清理干净", "photo_required": true }
      ]
    }
  },

  "approval_flow": {
    "rules": [
      {
        "condition": "true",
        "chain": ["unit_leader", "safety_dept"],
        "timeout_hours": 24,
        "escalation": "safety_dept_manager"
      }
    ],
    "delegate_enabled": true,
    "geo_fence_required": true,
    "signature_required": true
  },

  "constraint_rules": {
    "field_constraints": [
      { "type": "required_if", "target": "detour_plan", "expression": "true", "message": "断路作业必须制定绕行方案" },
      { "type": "required_if", "target": "traffic_plan", "expression": "true", "message": "断路作业必须制定交通组织方案" },
      { "type": "required_if", "target": "emergency_alternative_plan", "expression": "emergency_channel == 'no'", "message": "无应急通道时必须制定替代应急方案" }
    ],
    "execution_constraints": {
      "photo_source": "camera_only",
      "photo_watermark": { "gps": true, "timestamp": true, "person": true },
      "geo_fence_for_checklist": true,
      "warning_sign_distance_m": 100,
      "night_lighting_required": true
    }
  }
}
```

---

## 4. 配置差异化总结矩阵

| 维度 | 动火 | 受限空间 | 盲板抽堵 | 高处 | 吊装 | 临时用电 | 动土 | 断路 |
| ---- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **分级** | 特/一/二级 | 无 | 无 | 一~特级 | 一~三级 | 无 | 无 | 无 |
| **气体检测** | ✓ LEL+O₂ | ✓ O₂+H₂S+CO+LEL | 条件性 | — | — | — | — | — |
| **复测周期** | 2h | 30min | 1h | — | — | — | — | — |
| **连续监测** | 特级 | 全部 | — | — | — | — | — | — |
| **设备台账** | — | — | ✓ 盲板 | — | ✓ 起重 | — | — | — |
| **天气约束** | — | — | — | ✓ 风力<5级 | ✓ 风力<5级 | — | — | — |
| **特有角色** | 气体检测人 | 检测人+救援人员 | — | — | 司机+司索+指挥+警戒 | 电工 | — | — |
| **人员清点** | — | ✓ | — | — | — | — | — | — |
| **管线探测** | — | — | — | — | — | — | ✓ | — |
| **绕行方案** | — | — | — | — | — | — | — | ✓ |
