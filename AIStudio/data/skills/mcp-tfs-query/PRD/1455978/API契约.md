# 前后端 API 契约规范

## 一、通用约定

### 1.1 请求格式
- Base URL: `/api/v1/`
- Content-Type: `application/json`
- 认证方式: JWT Token
- 字符编码: UTF-8

### 1.2 通用响应结构

```typescript
// 统一响应包装
interface ApiResponse<T> {
  code: number;        // 业务状态码，0 表示成功
  message: string;     // 提示信息
  data: T;             // 业务数据
  timestamp: number;   // 服务端时间戳
}
```

### 1.3 通用错误码

```typescript
enum ErrorCode {
  SUCCESS = 0,
  PARAM_ERROR = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
  EMR_NOT_FOUND = 1001,    // 病历不存在
  PATIENT_NOT_FOUND = 1002 // 患者不存在
}
```

---

## 二、接口定义

### 2.1 急诊病历状态同步接口

#### 2.1.1 通知急诊病历状态变更

**请求：**
```
POST /api/v1/emg/emr/status/notify
```

```typescript
// 请求参数
interface EmgEmrStatusNotifyRequest {
  emrSetId: string;           // 病历ID
  patientId: string;          // 患者ID
  encounterId: string;        // 就诊ID
  status: EmrStatusCode;      // 病历状态
  statusName: string;         // 状态名称
  changeTime: string;         // 变更时间 ISO8601
  operatorId: string;         // 操作人ID
  operatorName: string;       // 操作人姓名
  deptId: string;             // 科室ID
  deptName: string;           // 科室名称
}

// 病历状态枚举
enum EmrStatusCode {
  CREATED = 'CREATED',         // 已创建
  SAVED = 'SAVED',            // 已保存
  SUBMITTED = 'SUBMITTED',     // 已提交
  SIGNED_OFF = 'SIGNED_OFF'   // 已签审
}
```

```typescript
// 响应数据
interface EmgEmrStatusNotifyResponse {
  success: boolean;           // 是否成功
  message: string;            // 提示信息
  syncId: string;             // 同步记录ID
}
```

**示例请求：**
```json
{
  "emrSetId": "1234567890",
  "patientId": "PAT001",
  "encounterId": "ENC001",
  "status": "SIGNED_OFF",
  "statusName": "已签审",
  "changeTime": "2026-04-15T10:30:00+08:00",
  "operatorId": "DOC001",
  "operatorName": "张医生",
  "deptId": "DEPT001",
  "deptName": "急诊科"
}
```

**示例响应：**
```json
{
  "code": 0,
  "message": "状态同步成功",
  "data": {
    "success": true,
    "message": "状态已同步到门诊",
    "syncId": "SYNC20260415103000001"
  },
  "timestamp": 1713135000000
}
```

### 2.2 门诊状态接收接口

#### 2.2.1 接收急诊病历状态

**请求：**
```
POST /api/v1/opt/emr/emg-status/receive
```

```typescript
// 请求参数（同急诊通知接口）
interface EmgEmrStatusReceiveRequest {
  emrSetId: string;
  patientId: string;
  encounterId: string;
  status: EmrStatusCode;
  statusName: string;
  changeTime: string;
  operatorId: string;
  operatorName: string;
  deptId: string;
  deptName: string;
}
```

```typescript
// 响应数据
interface EmgEmrStatusReceiveResponse {
  success: boolean;
  message: string;
  recordId: string;           // 门诊记录ID
}
```

### 2.3 患者综合查询接口

#### 2.3.1 查询患者病历状态

**请求：**
```
GET /api/v1/opt/emr/patient/status
```

```typescript
// 请求参数
interface PatientEmrStatusQueryRequest {
  patientId: string;          // 患者ID（必填）
  encounterId?: string;       // 就诊ID（可选）
  startDate?: string;         // 开始日期
  endDate?: string;           // 结束日期
  emrType?: string;           // 病历类型 OPT/EMG/ALL
  pageNum?: number;           // 页码
  pageSize?: number;          // 每页条数
}
```

```typescript
// 响应数据
interface PatientEmrStatusQueryResponse {
  patientId: string;
  patientName: string;
  total: number;
  records: EmrStatusRecord[];
}

interface EmrStatusRecord {
  emrSetId: string;
  emrType: string;            // OPT/EMG
  emrTypeName: string;        // 门诊/急诊
  emrTemplateName: string;    // 病历名称
  status: EmrStatusCode;
  statusName: string;
  changeTime: string;
  operatorName: string;
  deptName: string;
}
```

---

## 三、数据模型定义

### 3.1 枚举类型

```typescript
enum EmrStatusCode {
  CREATED = 'CREATED',
  SAVED = 'SAVED',
  SUBMITTED = 'SUBMITTED',
  SIGNED_OFF = 'SIGNED_OFF'
}

enum EmrTypeCode {
  OUTPATIENT = 'OPT',         // 门诊
  EMERGENCY = 'EMG',          // 急诊
  INPATIENT = 'INP'           // 住院
}
```

### 3.2 DTO 定义

```typescript
// 急诊病历状态DTO
interface EmgEmrStatusDTO {
  emrSetId: string;
  patientId: string;
  encounterId: string;
  status: EmrStatusCode;
  statusName: string;
  changeTime: string;
  operatorId: string;
  operatorName: string;
  deptId: string;
  deptName: string;
  createTime?: string;
  updateTime?: string;
}

// 患者病历状态记录DTO
interface PatientEmrStatusRecordDTO {
  recordId: string;
  emrSetId: string;
  patientId: string;
  encounterId: string;
  emrType: EmrTypeCode;
  emrTypeName: string;
  emrTemplateName: string;
  status: EmrStatusCode;
  statusName: string;
  changeTime: string;
  operatorId: string;
  operatorName: string;
  deptId: string;
  deptName: string;
  createTime: string;
  updateTime: string;
}
```

---

## 四、接口变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|---------|--------|
| v1.0 | 2026-04-15 | 初始定义，新增急诊病历状态同步相关接口 | AI |
