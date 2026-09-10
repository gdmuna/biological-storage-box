---
title: Docs 设计规范与约束
inherits: AGENTS.md
status: active
version: "0.7.4"
last-updated: 2026-04-09
category: standard
related:
  - AGENTS.md
  - docs/AGENTS.md
  - docs/01-guides/STANDARD.md
  - docs/02-harness/STANDARD.md
  - docs/03-architecture/STANDARD.md
  - docs/04-appendix/STANDARD.md
  - docs/05-releases/STANDARD.md
  - docs/06-audits/STANDARD.md
---

# Docs 设计规范与约束

本文档继承 [根 AGENTS.md](../AGENTS.md) 的核心设计原则，在此基础上定义 `docs/` 目录所有内容的**设计基准与唯一事实标准**。

---

## 1. 文档场景原则补充

以下为 [根 AGENTS.md §1](../AGENTS.md) 核心原则在文档场景中的专项补充。原则定义不在此重复（DRY），仅说明 docs 场景的具体含义。

### DRY 补充

- 同一事实只在一个位置描述，其他位置通过链接引用
- `copilot-instructions.md` 不复制 docs 内容，只放链接
- 根目录 `README.md` 已覆盖的信息，docs 中不再重复

**违规示例**：在 `AGENTS.md` 和 `copilot-instructions.md` 中同时维护完整的提交规范
**正确做法**：在一处定义，另一处 `[提交规范](链接)` 引用

### KISS 补充

- 文档数量取决于实际需要，不为"看起来完整"而创建占位空文件
- 每篇文档只回答一个核心问题。需要两段无关说明时，拆成两篇
- 目录层级不超过两级（`docs/分类/文件.md`），不建立三级嵌套

**违规示例**：创建 `docs/03-architecture/designs/middleware/` 三级目录只为存一个文件
**正确做法**：`docs/03-architecture/middleware-design.md`

---

## 2. 双维度设计标准

文档必须同时满足两个维度的高标准，两者不是竞争关系，而是同等要求：

- **AI 可读**：AI 助手能准确判断文档的时效性、适用范围、与其他文档的关系
- **人类可读**：开发者可通过 GitHub Web UI 或 Obsidian 顺畅、完整地理解内容

**唯一例外**：frontmatter 的格式层面以机器可解析为优先，但其内容本身仍需对人类清晰。

### 2.1 AI 可读性要求

`docs/README.md` 必须让 AI 助手在读取后能：
1. 知道当前有哪些文档、各自的状态
2. 快速定位"某类问题应读哪篇文档"
3. 识别过时文档以避免上下文污染

### 2.2 人类可读性要求

- 使用标准 Markdown 链接 `[text](path)`，不使用引用链接 `[text][id]` 或 `[[wikilink]]`
- 链接路径为相对路径（相对于当前文件）
- 标题层级从 `#` 开始，每篇只有一个 `#`
- 表格、代码块、列表等优先使用 GitHub Flavored Markdown 语法
- 中文文档中，中英文之间加空格（如 `NestJS 框架`）
- 技术概念首次出现时给出简短解释或链接

---

## 3. 目录结构

```
docs/
├── README.md              # 文档索引（人类导航 + AI 导航）
├── STANDARD.md            # 本文档：设计规范与约束
├── AGENTS.md              # AI 文档操作手册（category: meta）
│
├── 01-guides/             # category: guide
│   └── STANDARD.md
├── 02-harness/            # category: harness
│   └── STANDARD.md
├── 03-architecture/       # category: architecture
│   └── STANDARD.md
├── 04-appendix/          # category: reference
│   └── STANDARD.md
├── 05-releases/           # category: release
│   └── STANDARD.md
└── 06-audits/             # category: audit
    └── STANDARD.md
```

### 目录命名规则

- 数字前缀保证排序稳定：`XX-名称/`
- 名称为英文小写，多词用 `-` 连接
- 每个目录对应一个 `category` 值

### 分类定义

`category` 字段描述文档的**角色类型**，分为内容文档和元文档两组：

**内容文档**（按所属子目录分类）：

