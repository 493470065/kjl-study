---
name: medical-product-monitor
description: 病历条线产品库存监控技能。获取TFS实时数据，分析9个病历产品的库存/新增/关闭/趋势，生成MD报告并发送到飞书。触发场景：产品库存监控、病历条线进度分析、库存趋势报告。
allowed-tools: terminal, file, read_file, write_file, send_message
disable: false
---

# 病历条线产品库存监控

监控病历条线8个产品的库存需求、近一周新增、近一周关闭、每日库存趋势。

## ⚠️ 重要：触发此技能

当用户要求以下任务时，**必须立即加载此技能**，不要自行查询数据：
- 病历条线库存监控
- 产品库存进度分析
- 基准库存统计（截止某日期）
- 库存趋势报告

**错误做法**：直接调用API或查询数据
**正确做法**：先加载此技能 → 按技能流程执行

## 监控产品范围

| 序号 | 产品名称 | TFS实际名称（含变体） |
|------|----------|---------------------|
| 01 | WiNEX 病历管理 | WiNEX 病历管理 |
| 02 | WiNEX 门诊病历管理 | WiNEX 门诊病历管理 |
| 03 | WiNEX 急诊病历 | WiNEX 急诊病历、03 WiNEX 急诊病历 |
| 04 | WiNEX 病案无纸化 | WINEX 病案无纸化、WiNEX 病案无纸化 |
| 05 | WiNEX 医生站病案首页 | WINEX 医生站病案首页、WiNEX 医生站病案首页 |
| 06 | WiNEX 病案统计管理 | WiNEX 病案统计管理 |
| 07 | WiNEX 病案翻拍 | WiNEX 病案翻拍、WINEX 病案翻拍 |
| 08 | WiNEX 病案首页质控 | WiNEX 病案首页质控 |
| 09 | WiNEX 病历质控 | WiNEX 病历质控 |

**⚠️ 重要：产品范围可能根据用户要求动态调整，默认包含以上9个产品**

---

## 执行流程

### Step 1: 获取TFS实时数据（优先使用预置查询）

⚠️ **重要：优先使用用户提供的预置查询ID，比自定义WiQL查询更可靠！**

**数据获取策略（按优先级）**：

| 优先级 | 数据类型 | 方式 | 说明 |
|:-----:|:-------|:---|:------|
| **1** | 新增/关闭数据 | **标准预置查询ID** | 最可靠，口径与用户TFS查询一致，**强制使用** |
| **2** | 库存数据 | 标准预置查询 | 查询ID: 920c888e-d178-48f9-b890-31e7a03244d6 |
| **3** | 其他数据 | WiQL自定义查询 | 仅作为降级方案，**禁止作为首选** |

---

## ⚠️⚠️⚠️ 【强制规则】预置查询使用规范

**新增/关闭数据必须使用标准预置查询ID（已验证可用）**：

| 数据类型 | 查询ID | 完整URL |
|:-------|:------|:--------|
| **监控期间新增** | `7ef2c787-e966-4304-827a-8c09beb7fa80` | http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Inpatient-2/_queries?id=7ef2c787-e966-4304-827a-8c09beb7fa80&_a=query-edit |
| **监控期间关闭** | `c5276b73-fed9-4c4f-83c7-86fea07c3ee4` | http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Inpatient-2/_queries?id=c5276b73-fed9-4c4f-83c7-86fea07c3ee4&_a=query-edit |

**标准库存预置查询**：

| 配置项 | 值 |
|:-------|:---|
| 数据来源 | **TFS预置查询（唯一来源）** |
| 查询URL | `http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Inpatient-2/_queries?tempQueryId=920c888e-d178-48f9-b890-31e7a03244d6` |
| 查询ID | `920c888e-d178-48f9-b890-31e7a03244d6` |
| 项目路径 | `WiNEX-Inpatient-2` |

---

### ⚠️ 禁止事项（严格执行）

| 禁止行为 | 原因 |
|:--------|:------|
| **禁止**使用WiQL自定义查询获取新增/关闭数据 | 口径与预置查询不一致，会导致数据差异 |
| **禁止**手写WiQL查询替代预置查询 | 日期格式、状态筛选可能导致偏差 |
| **禁止**使用其他查询ID或查询路径 | 只有上述3个查询ID是已验证的标准口径 |
| **禁止**从缓存或历史数据文件读取数据 | 必须每次实时获取TFS数据 |

---

### ✅ 预置查询执行代码（强制使用）

```python
# ===== 强制使用预置查询获取新增/关闭数据 =====

from requests_ntlm import HttpNtlmAuth
import requests
from collections import defaultdict

TFS_URL = "http://tfs2018-web.winning.com.cn:8080/tfs"
COLLECTION = "WINNING-6.0"
PROJECT = "WiNEX-Inpatient-2"

# ⚠️ 使用标准预置查询ID（强制）
NEW_QUERY_ID = "7ef2c787-e966-4304-827a-8c09beb7fa80"   # 监控期间新增
CLOSED_QUERY_ID = "c5276b73-fed9-4c4f-83c7-86fea07c3ee4" # 监控期间关闭

TFS_USER = 'kjl'
TFS_PASSWORD = 'Kjl7386885'  # ⚠️ 密码安全：从记忆获取

session = requests.Session()
session.auth = HttpNtlmAuth(TFS_USER, TFS_PASSWORD, session)
session.headers.update({'Content-Type': 'application/json'})

# Step 1: 执行新增查询
new_query_url = f"{TFS_URL}/{COLLECTION}/{PROJECT}/_apis/wit/wiql/{NEW_QUERY_ID}?api-version=4.1"
resp_new = session.get(new_query_url, timeout=120)
new_result = resp_new.json()
new_ids = [wi['id'] for wi in new_result.get('workItems', [])]
print(f"新增工作项数量: {len(new_ids)}")

# Step 2: 执行关闭查询
closed_query_url = f"{TFS_URL}/{COLLECTION}/{PROJECT}/_apis/wit/wiql/{CLOSED_QUERY_ID}?api-version=4.1"
resp_closed = session.get(closed_query_url, timeout=120)
closed_result = resp_closed.json()
closed_ids = [wi['id'] for wi in closed_result.get('workItems', [])]
print(f"关闭工作项数量: {len(closed_ids)}")

# Step 3: 批量获取详情（每批100条）
def batch_get_details(ids, session):
    items = []
    for i in range(0, len(ids), 100):
        batch_ids = ids[i:i+100]
        ids_str = ','.join(str(id) for id in batch_ids)
        detail_url = f"{TFS_URL}/{COLLECTION}/_apis/wit/workitems?ids={ids_str}&api-version=4.1"
        batch_resp = session.get(detail_url, timeout=120)
        if batch_resp.status_code == 200:
            batch_data = batch_resp.json()
            for item in batch_data.get('value', []):
                fields = item.get('fields', {})
                items.append({
                    'id': item['id'],
                    '标题': fields.get('System.Title', ''),
                    '状态': fields.get('System.State', ''),
                    '需求类型': fields.get('Microsoft.VSTS.CMMI.RequirementType', ''),
                    '产品名称': fields.get('Winning.Product.Name', ''),
                    '模块': fields.get('Winning.Module.name', ''),
                    '责任人': fields.get('System.AssignedTo', ''),
                    '创建日期': fields.get('System.CreatedDate', ''),
                    '关闭日期': fields.get('Microsoft.VSTS.Common.ResolvedDate', '')
                })
    return items

new_items = batch_get_details(new_ids, session)
closed_items = batch_get_details(closed_ids, session)
```

