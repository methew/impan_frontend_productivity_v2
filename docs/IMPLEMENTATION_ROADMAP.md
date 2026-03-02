# OmniFocus 功能实施路线图

本文档记录 Productivity 应用已实现和待实现的功能，基于 OmniFocus 4.8.5 设计。

---

## ✅ 已实现功能

### 核心架构
- [x] React + TypeScript + Vite 项目架构
- [x] TanStack Router 路由系统
- [x] TanStack Query 数据获取
- [x] JWT 认证系统
- [x] Tailwind CSS + shadcn/ui 组件库

### 基础实体管理
- [x] **Folder (文件夹)** - CRUD + MPTT 树形结构
- [x] **Project (项目)** - CRUD + 项目类型 (Sequential/Parallel/Single Actions)
- [x] **Task (任务)** - CRUD + 子任务支持
- [x] **Tag (标签)** - 读取 + 树形选择
- [x] **Location (地点)** - 读取 + 树形选择

### 标准透视 (Perspectives)
- [x] **Inbox** - 收件箱视图 + 快速添加
- [x] **Projects** - 项目树 + 任务列表
- [x] **Tags** - 标签树 + 关联任务
- [x] **Forecast** - 日历周视图 (基础版)
- [x] **Flagged** - 标记任务列表
- [x] **Location** - 地点管理 + 编辑功能
- [x] **Review** - 需要回顾的项目列表

### 任务状态系统
- [x] 状态圆圈组件 (Status Circle)
- [x] 完成/未完成切换
- [x] 标记 (Flag) 功能
- [x] 丢弃 (Drop) 功能

### 日期系统 (基础)
- [x] Due Date (截止日期)
- [x] Defer Date (推迟日期) - 字段支持
- [ ] Planned Date (计划日期) - OmniFocus 4.7+ 新增

### UI 组件
- [x] OmniFocus 风格任务列表 (TaskList)
- [x] 树形选择器 (TreeSelect)
- [x] 侧边栏导航
- [x] 搜索过滤

---

## 🚧 部分实现功能

### Projects 透视
- [x] 基础项目树
- [x] 任务列表
- [ ] 完成百分比显示
- [ ] 项目状态指示器

### Forecast 透视
- [x] 周视图框架
- [ ] 日历事件集成
- [ ] 过去任务显示
- [ ] 月视图/日视图切换

### Location 透视
- [x] 基础地点管理
- [x] 编辑功能
- [ ] 地图视图
- [ ] 距离排序
- [ ] 位置提醒

---

## ❌ 待实现功能

### 核心功能

#### 1. Quick Entry (快速录入)
```
全局快捷键: Ctrl + Option + Space
- 弹出快速输入框
- 支持设置标题、项目、标签、日期
- 从任何应用快速添加
```

#### 2. Quick Open (快速打开)
```
快捷键: Cmd + O
- 模糊搜索所有实体
- 透视/文件夹/项目/标签
- 键盘导航
```

#### 3. Batch Editing (批量编辑)
```
- 多选任务 (Cmd + 点击)
- 批量设置标签/日期/项目
- Inspector 批量编辑界面
```

### 日期系统增强

#### Planned Date (计划日期)
```typescript
// 新增字段
interface Task {
  planned_date?: string | null  // 计划执行日期
  // 不影响任务状态，仅用于日程规划
}

// Forecast 透视需要支持显示 Planned Date
```

#### 日期继承规则
```
父项目/任务组的日期应影响子任务:
- Defer Date: "Start No Earlier Than" 约束
- Due Date: "End No Later Than" 约束
- Planned Date: 仅作为默认值，不强制
```

### 状态系统增强

#### 状态指示器
```
当前: 只有完成/未完成
需要:
- 🟡 Due Soon (24小时内截止) 
- 🔴 Overdue (已逾期)
- 🟠 Flagged (已标记)
- ⭕ Repeating (重复任务 - 三点)
```

#### 状态组合
```
允许同时显示多个状态:
- 逾期 + 已标记
- 逾期 + 重复
- 已标记 + 重复
```

### 重复任务 (Repeat)