| 目录 | category 值 | 回答的核心问题 | 示例 |
|------|-------------|---------------|------|
| `01-guides/` | `guide` | "怎么做？" | 贡献者指南、工具使用教程 |
| `02-harness/` | `harness` | "Harness Engineering 是什么？" | Harness Engineering 理念与实现 |
| `03-architecture/` | `architecture` | "系统是什么样的？" | 架构全景、模块设计 |
| `04-appendix/` | `reference` | "接口/签名是什么？" | API 参考文档 |
| `05-releases/` | `release` | "内容变了什么？" | 发布说明 |
| `06-audits/` | `audit` | "现在质量如何？" | 生产就绪度评审 |

**元文档**（基础设施性质，不属于任何内容子目录）：

| category 值 | 适用文档 | 说明 |
|-------------|---------|------|
| `standard` | `docs/STANDARD.md`、各子目录 `STANDARD.md` | 写作规范与约束，定义文档契约 |
| `meta` | `AGENTS.md`、`docs/AGENTS.md` | AI 协助者操作手册，定义行为约束 |
| `index` | `docs/README.md` | 导航索引，不包含业务内容 |

### 目录增删规则

- **增**：当有 ≥1 篇文档需要新分类时才创建新目录
- **删**：当目录内所有文档被归档或删除后，删除空目录（保留 `STANDARD.md` 的目录不算空）
- **编号**：新目录取当前最大编号 +1，不要填补跳号

---

## 4. 文件命名规范

```
# 普通文档
kebab-case.md
例：project-architecture-overview.md
```

- 全小写英文，单词间用 `-` 连接
- 不在文件名中包含日期（日期由 frontmatter 管理）
- 不在文件名中包含版本号
- 元文档（`STANDARD.md`、`AGENTS.md`、`README.md`）使用全大写

---

## 5. Frontmatter 规范

每篇文档**必须**以 YAML frontmatter 开头，使 AI 无需阅读全文即可判断文档的有效性和范围：

