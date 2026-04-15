# Bug Fix & UX Restore — Design Document

**Date:** 2026-04-15  
**Scope:** BSB-Frontend only  
**Trigger:** Browser testing revealed 7 frontend regressions introduced during the Phase 3–5 implementation sprint.

---

## Background & Process Reflection

Multiple unauthorized changes were made during prior implementation tasks that had NOT been requested by the user:

- **Logo text changed** `Biological-Storage-Box` → `BSB` (reverted by user)
- **Room nav link removed** from AppLayout sidebar
- **Org-switcher dropdown removed** from AppLayout header (replaced by static text)
- **Dashboard welcome message** bound to org name instead of username

**Root causes:**
1. Batch rewrites of layout/page components without explicitly diffing against the original to preserve existing UX decisions.
2. The executing-plans skill lacks a "don't touch what you weren't asked to change" self-check gate.
3. No automated assertion that existing UI affordances (nav items, dropdowns) survive component rewrites.

**Process fix (to be added to constraints):** Before committing any layout or shared component change, explicitly enumerate original UI affordances and confirm each one is preserved.

---

## Issues & Designs

### Issue 1 — Room Nav Link Missing

**File:** `BSB-Frontend/src/layouts/AppLayout.vue`

`navItems` is missing the `/room` entry. The routes exist (`/room`, `/room/:id`), but there's no sidebar link to reach them.

**Fix:** Insert `{ path: '/room', label: '房间', icon: Home }` between `/box` and `/node`. Import `Home` from `lucide-vue-next`.

---

### Issue 2 — SelectItem Empty String Error in BoxDetailPage

**File:** `BSB-Frontend/src/pages/box/BoxDetailPage.vue`

**Root cause:** `<SelectItem value="">无</SelectItem>` — shadcn-vue/Radix Select treats `""` as the "cleared" sentinel and throws:  
`Error: A <SelectItem /> must have a value prop that is not an empty string.`

**Fix:**
- Replace `value=""` with `value="__none__"` on the "无" item.
- Initialize `slotTypeId.value = reagent?.reagentTypeId ?? '__none__'`.
- When calling the API: `reagentTypeId: slotTypeId.value !== '__none__' ? slotTypeId.value : undefined`.

---

### Issue 3 — ReagentPage Cannot Create Reagents or Reagent Types

**File:** `BSB-Frontend/src/pages/reagent/ReagentPage.vue`

**Current state:** List-only. No creation affordances.

**Design — Tab layout:**

**Tab 1: 试剂列表**
- Existing reagent list (unchanged).
- "新建试剂" button → Dialog:
  - Select box (from current org via `GET /box/node/list` or `GET /box/list`)
  - Position input (format: `row-col`, e.g. `1-1`)
  - Name input (required)
  - Description (optional)
  - Reagent type Select (loaded from `GET /reagent-type/list`)
- Submits via `POST /reagent/add`.

**Tab 2: 试剂类型**
- List of reagent types for current org.
- Each row: color swatch + name + unit badge + description.
- Per-row Delete button → `DELETE /reagent-type/del`.
- "新建类型" button → Dialog:
  - Name (required)
  - Description (optional)
  - Color hex (optional, color input)
  - Unit (optional, text input)
- Submits via `POST /reagent-type/add`.

**API needed (all already exist):**
- `listReagentTypes(orgId)` from `@/api/modules/reagent-type`
- `createReagentType(data)` from `@/api/modules/reagent-type`
- `deleteReagentType(id)` from `@/api/modules/reagent-type`
- `createReagent(data)` from `@/api/modules/box` (aliased from box module)
- `listBoxes(orgId)` from `@/api/modules/box`

---

### Issue 4 — Vue Flow Height Warning

**File:** `BSB-Frontend/src/components/node/NodeCanvas.vue`

**Root cause:** The outer wrapper uses `:style="{ minHeight: height }"`. CSS `min-height` does not establish a definite height for flex children. `flex-1` on the inner canvas div has no height reference, so Vue Flow measures 0.

**Fix:**
```html
<div class="flex flex-col overflow-hidden" :style="{ height: height }">
```
Also ensure the canvas div has `class="relative flex-1"` so it gets the remaining height.

---

### Issue 5 — Alova Caches listOrgs Response

**File:** `BSB-Frontend/src/api/modules/org.ts`

**Root cause:** Alova v3 caches GET responses by default. After org CRUD operations, stale cached lists are returned.

**Fix:** Disable caching on `listOrgs()`:
```ts
export const listOrgs = () =>
    alovaInstance.Get<Org[]>('/org/list', { cacheFor: 0 });
```

No other call sites need changes — the `org.fetchOrgs()` already re-calls this after mutations.

---

### Issue 6 — Org Switcher Removed from Header

**File:** `BSB-Frontend/src/layouts/AppLayout.vue`

The header previously showed an org dropdown for switching organizations. It was replaced by a static text span.

**Fix:** Replace the static `<span>` with a `DropdownMenu` listing `org.orgs`, with a checkmark on `org.currentOrgId`, clicking any item calls `org.selectOrg(id)`.

**Imports to add:** `ChevronDown`, `Check` from `lucide-vue-next`; `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` already present.

---

### Issue 7 — Dashboard Welcome Message Shows Org Name

**File:** `BSB-Frontend/src/pages/dashboard/DashboardPage.vue`

**Current:** `欢迎回来，{{ org.currentOrg?.name ?? '未选择组织' }}`  
**Correct:** `欢迎回来，{{ auth.user?.nickname ?? auth.user?.username ?? '用户' }}`

**Fix:** Import `useAuthStore`, instantiate it, replace the template expression.

---

### Issue 8 — Logo Text (Already Resolved)

User manually reverted `BSB` → `Biological-Storage-Box`. No further action needed.

---

## Files to Touch

| File | Changes |
|------|---------|
| `BSB-Frontend/src/layouts/AppLayout.vue` | Add room nav, restore org switcher |
| `BSB-Frontend/src/pages/box/BoxDetailPage.vue` | Fix SelectItem sentinel value |
| `BSB-Frontend/src/pages/reagent/ReagentPage.vue` | Full tab redesign |
| `BSB-Frontend/src/components/node/NodeCanvas.vue` | Fix container height |
| `BSB-Frontend/src/api/modules/org.ts` | `cacheFor: 0` on listOrgs |
| `BSB-Frontend/src/pages/dashboard/DashboardPage.vue` | Fix welcome message |
