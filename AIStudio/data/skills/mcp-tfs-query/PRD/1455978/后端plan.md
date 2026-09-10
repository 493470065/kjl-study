# 后端实施计划

## 一、准备工作

- [ ] 阅读需求文档和设计文档
- [ ] 了解项目结构和编码规范
- [ ] 搭建本地开发环境

## 二、急诊模块开发

### 2.1 创建数据模型

- [ ] 创建 `EmgEmrStatusSyncLogPO` 实体类
  - 路径: `winning-emr-emg-emrset-application/src/main/java/com/winning/emr/emg/emrset/application/emrset/entity/`
  - 字段: id, syncId, emrSetId, patientId, encounterId, status, syncStatus, retryCount, errorMessage, createdTime, updatedTime

- [ ] 创建 `EmgEmrStatusNotifyRequest` 请求类
  - 路径: `winning-emr-emg-emrset-application/src/main/java/com/winning/emr/emg/emrset/application/emrset/valueobject/input/emr/`
  - 字段: emrSetId, patientId, encounterId, status, statusName, changeTime, operatorId, operatorName, deptId, deptName

- [ ] 创建 `EmgEmrStatusNotifyResponse` 响应类
  - 路径: `winning-emr-emg-emrset-application/src/main/java/com/winning/emr/emg/emrset/application/emrset/valueobject/output/emr/`
  - 字段: success, message, syncId

- [ ] 创建 `EmgEmrStatusDTO` 数据传输对象
  - 路径: `winning-emr-emg-emrset-application/src/main/java/com/winning/emr/emg/emrset/application/emrset/valueobject/`

### 2.2 创建 Repository

- [ ] 创建 `EmgEmrStatusSyncLogJpaRepo` 接口
  - 路径: `winning-emr-emg-emrset-application/src/main/java/com/winning/emr/emg/emrset/application/emrset/repository/`
  - 继承: `JpaRepository<EmgEmrStatusSyncLogPO, Long>`
  - 方法: `findBySyncStatusAndRetryCountLessThan()`

### 2.3 创建 Service

- [ ] 创建 `EmgEmrStatusNotifyService` 接口
  - 路径: `winning-emr-emg-emrset-application/src/main/java/com/winning/emr/emg/emrset/application/emrset/service/`
  - 方法: `notifyStatusChange()`, `retryNotify()`

- [ ] 创建 `EmgEmrStatusNotifyServiceImpl` 实现类
  - 路径: `winning-emr-emg-emrset-application/src/main/java/com/winning/emr/emg/emrset/application/emrset/service/impl/`
  - 实现状态变更通知逻辑
  - 实现重试机制

- [ ] 创建 `EmgEmrStatusSyncService` 接口和实现类
  - 实现调用门诊接口的逻辑

### 2.4 创建 Controller

- [ ] 创建 `EmgEmrStatusController` 控制器
  - 路径: `winning-emr-emg-emrset-provider/src/main/java/com/winning/emr/emg/emrset/provider/controller/`
  - 接口: `POST /api/v1/emg/emr/status/notify`

### 2.5 修改现有代码

- [ ] 修改 `EmgEmrSetOperateServiceImpl` 类
  - 在病历状态变更方法中添加状态通知调用
  - 确保事务一致性

## 三、门诊模块开发

### 3.1 创建数据模型

- [ ] 创建 `OptEmrEmgStatusPO` 实体类
  - 路径: `winning-emr-opt-emrset-application/src/main/java/com/winning/emr/opt/emrset/application/emrset/entity/`

- [ ] 创建 `EmgEmrStatusReceiveRequest` 请求类
- [ ] 创建 `EmgEmrStatusReceiveResponse` 响应类
- [ ] 创建 `OptEmrEmgStatusDTO` 数据传输对象

### 3.2 创建 Repository

- [ ] 创建 `OptEmrEmgStatusJpaRepo` 接口
  - 方法: `findByEmrSetId()`, `findByPatientIdAndEncounterIdOrderByChangeTimeDesc()`

### 3.3 创建 Service

- [ ] 创建 `OptEmrEmgStatusReceiveService` 接口
  - 方法: `receiveEmgStatus()`, `queryEmgStatus()`

- [ ] 创建 `OptEmrEmgStatusReceiveServiceImpl` 实现类
  - 实现接收急诊状态逻辑
  - 实现状态存储逻辑

### 3.4 创建 Controller

- [ ] 创建 `OptEmrEmgStatusController` 控制器
  - 接口: `POST /api/v1/opt/emr/emg-status/receive`

### 3.5 修改现有代码

- [ ] 修改患者综合查询相关 Service
  - 添加查询急诊病历状态的逻辑
  - 合并门诊和急诊状态数据

## 四、数据库脚本

- [ ] 编写建表 SQL 脚本
  - `emg_emr_status_sync_log` 表
  - `opt_emr_emg_status` 表

- [ ] 执行数据库脚本

## 五、配置文件

- [ ] 添加配置项到 `application.yml`
  - `emr.emg.status-sync.enabled`
  - `emr.emg.status-sync.endpoint`

## 六、单元测试

- [ ] 编写 Service 层单元测试
- [ ] 编写 Controller 层单元测试

## 七、联调测试

- [ ] 与前端联调
- [ ] 验证状态同步功能
- [ ] 验证患者综合查询显示
