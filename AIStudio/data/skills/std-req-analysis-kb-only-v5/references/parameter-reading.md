# 参数读取规则

仅在需求涉及参数、配置开关、默认值、院区差异化、兼容旧行为兜底，或代码显示功能由参数控制时读取参数。

## 数据源优先级

| 业务 | 优先级 | 数据源 | 说明 |
| --- | --- | --- | --- |
| 病案 | 1 | 数据库表 `MA_PARAMETER` | 有本机数据库配置时优先查库，保证参数值和有效状态最新。 |
| 病案 | 2 | `references/Param/ma-parameter.csv` | 数据库不可用、离线复核或需要批量检索时使用。 |
| 病历 | 1 | `references/Param/病历参数合集.csv` | 先用文件快速按关键词、编码、名称、描述命中候选参数。 |
| 病历 | 2 | 数据库表 `INPATIENT_EMR_PARAMETER` | 用于核对最新值、医院/院区范围、启用状态和删除状态。 |

## 配置边界

- 本技能保留现有数据库配置文件；跨平台改造不要求清空数据库账号和密码。
- 每个人也可以在自己电脑上通过环境变量覆盖 JSON 配置，避免修改共享 skill 文件。
- 病案数据库环境变量：`MA_PARAM_DB_SERVER`、`MA_PARAM_DB_DATABASE`、`MA_PARAM_DB_USER`、`MA_PARAM_DB_PASSWORD`，可选 `MA_PARAM_DB_SCHEMA`、`MA_PARAM_DB_TABLE`。
- 病历数据库环境变量：`INP_EMR_PARAM_DSN` 或 `INP_EMR_PARAM_JDBC_URL`、`INP_EMR_PARAM_DB_USER`、`INP_EMR_PARAM_DB_PASSWORD`、`INP_EMR_PARAM_DB_TABLE`。
- 数据库依赖不是必需项。没有数据库驱动或权限时，使用 CSV 离线检索，并在 `notes.md` 记录“参数未做数据库复核”。

## 病案参数

- 离线检索：

```bash
python3 scripts/query_ma_parameter.py --keyword <关键词>
```

Windows 环境可用 `python scripts/query_ma_parameter.py --keyword <关键词>`。

- 数据库复核需要安装 `pyodbc` 并配置 ODBC Driver，再运行：

```bash
python3 scripts/query_ma_parameter.py --keyword <关键词> --db
```

Windows 环境可用 `python scripts/query_ma_parameter.py --keyword <关键词> --db`。

- 重点字段：参数编码/键、参数名称、参数描述、当前值、默认值、医院或院区范围、删除标志。
- 查询有效参数，排除已删除参数；参数文件缺失时不要臆造 `ma-parameter.csv` 内容。

## 病历参数

- 离线检索：

```bash
python3 scripts/query_inpatient_emr_parameter.py --keyword <关键词>
```

Windows 环境可用 `python scripts/query_inpatient_emr_parameter.py --keyword <关键词>`。

- 数据库复核需要安装 `oracledb` 并配置本机 Oracle 连接，再运行：

```bash
python3 scripts/query_inpatient_emr_parameter.py --keyword <关键词> --db
```

Windows 环境可用 `python scripts/query_inpatient_emr_parameter.py --keyword <关键词> --db`。

- 重点字段：`INP_EMR_PARAM_NO`、`INP_EMR_PARAM_NAME`、`INP_EMR_PARAM_CONTENT`、`INP_EMR_PARAM_DESC`、`ENABLED_FLAG`、`HOSPITAL_SOID`、`HOSPITAL_AREA_ID`、`IS_DEL`、`PARAM_VALUE`。
- 文件和数据库不一致时，以数据库为准，并在本地 `notes.md` 记录差异；正文只写业务结论。

## 输出规则

参数结论只写可复用参数、是否新增参数、默认值如何保持旧行为、影响范围和待确认项。不要把连接串、账号密码、脚本报错或排错过程写入 `Winning.Demand.Analysis`。

## 新增参数路径规则

设计新增参数时，参数路径和层级必须先找依据，再写入正文：

1. 先查代码中的参数常量、参数读取位置和同类功能使用的路径。
2. 再查参数表或 CSV 中相近参数的路径格式。
3. 如项目内已有历史分析文档，可参考其中已确认的参数路径格式。
4. 路径应优先保持系统既有格式，例如“基础参数配置-<业务类型>-<功能节点>”这类已存在层级，而不是按当前需求所属业务模块、菜单名称或页面入口自行归类。
5. 如果找不到可验证的同类路径，不要臆造参数路径；在正文中写“参数路径待按系统参数规范确认”，并作为待确认项处理。

参数路径、参数名称、默认值和说明必须彼此一致；不能出现路径属于一个模块、参数名称属于另一个模块的混用。