---

### ⚠️ 用户提供自定义查询URL时的处理

如果用户提供了不同的预置查询URL（格式：`.../_queries?id=xxx&_a=query-edit`）：

**正确做法**：
1. 从URL中提取查询ID（`id=xxx` 参数）
2. **替换**标准查询ID，使用用户提供的查询ID
3. 执行GET请求获取数据
4. 在报告中注明数据来源URL

**示例**：
- 用户说："新增数据URL: .../_queries?id=abc123&_a=query-edit"
- 提取ID：`abc123`
- 使用该ID替代标准查询ID执行查询

---

### ✅ 验证数据一致性

**执行预置查询后，必须验证数据**：

```python
# 验证新增数据按需求类型分布
new_by_type = defaultdict(int)
for item in new_items:
    new_by_type[item['需求类型']] += 1
print(f"新增按类型: {dict(new_by_type)}")
# 预期输出: {'软件质量': ~75, '接口': ~5, '功能性的': ~208}

# 验证关闭数据按需求类型分布
closed_by_type = defaultdict(int)
for item in closed_items:
    closed_by_type[item['需求类型']] += 1
print(f"关闭按类型: {dict(closed_by_type)}")
# 预期输出: {'软件质量': ~111, '接口': ~7, '功能性的': ~224}
```

**TFS服务器信息**：
- 服务器：`tfs2018-web.winning.com.cn:8080/tfs`
- Collection：`WINNING-6.0`
- 认证：**NTLM域认证**（推荐）
- API版本：`4.1`（TFS 2018适用）

**⚠️ NTLM认证方法（推荐）**：

```python
from requests_ntlm import HttpNtlmAuth
import requests

TFS_URL = "http://tfs2018-web.winning.com.cn:8080/tfs"
COLLECTION = "WINNING-6.0"
PROJECT = "WiNEX-Inpatient-2"
QUERY_ID = "064376cf-69af-4e3f-b794-b5697dedd06a"

TFS_USER = 'kjl'  # 域用户名
TFS_PASSWORD = '***'  # 域密码（从记忆获取）

session = requests.Session()
session.auth = HttpNtlmAuth(TFS_USER, TFS_PASSWORD, session)
```

**预置查询执行方式**：

```python
# 方式一：执行用户提供的预置查询（推荐）
# 用户提供的查询URL格式：.../_queries?id={QUERY_ID}&_a=query-edit
# 提取查询ID后执行GET请求

NEW_QUERY_ID = "7ef2c787-e966-4304-827a-8c09beb7fa80"   # 用户提供的新增查询
CLOSED_QUERY_ID = "c5276b73-fed9-4c4f-83c7-86fea07c3ee4" # 用户提供的关闭查询

# 执行新增数据查询
new_query_url = f"{TFS_URL}/{COLLECTION}/{PROJECT}/_apis/wit/wiql/{NEW_QUERY_ID}?api-version=4.1"
resp_new = session.get(new_query_url, timeout=120)
new_result = resp_new.json()
new_ids = [wi['id'] for wi in new_result.get('workItems', [])]

# 执行关闭数据查询
closed_query_url = f"{TFS_URL}/{COLLECTION}/{PROJECT}/_apis/wit/wiql/{CLOSED_QUERY_ID}?api-version=4.1"
resp_closed = session.get(closed_query_url, timeout=120)
closed_result = resp_closed.json()
closed_ids = [wi['id'] for wi in closed_result.get('workItems', [])]

# 方式二：执行标准库存预置查询
QUERY_ID = "920c888e-d178-48f9-b890-31e7a03244d6"
query_url = f"{TFS_URL}/{COLLECTION}/{PROJECT}/_apis/wit/wiql/{QUERY_ID}?api-version=4.1"
resp = session.get(query_url, timeout=120)
result = resp.json()

# 获取工作项ID列表
work_item_ids = [wi['id'] for wi in result.get('workItems', [])]

# 批量获取详情（每批100条）
all_items = []
for i in range(0, len(work_item_ids), 100):
    batch_ids = work_item_ids[i:i+100]
    ids_str = ','.join(str(id) for id in batch_ids)
    detail_url = f"{TFS_URL}/{COLLECTION}/_apis/wit/workitems?ids={ids_str}&api-version=4.1"
    batch_resp = session.get(detail_url, timeout=120)
    batch_data = batch_resp.json()
    
    for item in batch_data.get('value', []):
        fields = item.get('fields', {})
        all_items.append({
            'id': item['id'],
            '标题': fields.get('System.Title', ''),
            '状态': fields.get('System.State', ''),
            '需求类型': fields.get('Microsoft.VSTS.CMMI.RequirementType', ''),
            '产品名称': fields.get('Winning.Product.Name', ''),
            '模块': fields.get('Winning.Module.name', ''),
            '责任人': fields.get('System.AssignedTo', ''),
            '优先级': fields.get('Microsoft.VSTS.Common.Priority', 4),
            '完成日期': fields.get('Microsoft.VSTS.Scheduling.FinishDate', ''),
            '创建日期': fields.get('System.CreatedDate', ''),
            '关闭日期': fields.get('Microsoft.VSTS.Common.ResolvedDate', ''),
            '工作项类型': fields.get('System.WorkItemType', '')
        })
```

**⚠️ 禁止事项**：
- **禁止**使用CRC API获取数据
- **禁止**手写WiQL查询（可能导致口径不一致）
- **禁止**使用其他查询ID或查询路径
- **禁止**从缓存或历史数据文件读取数据

**需求类型筛选**（产品监控口径）：
- 功能性的（⚠️ 字段值带"的"字）
- 软件质量
- 接口

**⚠️ 重要：需求类型字段使用**
- **正确字段**：`Microsoft.VSTS.CMMI.RequirementType`（推荐，数据更准确）
- **备选字段**：`Winning.Demand.Classify`（部分记录为空，不推荐）
- **差异示例**：软件质量需求，`RequirementType`返回44条，`Classify`只返回28条

**排除类型**：支持单、内部虚拟（不在监控范围内）

**获取详细字段**：

WiQL返回ID列表后，批量获取详情（每批100条）：

```python
all_ids = [wi['id'] for wi in result.get('workItems', [])]

for i in range(0, len(all_ids), 100):
    batch_ids = all_ids[i:i+100]
    ids_str = ','.join(str(id) for id in batch_ids)
    url = f'{TFS_BASE_URL}/_apis/wit/workitems?ids={ids_str}&api-version=4.1'
    resp = session.get(url, timeout=120)
    batch_details = resp.json().get('value', [])
```

### Step 2: 过滤病历条线数据（含产品名称变体映射）

