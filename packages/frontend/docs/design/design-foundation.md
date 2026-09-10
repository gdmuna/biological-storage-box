# TalosArk 前端 Design Foundation

> 状态：v0.4，代码对齐基线。适用于桌面端与 Web Workbench；Dark Theme 仍延后。

## 真相源与优先级

1. 本文定义设计语义、准入规则与组件状态语言。
2. [`src/style.css`](../../src/style.css) 是 CSS Token 数值的唯一真相源。
3. [`ux.md`](./ux.md) 定义这些基础在页面和交互中的使用方式。
4. `color-system-preview.html` 是派生的视觉 QA 样张，不得成为第二份 Token 定义。
5. 根目录 `DESIGN.md` 当前是外部 Notion 设计分析，仅作参考，不是 TalosArk SSOT；在本体系稳定前保留原样。

当本文的语义规则与 `style.css` 的实际数值不一致时：修正代码或本文，使两者重新一致；不要新增独立的 `tokens.ts` 或复制 Token 表。

## 设计原则

- 科研 SaaS 应保持高信息密度、克制的层次和可读性，而非以大面积品牌色制造层级。
- 视觉壳层使用暖中性调；蓝色只承担主操作、关键信息和有意的主强调。
- 业务语义色与分析图表色严格分离。
- 默认交互只要求 Hover、Focus、Selected、Disabled、Invalid；不为普通按钮建立按住态视觉反馈。
- Token 只表达跨组件、跨布局的稳定语义；不为 Sidebar、Toolbar、Inspector 等具体部件建立独立视觉真相。

## 色彩语义

### Surface 与中性色

| Token              | 职责                                                           | 不应用于                 |
| ------------------ | -------------------------------------------------------------- | ------------------------ |
| `background`       | 主内容 Canvas                                                  | App Chrome 或浮层        |
| `card` / `popover` | 高于 Canvas 的内容与浮层表面                                   | Hover、Selected          |
| `muted`            | 比主内容略深的暖中性壳层，如 Title Bar、Sidebar、低强调容器    | 当前选中、业务状态       |
| `accent`           | 普通可交互元素的短暂 Hover 表面                                | 持久选中、成功/警告/失败 |
| `neutral-selected` | 不携带业务语义的持久 Selected 表面；`secondary` 当前别名到此值 | 鼠标按住、业务状态       |
| `border` / `input` | 结构分隔与输入边界                                             | Hover、状态提示          |
| `ring`             | 所有可键盘访问控件的 Focus 指示                                | 常态边框                 |

中性色的职责是建立空间和交互层次，不表达“成功、异常、危险、审批通过”等业务含义。

选择态分两类：局部、无业务语义的选择使用 `neutral-selected`；需要表明当前主导航、当前信息焦点或关键筛选条件时，可以使用 `primary` 作为文字、下划线或轻量指示，但不应把整块壳层刷成蓝色。

`sidebar-*` 仅是 shadcn-vue Sidebar 的兼容别名，必须映射到上述通用 Token，不得发展独立的 Sidebar 配色体系。

### Primary 与业务语义色

| Token         | 职责                                   |
| ------------- | -------------------------------------- |
| `primary`     | 蓝色主操作、主导航指示、关键可操作信息 |
| `success`     | 成功、正常、完成、健康状态             |
| `warning`     | 需要注意、临近阈值、非阻断风险         |
| `destructive` | 失败、危险、破坏性操作、错误校验       |

实线主按钮可以使用 `primary-hover` 维持蓝色实体反馈；这不改变“通用 Hover 使用 `accent`”的规则。`primary-active` 与 `destructive-active` 为需要明确持久状态的专用组件保留，普通 `Button` 不消费按住态。

四种业务色各有一对经过视觉校准的 Soft Surface：

```text
primary-soft / primary-soft-foreground
success-soft / success-soft-foreground
warning-soft / warning-soft-foreground
destructive-soft / destructive-soft-foreground
```

这些成对 Token 用于状态 Icon 容器、Badge、Alert、摘要卡的低强调业务表面。它们是已批准的精确配色，不是任意颜色都可随意扩展的 `*-soft` 体系。

### 图表色

`chart-1` 到 `chart-5` 是 Azure → Cyan-blue → Indigo → Violet → Magenta 的分析序列色。它们不得引用 `success`、`warning` 或 `destructive`，避免用户把数据系列误读为业务状态。

## 状态矩阵

| 状态     | 普通控件                                           | 实线 Primary Button | 导航 / Tab                            |
| -------- | -------------------------------------------------- | ------------------- | ------------------------------------- |
| Rest     | 背景透明或 `card`                                  | `primary`           | 中性文字与边界                        |
| Hover    | `accent`                                           | `primary-hover`     | `accent`，不以蓝色泛化强调            |
| Selected | `neutral-selected` 或按语义使用轻量 `primary` 指示 | 不适用              | 当前层级可使用 `primary` 文字或下划线 |
| Focus    | `ring`                                             | `ring`              | `ring`                                |
| Pressed  | 默认不单独着色                                     | 默认不单独着色      | 默认不单独着色                        |
| Disabled | 降低不透明度且禁止交互                             | 同左                | 同左                                  |

这里的 `Selected` 是持久应用状态，例如当前路由、已打开菜单、被选中的过滤条件；它不等同于 CSS `:active` 的瞬时鼠标按住状态。

## Typography、几何与层级

- 字体采用 System UI Stack：`ui-sans-serif → system-ui → -apple-system → BlinkMacSystemFont → Segoe UI → PingFang SC → Microsoft YaHei → sans-serif`。不依赖 Inter Web Font 作为运行时前置条件。
- 默认正文为 `14px / 20px`；主要文字为 `foreground`，辅助文字为 `muted-foreground`。不保留第三个全局文字 Token；更弱元数据用 `text-muted-foreground` 的透明度表达。
- 基础圆角为 `8px`；按钮和输入优先使用 32 / 36 / 40px 控制高度。
- 阴影保持克制：`shadow-xs` 用于输入等轻微抬升，`shadow-md` 用于 Popover / Dropdown，`shadow-lg` 用于 Dialog / Sheet。
- 微交互使用 150–200ms 的标准缓动；尊重 `prefers-reduced-motion`。

## 可访问性与延后事项

- 所有可交互元素必须保留清晰的 `focus-visible` 指示；不要以删除 Focus 换取“干净”。
- 正常大小正文与背景须满足 4.5:1 对比度；颜色不能成为唯一状态说明。
- Dark Theme、独立 Tablet IA、用户自定义快捷键和完整视觉验收样本库均延后，在相应实施阶段另立决策。
