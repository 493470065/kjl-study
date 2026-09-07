# 前后端 API 契约规范

## 一、通用约定

### 1.1 请求格式
- Base URL: `/api/v1/`
- Content-Type: `application/json`
- 认证方式: [如 Bearer Token / Cookie]
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

// 分页响应
interface PageResponse<T> {
  code: number;
  message: string;
  data: {
    list: T[];           // 数据列表
    total: number;       // 总记录数
    pageNum: number;     // 当前页码
    pageSize: number;    // 每页条数
    totalPages: number;  // 总页数
  };
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
  // 业务错误码（根据具体需求补充）
}
```

### 1.4 分页请求参数

```typescript
interface PageRequest {
  pageNum: number;     // 页码，从 1 开始
  pageSize: number;    // 每页条数，默认 20
  sortBy?: string;     // 排序字段
  sortOrder?: 'asc' | 'desc';  // 排序方向
}
```

---

## 二、接口定义

### 2.1 [模块名称] 接口

#### [接口名称] - [功能描述]

**请求：**
```
[GET/POST/PUT/DELETE] /api/v1/[resource-path]
```

```typescript
// 请求参数
interface [RequestName] {
  field1: string;       // 字段说明
  field2: number;       // 字段说明
  field3?: boolean;     // 可选字段说明
}
```

```typescript
// 响应数据
interface [ResponseName] {
  id: string;           // 主键
  field1: string;       // 字段说明
  field2: number;       // 字段说明
  createTime: string;   // 创建时间 ISO8601
  updateTime: string;   // 更新时间 ISO8601
}
```

**示例请求：**
```json
{
  "field1": "value1",
  "field2": 100
}
```

**示例响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "xxx",
    "field1": "value1"
  }
}
```

---

## 三、数据模型定义

### 3.1 枚举类型

```typescript
enum [EnumName] {
  VALUE_1 = 'VALUE_1',  // 说明
  VALUE_2 = 'VALUE_2',  // 说明
}
```

### 3.2 DTO 定义

```typescript
// [DTO用途说明]
interface [DTOName] {
  id: string;
  // ... 字段定义
}
```

---

## 四、接口变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|---------|--------|
| v1.0 | [日期] | 初始定义 | [作者] |