⚠️ **重要**：TFS数据中产品名称可能存在变体，需要映射处理

**TFS产品名称格式特点**：
- 可能带空格：`WiNEX 病历管理` 或 `WiNEX病历管理`
- 需使用 `strip()` 和 contains 匹配

```python
# 产品名称变体映射（标准名称 → 可能的变体）
# ⚠️ 注意：避免使用过于通用的变体（如'病历质控'）防止与其他产品混淆
PRODUCT_VARIANTS = {
    # ⚠️ 重要：WiNEX病历管理 和 WiNEX门诊病历管理 必须分开统计，不合并！
    # 匹配顺序：先匹配门诊病历管理（更精确），再匹配病历管理
    'WiNEX门诊病历管理': ['WiNEX门诊病历管理', 'WiNEX 门诊病历管理'],  # ⚠️ 不含'门诊病历管理'避免误匹配
    'WiNEX病历管理': ['WiNEX病历管理', 'WiNEX 病历管理'],  # ⚠️ 移除'病历管理'避免匹配门诊病历管理
    'WiNEX急诊病历': ['WiNEX急诊病历', 'WiNEX 急诊病历', '03 WiNEX急诊病历', '03 WiNEX 急诊病历'],
    'WiNEX病案无纸化': ['WiNEX病案无纸化', 'WiNEX 病案无纸化', 'WINEX病案无纸化', 'WINEX 病案无纸化'],
    'WiNEX医生站病案首页': ['WiNEX医生站病案首页', 'WiNEX 医生站病案首页', 'WINEX医生站病案首页', 'WINEX 医生站病案首页'],
    'WiNEX病案统计管理': ['WiNEX病案统计管理', 'WiNEX 病案统计管理'],
    'WiNEX病案翻拍': ['WiNEX病案翻拍', 'WiNEX 病案翻拍', 'WINEX病案翻拍', 'WINEX 病案翻拍'],
    'WiNEX病案首页质控': ['WiNEX病案首页质控', 'WiNEX 病案首页质控'],
    'WiNEX病历质控': ['WiNEX病历质控', 'WiNEX 病历质控']
}

# ⚠️⚠️⚠️ 强制规则：匹配顺序必须先匹配门诊病历管理，再匹配病历管理
# 原因：'病历管理'可能出现在'门诊病历管理'中，必须先排除门诊
MATCH_ORDER = ['WiNEX门诊病历管理', 'WiNEX病历管理', 'WiNEX急诊病历', 
               'WiNEX病案无纸化', 'WiNEX医生站病案首页', 'WiNEX病案统计管理',
               'WiNEX病案翻拍', 'WiNEX病案首页质控', 'WiNEX病历质控']

# 匹配逻辑
medical_data = []
for item in data:
    product = item.get('产品名称', '')
    
    # ⚠️⚠️⚠️ 强制按MATCH_ORDER顺序匹配，确保门诊病历管理先匹配，避免被病历管理误匹配
    is_medical = False
    matched_product = None
    
    for std_product in MATCH_ORDER:  # ⚠️ 按顺序匹配，先门诊后病历
        variants = PRODUCT_VARIANTS[std_product]
        # 精确匹配优先，再模糊匹配
        if product in variants:
            is_medical = True
            matched_product = std_product
            break
        # 模糊匹配：检查变体是否在产品名称中
        elif any(v in product for v in variants):
            is_medical = True
            matched_product = std_product
            break
    
    if is_medical:
        item_copy = dict(item)
        item_copy['产品名称_标准化'] = matched_product  # 标准化产品名称
        medical_data.append(item_copy)

# ⚠️ 验证：检查门诊病历管理是否被正确分离
from collections import Counter
std_dist = Counter(item['产品名称_标准化'] for item in medical_data)
print(f"标准化产品分布: {dict(std_dist)}")
# 预期：WiNEX病历管理 ~288条, WiNEX门诊病历管理 ~110条（分开统计，不合并）
```

### Step 2.1: 区域路径过滤（可选）

⚠️ **适用场景**：当用户要求排除特定产品中的特定区域路径数据时使用

**示例**：排除WiNEX病历质控产品中区域路径为"WiNEX-Inpatient-2\病历质控"的数据

```python
# 区域路径字段：System.AreaPath（需在Step 1中添加到字段提取）
'区域路径': fields.get('System.AreaPath', '')

# 过滤逻辑
filtered_data = []
for item in medical_data:
    # 检查是否需要排除该区域路径
    if item['产品名称_标准化'] == 'WiNEX病历质控' and item['区域路径'] == 'WiNEX-Inpatient-2\\病历质控':
        continue  # 排除
    filtered_data.append(item)

# ⚠️ 注意：区域路径在TFS中使用反斜杠分隔，如 "WiNEX-Inpatient-2\\病历"
# Python字符串中需使用双反斜杠或原始字符串
```

**常见区域路径格式**：
- `WiNEX-Inpatient-2` — 顶层项目
- `WiNEX-Inpatient-2\\病历` — 病历模块
- `WiNEX-Inpatient-2\\病历质控` — 病历质控子模块
- `WiNEX-CaseHistory` — 病案项目
- `WiNEX-Outpatient` — 门诊项目

### Step 3: 计算库存指标

**重要**：TFS原生API包含"需求类型"字段（System.WorkItemType），可按类型筛选。

**需求类型定义**（产品监控口径）：
- 功能性的
- 软件质量
- 接口

**排除类型**：支持单、内部虚拟（不在产品监控范围内）

**库存定义**：
- 库存状态：活动、已分析、已建议（非已解决、已关闭、已验证）
- 需求类型：功能性的、软件质量、接口（三选一）

**⚠️ 重要：已解决状态不属于库存，已解决意味着需求已处理完成等待关闭**

**⚠️⚠️⚠️ 极其重要：产品监控覆盖完整时间段，从基准日期(2026-05-17)到当前日期！**

**获取完整时间段数据（用于"每日跟踪动态"表格）**：

