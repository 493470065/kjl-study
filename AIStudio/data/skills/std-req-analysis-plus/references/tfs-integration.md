# TFS 集成指南

## TFS 配置信息

```
URL: http://tfs2018-web.winning.com.cn:8080/tfs/
Collection: WINNING-6.0、 WN_HIS、WN_TJ、WN_Data_Platform、WN_DataHis
```

## 可用的 TFS MCP 工具

### 1. 获取工作项详情
```python
get_work_item(id: int, collectionHint: str = None)
```

**用途**：获取需求的原始内容

**参数说明**：
- `id`：工作项ID（需求号）
- `collectionHint`：可选的项目关键词，用于优先匹配集合
  - 示例："60项目"、"5x项目"、"卫数项目"、"天津项目"

**返回内容**：
- System.Title：需求标题
- System.Description：需求描述
- System.State：需求状态
- 其他字段信息

**使用示例**：
```
获取需求 1234567 的详细信息
```

### 2. 获取关联任务
```python
get_related_tasks(id: int, deep: bool = False)
```

**用途**：获取需求关联的开发任务列表

**参数说明**：
- `id`：需求工作项ID
- `deep`：是否递归获取子任务下的任务（默认 false）

**使用场景**：
- 了解需求的开发任务拆分情况
- 参考已有任务的技术实现方案

### 3. 下载附件
```python
download_attachments(id: int, targetDir: str = None)
```

**用途**：下载需求的所有附件到指定目录

**参数说明**：
- `id`：工作项ID
- `targetDir`：可选的目标目录，默认为 `PRD/{工作项ID}/`

**使用场景**：
- 需求包含图片、文档等附件时
- 需要理解需求中的界面原型图

**注意事项**：
- 如果原始需求中存在图片，必须理解图片内容（readme.md Rule 5）
- 下载的附件可用于需求分析参考

### 4. 列出附件
```python
list_attachments(id: int)
```

**用途**：列出工作项的所有附件（支持跨集合搜索）

**参数说明**：
- `id`：工作项ID

**使用场景**：
- 查看需求有哪些附件
- 决定是否需要下载附件

### 5. 上传附件
```python
upload_attachment(
    id: int,
    filePath: str,
    fileName: str = None,
    comment: str = None,
    collectionHint: str = None
)
```

**用途**：上传单个文件作为工作项的附件

**参数说明**：
- `id`：工作项ID
- `filePath`：要上传文件的完整路径
- `fileName`：可选的文件名，默认使用原文件名
- `comment`：可选的附件注释
- `collectionHint`：可选的项目关键词

### 6. 批量上传附件
```python
upload_attachments(
    id: int,
    filePaths: list,
    comment: str = None
)
```

**用途**：批量上传多个文件作为工作项的附件

**使用场景**：
- 上传需求分析文档
- 上传设计文档

### 7. 更新需求分析字段
```python
update_demand_analysis(
    id: int,
    markdownFilePath: str,
    collectionHint: str = None
)
```

**用途**：更新工作项的需求分析字段

**参数说明**：
- `id`：工作项ID
- `markdownFilePath`：Markdown文件的路径
- `collectionHint`：可选的项目关键词

**功能说明**：
- 读取Markdown文件并转换为HTML格式
- 上传到 Winning.Demand.Analysis 字段

**使用场景**：
- 将生成的需求分析文档上传到TFS

### 8. 更新工作项字段
```python
update_work_item(
    id: int,
    updates: dict,
    comment: str = None,
    collectionHint: str = None
)
```

**用途**：更新工作项字段（如状态、标签、指派人等）

**参数说明**：
- `id`：工作项ID
- `updates`：要更新的字段键值对
- `comment`：可选的变更注释
- `collectionHint`：可选的项目关键词

**常用字段**：
- `System.State`：状态
- `System.Tags`：标签
- `System.AssignedTo`：指派人

### 9. 创建工作项
```python
create_work_item(
    project: str,
    workItemType: str,
    title: str,
    description: str = None,
    assignedTo: str = None,
    priority: int = None,
    tags: str = None,
    parentId: int = None,
    ...
)
```

**用途**：创建新的工作项（需求、Bug、任务等）

**支持的工作项类型**：
- "需求"
- "Bug"
- "任务"
- "用例"
- "变更请求"
- "代码审查"
- "评审"

**自定义字段**：
- RaD.Center：研发中心
- Winning.Product.Name：产品名称

### 10. 添加工作项关联
```python
add_work_item_link(
    sourceId: int,
    targetId: int,
    linkType: str = "parent"
)
```

**用途**：在工作项之间添加关联

**链接类型**：
- "parent"：父子关系
- "child"：子项
- "related"：相关
- "predecessor"：前置
- "successor"：后续

## 需求分析工作流

### 标准流程

```
1. 获取原始需求
   └─> get_work_item(需求号)

2. 检查附件
   └─> list_attachments(需求号)
   └─> 如有附件，下载并理解
       └─> download_attachments(需求号)

3. 查看前置/参见需求
   └─> 如有前置需求，获取前置需求内容

4. 进行需求分析
   └─> 结合业务知识、代码进行深入分析

5. 生成分析文档
   └─> 产品业务分析.md
   └─> 代码实现分析.md

6. 上传分析结果
   └─> update_demand_analysis(需求号, 文档路径)
```

### 前置需求处理（Rule 7）

如果需求中写明了前置需求或参见需求：

1. 从 TFS 获取前置/参见需求的原始需求
2. **重要**：获取前置/参见需求的"需求分析"内容
3. 如果"需求分析"内容中有图片，也要解析
4. 将前置需求的分析内容作为参考

**处理示例**：
```
原始需求："本需求参见需求 1234567"
处理步骤：
1. get_work_item(1234567) - 获取参见需求的原始内容
2. 获取需求 1234567 的 Winning.Demand.Analysis 字段
3. 理解参见需求的分析思路和方案
4. 在当前需求分析中参考这些内容
```

### 项目关键词匹配（collectionHint）

当需求可能属于不同项目时，使用 collectionHint 优先匹配集合：

**常用关键词**：
- "60项目"、"6.0项目" → WINNING-6.0
- "5x项目"、"5.x项目" → WN_HIS
- "天津项目"、"TJ项目" → WN_TJ
- "VTE"、"VTE产品" → WN_Data_Platform
- "卫数项目"、"卫数" → WN_DataHis

## 常见问题

### Q1：需求在多个集合中存在怎么办？
使用 `collectionHint` 参数指定项目关键词，系统会优先匹配该集合。

### Q2：需求描述中包含图片如何处理？
1. 使用 `list_attachments` 查看附件列表
2. 使用 `download_attachments` 下载附件
3. 理解图片内容并在需求分析中体现

### Q3：如何获取前置需求的完整信息？
需要分别获取：
- 前置需求的 System.Description（原始需求）
- 前置需求的 Winning.Demand.Analysis（需求分析）
- 前置需求的附件（如果有）

### Q4：上传的需求分析格式要求是什么？
- 文件格式：Markdown (.md)
- 编码：UTF-8
- 内容结构：按模板要求组织
- 系统会自动转换为 HTML 上传到 TFS

## 最佳实践

1. **分析前准备**
   - 先获取需求的完整信息
   - 下载并理解所有附件
   - 获取前置/参见需求的参考信息

2. **分析过程中**
   - 保持与TFS需求的关联性
   - 记录需求来源和版本信息

3. **分析完成后**
   - 及时上传分析文档到TFS
   - 确保文档格式符合要求
   - 必要时更新需求状态或标签
