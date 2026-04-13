---
title: 参考文档规范
inherits: docs/STANDARD.md
status: active
version: "0.5.3"
last-updated: 2026-03-26
category: standard
---

# 参考文档规范

本文档继承 [docs/STANDARD.md](../STANDARD.md)，定义 `docs/04-appendix/` 目录的专项约束。

---

## 1. 参考文档要求

参考文档回答"接口/签名是什么？"，具有以下特征：

- **查阅导向**：读者带着具体问题来查找答案，而非从头通读
- **结构化**：按模块、端点或主题分组，便于快速定位
- **精确**：参数类型、返回值、错误码等信息必须与代码保持同步
- **不含教程内容**：操作步骤类内容放在 `01-guides/`

---

## 2. API 参考特殊规则

`api-reference.md` 等 API 文档可使用 Slate/Swagger 风格的 frontmatter（如 `language_tabs`、`toc_footers`），不受通用 frontmatter 规范约束。但仍需包含 `title` 和 `status` 字段。

---

## 引用

- [Docs 设计规范与约束](../STANDARD.md)