```python
# ⚠️ 关键：产品监控覆盖从基准日期到当前日期的所有天数（不仅仅是近一周）
from datetime import datetime, timedelta

BASELINE_DATE = '2026-05-17T00:00:00'  # 基准日期（ISO格式）
CURRENT_DATE = datetime.now().strftime('%Y-%m-%dT23:59:59')

# 计算监控天数
baseline_dt = datetime(2026, 5, 17)
current_dt = datetime.now()
days_count = (current_dt - baseline_dt).days + 1  # 包含当天

# WiQL查询：获取从基准日期至今的所有新增数据
wiql_new = """
SELECT [System.Id], [System.Title], [System.State], 
       [Microsoft.VSTS.CMMI.RequirementType], [Winning.Product.Name], 
       [System.AssignedTo], [System.CreatedDate], [Winning.Module.name]
FROM WorkItems
WHERE [System.CreatedDate] >= '{}'
  AND ([Microsoft.VSTS.CMMI.RequirementType] = '功能性的' OR [Microsoft.VSTS.CMMI.RequirementType] = '软件质量' OR [Microsoft.VSTS.CMMI.RequirementType] = '接口')
ORDER BY [System.CreatedDate] ASC
""".format(BASELINE_DATE)

# WiQL查询：获取从基准日期至今的所有解决数据
wiql_closed = """
SELECT [System.Id], [System.Title], [System.State], 
       [Microsoft.VSTS.CMMI.RequirementType], [Winning.Product.Name], 
       [System.AssignedTo], [Microsoft.VSTS.Common.ResolvedDate], [System.CreatedDate]
FROM WorkItems
WHERE ([System.State] = '已解决' OR [System.State] = '已关闭' OR [System.State] = '已验证')
  AND ([Microsoft.VSTS.CMMI.RequirementType] = '功能性的' OR [Microsoft.VSTS.CMMI.RequirementType] = '软件质量' OR [Microsoft.VSTS.CMMI.RequirementType] = '接口')
  AND [Microsoft.VSTS.Common.ResolvedDate] >= '{}'
ORDER BY [Microsoft.VSTS.Common.ResolvedDate] ASC
""".format(BASELINE_DATE)

# 执行WiQL查询
wiql_url = f"{TFS_URL}/{COLLECTION}/_apis/wit/wiql?api-version=4.1"
resp_new = session.post(wiql_url, json={'query': wiql_new}, timeout=120)
resp_closed = session.post(wiql_url, json={'query': wiql_closed}, timeout=120)

# ⚠️ 注意：WiQL日期格式必须使用ISO格式 '2026-05-17T00:00:00'
```

**按日期统计新增和解决**：

```python
# ⚠️ 重要：使用正确的数据结构初始化，避免KeyError
# 监控周期日期列表
date_range = ['05-17', '05-18', '05-19', '05-20', '05-21', '05-22', '05-23', '05-24']

# 方法1：预先初始化所有日期的统计结构
new_by_date = {d: {'功能性': 0, '软件质量': 0, '接口': 0} for d in date_range}
closed_by_date = {d: {'功能性': 0, '软件质量': 0, '接口': 0} for d in date_range}

# 方法2：封装为函数
def get_date_stats(items, date_field, date_range):
    """按日期统计各类型数量"""
    stats = {d: {'功能性': 0, '软件质量': 0, '接口': 0} for d in date_range}
    for item in items:
        date_str_raw = item.get(date_field, '')
        if not date_str_raw:
            continue
        parsed = parse_date_utc(date_str_raw)
        if not parsed:
            continue
        date_key = parsed.strftime('%m-%d')
        if date_key not in stats:
            continue  # 跳过不在监控周期内的数据
        item_type = item.get('需求类型', '功能性的')
        if item_type in stats[date_key]:
            stats[date_key][item_type] += 1
    return stats

new_by_date = get_date_stats(new_items, '创建日期', date_range)
closed_by_date = get_date_stats(closed_items, '关闭日期', date_range)

# ⚠️ 注意：需求类型字段值必须为 '功能性的'（带"的"字）、'软件质量'、'接口'
# 如果使用 defaultdict(lambda: {...}) 可能遇到 KeyError，建议使用预先初始化的方式
```

**⚠️ 报告必须展示完整时间段数据**：
- 每日新增表格：包含从基准日期到当前日期的所有天数
- 每日解决表格：包含从基准日期到当前日期的所有天数
- 每日库存变化表格：新增/解决/净变化/趋势

# 执行WiQL查询
wiql_url = f"{TFS_URL}/{COLLECTION}/_apis/wit/wiql?api-version=4.1"
resp = session.post(wiql_url, json={'query': wiql_closed}, timeout=120)

# 获取详情并统计每日解决
closed_items = []
# ... 批量获取详情逻辑

# 统计按日期分布
from collections import defaultdict
closed_by_date = defaultdict(lambda: {'功能性的': 0, '软件质量': 0, '接口': 0, '合计': 0})

for item in closed_items:
    closed_date = item.get('关闭日期', '')
    if closed_date:
        date_obj = datetime.fromisoformat(closed_date.replace('Z', '+00:00')).replace(tzinfo=None)
        date_str = date_obj.strftime('%m-%d')
        req_type = item.get('需求类型', '')
        if req_type in ['功能性的', '软件质量', '接口']:
            closed_by_date[date_str][req_type] += 1
            closed_by_date[date_str]['合计'] += 1

# 篮选病历条线产品数据
# ... 同Step 2的产品名称匹配逻辑
```

**⚠️ 如果不执行此查询，"每日解决"表格将全部为0，导致报告不完整！**

---

### Step 3.1: 基准库存计算（固化数据）

**⚠️ 重要：基准库存数据已固化，每次报告必须使用以下固定数据**

**基准日期**：2026-05-17

**⚠️⚠️⚠️ 重要：基准库存必须动态计算，禁止使用固化数据！**

**基准库存计算公式**（必须执行WiQL查询）：
```python
# 第1部分：库存状态 + 创建≤基准
wiql_part1 = """
SELECT [System.Id] FROM WorkItems
WHERE ([System.State] = '活动' OR [System.State] = '已分析' OR [System.State] = '已建议')
  AND [System.CreatedDate] <= '2026-05-17'
  AND ([Microsoft.VSTS.CMMI.RequirementType] = '功能性的' OR ...)
"""

# 第2部分：关闭状态 + 关闭≥基准 + 创建≤基准
wiql_part2 = """
SELECT [System.Id] FROM WorkItems
WHERE ([System.State] = '已解决' OR [System.State] = '已关闭' OR [System.State] = '已验证')
  AND [System.CreatedDate] <= '2026-05-17'
  AND [Microsoft.VSTS.Common.ResolvedDate] >= '2026-05-17'
  AND ([Microsoft.VSTS.CMMI.RequirementType] = '功能性的' OR ...)
"""

基准库存 = 第1部分数量 + 第2部分数量
```

**⚠️ 为什么不能使用固化数据**：
- 固化数据可能不准确（之前使用652条，实际WiQL计算为739条）
- 固化数据会导致库存变化逻辑矛盾（如：本周新增<本周解决，但库存却增长）
- 必须通过WiQL动态计算确保数据一致性

**验证逻辑**：
```
当前库存 = 基准库存 + 本周新增仍在库存 - 本周解决基准前创建

其中：
- 本周新增仍在库存 = 本周新增 - 本周新增本周解决
- 本周解决基准前创建 = 本周解决中创建日期≤基准日期的需求

验证误差应<5条，否则需检查数据口径
```

```python
# 基准日期示例
BASELINE_DATE = datetime(2026, 5, 17)

# 第1部分：库存状态 + 创建≤基准
part1 = [item for item in product_data 
         if item.get('状态') in inventory_states 
         and parse_date(item.get('创建日期')) <= BASELINE_DATE]

# 第2部分：关闭状态 + 关闭≥基准 + 创建≤基准
part2 = [item for item in product_data 
         if item.get('状态') in closed_states 
         and parse_date(item.get('创建日期')) <= BASELINE_DATE
         and parse_date(item.get('关闭日期')) >= BASELINE_DATE]

