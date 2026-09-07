# std-code-paths v2 配置结构参考

本文件供阶段1读取配置时参考，**不随 skill 加载**，仅在需要理解配置结构时由 agent 按需读取。

## 配置文件结构

```
~/.claude/skills/std-code-paths/config/
  settings.json              # 全局设置（跨系统共享）
  <system>/                  # 系统目录（如 emr/）
    versions.json            # 版本定义
    repositories.json        # 仓库注册表（每个仓库只定义一次）
    <项目名>.json            # 项目配置（如 会诊.json）
```

## settings.json — 全局设置

```json
{
  "planBasePath": "过程文件",
  "branchFormatter": "feature/{workItemId}",
  "codeBasePath": "/Users/xxx/代码",
  "defaultSystem": "emr",
  "defaultProject": "会诊"
}
```

| 字段 | 说明 |
|------|------|
| `planBasePath` | 过程文件存放目录名，实际路径为 `codeBasePath + planBasePath` |
| `codeBasePath` | 代码下载根目录，为空时首次提示输入 |
| `defaultSystem` | 默认系统目录名 |
| `defaultProject` | 默认项目名称 |

## versions.json — 版本定义

```json
{
  "defaultVersion": "250815",
  "versions": {
    "240815": {
      "label": "2024年8月15日迭代版本",
      "fromBranch": "branch-from/V6.0-20240815-it",
      "defaultCloneBranch": "branch-from/V6.0-20240815-it",
      "iterationPatterns": ["240815", "20240815", "V6.0-20240815"]
    },
    "250225": {
      "label": "2025年2月25日迭代版本",
      "fromBranch": "sr-rc",
      "defaultCloneBranch": "sr-rc",
      "iterationPatterns": ["250225", "20250225", "V6.0-20250225"]
    },
    "250815": {
      "label": "2025年8月15日迭代版本",
      "fromBranch": "sr-next",
      "defaultCloneBranch": "sr-next",
      "iterationPatterns": ["250815", "20250815", "V6.0-20250815"]
    }
  }
}
```

| 字段 | 说明 |
|------|------|
| `defaultVersion` | 默认版本，版本匹配无结果时的推荐项 |
| `versions[key].fromBranch` | 该版本的基准分支（用于分支创建） |
| `versions[key].defaultCloneBranch` | 该版本的默认克隆分支 |
| `versions[key].iterationPatterns` | 迭代路径匹配模式列表 |

## repositories.json — 仓库注册表

```json
{
  "repos": [
    {
      "id": "winning-webui-consultation-next",
      "name": "新会诊前端",
      "type": "frontend",
      "tech_stack": ["vue3", "typescript", "win-design-next"],
      "local_path": "",
      "clone_url": "http://tfs2018.../repo",
      "variant": "new"
    }
  ]
}
```

每个仓库全局只定义一次，通过 `id` 在项目配置中引用。

## <项目名>.json — 项目配置

```json
{
  "name": "会诊",
  "aliases": ["会诊", "consultation"],
  "aliasWeights": { "会诊": 3, "consultation": 2 },
  "excludeKeywords": ["住院病历"],
  "hasVariants": true,
  "repos": [
    "winning-webui-consultation-next",
    { "id": "winning-webui-emr-consultation", "variant": "old", "versions": ["250815"] },
    { "id": "winning-emr-consultation", "versions": { "240815": { "clone_branch": "branch-from/V6.0-20240815-ipt-it" } } }
  ]
}
```

### repos 字段三种写法

| 写法 | 示例 | 含义 |
|------|------|------|
| 字符串 | `"repo-id"` | 全版本覆盖，使用默认克隆分支 |
| 对象+版本列表 | `{ "id": "...", "versions": ["250815"] }` | 仅指定版本，使用默认克隆分支 |
| 对象+版本覆盖 | `{ "id": "...", "versions": { "240815": { "clone_branch": "..." } } }` | 版本级覆盖分支/URL |

### clone_branch 默认值继承链

按以下优先级解析（从低到高）：

```
版本 defaultCloneBranch → 项目 defaultCloneBranch → 仓库级显式覆盖
```

只需写**不同**的地方。

### hasVariants 项目

项目配置中 `hasVariants: true` 时，同一 type 下存在多个 variant 仓库（如新老前端），需要用户确认使用哪个变体。