```yaml
---
title: "文档标题"
inherits: docs/STANDARD.md       # 继承的父规范路径（相对项目根）
status: active
version: "0.5.3"
last-updated: 2026-03-26
category: architecture
related:                          # 相关文档路径（相对项目根）
  - docs/03-architecture/project-architecture-overview.md
overrides:                        # 覆盖父规范的规则（可选）
  - docs/STANDARD.md#yagni-补充
---
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 文档标题 |
| `inherits` | 否 | 继承的父规范文档路径（相对项目根），子文档自动继承父文档所有规则 |
| `status` | 是 | `active`=当前有效；`draft`=编写中不可依赖；`archived`=仅供历史参考 |
| `version` | 是 | 该文档描述/适用的项目版本 |
| `last-updated` | 是 | ISO 日期 |
| `category` | 是 | 文档分类，完整值域见 §3 分类定义（内容文档：`guide`/`harness`/`architecture`/`reference`/`release`/`audit`；元文档：`standard`/`meta`/`index`） |
| `related` | 否 | 相关文档路径（相对项目根），显式声明文档间依赖关系 |
| `overrides` | 否 | 显式禁用父规范的某条规则，值为父文档路径 + Markdown 标题锚点 |

### `inherits` 继承机制

- 子文档默认继承父文档的**所有**规则
- 不需要重复父文档已定义的内容
- 如需禁用某条父规则，在 `overrides` 中声明该规则的锚点
- 继承链示例：`AGENTS.md` → `docs/STANDARD.md` → `docs/03-architecture/STANDARD.md` → 具体文档

### `status` 状态转换规则

- 新文档创建时为 `draft` 或 `active`
- 被新版本取代时改为 `archived`
- `archived` 文档不得删除 frontmatter，以保留历史元数据

---

## 6. 引用规范

文档中的链接均使用 `[显示文本](路径)` 格式，路径相对于当前文件位置（确保 GitHub 渲染可点击），不使用 `[text][id]` 引用链接格式。

同一目标文件的多个锚点变体合并使用基础路径引用；显示文本使用目标文档的标题或可读描述。

---

## 7. 文档生命周期

```
创建(draft/active) → 有效(active) → 过时(archived) → 删除(可选)
```

| 阶段 | 触发条件 | 操作 |
|------|---------|------|
| 创建 | 有实际内容需要记录 | 写入内容 + frontmatter |
| 更新 | 项目版本变更影响文档内容 | 修改内容 + 更新 `version` 和 `last-updated` |
| 归档 | 被新版本取代或不再适用 | `status` 改为 `archived`，保留在原位 |
| 删除 | 归档 ≥ 2 个版本后无参考价值 | 删除文件，更新 `docs/README.md` 索引 |

**禁止事项**：
- 不创建空文件作为占位符
- 不保留 `status: draft` 超过一个版本周期

---

## 8. 与 docs 外部文件的关系

### 根目录 AGENTS.md

- 定位：项目级 AI 协助者操作手册，定义核心设计原则与通用工作流程
- 原则：本文档和 `docs/AGENTS.md` 均继承自它

### .github/copilot-instructions.md

- 定位：AI 助手的**精简快速上下文**（≤80 行有效内容）
- 原则：不复制 docs 中已有的信息，通过链接引用
- 导航入口：指向根 `AGENTS.md`

### 根目录 README.md

- 定位：项目的**对外门面**，面向 GitHub 访客
- 原则：与 docs 内容互补不重叠

### 子目录 STANDARD.md

以下文件是子目录的领域专属规范，继承本文档：

| 文件                                                         | 管辖范围                  |
| ---------------------------------------------------------- | --------------------- |
| [01-guides/STANDARD.md](01-guides/STANDARD.md)             | 指南写作约束                |
| [02-harness/STANDARD.md](02-harness/STANDARD.md)           | Harness Engineering 写作约束              |
| [03-architecture/STANDARD.md](03-architecture/STANDARD.md) | 架构约束、模块依赖规则、架构子文档格式标准 |
| [04-appendix/STANDARD.md](04-appendix/STANDARD.md)       | 参考文档格式标准              |
| [05-releases/STANDARD.md](05-releases/STANDARD.md)         | 发布说明约束                |
| [06-audits/STANDARD.md](06-audits/STANDARD.md)             | 审计文档约束                |

---

## 9. 写作风格

以下规则同时服务 AI 和人类读者。

### 结构清晰

- 每篇文档有且仅有一个 `#` 级标题
- 每个章节回答一个问题
- 优先用表格、列表呈现并列信息，而非长段落

### 精确简洁

- 删除不增加信息量的修饰语
- 事实优先，避免主观评价
- 文件路径、命令、配置值使用行内代码标记

### 自包含

- 技术术语首次出现时给出简短解释
- 不依赖"上下文隐含"：只看当前文档时也能理解核心内容

### 面向现在

- 描述系统当前状态，不夹杂"计划中"或"将来会"的描述
- 规划类内容专门放在 `05-releases/`

### 图示选型

| 适用场景 | 推荐方式 |
|---------|--------|
| 步骤 ≤5、无条件分支 | ASCII art |
| 步骤 ≥6、含条件分支或严格时序 | Mermaid 代码块 |

---

## 10. 防漂移设计原则

代码演进时文档容易滞后。本节定义设计原则，具体触发矩阵见 [docs/AGENTS.md §2](AGENTS.md#2-漂移防护触发矩阵)。

- **Swagger 注解是接口契约的唯一真实来源**：接口文档随代码维护，由 `/api-doc` 自动生成
- **常量集中管理**：阈值、配置值只在 `src/constants/` 中定义，文档中引用符号名称而非硬编码数值
- **版本节点全量同步**：`package.json` 版本升级时触发所有文档版本字段更新（操作详见 [docs/AGENTS.md §3](AGENTS.md#3-版本节点全量同步)）

---

## 11. 检查清单

新建或修改文档时，确认以下事项：

- [ ] 有完整的 YAML frontmatter（所有必填字段）
- [ ] `inherits` 字段正确指向父规范文档
- [ ] `status` 反映文档当前真实状态
- [ ] 所有内部链接使用相对路径且可访问
- [ ] 未与其他文档内容重复（DRY）
- [ ] 文件名符合命名规范
- [ ] `docs/README.md` 索引已同步更新
- [ ] 如有覆盖父规则，已在 `overrides` 中声明