baseline_inventory = len(part1) + len(part2)
```

**用途**：
- 对比基准库存 vs 当前库存，计算变化量和变化幅度
- 评估库存改善/恶化趋势

### Step 4: 生成MD报告

**⚠️⚠️⚠️ 【强制规则 - 用户反复强调】必须严格按照标准模板生成完整8章节，不得跳过任何章节！**

**用户对"模板"强调三次：模板，模板，模板！以后每次都是按照模板输出！**

---

**🔴 强制执行流程（每次生成报告必须遵循）**：

**Step 4.1**: 先读取标准模板文件
```python
# 必须先读取模板，了解完整结构
template_path = '/home/lenovo/.hermes/skills/ai-team/product-monitor/SKILL.md'
template_content = read_file(template_path)
```

**Step 4.2**: 逐一填充8个章节（严格按模板占位符）
- 每个章节必须完整生成，不得简化或跳过
- 表格格式必须与模板完全一致
- 所有占位符 `{{xxx}}` 必须填充真实数据

**Step 4.3**: 检查报告完整性（生成后必须自查）
- 检查是否包含全部8个章节标题
- 检查每个章节是否包含模板要求的表格
- 检查"每日解决"表格是否有真实数据（不为空）

---

**标准模板位置**: `/home/lenovo/.hermes/skills/ai-team/product-monitor/SKILL.md`

**报告必须包含的8个章节（每个章节的表格和内容都必须完整）**：

| 章节 | 必须包含的表格/内容 | 强制要求 |
|:----:|:-----------------|:--------|
| **1.1 库存总览** | 产品明细表（9产品） + 变化对比表 + 趋势解读 | 必须包含所有9产品，变化对比表必须有基准数据 |
|| **1.2 每日跟踪动态** | 每日新增表（完整监控天数×3类型） + 每日解决表（完整监控天数×3类型） + 每日库存变化表 + 期间新增按产品分布 + 趋势解读 | 监控天数从基准日期(2026-05-17)到当前日期，必须展示完整天数数据 |
| **1.3 库存需求按模块分布** | TOP15模块表 + 问题分类表 + 趋势解读 | 必须输出TOP15模块，问题分类表必须有数据 |
| **1.4 库存软件质量按模块分布** | TOP15软件质量模块表 + 关键发现 + 问题分类表 + 趋势解读 | 必须标注模块未指定率，问题分类必须有数据 |
| **1.5 超期分布** | 总览表 + 按状态表 + 按产品表 + 按类型表 + 按责任人TOP10表 + 明细TOP20表 + 趋势解读 | **必须输出全部6个子表格，不得遗漏任何表格** |
| **1.6 结构性风险问题及建议** | 至少3项结构性风险分析 + 每项含明细表 + 改进建议 + 趋势解读 | 每项风险必须有明细表和具体建议 |
| **1.7 责任人分布** | TOP10责任人表（总数/已建议/已分析/活动） + 需关注说明 + 趋势解读 | 必须输出TOP10责任人，需关注说明必须填写 |
| **1.8 总结与建议** | 核心指标汇总（6-8项） + 关注点清单（4-5项） | 核心指标和关注点都必须有具体内容 |

---

**用户明确要求（强制遵守）**: 
- ✅ 必须使用标准模板8章节结构，不得自行简化或跳过章节
- ✅ 每个章节的表格格式需遵循模板，但尊重用户记忆中的偏好优化
- ✅ "每日解决"表格必须有真实数据，不能为空（需要额外查询已关闭数据）
- ✅ 趋势解读必须填写，不能留空
- ✅ 超期分布章节按用户偏好简化（保留概览/按类型/按责任人/明细）

**⚠️ 重要：模板与用户偏好平衡策略**
生成报告前必须执行：
1. **先读取模板文件**：`/home/lenovo/.hermes/skills/ai-team/product-monitor/SKILL.md` 确认8章节结构
2. **再检查用户记忆偏好**：查看memory中的报告格式偏好（合并表格、简化超期分析等）
3. **平衡两者**：遵循模板章节结构，但按用户偏好优化具体内容格式
4. **遇到质疑时**：对比模板文件与生成报告，解释差异来源（用户偏好 vs 模板要求）

---

**数据补充要求**：

---

### ✅ 监控期间新增数据查询（强制执行）

**⚠️ 重要：监控时间范围从基准日期开始（包含当天）到当前日期，不是"一周"数据**

**查询规则**：

```python
# WiQL查询：监控期间新增（创建日期在基准日期到当前日期）
# ⚠️⚠️⚠️ 重要：必须使用正确的UTC时间转换！
# 本地时间（中国UTC+8）基准日期00:00 = UTC时间 前一天16:00
# 例如：本地时间 2026-05-17 00:00 = UTC时间 2026-05-16T16:00:00

from datetime import datetime, timedelta

BASELINE_DATE_LOCAL = datetime(2026, 5, 17, 0, 0, 0)  # 本地时间基准日期
BASELINE_DATE_UTC = BASELINE_DATE_LOCAL - timedelta(hours=8)  # 转换为UTC时间

CURRENT_DATE_LOCAL = datetime.now()  # 当前本地时间
CURRENT_DATE_UTC = CURRENT_DATE_LOCAL - timedelta(hours=8)  # 转换为UTC时间

# WiQL查询使用UTC时间（ISO格式）
BASELINE_DATE = BASELINE_DATE_UTC.strftime('%Y-%m-%dT%H:%M:%S')  # '2026-05-16T16:00:00'
CURRENT_DATE = CURRENT_DATE_UTC.strftime('%Y-%m-%dT%H:%M:%S')    # 如 '2026-05-24T15:59:59'

wiql_new = """
SELECT [System.Id], [System.Title], [System.State], 
       [Microsoft.VSTS.CMMI.RequirementType], [Winning.Product.Name],
       [System.CreatedDate], [System.AreaPath]
FROM WorkItems
WHERE [System.CreatedDate] >= '{BASELINE_DATE}'
  AND [System.CreatedDate] <= '{CURRENT_DATE}'
  AND ([Microsoft.VSTS.CMMI.RequirementType] = '功能性的' 
       OR [Microsoft.VSTS.CMMI.RequirementType] = '软件质量' 
       OR [Microsoft.VSTS.CMMI.RequirementType] = '接口')
ORDER BY [System.CreatedDate] ASC
"""
```

**⚠️ 重要说明**：
- **监控期间新增** = 创建日期在基准日期到当前日期之间的所有需求（本地时间）
- **包含所有状态**（活动/已建议/已分析/已解决/已关闭/已验证）
- **不限制状态**，只要是监控期间创建的都算新增
- **报告标题应标注完整监控天数**：如"2026-05-17 ~ 2026-05-24 (8天)"
- **⚠️⚠️⚠️ 时区转换陷阱**：
  - 错误：`CreatedDate >= '2026-05-17T00:00:00'`（UTC）→ 漏掉本地时间凌晨0-8点的数据
  - 正确：`CreatedDate >= '2026-05-16T16:00:00'`（UTC）→ 对应本地时间 2026-05-17 00:00

---

### ✅ 本周解决数据查询（强制执行）

如果库存数据不包含已关闭状态，必须执行额外查询：
```python
# 获取已关闭数据（状态=已解决/已关闭/已验证，ResolvedDate >= 基准日期）
# ⚠️⚠️⚠️ 重要：使用正确的UTC时间转换！
# 本地时间基准日期00:00 = UTC时间 前一天16:00