```typescript
interface RepeatRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval: number  // 每 N 天/周/月/年
  weekdays?: number[]  // 每周几 [1,3,5] = 周一三五
  endDate?: string     // 结束日期
  count?: number       // 重复次数
}

interface Task {
  repeat_rule?: RepeatRule
  is_repeating: boolean
}
```

### 搜索和过滤

#### 高级搜索
```
- 全文搜索 (标题、备注)
- 按日期范围搜索
- 按标签组合搜索
- 按项目/文件夹搜索
- 保存搜索为透视
```

#### 视图过滤器
```
显示选项:
☑️ 已完成任务
☑️ 已丢弃任务  
☑️ 将来任务 (Defer Date > 今天)
☑️ 仅可用任务 (Defer Date <= 今天)
```

### Pro 功能

#### 1. Custom Perspectives (自定义透视)
```typescript
interface CustomPerspective {
  id: string
  name: string
  icon: string
  
  // 过滤规则
  filter: {
    status?: ('active' | 'on_hold' | 'completed' | 'dropped')[]
    availability?: 'available' | 'unavailable' | 'all'
    has_due_date?: boolean
    has_defer_date?: boolean
    has_planned_date?: boolean
    flagged?: boolean
    tags?: { include: number[], exclude: number[] }
    projects?: { include: string[], exclude: string[] }
  }
  
  // 分组
  groupBy: 'project' | 'tag' | 'due_date' | 'defer_date' | 'folder' | 'none'
  
  // 排序
  sortBy: 'due_date' | 'created_at' | 'title' | 'flagged'
  sortOrder: 'asc' | 'desc'
  
  // 视图选项
  viewOptions: {
    showCompleted: boolean
    showDropped: boolean
    showFuture: boolean
  }
}
```

#### 2. Focus Mode (专注模式)
```
- 选择项目/文件夹/标签
- 只显示相关内容
- 其他内容隐藏
- 全局 Focus 指示器
```

### Inspector (检查器面板)

```
右侧边栏，显示选中项详情:

Tab 1 - Overview:
  - 标题编辑
  - 备注编辑
  - 所属项目
  - 分配标签
  
Tab 2 - Dates:
  - Defer Date
  - Planned Date  
  - Due Date
  - 时间选择器
  
Tab 3 - Repeat:
  - 重复类型
  - 间隔设置
  - 结束条件
  
Tab 4 - Attachments:
  - 文件附件
  - 图片
  - 链接
```

### 通知系统

```
- 截止日期提醒
- 推迟日期可用提醒
- 计划日期提醒
- 位置提醒 (到达/离开)
- 回顾提醒
```

### 导入/导出

```
- 导出 .ofocus 文件
- 导入 OmniFocus 备份
- CSV 导入/导出
```

---

## 🎯 优先级建议

### 高优先级 (P0)
1. **状态指示器** - Due Soon / Overdue / Flagged
2. **Planned Date** - 完整的日期系统
3. **Quick Open** - 全局搜索导航
4. **Inspector 面板** - 右侧详情编辑

### 中优先级 (P1)
1. **Quick Entry** - 快速录入
2. **重复任务** - Repeat Rules
3. **自定义透视** - Pro 核心功能
4. **高级搜索** - 全文搜索

### 低优先级 (P2)
1. **Focus Mode** - 专注模式
2. **通知系统** - 推送提醒
3. **地图视图** - Location 地图
4. **导入/导出** - 数据迁移

---

## 🔧 技术债务

### 当前问题
- [ ] TypeScript 类型错误 (TreeTagSelect)
- [ ] Sidebar 组件未导出
- [ ] 部分 hooks 未使用类型

### 性能优化
- [ ] 大数据列表虚拟滚动
- [ ] 树形结构懒加载
- [ ] 查询缓存优化

---

## 📚 参考文档

- [OmniFocus 4 Reference Manual](https://support.omnigroup.com/documentation/omnifocus/universal/4.8.5/en/)
- [GTD Methodology](https://gettingthingsdone.com/)
- [本功能规格文档](./OMNIFOCUS_4_FEATURES.md)
