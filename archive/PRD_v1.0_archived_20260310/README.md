# PRD v1.0 归档说明

**归档时间**：2026-03-10
**归档原因**：基于最新八层架构重写产品文档
**归档人**：产品团队

---

## 归档内容

本目录包含基于四层架构的PRD v1.0版本文档，共12个章节：

1. 01-产品概述.md
2. 02-业务背景与问题分析.md
3. 03-产品目标与成功指标.md
4. 04-系统架构设计.md
5. 05-通用底座功能需求.md
6. 06-8大作业票模块需求.md
7. 07-交叉作业管理.md
8. 08-非功能性需求.md
9. 09-用户体验设计.md
10. 10-技术实现建议.md
11. 11-项目实施计划.md
12. 12-风险与应对.md

---

## 归档原因

### 架构升级

**旧架构（四层）**：
1. 表现层（Presentation Layer）
2. 业务能力层（Application Service Layer）
3. 领域核心层（Core Domain Layer）
4. 基础设施层（Infrastructure Layer）

**新架构（八层）**：
1. 表现层（Presentation Layer）
2. 业务能力层（Application Service Layer）
3. 领域核心层（Core Domain Layer）
4. **认知决策层（Cognitive Decision Layer）**【新增】
5. **数据骨干网层（Data Backbone Layer）**【新增】
6. **边缘弹性层（Edge Resilience Layer）**【新增】
7. **微服务编排层（Microservices Orchestration Layer）**【新增】
8. 基础设施层（Infrastructure Layer）

### 主要差异

#### 1. 新增架构层级

**认知决策层（第四层）**：
- 知识图谱引擎（Neo4j/ArangoDB）
- 多专家推理（RoE）
- 可解释AI（XAI）

**数据骨干网层（第五层）**：
- 流处理引擎（Apache Flink）
- 消息队列（Kafka）
- 实时异常检测

**边缘弹性层（第六层）**：
- 边缘智能网关（KubeEdge）
- 边缘异常检测
- 离线推理（Small LLM）

**微服务编排层（第七层）**：
- 服务网格（Istio）
- 多租户中间件
- 22个核心微服务

#### 2. 技术栈升级

| 组件类型 | v1.0（旧） | v2.0（新） | 变更原因 |
|---------|-----------|-----------|---------|
| **关系数据库** | MySQL 8.0 | PostgreSQL 15 + PostGIS 3.3 | 支持三维空间索引、RLS行级安全 |
| **向量数据库** | 无 | Milvus 2.3+ | AI知识库、语义检索 |
| **规则引擎** | 无 | Drools 8.0+ | 报警编码、合规规则 |
| **消息队列** | RabbitMQ | Kafka 3.5+ | 高频IoT消息、事件驱动 |
| **时序数据库** | InfluxDB 2.0 | InfluxDB 2.7+ | 版本升级 |
| **知识图谱** | 无 | Neo4j/ArangoDB | SPO三元组、跨文档依赖 |
| **流处理** | 无 | Apache Flink | 毫秒级窗口聚合 |

#### 3. 核心能力增强

**多租户SaaS架构**：
- v1.0：仅提及"支持多租户"
- v2.0：完整的Pooled/Silo/Bridge模式设计、PostgreSQL RLS、TenantContext中间件

**三维SIMOPs冲突检测**：
- v1.0：基础的空间+时间冲突检测
- v2.0：PostGIS三维空间索引、冲突规则矩阵、<500ms P95延迟

**多传感器融合定位**：
- v1.0：精度≤1米
- v2.0：EKF融合算法、±2m水平/±1m垂直、年度校准机制

**AI Agent智能体引擎**：
- v1.0：无
- v2.0：三智能体协作（Auditor/Spatial-Temporal/Data Exchange）、RAG检索、≥92%准确率

**标准化报警编码**：
- v1.0：4级告警
- v2.0：AQ 3064.2标准编码、6大类型、报警闭环流程

**边缘计算与离线容错**：
- v1.0：无
- v2.0：边缘网关三层架构、Delta Sync增量同步、离线推理

#### 4. MVP范围调整

**v1.0 MVP范围**：
- 通用底座（完整）
- 动火作业模块
- 受限空间作业模块
- 基础SIMOPs检测
- 移动端+Web管理端

**v2.0 MVP范围（新增P0能力）**：
- 通用底座（完整）
- 动火作业模块
- 受限空间作业模块
- **多租户隔离（Pooled模式）**【新增】
- **三维SIMOPs冲突检测（PostGIS）**【新增】
- **多传感器融合定位（EKF算法）**【新增】
- **报警编码体系（AQ 3064.2标准）**【新增】
- **AI合规审计（RAG）**【新增】
- 移动端+Web管理端

**延后到V2.0的能力**：
- 边缘计算+离线容错
- 视觉AI未办票检测
- 其他6大作业模块

**延后到V3.0的能力**：
- Silo模式+BYOK
- 行业适配包（白酒/石化）
- 租户迁移工具

---

## 新版本文档位置

**产品路线图**：
- 新版本：`产出/roadmap_v2.0.md`
- 旧版本：`archive/roadmap_v1.0_archived_20260310.md`

**产品需求文档**：
- 新版本：`产出/PRD_v2.0/`（12个章节）
- 旧版本：`archive/PRD_v1.0_archived_20260310/PRD章节/`（12个章节）

---

## 参考文档

**架构设计文档**：
- [八层解耦架构设计](../../docs/architecture/layered-architecture.md)
- [AI Agent智能体引擎](../../docs/architecture/ai-agent-engine.md)
- [多租户架构](../../docs/architecture/multi-tenant.md)
- [IoT边缘接入](../../docs/architecture/iot-integration.md)
- [人员定位](../../docs/architecture/personnel-positioning.md)
- [报警编码](../../docs/architecture/alarm-coding.md)
- [SIMOPs算法](../../docs/architecture/simops-algorithm.md)

**架构决策记录**：
- [ADR-002: 产品范围从单一动火系统升级为完整PTW系统](../../docs/adr/20260309-upgrade-to-ptw-system.md)

---

## 版本对比总结

| 维度 | v1.0（旧） | v2.0（新） | 提升 |
|------|-----------|-----------|------|
| **架构层级** | 4层 | 8层 | +4层（认知决策、数据骨干网、边缘弹性、微服务编排） |
| **技术组件** | 6个 | 12个 | +6个（PostgreSQL、Milvus、Drools、Kafka、Neo4j、Flink） |
| **MVP能力** | 5个核心能力 | 10个核心能力 | +5个（多租户、三维SIMOPs、多传感器融合、报警编码、AI审计） |
| **定位精度** | ≤1米 | ±2m水平/±1m垂直 | 精度指标更科学 |
| **SIMOPs延迟** | 未定义 | <500ms P95 | 新增性能指标 |
| **合规审计** | 无 | ≥92%准确率 | 新增AI能力 |
| **报警响应** | 4级告警 | 极高≤10s、高≤30s | 细化时效要求 |

---

**归档完成时间**：2026-03-10
**下一步**：参考新版本文档进行产品开发