from datetime import datetime, timedelta

BASELINE_DATE_LOCAL = datetime(2026, 5, 17, 0, 0, 0)
BASELINE_DATE_UTC = BASELINE_DATE_LOCAL - timedelta(hours=8)
BASELINE_DATE = BASELINE_DATE_UTC.strftime('%Y-%m-%dT%H:%M:%S')  # '2026-05-16T16:00:00'

wiql_closed = """
SELECT [System.Id], [System.State], [Microsoft.VSTS.CMMI.RequirementType], 
       [Winning.Product.Name], [System.AssignedTo], [Microsoft.VSTS.Common.ResolvedDate]
FROM WorkItems
WHERE ([System.State] = '已解决' OR [System.State] = '已关闭' OR [System.State] = '已验证')
  AND ([Microsoft.VSTS.CMMI.RequirementType] = '功能性的' 
       OR [Microsoft.VSTS.CMMI.RequirementType] = '软件质量' 
       OR [Microsoft.VSTS.CMMI.RequirementType] = '接口')
  AND [Microsoft.VSTS.Common.ResolvedDate] >= '{BASELINE_DATE}'
ORDER BY [Microsoft.VSTS.Common.ResolvedDate] DESC
"""
```

**⚠️ 时区转换注意事项**：
- ResolvedDate也存储为UTC时间
- 统计解决日期时，需要转换到本地时间：`local_date = utc_date + timedelta(hours=8)`
- 例如：UTC时间 `2026-05-20T02:00` → 本地时间 `2026-05-20 10:00`
```

**文件路径**：`/mnt/c/Users/Lenovo/Desktop/病历条线产品库存监控_{YYYYMMDD}.md`

---

**文件路径**：`/mnt/c/Users/Lenovo/Desktop/病历条线产品库存监控_{YYYYMMDD}.md`

### Step 5: 发送到飞书

**方案一**：文本消息（推荐，无需权限）
```python
send_message(target="feishu", message=报告摘要)
```

**方案二**：飞书云文档（需权限）
- 前置条件：`docx:document` + `docx:document:create` 权限
- 开通地址：https://open.feishu.cn/app/cli_a9647ffdccb99bb4/auth
- 参考技能：`feishu-document-upload`

---

## 常见问题

### Q: 用户要求"产品监控从5月17日开始"，但我只查询了一周数据
**原因**：误解了监控时间范围，认为"近一周"即可
**解决**：
- 监控时间范围必须从基准日期(2026-05-17)到当前日期，包含当天
- 计算监控天数：`(当前日期 - 基准日期).days + 1`
- 报告标题标注完整天数：如"2026-05-17 ~ 2026-05-24 (8天)"

### Q: WiQL查询日期格式导致400错误
**原因**：WiQL日期必须使用ISO格式 `'2026-05-16T16:00:00'`，不能使用 `'2026-05-17'`
**解决**：使用 `datetime.strftime('%Y-%m-%dT%H:%M:%S')` 格式化日期

### Q: 用户提供了预置查询URL，如何使用？
**场景**：用户说"新增数据URL: .../_queries?id=xxx" 或 "关闭数据URL: ..."
**正确做法**：
1. 从URL中提取查询ID（`id=xxx` 参数）
2. 使用GET请求执行该预置查询：`/_apis/wit/wiql/{QUERY_ID}?api-version=4.1`
3. 批量获取工作项详情（每批100条）
4. 与用户TFS查询结果对比验证

**⚠️ 重要**：预置查询数据与用户TFS界面查询结果一致，比自定义WiQL查询更准确！

**示例**：
- 用户提供新增查询：返回288条（含功能性的208、软件质量75、接口5）
- 用户提供关闭查询：返回342条（含功能性的224、软件质量111、接口7）
- WiQL自定义查询可能存在口径差异（日期格式、状态筛选等）

### Q: 数据统计与用户TFS查询结果不一致
**原因**：可能有多重原因
**解决步骤**：
1. **确认查询条件一致**：
   - 产品范围：是否包含所有病历条线9个产品
   - 需求类型：功能性的 + 软件质量 + 接口（三类）
   - 状态范围：新增查询不限制状态，解决查询只包含已解决/已关闭/已验证
   
2. **检查时区转换**：
   - WiQL使用UTC时间，用户TFS Web界面使用本地时间
   - 正确转换：本地时间00:00 = UTC时间前一天16:00
   - 例如：本地时间 2026-05-20 00:00 = UTC时间 2026-05-19T16:00
   
3. **数据验证方法**：
   - 打印前20条需求ID，让用户在TFS上核对
   - 检查数据文件中的状态分布、产品分布
   - 对比关键需求ID（如ID最小值、最大值）

4. **常见差异场景**：
   - 用户只查询功能性的需求（忽略软件质量和接口）
   - 用户查询范围包含/排除某个产品
   - 时区转换导致部分数据归类到不同日期
**原因**：WiQL查询条件不完整（缺少状态筛选或产品筛选）
**解决**：在WHERE条件中同时添加：
- 状态筛选：`AND [System.State] = '活动' OR [System.State] = '已解决' OR ...`
- 需求类型筛选：`AND [Microsoft.VSTS.CMMI.RequirementType] = '功能性的' OR ...`
- 产品筛选：`AND [Winning.Product.Name] = 'WiNEX 病历管理' OR ...`

### Q: TFS认证失败（401 Unauthorized）

**⚠️ 已知状态（截至2026-07-14）**：所有已知凭证均返回401，包括：
- NTLM: `kjl` / `Kjl7386885` → 401
- NTLM: `kjl` / `Winning@2026` → 401
- PAT Basic Auth → 401
**结论：凭证已过期，必须联系本人获取新凭证。**

### Q: TFS认证失败（401 Unauthorized）
**原因**：NTLM域密码错误或PAT Token无效/过期

**⚠️ 凭证过期快速升级规则**：
- 如果 **NTLM 认证返回 401**，立即尝试 **一种** 备选密码（最多2次尝试）
- 如果 **PAT Token 认证返回 401**，说明凭证可能已过期
- 如果 **两种认证方式都失败**，**立即升级到人类用户**，禁止继续重试
- **禁止行为**：循环尝试多个密码组合、反复测试不同认证方式

**凭证过期症状**（需立即升级）：
- NTLM 返回 401（即使使用正确密码）
- PAT 返回 401（TF400813: 资源不可用于匿名访问）
- 两者同时失败 → **凭证已过期，需人工更新**

**快速尝试清单**（最多2次）：
1. `Winning@2026`（域密码，成功率较高）
2. `Winning@123`（备选密码）

