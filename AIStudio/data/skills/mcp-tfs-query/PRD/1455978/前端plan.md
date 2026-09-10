# 前端实施计划

## 一、准备工作

- [ ] 阅读需求文档和设计文档
- [ ] 了解项目结构和编码规范
- [ ] 搭建本地开发环境

## 二、API 调用层开发

### 2.1 创建 API 函数

- [ ] 创建 `api/emr-status.js` 文件
  - 路径: `src/api/emr-status.js`
  - 函数: `queryPatientEmrStatus(params)`

- [ ] 创建类型定义文件
  - 路径: `src/types/emr-status.js`
  - 定义: `PatientEmrStatusQueryRequest`, `PatientEmrStatusResponse`, `EmrStatusRecord`

## 三、组件开发

### 3.1 创建急诊病历状态标签组件

- [ ] 创建 `EmgEmrStatusTag` 组件
  - 路径: `src/components/emr-status/EmgEmrStatusTag.vue`
  - 功能: 根据状态显示不同颜色的标签
  - Props: status, statusName

### 3.2 修改患者病历状态查询组件

- [ ] 修改 `src/views/patient-emr-status/index.vue`
  - 添加病历类型筛选下拉框
  - 添加急诊病历类型显示
  - 修改表格列配置

- [ ] 添加病历类型筛选逻辑
  - 支持全部/门诊/急诊筛选
  - 筛选条件变化时重新查询

- [ ] 添加急诊病历状态显示
  - 显示病历类型列
  - 使用不同颜色区分急诊病历

## 四、状态管理

- [ ] 修改 `store/modules/emrStatus.js`
  - 添加急诊病历类型到 emrTypeList
  - 添加 getEmrTypeName getter

## 五、样式调整

- [ ] 添加急诊病历相关样式
  - 急诊病历类型标识样式
  - 状态标签样式

## 六、测试

- [ ] 功能测试
  - 验证病历类型筛选功能
  - 验证急诊病历状态显示
  - 验证空数据情况

- [ ] 兼容性测试
  - 验证浏览器兼容性
  - 验证与现有功能的兼容性
