# TalosArk 前端 UX 与交互规范

> 状态：v0.4，代码对齐基线。视觉 Token 见 [`design-foundation.md`](./design-foundation.md)。

## 适用范围与边界

本文说明设计基础应如何组成 TalosArk 的桌面端工作台。它不重复 CSS 数值；实际数值由 [`src/style.css`](../../src/style.css) 维护。

- `layout/` 负责应用壳层与空间骨架。
- `pages/` 负责路由入口与页面专属导航。
- `modules/` 负责可复用产品能力。
- `ui/` 只提供无业务语义的 shadcn-vue 基元。

## Desktop Workbench Shell

```text
Custom Title Bar (muted)
└─ Primary Sidebar (muted)
   └─ Primary Content Canvas (background)
      ├─ App Top Bar / Context Bar
      ├─ Page-local navigation
      └─ One intentional scroll owner
```

- Title Bar 与 Sidebar 是同一层级的暖中性 App Chrome；它们应比主内容 Canvas 略深，但不能抢夺业务内容的注意力。
- 主内容区域使用 `background`；Card、Popover、Dialog 等抬升内容使用 `card` / `popover`。
- 页面应明确唯一主滚动容器。壳层和中间布局节点负责约束尺寸与溢出，不应自然形成额外页面滚动。

## 导航与选择

- 一级 Sidebar 项在 Hover 时使用 `accent`；当前路由可用 `neutral-selected` 表示持久选择。
- 顶部或页面内 Router Tab 在 Hover 时使用 `accent`；当前项以 `primary` 文字或底部指示线表现，不使用整块浅蓝背景。
- `data-[active=true]`、`data-[activated=true]` 表示持久状态，不能与 CSS `:active` 混用。
- 组织 / 工作区切换器是小型上下文选择面板，使用 Popover 容器；简单动作列表使用 Dropdown Menu。

## 控件交互

### Button

- `default` 是实线 Primary Action；`outline`、`secondary`、`ghost` 是中性操作层级；`destructive` 只用于危险操作。
- 默认 Button 只有 Hover、Focus、Disabled 和 Invalid 状态，不建立 `:active` 的按住态填充色。
- Primary Button 的实体 Hover 可以使用 `primary-hover`；其他按钮的 Hover 统一使用 `accent`。
- 任何键盘可达 Button 都必须显示 `ring`；不要把 Focus 伪装成 Selected。

### Input 与表单

- Input Rest 使用 `background + input` 边框，Focus 使用通用 `ring`，Invalid 使用 `destructive`。
- `success`、`warning`、`destructive` 表示表单或业务结果，不能仅靠颜色传递状态；同时需要文字、图标或说明。

### Overlay

- Popover 和 Dropdown 是不改变主布局的临时表面。
- Dialog 与 Sheet 是覆盖层，不挤压 Main Content；Dialog 用于聚焦决策，Sheet 用于上下文详情或可延展操作。
- Overlay 中的 Close 仍有 Hover 与 Focus，但不添加按住态。

## Visual QA

每次修改 `style.css` 或基础组件时，至少检查：

1. 暖中性壳层与主内容 Canvas 的层级是否仍清晰。
2. 普通 Hover 是否只使用 `accent`，而不是浅蓝或业务状态色。
3. Selected 是否为持久语义，而非鼠标按住。
4. 图表色是否与成功、警告、失败语义分离。
5. Focus、Disabled、Invalid 与 Reduced Motion 是否仍可访问。

`color-system-preview.html` 可用于快速人工校色，但它是派生预览；验收基础组件时应优先查看真实 Vue `Button`、`Input`、Sidebar、Tab 和 Overlay。