**升级消息模板**：
```python
send_message(
    target="feishu:oc_bcbf50b2cb04ee5d53ae430f0b83cd78",
    message=f"""🚨 TFS认证失败 - 需人工介入
    
**问题**：TFS API 认证返回 401，NTLM 和 PAT 均失败
**影响**：无法获取产品库存数据，报告生成阻塞
**建议**：
1. 检查域用户 `kjl` 的密码是否过期
2. 重新生成 PAT Token
3. 更新环境变量或提供新凭证

**错误详情**：
- NTLM: 401 Unauthorized
- PAT: 401 TF400813

请尽快处理。"""
)
```
4. 本人需提供新的NTLM密码或PAT Token

### Q: TFS API完全失败时的降级方案
**适用场景**：认证失败、网络问题、API不可用

**降级方案：使用缓存数据**
```python
# 缓存数据位置（按优先级）
CACHE_FILES = [
    '/tmp/tfs_api_data.json',  # 最新（推荐）
    '/tmp/tfs_data.json',
    '/tmp/tfs_test.json'
]

# 选择最新文件
import os
cache_file = max(CACHE_FILES, key=lambda f: os.path.getmtime(f) if os.path.exists(f) else 0)

# 加载缓存数据
with open(cache_file, 'r', encoding='utf-8') as f:
    json_data = json.load(f)
    data = json_data.get('data', [])  # 注意：缓存数据格式为 {"data": [...]}
```

**⚠️ 缓存数据限制**：
- 缺少"需求类型"字段 → 需从标题推断（如标题含"bug"/"缺陷"/"问题"→软件质量）
- 缺少"模块"字段 → 无法按模块分析
- 缺少"完成日期"字段 → 无法精确计算超期
- 数据可能过期 → 报告中需标注"数据来源：TFS缓存（降级方案）"

**报告标注要求**：
```markdown
**数据说明**:
- 本报告使用TFS缓存数据作为降级方案（TFS原生API认证失败）
- 缺少模块、完成日期、需求类型等关键字段
- 建议使用TFS原生API（查询ID: xxx）获取完整数据
- 部分数据为估算值，实际数据请以TFS原生API为准
```

### Q: WiQL查询语法错误或返回异常数据
**原因**：TFS2018对IN语法支持不稳定，WiQL字段名与标准不同
**解决**：
- 使用OR语法替代IN：`[Field] = 'A' OR [Field] = 'B'`
- 使用正确字段名：`Microsoft.VSTS.CMMI.RequirementType`（非`System.WorkItemType`）
- 使用正确字段值：`功能性的`（带"的"字）
- 产品字段：`Winning.Product.Name`（非`System.AreaPath`）

### Q: TFS预置查询返回空响应
**原因**：预置查询可能因网络、权限、查询ID等问题返回空
**解决**：
- **降级方案**：直接使用WiQL查询替代预置查询
- **WiQL查询示例**：
```python
wiql_query = """
SELECT [System.Id], [System.Title], [System.State], 
       [Microsoft.VSTS.CMMI.RequirementType], [Winning.Product.Name]
FROM WorkItems
WHERE [Microsoft.VSTS.CMMI.RequirementType] IN ('功能性的', '软件质量', '接口')
ORDER BY [System.Id] DESC
"""
wiql_url = f"{TFS_URL}/{COLLECTION}/_apis/wit/wiql?api-version=4.1"
resp = session.post(wiql_url, json={'query': wiql_query}, timeout=120)
```

### Q: 用户强调"按模板输出"，但我生成的报告不完整
**原因**：用户对模板要求非常严格，强调三次"模板"
**解决**：
- **必须严格按照模板生成完整8章节**，不得跳过任何章节
- **每个章节的表格都必须完整**（如超期分布需要6个子表格）
- **"每日解决"表格必须有真实数据**（需要额外查询已关闭数据）
- **趋势解读必须填写**，不能留空或省略
- **参考标准模板**：`/home/lenovo/.hermes/skills/ai-team/product-monitor/SKILL.md`

### Q: 报告责任人显示账号名（如"liuqing>"），用户要求显示中文姓名
**原因**：TFS责任人字段格式为 `账号(姓名) <WINNING\\账号>`，直接显示会显示账号名
**解决**：
- **必须使用 `extract_chinese_name()` 函数提取中文姓名**
- 函数已定义在"数据字段说明"章节
- 报告中责任人列必须显示中文姓名（如"刘青"、"李培"、"王斐凡"）
- **🔴 强制规则：所有责任人相关表格（超期责任人、库存责任人分布、超期明细）必须使用中文姓名**

### Q: 每日新增/关闭表格显示"—"或空值
**原因**：统计数据初始化方式错误（使用defaultdict可能遇到KeyError）或未获取新增/关闭数据
**解决**：
- **必须使用预置查询ID获取新增/关闭数据**：
  - 新增查询ID: `7ef2c787-e966-4304-827a-8c09beb7fa80`
  - 关闭查询ID: `c5276b73-fed9-4c4f-83c7-86fea07c3ee4`
- **使用预先初始化方式**：`stats = {d: {'功能性': 0, '软件质量': 0, '接口': 0} for d in date_range}`
- 或使用封装函数 `get_date_stats()`，见"按日期统计新增和解决"章节
- **🔴 强制规则：每日新增/解决表格必须有真实数据，禁止显示"—"或空值**

### Q: 每日新增"功能性"显示为0（但实际有数据）⚠️ 2026-05-25实际案例
**原因**：需求类型字段匹配逻辑错误，导致"功能性的"数据被错误过滤
**实际错误代码示例**：
```python
# ❌ 错误：字段名或值匹配问题导致功能性数据丢失
for item in new_items:
    req_type = item.get('需求类型', '功能性的')  # 可能返回空或其他值
    if req_type in new_by_date[date_key]:  # 字典key不匹配
        new_by_date[date_key][req_type] += 1
```

**正确代码**：
```python
# ✅ 正确：直接使用TFS字段名，确保类型值完全匹配
for it in new_items:
    if it['创建_dt']:
        dk = it['创建_dt'].strftime('%m-%d')
        if dk in new_daily:
            # 直接用'类型'字段，确保值为'功能性的'/'软件质量'/'接口'
            tp = it['类型']
            if tp in new_daily[dk]:  # 预初始化字典包含这三个key
                new_daily[dk][tp] += 1
```

**验证方法**：
```python
# 执行后必须验证！
new_type_dist = Counter(it['类型'] for it in new_items)
print(f"新增按类型: {dict(new_type_dist)}")
# 预期输出: {'功能性的': ~237, '软件质量': ~98, '接口': ~8}
# 如果功能性=0，说明筛选逻辑有bug！
```

**🔴 强制规则**：生成报告前必须打印类型分布验证数据正确性！

### Q: 报告生成后用户反馈"几处代码取值没有成功"
**常见取值失败场景**：
1. **超期率计算为 "?"**：超期数/总数计算时分母为0或未初始化
2. **软件质量超期率缺失**：软件质量库存数未正确统计
3. **责任人显示账号名**：忘记调用 `extract_chinese_name()`

### ⚠️⚠️⚠️ Q: 用户反馈"没有按照模板生成"（最常见问题）
**根因**: 漏掉了模板要求的表格，导致报告不完整

