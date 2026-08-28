<template>
  <div class="ops-dashboard-view">
    <div class="page-header">
      <h2>运营平台看板</h2>
    </div>

    <el-tabs v-model="activeTab">
      <!-- ====== Tab 1: 表模型查看 ====== -->
      <el-tab-pane label="表模型查看" name="tableModel">
        <div class="sub-panel">
          <el-radio-group v-model="tableSubPanel" size="small" style="margin-bottom: 16px">
            <el-radio-button value="tableAnalysis">表结构分析</el-radio-button>
            <el-radio-button value="patchQuery">补丁查询</el-radio-button>
            <el-radio-button value="entityQuery">实体对象查询</el-radio-button>
            <el-radio-button value="versionDiff">版本差异分析</el-radio-button>
            <el-radio-button value="standard">基准库</el-radio-button>
          </el-radio-group>

          <!-- 表结构分析 -->
          <div v-if="tableSubPanel === 'tableAnalysis'">
            <el-form :inline="true" :model="tableAnalysisForm" label-width="80px">
              <el-form-item label="项目集" required>
                <el-input v-model="tableAnalysisForm.projectName" placeholder="默认 winex" style="width: 180px" />
              </el-form-item>
              <el-form-item label="表名" required>
                <el-input v-model="tableAnalysisForm.tableName" placeholder="如 PARAMETER" style="width: 200px" @keyup.enter="handleTableAnalysis" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleTableAnalysis" :loading="tableAnalysisLoading">查询</el-button>
              </el-form-item>
            </el-form>

            <template v-if="tableAnalysisInfo">
              <!-- 表元数据头 -->
              <div style="background: #f0f5ff; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
                <div style="font-size: 13px; color: #595959;">
                  <strong>表名：</strong>{{ tableAnalysisInfo.tableName || '' }}<br>
                  <strong>类名：</strong>{{ tableAnalysisInfo.className || '' }}<br>
                  <strong>项目：</strong>{{ tableAnalysisInfo.projectName || '' }}<br>
                  <strong>部门：</strong>{{ tableAnalysisInfo.deptOwner || '' }}<br>
                  <strong>中心：</strong>{{ tableAnalysisInfo.centerOwner || '' }}<br>
                  <strong>字段数：</strong>{{ (tableAnalysisInfo.properties || []).length }}
                </div>
              </div>

              <!-- 字段列表 -->
              <h4 style="margin: 16px 0 8px">字段列表</h4>
              <el-table :data="tableAnalysisInfo.properties || []" stripe border style="width: 100%" max-height="400">
                <el-table-column label="字段名" min-width="150">
                  <template #default="{ row }">{{ row.fieldName || row.name || '' }}</template>
                </el-table-column>
                <el-table-column prop="displayName" label="中文名" min-width="120" />
                <el-table-column label="类型" width="140">
                  <template #default="{ row }">{{ row.dataType || row.type || '' }}{{ row.attrLen ? '(' + row.attrLen + ')' : '' }}</template>
                </el-table-column>
                <el-table-column label="主键" width="70" align="center">
                  <template #default="{ row }">{{ (row.isPk || row.isPK) ? '是' : '' }}</template>
                </el-table-column>
                <el-table-column label="可空" width="70" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.nullable ? 'info' : 'danger'" size="small">{{ row.nullable ? '是' : '否' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="注释" min-width="200">
                  <template #default="{ row }">{{ row.description || row.comment || '' }}</template>
                </el-table-column>
              </el-table>

              <!-- 索引信息 -->
              <template v-if="(tableAnalysisInfo.indexes || []).length > 0">
                <h4 style="margin: 16px 0 8px">索引信息 ({{ tableAnalysisInfo.indexes.length }})</h4>
                <el-table :data="tableAnalysisInfo.indexes" stripe border style="width: 100%" max-height="300">
                  <el-table-column prop="indexName" label="索引名" min-width="180" />
                  <el-table-column prop="columns" label="字段" min-width="150" />
                  <el-table-column label="唯一" width="70" align="center">
                    <template #default="{ row }">{{ (row.isUniqueIndex || row.isUnique) ? '是' : '' }}</template>
                  </el-table-column>
                  <el-table-column label="主键" width="70" align="center">
                    <template #default="{ row }">{{ (row.isPrimIndex || row.isPrimary) ? '是' : '' }}</template>
                  </el-table-column>
                  <el-table-column label="聚集" width="70" align="center">
                    <template #default="{ row }">{{ (row.isClustIndex || row.isClustered) ? '是' : '' }}</template>
                  </el-table-column>
                  <el-table-column prop="indexType" label="类型" width="100" />
                </el-table>
              </template>

              <!-- 数据血缘 -->
              <template v-if="lineageRelations.length > 0">
                <h4 style="margin: 16px 0 8px">数据血缘</h4>
                <el-table :data="lineageRelations" stripe border style="width: 100%" max-height="300">
                  <el-table-column prop="sourcePropertyName" label="字段" min-width="150" />
                  <el-table-column prop="targetDbName" label="目标表" min-width="150" />
                  <el-table-column prop="targetPropertyName" label="目标字段" min-width="150" />
                  <el-table-column prop="targetProductName" label="目标产品" min-width="150" />
                </el-table>
              </template>
            </template>
          </div>

          <!-- 补丁查询 -->
          <div v-if="tableSubPanel === 'patchQuery'">
            <el-radio-group v-model="patchType" size="small" style="margin-bottom: 12px">
              <el-radio-button value="ddl">DDL 补丁</el-radio-button>
              <el-radio-button value="dml">DML 补丁</el-radio-button>
            </el-radio-group>

            <el-form v-if="patchType === 'ddl'" :inline="true" :model="ddlForm" label-width="80px">
              <el-form-item label="表名">
                <el-input v-model="ddlForm.tableName" placeholder="表名（可选）" style="width: 200px" />
              </el-form-item>
              <el-form-item label="字段名">
                <el-input v-model="ddlForm.fieldName" placeholder="字段名（可选）" style="width: 200px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleDdlPatchSearch" :loading="ddlPatchLoading">查询</el-button>
              </el-form-item>
            </el-form>

            <el-form v-if="patchType === 'dml'" :inline="true" :model="dmlForm" label-width="80px">
              <el-form-item label="迭代号" required>
                <el-input v-model="dmlForm.iteration" placeholder="如 V1.2.3" list="dml-iteration-list" style="width: 200px" />
                <datalist id="dml-iteration-list">
                  <option v-for="v in dmlVersionOptions" :key="v" :value="v" />
                </datalist>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleDmlPatchSearch" :loading="dmlPatchLoading">查询</el-button>
              </el-form-item>
            </el-form>

            <!-- DDL 补丁结果 -->
            <template v-if="patchType === 'ddl' && ddlPatchItems.length">
              <h4 style="margin: 16px 0 8px">DDL 补丁列表 ({{ ddlPatchItems.length }}条)</h4>
              <el-table :data="ddlPatchItems" stripe border style="width: 100%" max-height="500">
                <el-table-column label="需求号" width="120">
                  <template #default="{ row }">
                    <a v-if="row.workItemId" :href="'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_workitems/edit/' + row.workItemId" target="_blank" style="color: #409eff">{{ row.workItemId }}</a>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="关联克隆需求" width="160">
                  <template #default="{ row }">
                    <template v-if="parseCloneWorkItemIds(row.cloneWorkItemId).length">
                      <template v-for="(id, idx) in parseCloneWorkItemIds(row.cloneWorkItemId)" :key="id">
                        <a :href="'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_workitems/edit/' + id" target="_blank" style="color: #409eff">{{ id }}</a>
                        <span v-if="idx < parseCloneWorkItemIds(row.cloneWorkItemId).length - 1">, </span>
                      </template>
                    </template>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="TFS项目" width="140">
                  <template #default="{ row }">
                    <span v-if="row._workItemInfo?.project" style="color: #722ed1; font-size: 12px;">{{ row._workItemInfo.project }}</span>
                    <span v-else style="color: #999;">-</span>
                  </template>
                </el-table-column>
                <el-table-column label="TFS迭代" width="140">
                  <template #default="{ row }">
                    <span v-if="row._workItemInfo?.iteration" style="color: #eb2f96; font-size: 12px;">{{ row._workItemInfo.iteration }}</span>
                    <span v-else style="color: #999;">-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="tableName" label="表名" min-width="150" />
                <el-table-column label="描述" min-width="200">
                  <template #default="{ row }">{{ row.decription || row.description || '' }}</template>
                </el-table-column>
                <el-table-column prop="productName" label="产品线" width="120" />
                <el-table-column prop="branch" label="分支" width="120" />
                <el-table-column label="字段变化" min-width="200">
                  <template #default="{ row }">
                    <span v-html="row._fieldChangeHtml || '-'"></span>
                  </template>
                </el-table-column>
              </el-table>
            </template>

            <!-- DML 补丁结果 -->
            <template v-if="patchType === 'dml' && dmlPatchItems.length">
              <h4 style="margin: 16px 0 8px">DML 补丁列表 ({{ dmlPatchItems.length }}条)</h4>
              <el-table :data="dmlPatchItems" stripe border style="width: 100%" max-height="500">
                <el-table-column label="需求号" width="120">
                  <template #default="{ row }">
                    <a v-if="row.workItemId" :href="'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_workitems/edit/' + row.workItemId" target="_blank" style="color: #409eff">{{ row.workItemId }}</a>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="关联克隆需求" width="160">
                  <template #default="{ row }">
                    <template v-if="parseCloneWorkItemIds(row.cloneWorkItemId).length">
                      <template v-for="(id, idx) in parseCloneWorkItemIds(row.cloneWorkItemId)" :key="id">
                        <a :href="'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_workitems/edit/' + id" target="_blank" style="color: #409eff">{{ id }}</a>
                        <span v-if="idx < parseCloneWorkItemIds(row.cloneWorkItemId).length - 1">, </span>
                      </template>
                    </template>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="masterTableName" label="主表" min-width="150" />
                <el-table-column prop="dataThemeName" label="数据主题" min-width="120" />
                <el-table-column prop="sendType" label="发送类型" width="100" />
                <el-table-column prop="product_name" label="产品线" width="120" />
                <el-table-column label="备注" min-width="200">
                  <template #default="{ row }">{{ row.remark || '' }}</template>
                </el-table-column>
                <el-table-column prop="create_time" label="创建时间" width="160" />
              </el-table>
            </template>

            <el-empty v-else-if="patchQueried && ((patchType === 'ddl' && !ddlPatchItems.length) || (patchType === 'dml' && !dmlPatchItems.length))" description="暂无数据" />
          </div>

          <!-- 实体对象查询 -->
          <div v-if="tableSubPanel === 'entityQuery'">
            <el-form :inline="true" :model="entityForm" label-width="100px">
              <el-form-item label="项目名" required>
                <el-input v-model="entityForm.projectName" placeholder="如 winex" style="width: 180px" />
              </el-form-item>
              <el-form-item label="表名">
                <el-input v-model="entityForm.tableName" placeholder="如 PARAMETER" style="width: 200px" />
              </el-form-item>
              <el-form-item label="模块名">
                <el-input v-model="entityForm.moduleName" placeholder="可选" style="width: 160px" />
              </el-form-item>
            </el-form>
            <el-form :inline="true" label-width="100px" style="margin-top: -8px">
              <el-form-item label="classId">
                <el-input v-model="entityForm.classId" placeholder="查询后自动填充，也可手动输入" style="width: 300px" />
              </el-form-item>
              <el-form-item label="字段中文名">
                <el-input v-model="entityForm.fieldName" placeholder="如: 签署日期" style="width: 200px" />
              </el-form-item>
            </el-form>
            <div style="display: flex; gap: 8px; margin-bottom: 16px; padding-left: 100px">
              <el-button type="primary" @click="handleEntityQuery" :loading="entityQueryLoading">查询 classId</el-button>
              <el-button @click="handleModelAnalyze" :loading="modelAnalyzeLoading" :disabled="!entityForm.classId">模型分析</el-button>
              <el-button @click="handleQueryFieldsByTable" :loading="fieldsByTableLoading" :disabled="!entityForm.projectName || !entityForm.tableName">查询字段</el-button>
              <el-button @click="handleQueryByFieldName" :loading="byFieldNameLoading" :disabled="!entityForm.projectName || !entityForm.fieldName">按字段名查询</el-button>
            </div>

            <!-- classId 查询结果 -->
            <template v-if="classIdResult">
              <div style="background: #f0f5ff; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
                <div style="font-size: 13px; color: #595959;">
                  <strong>classId：</strong><span style="font-family: monospace; background: #e6f7ff; padding: 4px 8px; border-radius: 3px; user-select: all;">{{ classIdResult }}</span>
                </div>
              </div>
            </template>

            <!-- 模型分析结果 -->
            <template v-if="modelAnalyzeResult">
              <div style="background: #f0f5ff; padding: 12px; border-radius: 4px; margin-bottom: 16px; max-height: 400px; overflow-y: auto;">
                <pre style="margin: 0; font-size: 12px; white-space: pre-wrap; word-break: break-all;">{{ JSON.stringify(modelAnalyzeResult, null, 2) }}</pre>
              </div>
            </template>

            <!-- 查询字段 / 按字段名查询 结果 -->
            <template v-if="fieldQueryResults.length">
              <h4 style="margin: 16px 0 8px">字段查询结果</h4>
              <el-table :data="fieldQueryResults" stripe border style="width: 100%" max-height="400">
                <el-table-column prop="tableEnglishName" label="表英文名" min-width="150" />
                <el-table-column prop="tableChineseName" label="表中文名" min-width="120" />
                <el-table-column prop="fieldName" label="字段名" min-width="150" />
                <el-table-column prop="fieldComment" label="字段注释" min-width="200" />
              </el-table>
            </template>
          </div>

          <!-- 版本差异分析 -->
          <div v-if="tableSubPanel === 'versionDiff'">
            <!-- 步骤1: 查询实体 -->
            <el-card shadow="never" style="margin-bottom: 16px">
              <template #header><span>步骤1: 查询表实体</span></template>
              <el-form :inline="true" :model="versionStep1" label-width="80px">
                <el-form-item label="表名" required>
                  <el-input v-model="versionStep1.tableName" placeholder="如 CLINICAL_ORDER" style="width: 200px" @keyup.enter="handleQueryTableInfo" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleQueryTableInfo" :loading="versionStep1Loading">查询</el-button>
                </el-form-item>
              </el-form>
              <el-table v-if="tableInfoList.length" :data="tableInfoList" stripe style="width: 100%" max-height="200" highlight-current-row @current-change="handleTableInfoSelect">
                <el-table-column label="选择" width="60">
                  <template #default="{ row }">
                    <el-radio v-model="selectedTableId" :value="row.id" @change="handleEntityRadioChange(row)">&nbsp;</el-radio>
                  </template>
                </el-table-column>
                <el-table-column label="表名" min-width="150">
                  <template #default="{ row }">{{ row.defaultTblName || '' }}</template>
                </el-table-column>
                <el-table-column label="显示名" min-width="150">
                  <template #default="{ row }">{{ row.displayName || '' }}</template>
                </el-table-column>
                <el-table-column prop="projectName" label="项目" min-width="120" />
                <el-table-column prop="responsePerson" label="负责人" width="100" />
              </el-table>
            </el-card>

            <!-- 步骤2: 选择版本 -->
            <el-card v-if="versionList.length" shadow="never" style="margin-bottom: 16px">
              <template #header><span>步骤2: 选择版本</span></template>
              <el-form :inline="true" label-width="100px">
                <el-form-item label="旧版本">
                  <el-select v-model="versionStep2.firstVersion" placeholder="选择旧版本" style="width: 320px">
                    <el-option v-for="v in versionList" :key="v.classVersion" :value="v.classVersion" :label="v.classVersion + ' - ' + (v.createTime || '').substring(0, 10) + ' (' + (v.submitBy || '') + ')'" />
                  </el-select>
                </el-form-item>
                <el-form-item label="新版本">
                  <el-select v-model="versionStep2.secondVersion" placeholder="选择新版本" style="width: 320px">
                    <el-option v-for="v in versionList" :key="v.classVersion" :value="v.classVersion" :label="v.classVersion + ' - ' + (v.createTime || '').substring(0, 10) + ' (' + (v.submitBy || '') + ')'" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleDiffTree" :loading="versionStep2Loading" :disabled="!selectedTableId || !versionStep2.firstVersion || !versionStep2.secondVersion">对比</el-button>
                </el-form-item>
              </el-form>
              <!-- 版本历史列表 -->
              <el-table :data="versionList" stripe style="width: 100%" max-height="200">
                <el-table-column prop="classVersion" label="版本号" width="120" />
                <el-table-column prop="createTime" label="创建时间" min-width="160" />
                <el-table-column prop="submitBy" label="提交人" width="100" />
                <el-table-column label="需求号" width="120">
                  <template #default="{ row }">
                    <a v-if="row.workItemId" :href="'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_workitems/edit/' + row.workItemId" target="_blank" style="color: #409eff">{{ row.workItemId }}</a>
                    <span v-else>{{ row.demandId || '-' }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>

            <!-- 步骤3: 差异结果 -->
            <el-card v-if="diffResultReady" shadow="never">
              <template #header>
                <span>步骤3: 差异结果 ({{ versionStep2.firstVersion }} → {{ versionStep2.secondVersion }})</span>
              </template>
              <div style="font-size: 13px; color: #595959; margin-bottom: 12px;">
                新增: <span style="color: #52c41a; font-weight: 500;">{{ diffAdds.length }}</span> |
                修改: <span style="color: #faad14; font-weight: 500;">{{ diffUpdates.length }}</span> |
                删除: <span style="color: #ff4d4f; font-weight: 500;">{{ diffDeletes.length }}</span>
              </div>

              <template v-if="diffAdds.length">
                <h5 style="color: #52c41a; margin: 12px 0 8px">新增 ({{ diffAdds.length }})</h5>
                <el-table :data="diffAdds" stripe border style="width: 100%" max-height="200" size="small">
                  <el-table-column label="名称" min-width="200">
                    <template #default="{ row }">{{ row.displayName || row.name || '' }}</template>
                  </el-table-column>
                  <el-table-column prop="dataType" label="数据类型" width="150" />
                </el-table>
              </template>

              <template v-if="diffUpdates.length">
                <h5 style="color: #faad14; margin: 12px 0 8px">修改 ({{ diffUpdates.length }})</h5>
                <el-table :data="diffUpdates" stripe border style="width: 100%" max-height="200" size="small">
                  <el-table-column label="名称" min-width="200">
                    <template #default="{ row }">{{ row.displayName || row.name || '' }}</template>
                  </el-table-column>
                  <el-table-column prop="dataType" label="数据类型" width="150" />
                </el-table>
              </template>

              <template v-if="diffDeletes.length">
                <h5 style="color: #ff4d4f; margin: 12px 0 8px">删除 ({{ diffDeletes.length }})</h5>
                <el-table :data="diffDeletes" stripe border style="width: 100%" max-height="200" size="small">
                  <el-table-column label="名称" min-width="200">
                    <template #default="{ row }">{{ row.displayName || row.name || '' }}</template>
                  </el-table-column>
                  <el-table-column prop="dataType" label="数据类型" width="150" />
                </el-table>
              </template>

              <el-empty v-if="!diffAdds.length && !diffUpdates.length && !diffDeletes.length" description="两个版本无差异" />
            </el-card>
          </div>

          <!-- 基准库 -->
          <div v-if="tableSubPanel === 'standard'">
            <el-form :inline="true" :model="standardForm" label-width="100px">
              <el-form-item label="项目名" required>
                <el-input v-model="standardForm.projectName" placeholder="如 WINEX" style="width: 180px" />
              </el-form-item>
              <el-form-item label="关键词" required>
                <el-input v-model="standardForm.keyword" placeholder="如 0330、2508" style="width: 200px" />
              </el-form-item>
              <el-form-item label="数据库类型">
                <el-select v-model="standardForm.databaseType" placeholder="全部" clearable style="width: 160px">
                  <el-option label="ORACLE" value="ORACLE" />
                  <el-option label="SQLSERVER" value="SQLSERVER" />
                  <el-option label="MYSQL" value="MYSQL" />
                  <el-option label="POSTGRESQL" value="POSTGRESQL" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleStandardQuery" :loading="standardLoading">搜索</el-button>
              </el-form-item>
            </el-form>

            <!-- 基准库搜索结果 -->
            <template v-if="standardResults.length">
              <h4 style="margin: 16px 0 8px">基准库列表</h4>
              <div style="display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
                <div v-for="db in standardResults" :key="db.id"
                  :style="{ border: selectedStandardDb?.dbId === db.id ? '2px solid #1890ff' : '1px solid #f0f0f0', padding: '12px', borderRadius: '4px', cursor: 'pointer', background: selectedStandardDb?.dbId === db.id ? '#e6f7ff' : '#fafafa' }"
                  @click="selectStandardDb(db)">
                  <div style="font-weight: 500; margin-bottom: 4px;">{{ db.standardDatasourceName || '' }}</div>
                  <div style="font-size: 12px; color: #8c8c8c;">ID: {{ db.id }}</div>
                  <div style="font-size: 12px; color: #8c8c8c;">类型: {{ db.dbTreeType || '' }}</div>
                  <div style="font-size: 12px; color: #8c8c8c;">版本: {{ db.version || '' }}</div>
                </div>
              </div>
            </template>
            <el-empty v-else-if="standardQueried" description="暂无数据" />

            <!-- 基准库制作日志 -->
            <el-card v-if="selectedStandardDb" shadow="never" style="margin-top: 16px">
              <template #header><span>基准库制作日志 - {{ selectedStandardDb.name }}</span></template>
              <el-form :inline="true" label-width="80px">
                <el-form-item label="场景">
                  <el-select v-model="standardLogScene" style="width: 140px">
                    <el-option label="DDL" value="0" />
                    <el-option label="全部阶段" value="10" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleStandardLogs" :loading="standardLogsLoading">获取日志</el-button>
                </el-form-item>
              </el-form>
              <div v-if="standardLogsResult" class="logs-viewer">
                <pre>{{ JSON.stringify(standardLogsResult, null, 2) }}</pre>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- ====== Tab 2: 需求排队 ====== -->
      <el-tab-pane label="需求排队" name="demandQueue">
        <div class="demand-toolbar">
          <el-select v-model="demandForm.branch" placeholder="选择分支" style="width: 140px">
            <el-option label="全部" value="all" />
            <el-option label="sr-next" value="sr-next" />
            <el-option label="sr-rc" value="sr-rc" />
          </el-select>
          <el-button type="primary" @click="handleQueryDemand" :loading="demandLoading">查看排队统计</el-button>
          <el-button @click="handleSyncDemand" :loading="demandSyncing">刷新数据</el-button>
          <span v-if="demandLastSync" class="sync-hint">最后同步: {{ demandLastSync }}</span>
        </div>

        <div v-loading="demandLoading">
          <!-- 汇总统计 -->
          <div v-if="demandSummary" class="demand-summary">
            <span v-for="(stats, pl) in demandSummary" :key="pl" class="pl-stat">
              <strong>{{ pl }}</strong>:
              <span :style="{ color: stats.validating > 0 ? '#e6a23c' : '#c0c4cc' }">验证{{ stats.validating }}</span>
              <span :style="{ color: stats.queued > 0 ? '#f56c6c' : '#c0c4cc' }">排队{{ stats.queued }}</span>
              <span :style="{ color: stats.closed > 0 ? '#909399' : '#c0c4cc' }">已关闭{{ stats.closed }}</span>
            </span>
          </div>

          <!-- 按产品线分组显示 -->
          <template v-if="demandGroupedData">
            <div v-for="(group, pl) in demandGroupedData" :key="pl" class="product-line-card">
              <div class="pl-header">
                <div class="pl-title">
                  <span class="pl-name">{{ pl }}</span>
                  <span class="pl-count">({{ (group.validating?.length || 0) + (group.queued?.length || 0) + (group.published?.length || 0) + (group.idle?.length || 0) }}仓库)</span>
                </div>
                <div class="pl-stats">
                  <span :style="{ color: (group.validating?.length || 0) > 0 ? '#e6a23c' : '#c0c4cc', fontWeight: (group.validating?.length || 0) > 0 ? '600' : 'normal' }">
                    验证中: {{ group.validating?.length || 0 }}
                  </span>
                  <span :style="{ color: (group.queued?.length || 0) > 0 ? '#f56c6c' : '#c0c4cc', fontWeight: (group.queued?.length || 0) > 0 ? '600' : 'normal' }">
                    排队: {{ group.queued?.length || 0 }}
                  </span>
                  <span :style="{ color: (group.published?.length || 0) > 0 ? '#909399' : '#c0c4cc', fontWeight: (group.published?.length || 0) > 0 ? '600' : 'normal' }">
                    已关闭: {{ group.published?.length || 0 }}
                  </span>
                </div>
              </div>
              <div class="pl-body">
                <el-tabs v-model="demandTabMap[pl]" type="card" class="demand-sub-tabs">
                  <el-tab-pane label="待验证" name="validating">
                    <div v-if="group.validating?.length" class="repo-section">
                      <div v-for="repo in group.validating" :key="repo.repoName" class="repo-card validating-card">
                        <div class="repo-card-header" @click="toggleRepoCollapse('v-' + repo.repoName)">
                          <span class="repo-name">
                            {{ repo.repoName }}
                            <span class="module-stats">({{ formatDemandIds(repo.demands || []) }})</span>
                          </span>
                          <span class="module-count">{{ (repo.demands || []).length }}个需求</span>
                          <span class="collapse-icon">{{ collapsedRepos.has('v-' + repo.repoName) ? '+' : '-' }}</span>
                        </div>
                        <div v-show="!collapsedRepos.has('v-' + repo.repoName)" class="repo-card-body">
                          <div v-for="item in (repo.demands || [])" :key="item.id || item.demandId" class="demand-item">
                            <el-tag type="warning" size="small" effect="plain">{{ item.moduleName || item.module_name || '-' }}</el-tag>
                            <span class="demand-id">
                              <a :href="'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_workitems/edit/' + (item.demandId || item.demand_id)" target="_blank">
                                {{ item.demandId || item.demand_id || '-' }}
                              </a>
                            </span>
                            <span class="demand-branch">{{ item.branch || '-' }}</span>
                            <el-tag :type="demandStatusTagType(item.buildStatus || item.status)" size="small" effect="plain" class="demand-status-tag">{{ demandStatusText(item.buildStatus || item.status) }}</el-tag>
                          </div>
                        </div>
                      </div>
                    </div>
                    <el-empty v-else description="暂无待验证需求" :image-size="60" />
                  </el-tab-pane>

                  <el-tab-pane label="排队中" name="queued">
                    <div v-if="group.queued?.length" class="repo-section">
                      <div v-for="repo in group.queued" :key="repo.repoName" class="repo-card queued-card">
                        <div class="repo-card-header" @click="toggleRepoCollapse('q-' + repo.repoName)">
                          <span class="repo-name">
                            {{ repo.repoName }}
                            <span class="module-stats">({{ formatDemandIds(repo.queuedDemands || []) }})</span>
                          </span>
                          <span class="module-count">{{ (repo.queuedDemands || []).length }}个需求</span>
                          <span class="collapse-icon">{{ collapsedRepos.has('q-' + repo.repoName) ? '+' : '-' }}</span>
                        </div>
                        <div v-show="!collapsedRepos.has('q-' + repo.repoName)" class="repo-card-body">
                          <div v-for="item in (repo.queuedDemands || [])" :key="item.id || item.demandId" class="demand-item">
                            <el-tag type="danger" size="small" effect="plain">{{ item.moduleName || item.module_name || '-' }}</el-tag>
                            <span class="demand-id">
                              <a :href="'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_workitems/edit/' + (item.demandId || item.demand_id)" target="_blank">
                                {{ item.demandId || item.demand_id || '-' }}
                              </a>
                            </span>
                            <span class="demand-branch">{{ item.branch || '-' }}</span>
                            <el-tag :type="demandStatusTagType(item.buildStatus || item.status)" size="small" effect="plain" class="demand-status-tag">{{ demandStatusText(item.buildStatus || item.status) }}</el-tag>
                          </div>
                        </div>
                      </div>
                    </div>
                    <el-empty v-else description="暂无排队需求" :image-size="60" />
                  </el-tab-pane>

                  <el-tab-pane label="已关闭" name="published">
                    <div v-if="group.published?.length" class="repo-section">
                      <div v-for="repo in group.published" :key="repo.repoName" class="repo-card closed-card">
                        <div class="repo-card-header" @click="toggleRepoCollapse('p-' + repo.repoName)">
                          <span class="repo-name">
                            {{ repo.repoName }}
                            <span class="module-stats">({{ formatDemandIds(repo.publishedDemands || []) }})</span>
                          </span>
                          <span class="module-count">{{ (repo.publishedDemands || []).length }}个已关闭</span>
                          <span class="collapse-icon">{{ collapsedRepos.has('p-' + repo.repoName) ? '+' : '-' }}</span>
                        </div>
                        <div v-show="!collapsedRepos.has('p-' + repo.repoName)" class="repo-card-body">
                          <div v-for="item in (repo.publishedDemands || [])" :key="item.id || item.demandId" class="demand-item">
                            <el-tag type="info" size="small" effect="plain">{{ item.moduleName || item.module_name || '-' }}</el-tag>
                            <span class="demand-id">
                              <a :href="'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/_workitems/edit/' + (item.demandId || item.demand_id)" target="_blank">
                                {{ item.demandId || item.demand_id || '-' }}
                              </a>
                            </span>
                            <span class="demand-branch">{{ item.branch || '-' }}</span>
                            <el-tag type="info" size="small" effect="plain">{{ item.workStatus || '已关闭' }}</el-tag>
                          </div>
                        </div>
                      </div>
                    </div>
                    <el-empty v-else description="暂无已关闭需求" :image-size="60" />
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </template>

          <el-empty v-if="!demandLoading && !demandGroupedData" description="点击'查看排队统计'加载数据" />
        </div>
      </el-tab-pane>

      <!-- ====== Tab 3: PR 管理 ====== -->
      <el-tab-pane label="PR 管理" name="prManagement">
        <div class="toolbar">
          <el-select v-model="prFilter.repo" placeholder="全部仓库" clearable style="width: 180px">
            <el-option v-for="r in opsRepos" :key="r.id" :label="r.name" :value="r.name" />
          </el-select>
          <el-select v-model="prFilter.targetBranch" placeholder="目标分支" clearable style="width: 130px">
            <el-option label="全部" value="" />
            <el-option label="sr-next" value="sr-next" />
            <el-option label="sr-rc" value="sr-rc" />
          </el-select>
          <el-input v-model="prFilter.taskNo" placeholder="任务号/PR ID" clearable style="width: 160px" />
          <el-input v-model="prFilter.sourceBranch" placeholder="源分支" clearable style="width: 140px" />
          <el-checkbox v-model="prFilter.isMy" style="margin-left: 4px;">我的</el-checkbox>
          <el-select v-model="prAuthorFilter" placeholder="创建人" clearable style="width: 120px">
            <el-option v-for="a in prAuthors" :key="a" :label="a" :value="a" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="handleQueryPr">查询</el-button>
          <el-button type="success" :icon="Plus" @click="prCreateDialogVisible = true">发起 PR</el-button>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value">{{ prStats.pending }}</div>
            <div class="stat-label">待处理</div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value" style="color: #67c23a">{{ prStats.completed }}</div>
            <div class="stat-label">已完成</div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value" style="color: #f56c6c">{{ prStats.rejected }}</div>
            <div class="stat-label">已拒绝</div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <div class="stat-value" style="color: #409eff">{{ prStats.total }}</div>
            <div class="stat-label">总计</div>
          </el-card>
        </div>

        <!-- PR 列表 -->
        <el-table :data="filteredPrList" stripe border style="width: 100%" v-loading="prLoading" max-height="500">
          <el-table-column label="PR ID" width="100">
            <template #default="{ row }">
              <a v-if="getPrUrl(row)" :href="getPrUrl(row)" target="_blank" style="color: #409eff">
                #{{ row.prId || row.pr_id || row.id }}
              </a>
              <span v-else>#{{ row.prId || row.pr_id || row.id || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="250" show-overflow-tooltip />
          <el-table-column prop="repo" label="仓库" width="150" />
          <el-table-column prop="sourceBranch" label="源分支" width="150" show-overflow-tooltip />
          <el-table-column prop="targetBranch" label="目标分支" width="120" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="prStatusTag(row.status)" size="small">{{ prStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="当前步骤" width="100">
            <template #default="{ row }">
              <span v-if="prStepText(row.currentStep || row.current_step)" style="color: #409eff; font-size: 12px">
                {{ prStepText(row.currentStep || row.current_step) }}
              </span>
              <span v-else style="color: #c0c4cc">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="author" label="提交人" width="100" />
          <el-table-column prop="createTime" label="创建时间" width="160" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <a v-if="getPrUrl(row)" :href="getPrUrl(row)" target="_blank" style="color: #409eff; font-size: 13px">详情</a>
              <el-button v-else link type="primary" size="small" @click="handleViewPr(row)">详情</el-button>
              <el-button
                v-if="prCanActivate(row)"
                link type="success" size="small"
                @click="handleActivatePr(row)"
                :loading="row._activating"
              >激活</el-button>
              <el-button
                v-if="prIsMerged(row)"
                link type="warning" size="small"
                @click="handleViewDemandBuild(row)"
                :loading="row._demandBuildLoading"
              >需求构建</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 发起 PR 弹窗 -->
        <el-dialog v-model="prCreateDialogVisible" title="发起 PR" width="500px">
          <el-form :model="prCreateForm" label-width="100px" :rules="prCreateRules" ref="prCreateFormRef">
            <el-form-item label="仓库" prop="repoId" required>
              <el-select v-model="prCreateForm.repoId" placeholder="选择仓库" filterable style="width: 100%">
                <el-option v-for="r in opsRepos" :key="r.id" :label="r.name" :value="r.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="任务号">
              <div style="display: flex; gap: 8px">
                <el-input v-model="prCreateForm.taskNo" placeholder="输入任务号" style="flex: 1" />
                <el-button @click="handleQueryWorkItem" :loading="prBranchQuerying">查询</el-button>
              </div>
              <div v-if="prBranchInfo" style="font-size: 12px; color: #909399; margin-top: 4px">
                <div v-if="prBranchInfo.taskType">任务类型: {{ prBranchInfo.taskType }}</div>
                <div v-if="prBranchInfo.iterationPath">迭代路径: {{ prBranchInfo.iterationPath }}</div>
                <div v-if="prBranchInfo.inferredBranch">推断目标分支: {{ prBranchInfo.inferredBranch }}</div>
              </div>
            </el-form-item>
            <el-form-item label="源分支" prop="sourceBranch" required>
              <el-input v-model="prCreateForm.sourceBranch" placeholder="源分支（可自动推断）" />
            </el-form-item>
            <el-form-item label="目标分支" prop="targetBranch" required>
              <el-input v-model="prCreateForm.targetBranch" placeholder="目标分支" />
            </el-form-item>
            <el-form-item label="标题" prop="title" required>
              <el-input v-model="prCreateForm.title" placeholder="PR 标题" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="prCreateForm.description" type="textarea" :rows="3" placeholder="PR 描述" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="prCreateDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleCreatePr" :loading="prCreating">提交</el-button>
          </template>
        </el-dialog>

        <!-- PR 详情弹窗 -->
        <el-dialog v-model="prDetailVisible" title="PR 详情" width="600px">
          <el-descriptions :column="1" border v-if="currentPr">
            <el-descriptions-item label="PR ID">
              <a v-if="getPrUrl(currentPr)" :href="getPrUrl(currentPr)" target="_blank" style="color: #409eff">
                #{{ currentPr.prId || currentPr.pr_id || currentPr.id }}
              </a>
              <span v-else>{{ currentPr.prId || currentPr.pr_id || currentPr.id }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="标题">{{ currentPr.title }}</el-descriptions-item>
            <el-descriptions-item label="仓库">{{ currentPr.repo }}</el-descriptions-item>
            <el-descriptions-item label="源分支">{{ currentPr.sourceBranch }}</el-descriptions-item>
            <el-descriptions-item label="目标分支">{{ currentPr.targetBranch }}</el-descriptions-item>
            <el-descriptions-item label="提交人">{{ currentPr.author }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="prStatusTag(currentPr.status)" size="small">{{ prStatusText(currentPr.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前步骤">
              {{ prStepText(currentPr.currentStep || currentPr.current_step) || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ currentPr.createTime }}</el-descriptions-item>
            <el-descriptions-item label="描述">
              <pre class="demand-desc">{{ currentPr.description || '无' }}</pre>
            </el-descriptions-item>
          </el-descriptions>
        </el-dialog>

        <!-- 需求构建情况弹窗 -->
        <el-dialog v-model="demandBuildDialogVisible" title="需求构建情况" width="60%">
          <div v-loading="demandBuildLoading">
            <template v-if="demandBuildData">
              <div style="margin-bottom: 12px; font-size: 13px; color: #606266;">
                需求 ID: <strong>{{ demandBuildData.demandId }}</strong>
              </div>
              <el-table :data="demandBuildItems" stripe border size="small" max-height="400">
                <el-table-column prop="demand_id" label="需求ID" width="100" />
                <el-table-column prop="title" label="标题" min-width="120" show-overflow-tooltip />
                <el-table-column prop="products" label="产品线" width="130" />
                <el-table-column label="构建状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="demandBuildStatusType(row.build_status)" size="small">
                      {{ demandBuildStatusText(row.build_status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="work_status" label="工作状态" width="100" />
                <el-table-column prop="assignor" label="指派人" width="140" show-overflow-tooltip />
                <el-table-column prop="iteration_name" label="迭代" width="130" />
                <el-table-column prop="created_at" label="创建时间" width="160" />
              </el-table>
              <div v-if="demandBuildHasFailure" style="margin-top: 16px; text-align: right;">
                <el-button type="danger" @click="handleBuildDemand" :loading="demandBuilding">
                  构建需求
                </el-button>
              </div>
            </template>
            <el-empty v-if="!demandBuildLoading && !demandBuildData" description="暂无数据" />
          </div>
          <template #footer>
            <el-button @click="demandBuildDialogVisible = false">关闭</el-button>
          </template>
        </el-dialog>

      </el-tab-pane>

      <!-- ====== Tab 4: 重构前版本构建 ====== -->
      <el-tab-pane label="重构前版本构建" name="preRefactorBuild">
        <!-- 搜索栏 -->
        <el-form :inline="true" style="margin-top: 16px;">
          <el-form-item label="产品">
            <el-select v-model="preRefactorBuildForm.productId" placeholder="选择产品" @change="handlePreRefactorProductChange" style="width: 180px">
              <el-option label="WiNEX电子病历" value="d41488fe57a24e2f951cc4bec2cb97c4" />
              <el-option label="WiNEX大临床" value="2f63e49c0cc744259a7d9e0125dde7e6" />
            </el-select>
          </el-form-item>
          <el-form-item label="版本">
            <el-input :value="preRefactorBuildForm.versionName" disabled style="width: 160px" />
          </el-form-item>
          <el-form-item label="迭代">
            <el-select v-model="preRefactorBuildForm.iterationId" placeholder="选择迭代" filterable :loading="preRefactorIterationLoading" @change="handlePreRefactorIterationChange" style="width: 200px">
              <el-option v-for="item in preRefactorIterationList" :key="item.id" :label="item.iteration_name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="应用">
            <el-select v-model="preRefactorBuildForm.appList" multiple placeholder="选择应用" filterable :loading="preRefactorAppLoading" value-key="id_app" style="width: 300px">
              <el-option v-for="item in preRefactorAppList" :key="item.id_app" :label="(item.typeshow || '') + ' (' + (item.type || '') + ')'" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQueryBuildLog" :loading="preRefactorBuildLogLoading" :disabled="!preRefactorBuildForm.productId || !preRefactorBuildForm.iterationId">查询</el-button>
            <el-button type="success" @click="handlePreRefactorBuild" :loading="preRefactorBuilding" :disabled="!preRefactorBuildForm.productId || !preRefactorBuildForm.iterationId || preRefactorBuildForm.appList.length === 0">构建</el-button>
            <el-button type="warning" @click="vbPrDialogVisible = true">发起 PR</el-button>
          </el-form-item>
        </el-form>

        <!-- 构建记录 -->
        <div v-if="preRefactorBuildLogList.length > 0" style="margin-top: 8px;">
          <h4 style="margin: 8px 0">构建记录</h4>
          <el-table :data="preRefactorBuildLogList" stripe border size="small" max-height="500">
            <el-table-column prop="product_version_name" label="版本" min-width="180" show-overflow-tooltip />
            <el-table-column prop="product_iteration_name" label="迭代" width="140" />
            <el-table-column label="构建状态" width="110">
              <template #default="{ row }">
                <el-tag :type="row.build_status === '2' ? 'success' : (row.build_status === '3' ? 'danger' : 'info')" size="small">
                  {{ row.build_status_remark || row.build_status || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="create_by" label="触发人" width="120" />
            <el-table-column prop="create_time" label="开始时间" width="160" />
            <el-table-column prop="finish_time" label="结束时间" width="160" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewBuildDetail(row)">制品</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 构建制品弹窗 -->
        <el-dialog v-model="buildDetailDialogVisible" title="构建制品" width="60%">
          <div v-loading="buildDetailLoading">
            <template v-if="buildDetailData">
              <el-table :data="buildDetailData" stripe border size="small" max-height="500">
                <el-table-column prop="app_name" label="应用" min-width="180" show-overflow-tooltip />
                <el-table-column prop="build_pkg_Name" label="制品名" min-width="180" show-overflow-tooltip />
                <el-table-column label="构建状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.build_flag === '2' || row.build_status === '1' ? 'success' : 'danger'" size="small">
                      {{ row.build_flag === '2' ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="commit_branch" label="分支" width="160" show-overflow-tooltip />
                <el-table-column prop="commit_name" label="提交人" width="120" />
                <el-table-column prop="commit_comment" label="提交信息" min-width="200" show-overflow-tooltip />
                <el-table-column prop="create_time" label="开始时间" width="160" />
                <el-table-column prop="finish_time" label="结束时间" width="160" />
              </el-table>
            </template>
            <el-empty v-else-if="!buildDetailLoading" description="暂无数据" />
          </div>
          <template #footer>
            <el-button @click="buildDetailDialogVisible = false">关闭</el-button>
          </template>
        </el-dialog>

        <!-- 版本构建 - 发起 PR 弹窗 -->
        <el-dialog v-model="vbPrDialogVisible" title="发起 Pull Request（版本构建）" width="520px" @open="loadVbPrRepos">
          <el-form label-width="100px">
            <el-form-item label="仓库" required>
              <el-select v-model="vbPrForm.repoId" placeholder="选择门诊病历仓库" filterable style="width: 100%" @change="handleVbRepoChange">
                <el-option v-for="r in vbPrRepoList" :key="r.id" :label="(r.displayName || r.name) + ' (' + r.name + ')'" :value="r.id" />
              </el-select>
              <div style="font-size: 12px; color: #909399; margin-top: 4px">仅显示产品线=门诊病历的仓库</div>
            </el-form-item>
            <el-form-item label="任务分支" required>
              <el-input v-model="vbPrForm.sourceBranch" placeholder="如：feature/1717276" />
            </el-form-item>
            <el-form-item label="生产分支" required>
              <div style="display: flex; gap: 8px">
                <el-select v-model="vbPrForm.targetBranch" placeholder="先查询分支" filterable style="flex: 1" :loading="vbPrBranchesLoading">
                  <el-option v-for="b in vbPrBranchList" :key="b" :label="b" :value="b" />
                </el-select>
                <el-button @click="handleQueryVbBranches" :loading="vbPrBranchesLoading" :disabled="!vbPrForm.repoId">查询</el-button>
              </div>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="vbPrDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleVbCreatePr">确认发起</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  tableAnalysis,
  queryClassId,
  modelAnalyze,
  queryTableFieldMapping,
  queryFieldLineage,
  ddlPatchSearch,
  dmlPatchSearch,
  queryTableInfo,
  classVersionList,
  classDiffTree,
  standardQuery,
  standardProductionParams,
  standardProductionLogs,
  queryDemandQueue,
  syncDemandQueue,
  queryPrList,
  createPr,
  activatePr,
  listOpsRepos,
  getPrDemandBuild,
  buildDemand,
  queryIterations,
  queryProductApps,
  batchBuild,
  querySubApps,
  queryBuildLog,
  queryBuildDetail
} from '@/api/ops'
import { tfsApi } from '@/api/tfs'
import http from '@/api/http'

// 主 tab
const activeTab = ref('tableModel')

// 运营平台仓库列表（用于下拉选择）
const opsRepos = ref<any[]>([])

onMounted(async () => {
  try {
    opsRepos.value = await listOpsRepos()
  } catch (e: any) {
    console.warn('加载运营平台仓库列表失败:', e.message)
  }
  // 初始化重构前版本构建默认值
  try {
    preRefactorIterationLoading.value = true
    const iterRes = await queryIterations(preRefactorBuildForm.versionId)
    const iters = iterRes.data || iterRes
    preRefactorIterationList.value = Array.isArray(iters) ? iters : []
    const defaultIter = preRefactorIterationList.value.find((i: any) =>
      (i.iteration_name || '').includes('240815')
    )
    if (defaultIter) {
      preRefactorBuildForm.iterationId = defaultIter.id
      preRefactorAppLoading.value = true
      const appRes = await queryProductApps(preRefactorBuildForm.versionId, defaultIter.id)
      const apps = appRes.data || appRes
      preRefactorAppList.value = Array.isArray(apps) ? apps : []
      const defaultApp = preRefactorAppList.value.find((a: any) =>
        (a.typeshow || '').includes('门急诊') || (a.type || '').includes('emr-outp')
      )
      if (defaultApp) {
        preRefactorBuildForm.appList = [defaultApp]
      }
      preRefactorAppLoading.value = false
    }
    preRefactorIterationLoading.value = false
  } catch (e: any) {
    console.warn('初始化重构前版本构建默认值失败:', e.message)
    preRefactorIterationLoading.value = false
    preRefactorAppLoading.value = false
  }
})

// ========== 表模型查看 ==========
const tableSubPanel = ref('tableAnalysis')

// -- 表结构分析 --
const tableAnalysisForm = reactive({ projectName: 'winex', tableName: '' })
const tableAnalysisLoading = ref(false)
const tableAnalysisInfo = ref<any>(null)

// 数据血缘关系（从字段中提取）
const lineageRelations = computed(() => {
  if (!tableAnalysisInfo.value?.properties) return []
  const fields = tableAnalysisInfo.value.properties
  const relations: any[] = []
  for (const f of fields) {
    if (f.lineage?.relations && Array.isArray(f.lineage.relations)) {
      relations.push(...f.lineage.relations.filter(Boolean))
    }
  }
  return relations
})

async function handleTableAnalysis() {
  if (!tableAnalysisForm.projectName || !tableAnalysisForm.tableName) {
    ElMessage.warning('项目集和表名不能为空')
    return
  }
  tableAnalysisLoading.value = true
  try {
    const raw = await tableAnalysis(tableAnalysisForm.projectName, tableAnalysisForm.tableName)
    // WxP API returns { code, data: { tableName, className, properties, indexes, ... } }
    const info = raw?.data || raw
    tableAnalysisInfo.value = (info && info.properties) ? info : null
    if (!tableAnalysisInfo.value) {
      ElMessage.warning('未找到表结构信息')
    }
  } catch (e: any) {
    ElMessage.error('查询失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    tableAnalysisLoading.value = false
  }
}

// -- 补丁查询 --
const patchType = ref('ddl')
const ddlForm = reactive({ tableName: '', fieldName: '' })
const dmlForm = reactive({ iteration: '' })
const ddlPatchLoading = ref(false)
const dmlPatchLoading = ref(false)
const ddlPatchItems = ref<any[]>([])
const dmlPatchItems = ref<any[]>([])
const patchQueried = ref(false)
const dmlVersionOptions = ref<string[]>([])

async function handleDdlPatchSearch() {
  if (!ddlForm.tableName && !ddlForm.fieldName) {
    ElMessage.warning('表名和字段名至少填一个')
    return
  }
  ddlPatchLoading.value = true
  patchQueried.value = true
  try {
    const res = await ddlPatchSearch({
      workItemId: '',
      propertyName: ddlForm.fieldName || '',
      indexName: '',
      tableName: ddlForm.tableName,
      propertyTableName: ddlForm.tableName,
      viewName: '',
      productName: '',
      branch: null,
      paginationInfo: { pageSize: 100, pageIndex: 0, pageCount: 0, recordsCount: 0 },
    })
    const items = Array.isArray(res) ? res : (res?.data || res?.result || [])

    // 获取 TFS 工作项信息（项目和迭代）
    const workItemIds = items.map((item: any) => item.workItemId).filter(Boolean)
    const workItemInfoMap = new Map()
    if (workItemIds.length > 0) {
      try {
        const promises = workItemIds.map((id: any) =>
          http.get(`/tfs/work-items/${id}`).then(r => {
            const wi = r.data
            workItemInfoMap.set(id, {
              project: wi?.project || '',
              iteration: wi?.iterationPath || '',
              url: wi?.url || ''
            })
          }).catch(() => {
            workItemInfoMap.set(id, { project: '', iteration: '', url: '' })
          })
        )
        await Promise.all(promises)
      } catch (e) {
        console.warn('获取 TFS 工作项信息失败:', e)
      }
    }

    // Compute field change diffing between consecutive items
    const patchFieldsList = items.map((item: any) => {
      try {
        const patchText = JSON.parse(item.patchText || '{}')
        return Object.keys(patchText.tableField || {})
      } catch { return [] }
    })
    for (let i = 0; i < items.length; i++) {
      // 附加工作项信息
      items[i]._workItemInfo = workItemInfoMap.get(items[i].workItemId) || { project: '', iteration: '', url: '' }

      if (i < items.length - 1) {
        const currentFields = patchFieldsList[i]
        const nextFields = patchFieldsList[i + 1]
        const added = currentFields.filter((f: string) => !nextFields.includes(f))
        const deleted = nextFields.filter((f: string) => !currentFields.includes(f))
        if (added.length > 0 || deleted.length > 0) {
          const addedHtml = added.map((f: string) => `<span style="color: #52c41a;">+${f}</span>`).join(' ')
          const deletedHtml = deleted.map((f: string) => `<span style="color: #ff4d4f;">-${f}</span>`).join(' ')
          items[i]._fieldChangeHtml = addedHtml + ' ' + deletedHtml
        } else if (currentFields.length === nextFields.length) {
          items[i]._fieldChangeHtml = '<span style="color: #8c8c8c;">无变化</span>'
        }
      } else {
        items[i]._fieldChangeHtml = '<span style="color: #8c8c8c;">(最早版本)</span>'
      }
    }
    ddlPatchItems.value = items
  } catch (e: any) {
    ElMessage.error('查询失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    ddlPatchLoading.value = false
  }
}

async function handleDmlPatchSearch() {
  if (!dmlForm.iteration) {
    ElMessage.warning('迭代号不能为空')
    return
  }
  dmlPatchLoading.value = true
  patchQueried.value = true
  try {
    const res = await dmlPatchSearch({
      workItemId: '',
      iteration: dmlForm.iteration,
      productName: '',
      branch: null,
      paginationInfo: { pageSize: 100, pageIndex: 0, pageCount: 0, recordsCount: 0 },
      scrollId: null,
      tableName: null,
      dataThemId: null,
    })
    dmlPatchItems.value = Array.isArray(res) ? res : (res?.data || res?.result || [])
  } catch (e: any) {
    ElMessage.error('查询失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    dmlPatchLoading.value = false
  }
}

// -- 实体对象查询 --
const entityForm = reactive({ projectName: 'winex', tableName: '', moduleName: '', fieldName: '', classId: '' })
const entityQueryLoading = ref(false)
const modelAnalyzeLoading = ref(false)
const fieldsByTableLoading = ref(false)
const byFieldNameLoading = ref(false)
const classIdResult = ref<string>('')
const modelAnalyzeResult = ref<any>(null)
const fieldQueryResults = ref<any[]>([])

async function handleEntityQuery() {
  if (!entityForm.projectName || !entityForm.tableName) {
    ElMessage.warning('项目名和表名不能为空')
    return
  }
  entityQueryLoading.value = true
  classIdResult.value = ''
  modelAnalyzeResult.value = null
  fieldQueryResults.value = []
  try {
    const res = await queryClassId(entityForm.projectName, entityForm.tableName, entityForm.moduleName || undefined)
    const cid = res?.classId || res?.id || ''
    if (cid) {
      entityForm.classId = cid
      classIdResult.value = cid
    } else {
      ElMessage.warning('未找到对应的 Class ID')
    }
  } catch (e: any) {
    ElMessage.error('查询失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    entityQueryLoading.value = false
  }
}

async function handleModelAnalyze() {
  if (!entityForm.classId) {
    ElMessage.warning('请先查询或输入 classId')
    return
  }
  modelAnalyzeLoading.value = true
  try {
    const res = await modelAnalyze(entityForm.classId)
    modelAnalyzeResult.value = res
  } catch (e: any) {
    ElMessage.error('模型分析失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    modelAnalyzeLoading.value = false
  }
}

async function handleQueryFieldsByTable() {
  if (!entityForm.projectName || !entityForm.tableName) {
    ElMessage.warning('项目名和表名不能为空')
    return
  }
  fieldsByTableLoading.value = true
  classIdResult.value = ''
  modelAnalyzeResult.value = null
  try {
    const res = await queryTableFieldMapping(entityForm.projectName, entityForm.tableName)
    fieldQueryResults.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e: any) {
    ElMessage.error('查询失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    fieldsByTableLoading.value = false
  }
}

async function handleQueryByFieldName() {
  if (!entityForm.projectName || !entityForm.fieldName) {
    ElMessage.warning('项目名和字段中文名不能为空')
    return
  }
  byFieldNameLoading.value = true
  classIdResult.value = ''
  modelAnalyzeResult.value = null
  try {
    const res = await queryFieldLineage(entityForm.projectName, entityForm.fieldName)
    fieldQueryResults.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e: any) {
    ElMessage.error('查询失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    byFieldNameLoading.value = false
  }
}

// -- 版本差异分析 --
const versionStep1 = reactive({ tableName: '' })
const versionStep1Loading = ref(false)
const tableInfoList = ref<any[]>([])
const selectedTableId = ref('')

const versionStep2 = reactive({ firstVersion: '', secondVersion: '' })
const versionStep2Loading = ref(false)
const versionList = ref<any[]>([])
const diffResultReady = ref(false)
const diffAdds = ref<any[]>([])
const diffUpdates = ref<any[]>([])
const diffDeletes = ref<any[]>([])

async function handleQueryTableInfo() {
  if (!versionStep1.tableName) {
    ElMessage.warning('表名不能为空')
    return
  }
  versionStep1Loading.value = true
  try {
    const raw = await queryTableInfo(versionStep1.tableName)
    const allItems = raw?.data || raw || []
    const items = Array.isArray(allItems) ? allItems : []
    // Filter out "基础集成" projects
    const filtered = items.filter((item: any) =>
      !item.projectName?.includes('基础集成') && !item.projectName?.includes('集成')
    )
    tableInfoList.value = filtered.length > 0 ? filtered : items
    selectedTableId.value = ''
    versionList.value = []
    diffResultReady.value = false
    // Auto-select first entity and load versions
    if (tableInfoList.value.length > 0) {
      const first = tableInfoList.value[0]
      selectedTableId.value = first.id
      await loadVersionList(first.id)
    }
  } catch (e: any) {
    ElMessage.error('查询失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    versionStep1Loading.value = false
  }
}

async function handleTableInfoSelect(row: any) {
  if (!row) return
  selectedTableId.value = row.id
  await loadVersionList(row.id)
}

function handleEntityRadioChange(row: any) {
  if (!row) return
  selectedTableId.value = row.id
  loadVersionList(row.id)
}

async function loadVersionList(entityId: string) {
  try {
    const raw = await classVersionList(entityId)
    const items = raw?.data || raw || []
    versionList.value = Array.isArray(items) ? items : []
    // Default select adjacent versions
    if (versionList.value.length >= 2) {
      versionStep2.firstVersion = versionList.value[versionList.value.length - 2]?.classVersion || ''
      versionStep2.secondVersion = versionList.value[versionList.value.length - 1]?.classVersion || ''
    } else {
      versionStep2.firstVersion = ''
      versionStep2.secondVersion = ''
    }
    diffResultReady.value = false
  } catch (e: any) {
    ElMessage.error('获取版本列表失败: ' + (e?.response?.data?.error || e.message))
  }
}

async function handleDiffTree() {
  if (!selectedTableId.value || !versionStep2.firstVersion || !versionStep2.secondVersion) {
    ElMessage.warning('请选择实体和两个版本')
    return
  }
  if (versionStep2.firstVersion === versionStep2.secondVersion) {
    ElMessage.warning('请选择不同的版本进行对比')
    return
  }
  versionStep2Loading.value = true
  try {
    const raw = await classDiffTree(selectedTableId.value, versionStep2.firstVersion, versionStep2.secondVersion)
    const diffData = raw?.data || raw || {}
    const nowNodes = diffData.now || []

    // Recursively extract all changes by editType
    function extractAllChanges(nodes: any[], adds: any[], updates: any[], deletes: any[]) {
      for (const node of nodes) {
        if (node.editType === 'add') adds.push(node)
        else if (node.editType === 'update') updates.push(node)
        else if (node.editType === 'delete') deletes.push(node)
        if (node.child && node.child.length > 0) {
          extractAllChanges(node.child, adds, updates, deletes)
        }
      }
    }

    const adds: any[] = []
    const updates: any[] = []
    const deletes: any[] = []
    extractAllChanges(nowNodes, adds, updates, deletes)
    diffAdds.value = adds
    diffUpdates.value = updates
    diffDeletes.value = deletes
    diffResultReady.value = true
  } catch (e: any) {
    ElMessage.error('对比失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    versionStep2Loading.value = false
  }
}

// -- 基准库 --
const standardForm = reactive({ projectName: 'WINEX', keyword: '', databaseType: '' })
const standardLoading = ref(false)
const standardResults = ref<any[]>([])
const standardQueried = ref(false)
const standardLogScene = ref('0')
const standardLogsLoading = ref(false)
const standardLogsResult = ref<any>(null)
const selectedStandardDb = ref<any>(null)

async function handleStandardQuery() {
  if (!standardForm.projectName || !standardForm.keyword) {
    ElMessage.warning('项目名和关键词不能为空')
    return
  }
  standardLoading.value = true
  standardQueried.value = true
  try {
    const raw = await standardQuery(standardForm.projectName, standardForm.keyword, standardForm.databaseType || undefined)
    const list = Array.isArray(raw) ? raw : (raw?.data || [])
    standardResults.value = list
    // Auto-select first result
    if (list.length > 0) {
      selectStandardDb(list[0])
    }
  } catch (e: any) {
    ElMessage.error('查询失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    standardLoading.value = false
  }
}

function selectStandardDb(db: any) {
  selectedStandardDb.value = { dbId: db.id, name: db.standardDatasourceName || db.id }
  standardLogsResult.value = null
}

async function handleStandardLogs() {
  if (!selectedStandardDb.value?.dbId) {
    ElMessage.warning('请先选择基准库')
    return
  }
  standardLogsLoading.value = true
  try {
    const params = await standardProductionParams(selectedStandardDb.value.dbId)
    const logsParams = {
      dataSourceId: params.dataSourceId || params.data_source_id || '',
      sourceDataSourceId: params.sourceDataSourceId || params.source_data_source_id || '',
      syncId: params.syncId || params.sync_id || '',
      projectNo: params.projectNo || params.project_no || '',
      scene: standardLogScene.value
    }
    standardLogsResult.value = await standardProductionLogs(logsParams)
  } catch (e: any) {
    ElMessage.error('获取日志失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    standardLogsLoading.value = false
  }
}

// ========== 需求排队 ==========
const demandForm = reactive({ branch: 'sr-next' })
const demandLoading = ref(false)
const demandSyncing = ref(false)
const demandLastSync = ref<string | null>(null)
const demandGroupedData = ref<any>(null)
const collapsedRepos = ref(new Set<string>())
const demandTabMap = ref<Record<string, string>>({})

// 格式化需求号列表：返回 "需求号1, 需求号2, ..." 格式
function formatDemandIds(demands: any[]): string {
  const demandIds = new Set<string>()
  for (const item of demands) {
    const id = item.demandId || item.demand_id
    if (id) demandIds.add(String(id))
  }
  return Array.from(demandIds).join(', ')
}

// 解析克隆需求号：按逗号拆分、去空、去重
function parseCloneWorkItemIds(cloneWorkItemId: string | number | undefined | null): string[] {
  if (!cloneWorkItemId) return []
  return Array.from(new Set(String(cloneWorkItemId).split(',').map(s => s.trim()).filter(Boolean)))
}

// 统计每个产品线的各分类数量（直接使用后端三个分类）
const demandSummary = computed(() => {
  if (!demandGroupedData.value) return null
  const summary: Record<string, { validating: number; queued: number; closed: number }> = {}
  for (const [pl, group] of Object.entries(demandGroupedData.value as Record<string, any>)) {
    summary[pl] = {
      validating: (group.validating || []).length,
      queued: (group.queued || []).length,
      closed: (group.published || []).length
    }
  }
  return summary
})

function toggleRepoCollapse(key: string) {
  const s = new Set(collapsedRepos.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  collapsedRepos.value = s
}

async function handleQueryDemand() {
  demandLoading.value = true
  try {
    const branch = demandForm.branch === 'all' ? null : demandForm.branch
    const res = await queryDemandQueue({ branch })
    demandGroupedData.value = res.groupedByProductLine || null
    if (res.groupedByProductLine) {
      const tabMap: Record<string, string> = {}
      for (const pl of Object.keys(res.groupedByProductLine)) {
        tabMap[pl] = demandTabMap.value[pl] || 'validating'
      }
      demandTabMap.value = tabMap
    }
    if (res.lastSync) demandLastSync.value = res.lastSync
  } catch (e: any) {
    ElMessage.error('查询失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    demandLoading.value = false
  }
}

async function handleSyncDemand() {
  demandSyncing.value = true
  try {
    const res = await syncDemandQueue({ branches: ['sr-next', 'sr-rc'] })
    if (res.success) {
      ElMessage.success(`同步完成: 验证中${res.validatingCount}条, 排队${res.queuedCount}条`)
      demandLastSync.value = res.syncedAt
      // 同步后自动刷新
      await handleQueryDemand()
    }
  } catch (e: any) {
    ElMessage.error('同步失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    demandSyncing.value = false
  }
}

// ========== PR 管理 ==========
const prFilter = reactive({ repo: '', targetBranch: '', taskNo: '', sourceBranch: '', isMy: true })
const prAuthorFilter = ref('')
const prLoading = ref(false)
const prList = ref<any[]>([])
const prStats = reactive({ pending: 0, completed: 0, rejected: 0, total: 0 })

const prAuthors = computed(() => {
  const authors = new Set<string>()
  for (const p of prList.value) {
    const a = p.author || p.createdBy
    if (a) authors.add(a)
  }
  return Array.from(authors).sort()
})

const filteredPrList = computed(() => {
  let list = prList.value
  if (prAuthorFilter.value) {
    list = list.filter((p: any) => (p.author || p.createdBy) === prAuthorFilter.value)
  }
  if (prFilter.taskNo) {
    const kw = prFilter.taskNo.toLowerCase()
    list = list.filter((p: any) => {
      const prId = String(p.prId || p.pr_id || p.id || '').toLowerCase()
      const taskNo = String(p.taskNo || p.task_no || '').toLowerCase()
      const title = String(p.title || '').toLowerCase()
      return prId.includes(kw) || taskNo.includes(kw) || title.includes(kw)
    })
  }
  if (prFilter.sourceBranch) {
    const kw = prFilter.sourceBranch.toLowerCase()
    list = list.filter((p: any) => {
      const sb = String(p.sourceBranch || p.source_branch || '').toLowerCase()
      return sb.includes(kw)
    })
  }
  return list
})
const prCreateDialogVisible = ref(false)
const prCreating = ref(false)
const prCreateFormRef = ref<FormInstance>()
const prCreateForm = reactive({ repoId: null as number | null, sourceBranch: '', targetBranch: '', title: '', taskNo: '', description: '' })
const prCreateRules: FormRules = {
  repoId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
  sourceBranch: [{ required: true, message: '请输入源分支', trigger: 'blur' }],
  targetBranch: [{ required: true, message: '请输入目标分支', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}
const prDetailVisible = ref(false)
const currentPr = ref<any>(null)
const prBranchQuerying = ref(false)
const prBranchInfo = ref<any>(null)

function prStatusText(status: string): string {
  const s = String(status || '').toUpperCase()
  if (s === 'PENDING' || s === 'DRAFT') return '待提交'
  if (s === 'ACTIVE' || s === 'REVIEWING' || s === 'RUNNING') return '评审中'
  if (s === 'APPROVED') return '已通过'
  if (s === 'SUCCESS' || s === 'MERGED' || s === 'COMPLETED' || s === 'SUCCEEDED') return '已合并'
  if (s === 'REJECTED' || s === 'CLOSED' || s === 'FAILURE' || s === 'FAILED' || s === 'CANCELLED') return '已拒绝'
  if (s === 'ABANDONED') return '已放弃'
  return status || '-'
}

function prStatusTag(status: string): string {
  const s = String(status || '').toUpperCase()
  if (s === 'PENDING' || s === 'DRAFT') return 'warning'
  if (s === 'ACTIVE' || s === 'REVIEWING' || s === 'RUNNING' || s === 'APPROVED') return ''
  if (s === 'SUCCESS' || s === 'MERGED' || s === 'COMPLETED' || s === 'SUCCEEDED') return 'success'
  if (s === 'REJECTED' || s === 'CLOSED' || s === 'FAILURE' || s === 'FAILED' || s === 'CANCELLED' || s === 'ABANDONED') return 'danger'
  return 'info'
}

function prStepText(step: string): string {
  const s = String(step || '').toUpperCase()
  if (s === 'REVIEW') return '审核中'
  if (s === 'BUILD' || s === 'BUILDING') return '构建中'
  if (s === 'DEPLOY') return '部署中'
  if (s === 'TEST' || s === 'TESTING') return '测试中'
  if (s === 'AI_CHECK' || s === 'AICHECK') return 'AI评审中'
  if (s === 'MERGE') return '合并中'
  if (s === 'DONE' || s === 'COMPLETED') return '已完成'
  return step || ''
}

function getPrUrl(row: any): string {
  const tfsPrId = row.tfsPrId || row.tfs_pr_id
  const repoUrl = row.repoUrl || row.repo_url
  if (!tfsPrId || !repoUrl) return ''
  return `${repoUrl}/pullrequest/${tfsPrId}`
}

async function handleQueryPr() {
  if (!prFilter.repo) {
    ElMessage.warning('请先选择仓库')
    return
  }
  prLoading.value = true
  try {
    const params: any = {}
    if (prFilter.repo) params.repo = prFilter.repo
    if (prFilter.targetBranch) params.targetBranch = prFilter.targetBranch
    params.isMy = prFilter.isMy
    const res = await queryPrList(params)
    const list = Array.isArray(res) ? res : (res?.data || res?.list || [])
    prList.value = list

    // Stats: use correct WxP status values
    prStats.pending = list.filter((p: any) => {
      const s = String(p.status || '').toUpperCase()
      return s === 'PENDING' || s === 'DRAFT' || s === 'ACTIVE' || s === 'REVIEWING' || s === 'RUNNING' || s === 'APPROVED'
    }).length
    prStats.completed = list.filter((p: any) => {
      const s = String(p.status || '').toUpperCase()
      return s === 'SUCCESS' || s === 'MERGED' || s === 'COMPLETED' || s === 'SUCCEEDED'
    }).length
    prStats.rejected = list.filter((p: any) => {
      const s = String(p.status || '').toUpperCase()
      return s === 'REJECTED' || s === 'CLOSED' || s === 'FAILURE' || s === 'FAILED' || s === 'CANCELLED' || s === 'ABANDONED'
    }).length
    prStats.total = list.length
  } catch (e: any) {
    ElMessage.error('查询失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    prLoading.value = false
  }
}

async function handleQueryWorkItem() {
  if (!prCreateForm.taskNo) {
    ElMessage.warning('请先输入任务号')
    return
  }
  const taskId = parseInt(prCreateForm.taskNo)
  if (isNaN(taskId)) {
    ElMessage.warning('任务号必须为数字')
    return
  }
  prBranchQuerying.value = true
  prBranchInfo.value = null
  try {
    const item = await tfsApi.getWorkItem(taskId)
    if (!item) {
      ElMessage.warning('未找到对应的工作项')
      return
    }
    // Auto-fill title and description
    if (item.title) {
      prCreateForm.title = item.title
    }
    if (item.description) {
      // Strip HTML tags for description
      prCreateForm.description = item.description.replace(/<[^>]*>/g, '')
    }
    // Default source branch (fallback)
    const fallbackBranch = 'feature/' + prCreateForm.taskNo

    // Infer target branch from iteration path
    const iterPath = item.iterationPath || ''
    // 迭代路径包含 "250225" 或 "250825" 时目标分支为 sr-rc，否则默认为 sr-next
    // 去掉点号后再匹配，兼容 "6.0.2502.25.opt" 和 "250225" 两种格式
    const normalizedPath = iterPath.replace(/\./g, '')
    if (normalizedPath.includes('250225') || normalizedPath.includes('250825')) {
      prCreateForm.targetBranch = 'sr-rc'
    } else {
      prCreateForm.targetBranch = 'sr-next'
    }
    console.log('[PR] 目标分支推断: iterationPath=', iterPath, '-> targetBranch=', prCreateForm.targetBranch)

    // Try to find matching source branch from repo's actual branch list
    if (prCreateForm.repoId) {
      const selectedRepo = opsRepos.value.find((r: any) => r.id === prCreateForm.repoId)
      const repoGuid = selectedRepo?.repoId
      if (repoGuid) {
        try {
          const branchRes = await http.get(`/ops/repo/${repoGuid}/branches`)
          const branches: any[] = branchRes.data?.branches || branchRes.data || []
          // Search for branch containing the task number (e.g. feature/1721583)
          const matched = branches.find((b: any) => {
            const name = b.name || b
            return name.includes(prCreateForm.taskNo)
          })
          if (matched) {
            const branchName = matched.name || matched
            prCreateForm.sourceBranch = branchName
            console.log('[PR] 源分支从仓库分支列表匹配:', branchName)
          } else {
            prCreateForm.sourceBranch = fallbackBranch
            console.log('[PR] 未匹配到分支，回退到:', fallbackBranch)
          }
        } catch (branchErr: any) {
          prCreateForm.sourceBranch = fallbackBranch
          console.warn('[PR] 查询仓库分支列表失败，回退到默认:', fallbackBranch, branchErr.message)
        }
      } else {
        prCreateForm.sourceBranch = fallbackBranch
        console.warn('[PR] 仓库缺少 TFS GUID (repoId)，使用默认源分支:', fallbackBranch)
      }
    } else {
      prCreateForm.sourceBranch = fallbackBranch
      console.warn('[PR] 未选择仓库，使用默认源分支:', fallbackBranch)
    }

    // Show branch info
    prBranchInfo.value = {
      taskType: item.type || '',
      inferredBranch: prCreateForm.targetBranch,
      iterationPath: iterPath
    }
    ElMessage.success('工作项信息已填充')
  } catch (e: any) {
    ElMessage.warning('查询工作项失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    prBranchQuerying.value = false
  }
}

async function handleCreatePr() {
  const valid = await prCreateFormRef.value?.validate().catch(() => false)
  if (!valid) return
  prCreating.value = true
  try {
    await createPr({ ...prCreateForm })
    ElMessage.success('PR 创建成功')
    prCreateDialogVisible.value = false
    Object.assign(prCreateForm, { repoId: null, sourceBranch: '', targetBranch: '', title: '', taskNo: '', description: '' })
    prBranchInfo.value = null
    await handleQueryPr()
  } catch (e: any) {
    ElMessage.error('创建失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    prCreating.value = false
  }
}

function handleViewPr(row: any) {
  currentPr.value = row
  prDetailVisible.value = true
}

function prCanActivate(row: any): boolean {
  const s = String(row.status || '').toUpperCase()
  const terminal = ['SUCCESS', 'MERGED', 'COMPLETED', 'SUCCEEDED', 'ABANDONED']
  return !terminal.includes(s)
}

async function handleActivatePr(row: any) {
  const prId = row.prId || row.pr_id || row.id
  const internalId = row.id
  const repoName = row.repo
  if (!internalId) {
    ElMessage.warning('缺少 PR ID')
    return
  }
  try {
    row._activating = true
    const res = await activatePr({ prId, id: internalId, repo: repoName })
    if (res?.success) {
      ElMessage.success('激活成功')
      handleQueryPr()
    } else {
      ElMessage.error('激活失败: ' + (res?.error || '未知错误'))
    }
  } catch (e: any) {
    ElMessage.error('激活失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    row._activating = false
  }
}

// === 需求构建情况 ===
const demandBuildDialogVisible = ref(false)
const demandBuildLoading = ref(false)
const demandBuildData = ref<any>(null)
const demandBuilding = ref(false)
const demandBuildCurrentTaskNo = ref('')

const demandBuildItems = computed(() => {
  if (!demandBuildData.value?.data) return []
  const data = demandBuildData.value.data
  return Array.isArray(data) ? data : (data.list || data.moduleList || [])
})

const demandBuildHasFailure = computed(() => {
  return demandBuildItems.value.some((item: any) => {
    const s = String(item.build_status || item.status || '').toUpperCase()
    return s !== 'SUCCESS' && s !== 'PUBLISHED' && s !== 'RELEASED' && s !== 'COMPLETED'
  })
})

function demandBuildStatusText(status: string): string {
  const s = String(status || '').toUpperCase()
  if (s === 'SUCCESS' || s === 'PUBLISHED' || s === 'RELEASED' || s === 'COMPLETED') return '成功'
  if (s === 'BUILDING' || s === 'DEPLOYING') return '构建中'
  if (s === 'QUEUED' || s === 'WAITING' || s === 'PENDING') return '排队中'
  if (s === 'FAILED' || s === 'FAILURE' || s === 'ERROR') return '失败'
  if (s === 'VALIDATING') return '验证中'
  return status || '-'
}

function demandBuildStatusType(status: string): string {
  const s = String(status || '').toUpperCase()
  if (s === 'SUCCESS' || s === 'PUBLISHED' || s === 'RELEASED' || s === 'COMPLETED') return 'success'
  if (s === 'BUILDING' || s === 'DEPLOYING' || s === 'VALIDATING') return 'warning'
  if (s === 'FAILED' || s === 'FAILURE' || s === 'ERROR') return 'danger'
  if (s === 'QUEUED' || s === 'WAITING' || s === 'PENDING') return 'info'
  return 'info'
}

function prIsMerged(row: any): boolean {
  const s = String(row.status || '').toUpperCase()
  return ['SUCCESS', 'MERGED', 'COMPLETED', 'SUCCEEDED'].includes(s)
}

async function handleViewDemandBuild(row: any) {
  const sourceBranch = row.sourceBranch || row.source_branch || ''
  if (!sourceBranch) {
    ElMessage.warning('缺少源分支信息')
    return
  }
  const match = sourceBranch.match(/(\d+)/)
  if (!match) {
    ElMessage.warning('源分支中未找到任务号')
    return
  }
  const taskNo = match[1]
  demandBuildCurrentTaskNo.value = taskNo
  demandBuildDialogVisible.value = true
  demandBuildLoading.value = true
  demandBuildData.value = null
  try {
    const res = await getPrDemandBuild(String(taskNo))
    if (res.error) {
      ElMessage.warning(res.error)
    } else {
      demandBuildData.value = res
    }
  } catch (e: any) {
    ElMessage.error('查询需求构建情况失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    demandBuildLoading.value = false
  }
}

async function handleBuildDemand() {
  if (!demandBuildData.value?.demandId) {
    ElMessage.warning('缺少需求ID')
    return
  }
  try {
    await ElMessageBox.confirm('确定要构建需求吗？', '确认构建', { type: 'warning' })
  } catch { return }
  demandBuilding.value = true
  try {
    const res = await buildDemand(String(demandBuildData.value.demandId))
    if (res.success) {
      ElMessage.success('构建已触发')
      // Refresh
      await handleViewDemandBuild({ sourceBranch: demandBuildCurrentTaskNo.value } as any)
    } else {
      ElMessage.error('构建失败: ' + (res.error || '未知错误'))
    }
  } catch (e: any) {
    ElMessage.error('构建失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    demandBuilding.value = false
  }
}

/**
 * Get el-tag type for demand build status
 */
function demandStatusTagType(status: string): string {
  const s = String(status || '').toUpperCase()
  // Published / completed
  if (s === 'PUBLISHED' || s === 'RELEASED' || s === 'DONE' || s === 'COMPLETED' || s === 'SUCCESS') return 'success'
  // Validating / in-progress
  if (s === 'BUILDING' || s === 'DEPLOYING' || s === 'TESTING' || s === 'VALIDATING' || s === 'RUNNING') return 'warning'
  // Queued / waiting
  if (s === 'QUEUED' || s === 'WAITING' || s === 'PENDING') return 'danger'
  // Failed / error
  if (s === 'FAILED' || s === 'FAILURE' || s === 'ERROR' || s === 'REJECTED') return 'danger'
  return 'info'
}

/**
 * Get display text for demand build status
 */
function demandStatusText(status: string): string {
  const s = String(status || '').toUpperCase()
  if (s === 'PUBLISHED' || s === 'RELEASED') return '已发布'
  if (s === 'BUILDING') return '构建中'
  if (s === 'DEPLOYING') return '部署中'
  if (s === 'TESTING') return '测试中'
  if (s === 'VALIDATING') return '验证中'
  if (s === 'QUEUED') return '排队中'
  if (s === 'WAITING') return '等待中'
  if (s === 'PENDING') return '待处理'
  if (s === 'DONE' || s === 'COMPLETED') return '已完成'
  if (s === 'SUCCESS') return '成功'
  if (s === 'FAILED' || s === 'FAILURE') return '失败'
  if (s === 'REJECTED') return '已拒绝'
  return status || '-'
}

// === 重构前版本构建 ===
const preRefactorBuildForm = reactive({
  productId: 'd41488fe57a24e2f951cc4bec2cb97c4',
  versionId: '7fba50f2de27490583790a36062dd49f',
  versionName: 'rc_emr_pbc',
  iterationId: '',
  appList: [] as any[]
})
const preRefactorIterationList = ref<any[]>([])
const preRefactorIterationLoading = ref(false)
const preRefactorAppList = ref<any[]>([])
const preRefactorAppLoading = ref(false)
const preRefactorBuilding = ref(false)
const preRefactorBuildLogList = ref<any[]>([])
const preRefactorBuildLogLoading = ref(false)
const buildDetailDialogVisible = ref(false)
const buildDetailLoading = ref(false)
const buildDetailData = ref<any[]>([])

// === 版本构建 PR ===
const vbPrDialogVisible = ref(false)
const vbPrRepoList = ref<any[]>([])
const vbPrBranchList = ref<string[]>([])
const vbPrBranchesLoading = ref(false)
const vbPrForm = reactive({
  repoId: null as number | null,
  sourceBranch: '',
  targetBranch: ''
})

// Product → Version mapping
const productVersionMap: Record<string, { versionId: string; versionName: string }> = {
  'd41488fe57a24e2f951cc4bec2cb97c4': { versionId: '7fba50f2de27490583790a36062dd49f', versionName: 'rc_emr_pbc' },
  '2f63e49c0cc744259a7d9e0125dde7e6': { versionId: 'a1765bbfa4594e769a1665972debf3d6', versionName: 'rc_ipt_new_pbc' }
}

function handlePreRefactorProductChange(productId: string) {
  const v = productVersionMap[productId]
  if (v) {
    preRefactorBuildForm.versionId = v.versionId
    preRefactorBuildForm.versionName = v.versionName
  }
  preRefactorBuildForm.iterationId = ''
  preRefactorBuildForm.appList = []
  preRefactorIterationList.value = []
  preRefactorAppList.value = []
  // Fetch iterations
  if (preRefactorBuildForm.versionId) {
    preRefactorIterationLoading.value = true
    queryIterations(preRefactorBuildForm.versionId).then((res: any) => {
      const data = res.data || res
      preRefactorIterationList.value = Array.isArray(data) ? data : []
    }).catch(() => {
      ElMessage.error('获取迭代列表失败')
    }).finally(() => {
      preRefactorIterationLoading.value = false
    })
  }
}

function handlePreRefactorIterationChange(iterationId: string) {
  preRefactorBuildForm.appList = []
  preRefactorAppList.value = []
  if (preRefactorBuildForm.versionId && iterationId) {
    preRefactorAppLoading.value = true
    queryProductApps(preRefactorBuildForm.versionId, iterationId).then((res: any) => {
      const data = res.data || res
      preRefactorAppList.value = Array.isArray(data) ? data : []
    }).catch(() => {
      ElMessage.error('获取应用列表失败')
    }).finally(() => {
      preRefactorAppLoading.value = false
    })
  }
}

async function handleQueryBuildLog() {
  if (!preRefactorBuildForm.versionId || !preRefactorBuildForm.iterationId) {
    ElMessage.warning('请选择产品、迭代')
    return
  }
  const appIds = preRefactorBuildForm.appList.length > 0
    ? [...new Set(preRefactorBuildForm.appList.map((app: any) => app.id_app))]
    : []

  preRefactorBuildLogLoading.value = true
  try {
    const res = await queryBuildLog(
      preRefactorBuildForm.versionId,
      appIds,
      preRefactorBuildForm.iterationId,
      20,
      0
    )
    const data = res.data || res
    preRefactorBuildLogList.value = Array.isArray(data) ? data : (data.list || [])
  } catch (e: any) {
    ElMessage.error('查询构建记录失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    preRefactorBuildLogLoading.value = false
  }
}

async function handleViewBuildDetail(row: any) {
  const buildLogId = row.id
  if (!buildLogId) {
    ElMessage.warning('缺少构建记录ID')
    return
  }
  buildDetailDialogVisible.value = true
  buildDetailLoading.value = true
  buildDetailData.value = []
  try {
    const res = await queryBuildDetail(buildLogId)
    const data = res.data || res
    buildDetailData.value = Array.isArray(data) ? data : (data.list || [])
  } catch (e: any) {
    ElMessage.error('查询构建制品失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    buildDetailLoading.value = false
  }
}

async function handlePreRefactorBuild() {
  if (!preRefactorBuildForm.productId || !preRefactorBuildForm.iterationId || preRefactorBuildForm.appList.length === 0) {
    ElMessage.warning('请选择产品、迭代和应用')
    return
  }
  try {
    await ElMessageBox.confirm('确定要触发重构前版本构建吗？', '确认构建', { type: 'warning' })
  } catch { return }

  preRefactorBuilding.value = true
  try {
    // Step 1: Get product_app_id array from selected apps
    const productAppIdArray = [...new Set(preRefactorBuildForm.appList.map((app: any) => app.id_app))]

    // Step 2: Query sub-apps with commit records (获取最新提交记录)
    console.log('[PreRefactorBuild] querySubApps params:', { productAppIdArray, versionId: preRefactorBuildForm.versionId, iterationId: preRefactorBuildForm.iterationId })
    const subAppRes = await querySubApps(
      productAppIdArray,
      preRefactorBuildForm.versionId,
      preRefactorBuildForm.iterationId
    )
    console.log('[PreRefactorBuild] querySubApps response:', subAppRes)

    // Handle error response from backend
    if (subAppRes?.error) {
      ElMessage.error('获取提交记录失败: ' + subAppRes.error)
      return
    }

    const subAppList = subAppRes?.data || subAppRes
    if (!Array.isArray(subAppList) || subAppList.length === 0) {
      ElMessage.error('未获取到应用提交记录，请检查产品/版本/迭代配置')
      return
    }
    console.log('[PreRefactorBuild] subAppList count:', subAppList.length, 'first item sub-apps:', subAppList[0]?.productVersionSubAppVOList?.length)

    // Step 3: Assemble params and trigger batch build
    const body = {
      productVersionSubAppVOList: subAppList,
      product_version_id: preRefactorBuildForm.versionId,
      forceBuild: false,
      iteraterId: preRefactorBuildForm.iterationId,
      buildFullPkg: false,
      soid: '-1',
      buildToolsName: 'tekton'
    }
    console.log('[PreRefactorBuild] batchBuild body apps:', body.productVersionSubAppVOList.length)

    const res = await batchBuild(body)
    console.log('[PreRefactorBuild] batchBuild response:', res)
    if (res.success || res.code === 20000) {
      ElMessage.success('构建已触发')
    } else {
      ElMessage.error('构建失败: ' + (res.message || res.error || '未知错误'))
    }
  } catch (e: any) {
    ElMessage.error('构建失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    preRefactorBuilding.value = false
  }
}

// === 版本构建 PR 函数 ===

async function loadVbPrRepos() {
  // Reset form when dialog opens
  vbPrForm.repoId = null
  vbPrForm.sourceBranch = ''
  vbPrForm.targetBranch = ''
  vbPrBranchList.value = []
  try {
    const res = await http.get('/ops/repos')
    const allRepos = res.data || []
    // Filter: repos related to 门诊病历
    vbPrRepoList.value = allRepos.filter((r: any) => {
      const pl = (r.productLine || '').toLowerCase()
      const pln = (r.productLineName || '').toLowerCase()
      const dn = (r.displayName || '').toLowerCase()
      const nm = (r.name || '').toLowerCase()
      return pl.includes('门诊') || pln.includes('门诊') || dn.includes('门诊') || nm.includes('outpatient')
    })
  } catch (e: any) {
    ElMessage.error('加载仓库列表失败: ' + (e?.response?.data?.error || e.message))
  }
}

function handleVbRepoChange() {
  vbPrBranchList.value = []
  vbPrForm.targetBranch = ''
}

async function handleQueryVbBranches() {
  if (!vbPrForm.repoId) {
    ElMessage.warning('请先选择仓库')
    return
  }
  const repo = vbPrRepoList.value.find((r: any) => r.id === vbPrForm.repoId)
  if (!repo || !repo.repoId) {
    ElMessage.warning('仓库信息不完整')
    return
  }
  vbPrBranchesLoading.value = true
  try {
    const res = await http.get(`/ops/repo/${repo.repoId}/branches`)
    const branches: string[] = (res.data?.branches || []).map((b: any) => b.name)
    // Sort: put production branches first
    const production = branches.filter((b: string) => b.startsWith('branch-from/') || b.startsWith('release/') || b.startsWith('sr-'))
    const others = branches.filter((b: string) => !b.startsWith('branch-from/') && !b.startsWith('release/') && !b.startsWith('sr-'))
    vbPrBranchList.value = [...production, ...others]
    if (vbPrBranchList.value.length === 0) {
      ElMessage.warning('该仓库没有分支')
    }
  } catch (e: any) {
    ElMessage.error('查询分支失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    vbPrBranchesLoading.value = false
  }
}

function handleVbCreatePr() {
  if (!vbPrForm.repoId) {
    ElMessage.warning('请选择仓库')
    return
  }
  if (!vbPrForm.sourceBranch) {
    ElMessage.warning('请输入任务分支')
    return
  }
  if (!vbPrForm.targetBranch) {
    ElMessage.warning('请选择生产分支')
    return
  }

  const repo = vbPrRepoList.value.find((r: any) => r.id === vbPrForm.repoId)
  if (!repo) {
    ElMessage.warning('仓库信息丢失')
    return
  }

  const tfsPath = repo.tfsPath || ''
  const repoId = repo.repoId || ''
  if (!tfsPath || !repoId) {
    ElMessage.warning('仓库 TFS 路径或 ID 缺失')
    return
  }

  // Double URL encoding for slashes (TFS convention)
  const encodeBranch = (branch: string) => encodeURIComponent(branch.replace(/\//g, '%2F'))
  const encodedSource = encodeBranch(vbPrForm.sourceBranch)
  const encodedTarget = encodeBranch(vbPrForm.targetBranch)

  const prUrl = `${tfsPath}/pullrequestcreate?sourceRef=${encodedSource}&targetRef=${encodedTarget}&sourceRepositoryId=${repoId}&targetRepositoryId=${repoId}`

  window.open(prUrl, '_blank')
  ElMessage.success('PR 创建页面已在新标签页打开')
  vbPrDialogVisible.value = false
}
</script>

<style scoped>
.ops-dashboard-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.sub-panel {
  padding: 8px 0;
}

.sql-content {
  font-family: monospace;
  font-size: 12px;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.demand-desc {
  font-family: inherit;
  font-size: 13px;
  background: transparent;
  padding: 0;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.logs-viewer {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
  max-height: 400px;
  overflow: auto;
}

.logs-viewer pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  text-align: center;
  padding: 12px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #e6a23c;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

/* 需求排队样式 */
.demand-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.sync-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 16px;
}

.demand-summary {
  background: #f0f5ff;
  padding: 14px;
  border-radius: 4px;
  margin-bottom: 16px;
  border: 1px solid #91d5ff;
  font-size: 14px;
  color: #595959;
}

.pl-stat {
  margin-right: 20px;
}

.product-line-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.pl-header {
  background: #1a3a5c;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pl-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pl-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.pl-count {
  font-size: 14px;
  color: #b3d4e6;
}

.pl-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.pl-body {
  padding: 0 16px 16px;
}

.demand-sub-tabs {
  --el-tabs-header-height: 32px;
}

.demand-sub-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.demand-sub-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  height: 32px;
  line-height: 32px;
  padding: 0 16px;
}

.repo-section {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.validating-title {
  color: #e6a23c;
}

.queued-title {
  color: #f56c6c;
}

.idle-title {
  color: #909399;
}

.published-title {
  color: #409eff;
}

.repo-card {
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;
}

.validating-card {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.queued-card {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
}

.published-card {
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
}

.repo-card-header {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.repo-name {
  font-weight: 500;
  font-size: 14px;
  color: #303133;
}

.module-stats {
  font-size: 12px;
  font-weight: normal;
  color: #606266;
  margin-left: 4px;
}

.module-count {
  font-size: 12px;
  color: #909399;
}

.collapse-icon {
  font-size: 16px;
  color: #909399;
  width: 20px;
  text-align: center;
}

.repo-card-body {
  padding: 0 14px 10px;
}

.demand-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.demand-id a {
  color: #409eff;
  text-decoration: none;
}

.demand-id a:hover {
  text-decoration: underline;
}

.demand-branch {
  color: #909399;
}

.demand-status-tag {
  margin-left: 4px;
}

.idle-repos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.idle-repo-tag {
  background: #f5f5f5;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
  color: #595959;
}

.closed-card {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
}

.closed-title {
  color: #909399;
}

.closed-repo-card {
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
}

.closed-body {
  /* inherits padding from repo-card-body if needed */
}

.repo-name-small {
  font-size: 12px;
  color: #606266;
  margin-right: 8px;
}
</style>
