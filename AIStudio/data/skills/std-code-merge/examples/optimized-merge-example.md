# 优化后的代码合并流程示例

## 概述

通过提前查询父级工作项ID，优化后的流程可以在代码提交后立即添加AI-MERGE标记，无需等待额外的TFS查询。

## 完整流程

### 1. 查询需求详情并获取父级工作项ID

```bash
# 在项目根目录执行
node tools/query-demand-parent-id.mjs 1144995 1485439 WiNEX-Inpatient-2
```

**输出示例**：
```
正在查询需求 1144995 和任务 1485439...

📋 需求详情:
  需求ID: 1144995
  标题: 【排队】医嘱检索相同项目按规格排序@1004079移植单需求版本
  类型: 需求
  状态: 已关闭
  项目: WiNEX-Inpatient-2

🔗 父级工作项ID: 1485430

📊 JSON输出:
{
  "demandId": 1144995,
  "newTaskId": 1485439,
  "parentId": 1485430,
  "demandDetail": {
    "id": 1144995,
    "title": "【排队】医嘱检索相同项目按规格排序@1004079移植单需求版本",
    "state": "已关闭",
    "type": "需求",
    "project": "WiNEX-Inpatient-2"
  }
}
```

### 2. 选择源分支和目标分支

按照交互提示选择：
- 源分支：sr-rc
- 目标分支：sr-next

### 3. 查找有效代码

使用 `find-demand-code.mjs` 查询源分支上的相关代码：
```bash
node tools/find-demand-code.mjs 1144999 origin/sr-rc
```

### 4. 创建功能分支

```bash
git checkout origin/sr-next -b feature/1485439
```

### 5. 合并代码

使用 cherry-pick 或手动应用代码变更

### 6. 提交代码

```bash
git commit -m "#1485439 合并需求1144995到sr-next"
```

### 7. 推送分支

```bash
git push origin feature/1485439
```

### 8. 添加AI-MERGE标记

现在可以直接使用步骤 1 中获取的父级工作项ID：

```bash
# 从 tfs2018-integration 目录返回本技能目录
cd ../std-code-merge
node tools/add-work-item-tag.mjs 1485430 "AI-MERGE"
```

## 优化效果

### 优化前
1. 查询需求详情
2. 选择分支
3. 查找代码
4. 合并代码
5. 提交推送
6. **查询父级工作项ID ← 耗时**
7. 添加AI-MERGE标记

### 优化后
1. **查询需求详情 + 获取父级工作项ID ← 一次性完成**
2. 选择分支
3. 查找代码
4. 合并代码
5. 提交推送
6. **添加AI-MERGE标记 ← 立即执行**

## 优势

1. **减少等待时间**：父级工作项ID的查询提前到流程开始
2. **即时反馈**：代码提交后立即添加标记，无需额外等待
3. **更好的用户体验**：整个过程更加流畅，没有多余的等待步骤
4. **错误处理更早**：如果查询父级工作项ID失败，可以立即知晓并处理