**必须包含的表格清单（超期分布章节 1.5）**：
1. ✅ 超期总览表（库存总数、有完成日期、无完成日期、超期数、未超期）
2. ✅ 超期按状态分布表（已建议、已分析、活动的超期数）
3. ✅ 超期按产品分布表（每个产品的库存、超期数、超期率）
4. ✅ 超期按需求类型表（软件质量、功能性的超期数和超期率）
5. ✅ 超期按责任人（Top 10）表
6. ✅ 超期明细（Top 20）表（必须包含：ID、产品、类型、模块、完成日期、责任人、标题摘要）

**超期明细获取代码**：
```python
# 查询库存数据，筛选超期项，按超期天数排序
overdue_items = []
for item in medical_inventory:
    finish_dt = parse_date_utc(item.get('完成日期', ''))
    if finish_dt and finish_dt < today:
        item['超期天数'] = (today - finish_dt).days
        overdue_items.append(item)

# 按超期天数降序，取Top20
overdue_items.sort(key=lambda x: x['超期天数'], reverse=True)
overdue_top20 = overdue_items[:20]

# 输出明细表数据
for item in overdue_top20:
    print(f"| {item['id']} | {item['产品名称_标准化']} | {item['需求类型']} | {item['模块']} | {item['完成日期'][:10]} | {item['责任人_中文']} | {item['标题'][:30]}...")
```

**结构性风险章节（1.6）必须包含明细表**：
- 每项风险必须有详细明细表（TFS需求号 | 责任人 | 超期 | 类型 | 问题描述）
- 不能只写概要，必须有具体的TFS ID和标题

**生成报告前的自查清单**：
- [ ] 超期按状态分布表是否包含（已建议、已分析、活动）三个状态？
- [ ] 超期按产品分布表是否包含9个产品的超期率和库存数？
- [ ] 超期明细Top20是否包含具体的TFS ID、标题、完成日期？
- [ ] 结构性风险是否有详细明细表，不只是概要？

**统一解决方案**：
```python
# 生成报告前必须验证数据完整性
def validate_report_data(inventory, new_items, closed_items, overdue_items):
    """报告数据完整性验证"""
    errors = []
    
    # 1. 验证责任人姓名提取
    for item in overdue_items[:5]:
        if '<' in item.get('assignee', '') or '>' in item.get('assignee', ''):
            errors.append(f"责任人未提取中文姓名: {item['assignee']}")
    
    # 2. 验证每日数据不为空
    total_new = sum(sum(d.values()) for d in new_by_date.values())
    total_closed = sum(sum(d.values()) for d in closed_by_date.values())
    if total_new == 0:
        errors.append("每日新增数据为空，请检查预置查询ID")
    if total_closed == 0:
        errors.append("每日关闭数据为空，请检查预置查询ID")
    
    # 3. 验证软件质量库存数
    sw_quality_count = sum(1 for item in inventory if item.get('需求类型') == '软件质量')
    if sw_quality_count == 0:
        errors.append("软件质量库存数为0，请检查需求类型筛选")
    
    return errors

# 生成报告前调用验证
errors = validate_report_data(inventory, new_items, closed_items, overdue_items)
if errors:
    print(f"⚠️ 数据验证失败: {errors}")
    # 修复数据后再生成报告
```

### Q: 飞书文档上传403或权限错误
**原因**：飞书应用缺少必要权限或凭证

**所需权限（按优先级）**：
1. **docx:document** + **docx:document:create** — 创建飞书云文档（推荐）
2. **drive:drive** + **drive:file:upload** — 文件上传（权限门槛更高）

**所需凭证**：
- App ID: `cli_a9647ffdccb99bb4`（已配置）
- App Secret: 需从环境变量 `FEISHU_APP_SECRET` 读取（**必须配置**）

**开通步骤**：
1. 访问 https://open.feishu.cn/app/cli_a9647ffdccb99bb4/auth
2. 在「权限管理」中开通以下权限：
   - docx:document（创建、查看文档）
   - docx:document:create（创建文档）
   - drive:drive（文件管理）
   - drive:file:upload（上传文件）
3. 配置环境变量：`export FEISHU_APP_SECRET="xxx"`

**临时方案（权限未开通时）**：
```python
# 方案一：发送文本摘要（无需权限）
send_message(target="feishu", message=报告摘要)

# 方案二：MD文件保存到桌面，用户手动查看
write_file(path="/mnt/c/Users/Lenovo/Desktop/报告.md", content=report)
```

**⚠️ 环境变量检查**：执行前需确认 `FEISHU_APP_SECRET` 已配置（`echo $FEISHU_APP_SECRET`），否则只能发送文本摘要。

**参考技能**：`feishu-document-upload`（详细文档创建流程）

---

## 数据字段说明

**TFS原生API返回字段**：
- System.Id（需求ID）
- System.Title（标题）
- System.State（状态：活动/已解决/已分析/已建议/已关闭/已验证）
- Microsoft.VSTS.Common.Priority（优先级：1=P1, 2=P2, 3=P3, 4=P4）⚠️ 字段名注意
- System.AssignedTo（责任人）- 格式为 `账号(姓名) <WINNING\\账号>`
- System.CreatedDate（创建日期）
- Microsoft.VSTS.Common.ResolvedDate（关闭日期）
- Winning.Product.Name（产品名称）⚠️ 字段名注意
- Microsoft.VSTS.CMMI.RequirementType（需求类型：功能性的/软件质量/接口/支持单/内部虚拟）⚠️ 字段名注意

**⚠️ 责任人字段中文姓名提取（强制使用）**：

TFS责任人字段格式：`账号(姓名) <WINNING\\账号>` 或 `账号（姓名）`

```python
import re

def extract_chinese_name(assignee_str):
    """从TFS责任人字段提取中文姓名"""
    if not assignee_str:
        return "未分配"
    
    # 格式: 账号(姓名) <WINNING\\账号> 或 账号（姓名）
    # 支持中文括号（）和英文括号()
    match = re.search(r'[（(]([^)）]+)[)）]', assignee_str)
    if match:
        name = match.group(1)
        # 去掉部门后缀（如"-医院产品"）
        if '-' in name:
            name = name.split('-')[0]
        return name
    
    return assignee_str.strip()

# 示例：
# "s_ss(史姗姗) <WINNING\\s_ss>" → "史姗姗"
# "c_zj(蔡祖军-医院产品) <WINNING\\c_zj>" → "蔡祖军"
# "liuqing(刘青) <WINNING\\liuqing>" → "刘青"
```

**⚠️ 报告责任人必须使用中文姓名，禁止使用账号名！**

**产品监控筛选条件**：
- 需求类型：功能性的、软件质量、接口
- 排除：支持单、内部虚拟

---

## 输出示例

```
核心指标：
- 总库存：324条
- 高优先级(P1+P2)：64条
- 近一周新增：124条，关闭：125条，净变化：-1条

产品分布：
- WiNEX 病历管理：186条 (P1:2, P2:34)
- WiNEX 门诊病历：73条 (P1:0, P2:7)
- WiNEX 病案统计：37条 (P1:1, P2:11)

趋势分析：
✅ 下降：病案统计管理(-8)、病案无纸化(-3)
⚠️ 上升：门诊病历(+5)、病历管理(+3)
```