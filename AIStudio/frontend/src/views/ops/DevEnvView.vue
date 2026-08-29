<template>
  <page-container title="开发环境" no-card>
    <template #actions>
<el-button type="warning" @click="handleSeed">预置数据</el-button>
    </template>

    <el-tabs v-model="activeTab">
      <!-- ====== Tab 1: 数据库连接 ====== -->
      <el-tab-pane label="数据库连接" name="dbConnect">
        <el-form :inline="true" :model="dbForm" label-width="80px" style="margin-bottom: 16px">
          <el-form-item label="环境">
            <el-select v-model="dbForm.envId" placeholder="选择环境" style="width: 180px" @change="handleEnvChange">
              <el-option v-for="env in envConfigs" :key="env.id" :label="env.envName" :value="env.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="产品线">
            <el-select v-model="dbForm.productLine" placeholder="选择产品线" clearable style="width: 140px" @change="handleProductLineChange">
              <el-option v-for="opt in currentProductLineOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </el-form>



        <!-- SQL 执行区 -->
        <div class="sql-section">
          <div class="sql-toolbar">
            <span style="font-weight: 600; margin-right: 8px">SQL 执行</span>
            <el-select v-model="selectedFrequentSql" placeholder="搜索常用 SQL" clearable filterable style="width: 280px" @change="handleSelectFrequentSql">
              <el-option-group v-for="group in groupedFrequentSqls" :key="group.label" :label="group.label">
                <el-option v-for="sql in group.items" :key="sql.id" :label="sql.title" :value="sql.id" />
              </el-option-group>
            </el-select>
            <el-button type="primary" :icon="CaretRight" @click="handleExecuteSql" :loading="sqlExecuting" :disabled="!canExecuteSql">执行</el-button>
          </div>
          <el-input
            v-model="dbForm.sql"
            type="textarea"
            :rows="6"
            placeholder="输入 SQL 语句..."
            style="margin-bottom: 16px"
          />

          <!-- SQL 执行结果 -->
          <template v-if="sqlResult">
            <div style="margin-bottom: 8px; color: var(--ink-text-secondary); font-size: 13px">
              执行结果: 共 {{ sqlResult.rows?.length || 0 }} 行, 耗时 {{ sqlResult.elapsed || '-' }} ms
            </div>
            <el-table v-if="sqlResult.columns && sqlResult.rows" :data="sqlResult.rows" stripe style="width: 100%" max-height="400">
              <el-table-column
                v-for="col in sqlResult.columns"
                :key="col"
                :prop="col"
                :label="col"
                min-width="150"
                show-overflow-tooltip
              />
            </el-table>
            <el-alert v-if="sqlResult.affectedRows !== undefined" :title="`影响行数: ${sqlResult.affectedRows}`" type="success" show-icon />
            <el-alert v-if="sqlResult.error" :title="sqlResult.error" type="error" show-icon />
          </template>
        </div>
      </el-tab-pane>

      <!-- ====== Tab 2: 注册中心 ====== -->
      <el-tab-pane label="注册中心" name="registry">
        <el-form :inline="true" :model="consulForm" label-width="80px" style="margin-bottom: 16px">
          <el-form-item label="环境">
            <el-select v-model="consulForm.envId" placeholder="选择环境" style="width: 180px" @change="handleConsulEnvChange">
              <el-option v-for="env in envConfigs" :key="env.id" :label="env.envName" :value="env.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="产品线">
            <el-select v-model="consulForm.productLine" placeholder="选择产品线" clearable style="width: 140px" @change="handleConsulProductLineChange">
              <el-option v-for="opt in currentRegistryProductLineOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </el-form>

        <el-descriptions v-if="registryConsulConfig" title="Consul 配置（来自配置中心）" :column="2" border style="margin-bottom: 16px">
          <el-descriptions-item label="Consul Host">{{ registryConsulConfig.host || '(未找到)' }}</el-descriptions-item>
          <el-descriptions-item label="Consul Port">{{ registryConsulConfig.port || '(未找到)' }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-bottom: 16px">
          <el-input v-model="consulServiceFilter" placeholder="过滤服务名" clearable style="width: 240px; margin-right: 8px" />
          <el-button type="primary" :icon="Refresh" @click="handleLoadConsulServices" :loading="consulLoading" :disabled="!registryConsulConfig?.host">拉取服务列表</el-button>
        </div>

        <el-table :data="filteredConsulServices" stripe style="width: 100%" v-loading="consulLoading" max-height="500">
          <el-table-column prop="serviceName" label="服务名" min-width="200" />
          <el-table-column prop="serviceId" label="服务 ID" min-width="200" />
          <el-table-column prop="address" label="地址" width="140" />
          <el-table-column prop="port" label="端口" width="80" />
          <el-table-column label="标签" min-width="200">
            <template #default="{ row }">
              <el-tag v-for="tag in (row.tags || [])" :key="tag" size="small" style="margin: 2px 4px 2px 0">{{ tag }}</el-tag>
              <span v-if="!row.tags?.length" style="color: #b8b1a0">-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleViewInstances(row)">实例</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 服务实例弹窗 -->
        <el-dialog v-model="instancesDialogVisible" title="服务实例" width="850px">
          <el-table :data="serviceInstances" stripe style="width: 100%" v-loading="instancesLoading" max-height="400">
            <el-table-column prop="node" label="Node" width="120" />
            <el-table-column prop="nodeAddress" label="节点地址" width="140" />
            <el-table-column prop="serviceAddress" label="服务地址" width="140" />
            <el-table-column prop="servicePort" label="端口" width="80" />
            <el-table-column prop="datacenter" label="Datacenter" width="100" />
            <el-table-column label="标签" min-width="180">
              <template #default="{ row }">
                <el-tag v-for="tag in (row.tags || [])" :key="tag" size="small" style="margin: 2px 4px 2px 0">{{ tag }}</el-tag>
                <span v-if="!row.tags?.length" style="color: #b8b1a0">-</span>
              </template>
            </el-table-column>
            <el-table-column label="健康状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-dialog>
      </el-tab-pane>

      <!-- ====== Tab 3: 常用 SQL ====== -->
      <el-tab-pane label="常用 SQL" name="frequentSql">
        <div class="toolbar">
          <el-input v-model="frequentSqlSearch" placeholder="搜索标题/内容" clearable style="width: 220px" @change="loadFrequentSqls" @keyup.enter="loadFrequentSqls" />
          <el-select v-model="frequentSqlDbType" placeholder="数据库类型" clearable style="width: 140px" @change="loadFrequentSqls">
            <el-option label="Oracle" value="oracle" />
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
          </el-select>
          <el-button :icon="Refresh" @click="loadFrequentSqls">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="handleAddFrequentSql">新增</el-button>
        </div>

        <el-table :data="frequentSqls" stripe style="width: 100%" v-loading="frequentSqlLoading">
          <el-table-column prop="title" label="标题" min-width="180" />
          <el-table-column label="SQL 内容" min-width="350">
            <template #default="{ row }">
              <el-tooltip :content="row.sqlContent" placement="top" :show-after="300">
                <span class="truncate-text">{{ row.sqlContent }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="dbType" label="数据库类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ row.dbType || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEditFrequentSql(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDeleteFrequentSql(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 常用 SQL 编辑弹窗 -->
        <el-dialog v-model="frequentSqlDialogVisible" :title="isEditFrequentSql ? '编辑常用 SQL' : '新增常用 SQL'" width="600px">
          <el-form ref="sqlFormRef" :model="frequentSqlForm" :rules="sqlRules" label-width="100px">
            <el-form-item label="标题" prop="title">
              <el-input v-model="frequentSqlForm.title" placeholder="如: 查询患者信息" />
            </el-form-item>
            <el-form-item label="SQL 内容" prop="sqlContent">
              <el-input v-model="frequentSqlForm.sqlContent" type="textarea" :rows="6" placeholder="输入 SQL" />
            </el-form-item>
            <el-form-item label="数据库类型">
              <el-select v-model="frequentSqlForm.dbType" placeholder="选择类型" clearable style="width: 100%">
                <el-option label="Oracle" value="oracle" />
                <el-option label="MySQL" value="mysql" />
                <el-option label="PostgreSQL" value="postgresql" />
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="frequentSqlDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveFrequentSql" :loading="frequentSqlSaving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ====== Tab 4: 开发环境列表 ====== -->
      <el-tab-pane label="开发环境列表" name="envList">
        <div class="toolbar">
          <el-button type="primary" :icon="Plus" @click="handleAddEnv">新增环境</el-button>
          <el-button :icon="Refresh" @click="loadEnvConfigs">刷新</el-button>
        </div>

        <!-- 环境卡片列表 -->
        <div v-loading="envLoading">
          <el-empty v-if="envCards.length === 0" description="暂无环境配置" :image-size="60" />
          <div
            v-for="(card, idx) in envCards"
            :key="card.id"
            class="env-card"
            style="background: var(--paper-card); border-radius: 12px; margin-bottom: 12px; overflow: hidden; border: 1px solid var(--paper-border);"
          >
            <!-- 卡片头 -->
            <div
              class="env-card-header"
              style="padding: 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;"
              @click="toggleEnvDetail(idx)"
            >
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 18px; font-weight: 600; color: var(--ink-text);">{{ card.envName }}</span>
                <span
                  :style="{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                    background: card.categoryColor + '20', color: card.categoryColor,
                    border: '1px solid ' + card.categoryColor + '40'
                  }"
                >{{ card.categoryLabel }}</span>
                <span
                  v-if="card.dbTypeLabel"
                  :style="{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                    background: card.dbTypeColor + '20', color: card.dbTypeColor,
                    border: '1px solid ' + card.dbTypeColor + '40'
                  }"
                >{{ card.dbTypeLabel }}</span>
                <span v-if="card.branch" style="font-size: 13px; color: var(--ink-text-regular); background: var(--el-border-color-extra-light); padding: 2px 8px; border-radius: 4px;">
                  {{ card.branch }}
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 16px;">
                <span v-if="card.ip" style="font-size: 13px; color: var(--ink-text-regular);">{{ card.ip }}</span>
                <span
                  :style="{
                    fontSize: '16px', color: 'var(--ink-text-secondary)', transition: 'transform 0.2s',
                    transform: expandedEnvCards.has(idx) ? 'rotate(180deg)' : 'rotate(0deg)'
                  }"
                >&#9660;</span>
              </div>
            </div>
            <!-- 展开详情 -->
            <div
              v-if="expandedEnvCards.has(idx)"
              style="padding: 0 16px 16px; border-top: 1px solid #ede8da;"
            >
              <div style="padding-top: 16px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <!-- 配置ID (SerialIds) -->
                  <div>
                    <h3 style="font-size: 14px; margin-bottom: 12px; color: var(--ink-text);">配置ID (SerialIds)</h3>
                    <template v-if="getSerialIdEntries(card.config).length > 0">
                      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                        <thead>
                          <tr style="background: var(--el-fill-color-light);">
                            <th style="padding: 8px 12px; border-bottom: 2px solid #e1dbcb; text-align: left; font-weight: 600;">产品线</th>
                            <th style="padding: 8px 12px; border-bottom: 2px solid #e1dbcb; text-align: left; font-weight: 600;">SerialId</th>
                            <th style="padding: 8px 12px; border-bottom: 2px solid #e1dbcb; text-align: left; font-weight: 600;">配置中心</th>
                            <th style="padding: 8px 12px; border-bottom: 2px solid #e1dbcb; text-align: left; font-weight: 600;">业务库</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="entry in getSerialIdEntries(card.config)" :key="entry.key">
                            <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da;">{{ entry.label }}</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da; font-family: var(--app-font-mono);">{{ entry.serialId }}</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da;">
                              <a
                                v-if="entry.configUrl !== '#'"
                                :href="entry.configUrl"
                                target="_blank"
                                style="color: var(--el-color-primary); text-decoration: none; font-size: 12px;"
                                @click.stop
                              >打开配置</a>
                              <span v-else style="color: #b8b1a0; font-size: 12px;">-</span>
                            </td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da;">
                              <el-input
                                size="small"
                                :model-value="getCardBizDb(card.config, entry.key)"
                                @update:model-value="setCardBizDb(card.config, entry.key, $event)"
                                @change="handleSaveBizDb(card.config)"
                                :placeholder="`${entry.label}业务库`"
                                style="width: 180px"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </template>
                    <table v-else style="width: 100%; font-size: 13px; border-collapse: collapse;">
                      <tbody>
                        <tr style="background: var(--el-fill-color-light);">
                          <td style="padding: 8px 12px; border-bottom: 1px solid #e1dbcb; font-weight: 600; width: 100px;">环境名</td>
                          <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da;">{{ card.envName }}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 12px; border-bottom: 1px solid #e1dbcb; font-weight: 600;">类别</td>
                          <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da;">{{ card.categoryLabel }}</td>
                        </tr>
                        <tr style="background: var(--el-fill-color-light);">
                          <td style="padding: 8px 12px; border-bottom: 1px solid #e1dbcb; font-weight: 600;">产品线</td>
                          <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da;">{{ card.branch || '-' }}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 12px; border-bottom: 1px solid #e1dbcb; font-weight: 600;">数据库</td>
                          <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da;">{{ card.dbTypeLabel || '-' }}</td>
                        </tr>
                        <tr style="background: var(--el-fill-color-light);">
                          <td style="padding: 8px 12px; border-bottom: 1px solid #e1dbcb; font-weight: 600;">DB URL</td>
                          <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da; word-break: break-all;">{{ card.dbUrl || '-' }}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 12px; border-bottom: 1px solid #e1dbcb; font-weight: 600;">Web URL</td>
                          <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da; word-break: break-all;">{{ card.webUrl || '-' }}</td>
                        </tr>
                        <tr v-if="card.serialId">
                          <td style="padding: 8px 12px; border-bottom: 1px solid #e1dbcb; font-weight: 600;">SerialId</td>
                          <td style="padding: 8px 12px; border-bottom: 1px solid #ede8da; font-family: var(--app-font-mono);">{{ card.serialId }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div v-if="card.serialId && getSerialIdEntries(card.config).length === 0" style="margin-top: 8px;">
                      <a
                        :href="buildDevopsUrl(card)"
                        target="_blank"
                        style="color: var(--el-color-primary); text-decoration: none; font-size: 12px;"
                        @click.stop
                      >打开配置中心</a>
                    </div>
                  </div>
                  <!-- 配置中心地址 (DevopsBaseUrl) -->
                  <div>
                    <h3 style="font-size: 14px; margin-bottom: 12px; color: var(--ink-text);">配置中心地址 (DevopsBaseUrl)</h3>
                    <div style="font-size: 13px; background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 4px; padding: 12px; word-break: break-all; line-height: 1.8;">
                      <template v-if="getDevopsBaseUrlEntries(card.config).length > 0">
                        <div v-for="entry in getDevopsBaseUrlEntries(card.config)" :key="entry.label">
                          <strong>{{ entry.label }}:</strong> {{ entry.url }}
                        </div>
                      </template>
                      <template v-else-if="getDevopsBaseUrlString(card.config)">
                        <div><strong>URL:</strong> {{ getDevopsBaseUrlString(card.config) }}</div>
                      </template>
                      <template v-else>
                        <div style="color: #b8b1a0;">未配置</div>
                      </template>
                    </div>
                    <!-- Consul 配置 -->
                    <h3 style="font-size: 14px; margin: 12px 0 8px; color: var(--ink-text);">Consul 配置</h3>
                    <div style="font-size: 13px; background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 4px; padding: 12px; word-break: break-all; line-height: 1.6;">
                      <div><strong>Host:</strong> {{ card.consulHost || '-' }}</div>
                      <div><strong>Port:</strong> {{ card.consulPort || '-' }}</div>
                    </div>
                  </div>
                </div>
                <!-- 操作按钮 -->
                <div style="margin-top: 16px; display: flex; gap: 8px;">
                  <el-button link type="primary" size="small" @click.stop="handleEditEnv(card.config)">编辑</el-button>
                  <el-button link type="danger" size="small" @click.stop="handleDeleteEnv(card)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 环境编辑弹窗 -->
        <el-dialog v-model="envDialogVisible" :title="isEditEnv ? '编辑环境' : '新增环境'" width="600px">
          <el-form :model="envForm" label-width="110px" :rules="envRules" ref="envFormRef">
            <el-form-item label="环境名" prop="envName" required>
              <el-input v-model="envForm.envName" placeholder="如: 105环境" />
            </el-form-item>
            <el-form-item label="类别" prop="category" required>
              <el-select v-model="envForm.category" placeholder="选择类别" style="width: 100%">
                <el-option label="开发环境" value="dev" />
                <el-option label="测试环境" value="test" />
                <el-option label="公共" value="public" />
              </el-select>
            </el-form-item>
            <el-form-item label="产品线" prop="productLine" required>
              <el-select v-model="envForm.productLine" placeholder="选择产品线" style="width: 100%">
                <el-option label="门诊" value="outpatient" />
                <el-option label="急诊" value="emergency" />
                <el-option label="住院" value="inpatient" />
                <el-option label="会诊" value="integration" />
              </el-select>
            </el-form-item>
            <el-form-item label="DB URL" prop="dbUrl">
              <el-input v-model="envForm.dbUrl" placeholder="jdbc:oracle:thin:@..." />
            </el-form-item>
            <el-form-item label="Web URL" prop="webUrl">
              <el-input v-model="envForm.webUrl" placeholder="如: http://172.16.7.105:80" />
            </el-form-item>
            <el-form-item label="DB 用户名">
              <el-input v-model="envForm.dbUsername" placeholder="数据库用户名" />
            </el-form-item>
            <el-form-item label="DB 密码">
              <el-input v-model="envForm.dbPassword" type="password" show-password placeholder="数据库密码" />
            </el-form-item>
            <el-form-item label="DB 驱动">
              <el-select v-model="envForm.dbDriver" placeholder="选择驱动" clearable style="width: 100%">
                <el-option label="Oracle" value="oracle.jdbc.OracleDriver" />
                <el-option label="MySQL" value="com.mysql.cj.jdbc.Driver" />
                <el-option label="PostgreSQL" value="org.postgresql.Driver" />
                <el-option label="SQL Server" value="com.microsoft.sqlserver.jdbc.SQLServerDriver" />
              </el-select>
            </el-form-item>
            <el-form-item label="Consul 地址">
              <el-input v-model="envForm.consulHost" placeholder="如: 192.168.1.100" />
            </el-form-item>
            <el-form-item label="Consul 端口">
              <el-input v-model="envForm.consulPort" placeholder="如: 8500" />
            </el-form-item>
            <el-form-item label="序列号">
              <el-input v-model="envForm.serialId" placeholder="可选" />
            </el-form-item>
            <el-form-item label="SerialIds (JSON)">
              <el-input v-model="envForm.serialIds" type="textarea" :rows="2" placeholder='{"outpatient":185,"emergency":185,"inpatient":153,"integration":153}' />
            </el-form-item>
            <el-form-item label="业务库">
              <div style="display: flex; flex-direction: column; gap: 8px; width: 100%">
                <div v-for="pl in ['outpatient','emergency','inpatient','integration']" :key="pl" style="display: flex; align-items: center; gap: 8px;">
                  <span style="width: 50px; flex-shrink: 0;">{{ productLineLabels[pl] }}</span>
                  <el-input
                    :model-value="getBizDb(pl)"
                    @update:model-value="setBizDb(pl, $event)"
                    :placeholder="`${productLineLabels[pl]}业务库名`"
                  />
                </div>
              </div>
            </el-form-item>
            <el-form-item label="配置中心URL">
              <el-input v-model="envForm.devopsBaseUrl" type="textarea" :rows="2" placeholder="URL 或 JSON 对象如 {&quot;outpatient&quot;:&quot;http://...&quot;}" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="envDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveEnv" :loading="envSaving">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </page-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useConfirmDelete } from '@/composables/useConfirmDelete'
import { useStatusTag } from '@/composables/useStatusTag'

const { confirmDelete } = useConfirmDelete()
const { statusType, statusLabel } = useStatusTag()
import { Plus, Refresh, View, Hide, CaretRight } from '@element-plus/icons-vue'
import {
  listEnvConfigs,
  saveEnvConfig,
  deleteEnvConfig,
  executeSql,
  getConsulServices,
  getConsulInstances,
  listFrequentSqls,
  saveFrequentSql,
  deleteFrequentSql,
  seedDevEnv,
  fetchConfigCenter,
  type DevEnvConfig,
  type FrequentSql
} from '@/api/devEnv'

// 主 tab
const activeTab = ref('dbConnect')

// 产品线标签映射
const productLineLabels: Record<string, string> = {
  outpatient: '门诊',
  emergency: '急诊',
  inpatient: '住院',
  integration: '会诊'
}

// 环境配置列表（共享）
const envConfigs = ref<DevEnvConfig[]>([])
const envLoading = ref(false)

async function loadEnvConfigs() {
  envLoading.value = true
  try {
    envConfigs.value = await listEnvConfigs()
  } catch (e: any) {
    ElMessage.error('加载环境配置失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    envLoading.value = false
  }
}

// ========== Tab 1: 数据库连接 ==========
const dbForm = reactive({
  envId: null as number | null,
  productLine: '',
  sql: ''
})
const sqlExecuting = ref(false)
const sqlResult = ref<any>(null)
const showDbPassword = ref(false)
const showCcPassword = ref(false)
const selectedFrequentSql = ref<number | null>(null)
const frequentSqls = ref<FrequentSql[]>([])

const dbTypeLabels: Record<string, string> = { oracle: 'Oracle', sqlserver: 'SQL Server', mysql: 'MySQL', postgresql: 'PostgreSQL' }
const groupedFrequentSqls = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const sql of frequentSqls.value) {
    const key = sql.dbType || '通用'
    if (!groups[key]) groups[key] = []
    groups[key].push(sql)
  }
  return Object.entries(groups).map(([key, items]) => ({ label: dbTypeLabels[key] || key, items }))
})

const configCenterResult = ref<{
  url: string
  username: string
  password: string
  driver: string
  dbName: string
} | null>(null)

const currentEnv = computed(() => {
  if (!dbForm.envId) return null
  return envConfigs.value.find(e => e.id === dbForm.envId) || null
})

const currentProductLineOptions = computed(() => getProductLineOptions(dbForm.envId))

const canExecuteSql = computed(() => {
  return !!currentEnv.value && !!dbForm.sql.trim()
})

function getProductLineOptions(envId: number | null) {
  if (!envId) return []
  const env = envConfigs.value.find(e => e.id === envId)
  if (!env?.serialIds) return []
  try {
    const parsed = JSON.parse(env.serialIds)
    return Object.keys(parsed).map(key => ({ value: key, label: productLineLabels[key] || key }))
  } catch {
    return []
  }
}

function handleEnvChange(envId: number) {
  const opts = getProductLineOptions(envId)
  dbForm.productLine = opts[0]?.value || ''
  sqlResult.value = null
  configCenterResult.value = null
  if (envId && dbForm.productLine) {
    loadDbConfigFromConfigCenter()
  }
}

function handleProductLineChange(productLine: string) {
  sqlResult.value = null
  configCenterResult.value = null
  if (dbForm.envId && productLine) {
    loadDbConfigFromConfigCenter()
  }
}

async function loadDbConfigFromConfigCenter() {
  const env = currentEnv.value
  if (!env || !dbForm.productLine) return
  configCenterLoading.value = true
  configCenterResult.value = null
  try {
    const data = await fetchConfigCenter({
      envName: env.envName,
      productLine: dbForm.productLine
    })
    if (data.error) {
      ElMessage.error('配置中心返回错误: ' + data.error)
      return
    }
    const config = data.config || data
    let jdbcUrl = ''
    let username = ''
    let password = ''
    let driver = ''
    let dbName = ''

    for (const [key, value] of Object.entries(config)) {
      if (/datasource\..*\.url$/.test(key) && value) {
        jdbcUrl = value as string
      } else if (/datasource\..*\.username$/.test(key) && value) {
        username = value as string
      } else if (/datasource\..*\.password$/.test(key) && value) {
        password = value as string
      }
    }

    if (jdbcUrl) {
      if (jdbcUrl.includes('jdbc:oracle')) {
        driver = 'oracle.jdbc.OracleDriver'
      } else if (jdbcUrl.includes('jdbc:sqlserver')) {
        driver = 'com.microsoft.sqlserver.jdbc.SQLServerDriver'
      } else if (jdbcUrl.includes('jdbc:mysql')) {
        driver = 'com.mysql.cj.jdbc.Driver'
      }
    }

    // 业务库：从 env.dbDataBase JSON 中按产品线读取，否则从 URL 解析
    const currentProductLine = dbForm.productLine
    let envBizDb = ''
    if (env.dbDataBase) {
      try {
        const parsed = JSON.parse(env.dbDataBase)
        envBizDb = parsed[currentProductLine] || ''
      } catch {
        // 兼容旧格式：不是 JSON 时作为整体业务库名
        envBizDb = env.dbDataBase
      }
    }

    if (jdbcUrl) {
      if (envBizDb) {
        // 有业务库配置，覆盖 URL 中的数据库名
        if (jdbcUrl.includes('databaseName=')) {
          jdbcUrl = jdbcUrl.replace(/databaseName=[^;]+/, 'databaseName=' + envBizDb)
        } else if (jdbcUrl.startsWith('jdbc:sqlserver://')) {
          jdbcUrl += ';databaseName=' + envBizDb
        } else {
          jdbcUrl = jdbcUrl.replace(/\/([^\/]+)$/, '/' + envBizDb)
        }
        dbName = envBizDb
      } else {
        // 没有业务库配置，从 URL 解析现有数据库名
        const dbMatch = jdbcUrl.match(/databaseName=([^;]+)/)
        if (dbMatch) {
          dbName = dbMatch[1]
        } else {
          const pathMatch = jdbcUrl.match(/jdbc:\w+:\/\/[^/]+\/([^?;]+)/)
          if (pathMatch) dbName = pathMatch[1]
        }
      }
    }

    configCenterResult.value = { url: jdbcUrl, username, password, driver, dbName }
  } catch (e: any) {
    ElMessage.error('加载配置中心失败: ' + (e?.message || e))
  } finally {
    configCenterLoading.value = false
  }
}

function handleSelectFrequentSql(sqlId: number) {
  const sql = frequentSqls.value.find(s => s.id === sqlId)
  if (sql) {
    dbForm.sql = sql.sqlContent
  }
}

async function handleExecuteSql() {
  const env = currentEnv.value
  if (!env) {
    ElMessage.warning('请先选择环境')
    return
  }
  if (!dbForm.sql.trim()) {
    ElMessage.warning('请输入 SQL 语句')
    return
  }
  sqlExecuting.value = true
  sqlResult.value = null
  try {
    const res = await executeSql({
      envName: env.envName,
      productLine: dbForm.productLine,
      sql: dbForm.sql
    })
    sqlResult.value = res
  } catch (e: any) {
    sqlResult.value = { error: e?.response?.data?.error || e.message }
    ElMessage.error('SQL 执行失败')
  } finally {
    sqlExecuting.value = false
  }
}

// ========== Tab 2: 注册中心 ==========
const consulForm = reactive({
  envId: null as number | null,
  productLine: ''
})
const consulLoading = ref(false)
const consulServices = ref<any[]>([])
const consulServiceFilter = ref('')
const instancesDialogVisible = ref(false)
const instancesLoading = ref(false)
const serviceInstances = ref<any[]>([])
const registryConsulConfig = ref<{ host: string; port: string } | null>(null)

const filteredConsulServices = computed(() => {
  if (!consulServiceFilter.value) return consulServices.value
  const keyword = consulServiceFilter.value.toLowerCase()
  return consulServices.value.filter(s =>
    (s.serviceName || '').toLowerCase().includes(keyword) ||
    (s.serviceId || '').toLowerCase().includes(keyword)
  )
})

const currentRegistryProductLineOptions = computed(() => getProductLineOptions(consulForm.envId))

async function handleConsulEnvChange(envId: number) {
  const opts = getProductLineOptions(envId)
  consulForm.productLine = opts[0]?.value || ''
  registryConsulConfig.value = null
  consulServices.value = []
  if (consulForm.productLine) {
    await handleConsulProductLineChange()
    const cfg = registryConsulConfig.value as { host: string; port: string } | null
    if (cfg?.host) {
      await handleLoadConsulServices()
    }
  }
}

async function handleConsulProductLineChange() {
  registryConsulConfig.value = null
  consulServices.value = []
  if (consulForm.envId && consulForm.productLine) {
    // 从配置中心获取 Consul 地址
    try {
      const env = envConfigs.value.find(e => e.id === consulForm.envId)
      if (env) {
        const data = await fetchConfigCenter({ envName: env.envName, productLine: consulForm.productLine })
        if (data.config) {
          const host = data.config['spring.cloud.consul.host'] || ''
          const port = data.config['spring.cloud.consul.port'] || '8500'
          registryConsulConfig.value = { host, port }
        }
      }
    } catch (e) {
      console.error('获取配置中心 Consul 地址失败', e)
    }
  }
}

async function handleLoadConsulServices() {
  const host = registryConsulConfig.value?.host
  const port = registryConsulConfig.value?.port || '8500'
  if (!host) {
    ElMessage.warning('请先通过配置中心获取 Consul 地址')
    return
  }
  consulLoading.value = true
  try {
    const res = await getConsulServices(host, port)
    if (res && typeof res === 'object' && !Array.isArray(res)) {
      consulServices.value = Object.entries(res)
        .filter(([name]) => name !== 'consul')
        .map(([serviceName, tags]) => ({
          serviceName,
          tags: Array.isArray(tags) ? tags : []
        }))
    } else {
      consulServices.value = []
    }
  } catch (e: any) {
    ElMessage.error('拉取服务列表失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    consulLoading.value = false
  }
}

async function handleViewInstances(row: any) {
  const host = registryConsulConfig.value?.host
  const port = registryConsulConfig.value?.port || '8500'
  if (!host) return
  instancesDialogVisible.value = true
  instancesLoading.value = true
  try {
    const res = await getConsulInstances(host, port, row.serviceName || row.serviceId)
    serviceInstances.value = res?.instances || (Array.isArray(res) ? res : [])
  } catch (e: any) {
    ElMessage.error('获取实例失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    instancesLoading.value = false
  }
}

// ========== Tab 3: 常用 SQL ==========
const frequentSqlSearch = ref('')
const frequentSqlDbType = ref('')
const frequentSqlLoading = ref(false)
const frequentSqlDialogVisible = ref(false)
const isEditFrequentSql = ref(false)
const frequentSqlSaving = ref(false)

const sqlFormRef = ref<FormInstance>()
const sqlRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  sqlContent: [{ required: true, message: '请输入 SQL 内容', trigger: 'blur' }]
}

const frequentSqlForm = reactive<FrequentSql>({
  title: '',
  sqlContent: '',
  dbType: ''
})

async function loadFrequentSqls() {
  frequentSqlLoading.value = true
  try {
    frequentSqls.value = await listFrequentSqls(frequentSqlSearch.value || undefined, frequentSqlDbType.value || undefined)
  } catch (e: any) {
    ElMessage.error('加载常用 SQL 失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    frequentSqlLoading.value = false
  }
}

function handleAddFrequentSql() {
  isEditFrequentSql.value = false
  frequentSqlForm.title = ''
  frequentSqlForm.sqlContent = ''
  frequentSqlForm.dbType = ''
  frequentSqlDialogVisible.value = true
}

function handleEditFrequentSql(row: FrequentSql) {
  isEditFrequentSql.value = true
  Object.assign(frequentSqlForm, { ...row })
  frequentSqlDialogVisible.value = true
}

async function handleSaveFrequentSql() {
  const valid = await sqlFormRef.value?.validate().catch(() => false)
  if (!valid) return
  frequentSqlSaving.value = true
  try {
    await saveFrequentSql({ ...frequentSqlForm })
    ElMessage.success('保存成功')
    frequentSqlDialogVisible.value = false
    await loadFrequentSqls()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    frequentSqlSaving.value = false
  }
}

async function handleDeleteFrequentSql(row: FrequentSql) {
  if (!await confirmDelete(`常用 SQL "${row.title}"`)) return
  try {
    await deleteFrequentSql(row.id!)
    ElMessage.success('已删除')
    await loadFrequentSqls()
  } catch {
    // 接口错误已由统一错误出口提示
  }
}

// ========== Tab 4: 开发环境列表 ==========
const envDialogVisible = ref(false)
const isEditEnv = ref(false)
const envSaving = ref(false)
const envFormRef = ref<FormInstance>()

// 环境卡片展开状态
const expandedEnvCards = ref(new Set<number>())

function toggleEnvDetail(idx: number) {
  const s = new Set(expandedEnvCards.value)
  if (s.has(idx)) s.delete(idx); else s.add(idx)
  expandedEnvCards.value = s
}

// 将 envConfigs 映射为卡片列表，每个配置一张卡片
interface EnvCard {
  id: number | undefined
  envName: string
  category: string
  categoryLabel: string
  categoryColor: string
  dbTypeLabel: string
  dbTypeColor: string
  branch: string
  ip: string
  consulHost: string
  consulPort: string
  consulAddr: string
  serialId: string
  dbUrl: string
  webUrl: string
  config: DevEnvConfig
}

const envCards = computed<EnvCard[]>(() => {
  return envConfigs.value.map(c => {
    // 从 category 字段映射标签和颜色
    let categoryLabel = '开发环境'
    let categoryColor = '#67c23a'
    if (c.category === 'test') {
      categoryLabel = '测试环境'; categoryColor = 'var(--el-color-primary)'
    } else if (c.category === 'public') {
      categoryLabel = '公共'; categoryColor = '#e6a23c'
    }

    // 从 dbDriver 推断数据库类型
    const driver = c.dbDriver || ''
    let dbTypeLabel = ''
    let dbTypeColor = 'var(--ink-text-secondary)'
    if (driver.includes('oracle') || driver.includes('Oracle')) {
      dbTypeLabel = 'ORACLE'; dbTypeColor = '#e6a23c'
    } else if (driver.includes('sqlserver') || driver.includes('SQLServer')) {
      dbTypeLabel = 'SQLSERVER'; dbTypeColor = 'var(--viz-violet)'
    } else if (driver.includes('mysql') || driver.includes('MySQL')) {
      dbTypeLabel = 'MYSQL'; dbTypeColor = 'var(--el-color-primary)'
    } else if (driver.includes('postgresql') || driver.includes('PostgreSQL')) {
      dbTypeLabel = 'POSTGRESQL'; dbTypeColor = 'var(--el-color-primary)'
    }

    // 从 dbUrl 提取 IP 显示
    let ip = ''
    if (c.dbUrl) {
      try {
        ip = new URL(c.dbUrl).hostname || c.dbUrl
      } catch {
        ip = c.dbUrl
      }
    } else if (c.consulHost) {
      ip = c.consulHost
    }

    const consulHost = c.consulHost || ''
    const consulPort = c.consulPort || ''

    return {
      id: c.id,
      envName: c.envName,
      category: c.category || 'dev',
      categoryLabel,
      categoryColor,
      dbTypeLabel,
      dbTypeColor,
      branch: c.productLine || '',
      ip,
      consulHost,
      consulPort,
      consulAddr: consulHost ? `${consulHost}:${consulPort}` : '',
      serialId: c.serialId || '',
      dbUrl: c.dbUrl || '',
      webUrl: c.webUrl || '',
      config: c
    }
  })
})

function parseSerialIds(config: DevEnvConfig): Record<string, number> {
  if (!config.serialIds) return {}
  try {
    return JSON.parse(config.serialIds)
  } catch {
    return {}
  }
}

function parseDevopsBaseUrl(config: DevEnvConfig): string | Record<string, string> {
  if (!config.devopsBaseUrl) return ''
  try {
    const parsed = JSON.parse(config.devopsBaseUrl)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, string>
    }
    return config.devopsBaseUrl
  } catch {
    return config.devopsBaseUrl
  }
}

function getDevopsBaseUrlEntries(config: DevEnvConfig): Array<{label: string, url: string}> {
  const parsed = parseDevopsBaseUrl(config)
  if (typeof parsed === 'object') {
    return Object.entries(parsed).map(([key, url]) => ({
      label: productLineLabels[key] || key,
      url: url as string
    }))
  }
  return []
}

function getDevopsBaseUrlString(config: DevEnvConfig): string {
  const parsed = parseDevopsBaseUrl(config)
  return typeof parsed === 'string' ? parsed : ''
}

function buildConfigCenterUrl(config: DevEnvConfig, productLineKey: string): string {
  const serialIds = parseSerialIds(config)
  const baseUrl = parseDevopsBaseUrl(config)
  const serialId = serialIds[productLineKey]

  if (typeof baseUrl === 'object') {
    return baseUrl[productLineKey] || baseUrl['outpatient'] || '#'
  }
  if (baseUrl && serialId) {
    return `${baseUrl}?serialId=${serialId}`
  }
  return '#'
}

function getSerialIdEntries(config: DevEnvConfig): Array<{key: string, label: string, serialId: number, configUrl: string}> {
  const serialIds = parseSerialIds(config)
  return Object.entries(serialIds).map(([key, sid]) => ({
    key,
    label: productLineLabels[key] || key,
    serialId: sid as number,
    configUrl: buildConfigCenterUrl(config, key)
  }))
}

function buildDevopsUrl(card: EnvCard): string {
  const serialId = card.serialId || ''
  if (!serialId) return '#'
  return `http://172.16.9.87:8089/cluster/action/appconfig/LoadBySerial?serialId=${serialId}`
}

const defaultEnvForm = (): DevEnvConfig => ({
  envName: '',
  productLine: '',
  category: 'dev',
  dbUrl: '',
  webUrl: '',
  dbUsername: '',
  dbPassword: '',
  dbDriver: '',
  consulHost: '',
  consulPort: '',
  serialId: '',
  serialIds: '',
  devopsBaseUrl: '',
  dbDataBase: ''
})

const envForm = reactive<DevEnvConfig>(defaultEnvForm())

function getBizDb(productLine: string): string {
  try {
    const parsed = JSON.parse(envForm.dbDataBase || '{}')
    return parsed[productLine] || ''
  } catch {
    return ''
  }
}

function setBizDb(productLine: string, value: string) {
  let parsed: Record<string, string> = {}
  try {
    parsed = JSON.parse(envForm.dbDataBase || '{}')
  } catch {}
  if (value) {
    parsed[productLine] = value
  } else {
    delete parsed[productLine]
  }
  envForm.dbDataBase = Object.keys(parsed).length ? JSON.stringify(parsed) : ''
}

function getCardBizDb(config: DevEnvConfig, productLine: string): string {
  try {
    const parsed = JSON.parse(config.dbDataBase || '{}')
    return parsed[productLine] || ''
  } catch {
    return ''
  }
}

function setCardBizDb(config: DevEnvConfig, productLine: string, value: string) {
  let parsed: Record<string, string> = {}
  try {
    parsed = JSON.parse(config.dbDataBase || '{}')
  } catch {}
  if (value) {
    parsed[productLine] = value
  } else {
    delete parsed[productLine]
  }
  config.dbDataBase = Object.keys(parsed).length ? JSON.stringify(parsed) : ''
}

async function handleSaveBizDb(config: DevEnvConfig) {
  try {
    await saveEnvConfig({ ...config })
    await loadEnvConfigs()
    ElMessage.success('业务库已保存')
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.message || e))
  }
}

const envRules: FormRules = {
  envName: [{ required: true, message: '请输入环境名', trigger: 'blur' }],
  productLine: [{ required: true, message: '请选择产品线', trigger: 'change' }]
}

function handleAddEnv() {
  isEditEnv.value = false
  Object.assign(envForm, defaultEnvForm())
  envDialogVisible.value = true
}

function handleEditEnv(row: DevEnvConfig) {
  isEditEnv.value = true
  Object.assign(envForm, { ...row })
  envDialogVisible.value = true
}

async function handleSaveEnv() {
  const valid = await envFormRef.value?.validate().catch(() => false)
  if (!valid) return
  envSaving.value = true
  try {
    await saveEnvConfig({ ...envForm })
    ElMessage.success('保存成功')
    envDialogVisible.value = false
    await loadEnvConfigs()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    envSaving.value = false
  }
}

async function handleDeleteEnv(card: EnvCard) {
  if (!await confirmDelete(`环境 "${card.envName}"`)) return
  try {
    if (card.id) await deleteEnvConfig(card.id)
    ElMessage.success('已删除')
    await loadEnvConfigs()
  } catch {
    // 接口错误已由统一错误出口提示
  }
}

// ========== 预置数据 & 配置中心 ==========
const configCenterLoading = ref(false)

async function handleSeed() {
  try {
    const result = await seedDevEnv()
    ElMessage.success(`预置成功: 环境 ${result.envCreated} 条, 常用SQL ${result.sqlCreated} 条`)
    await Promise.all([loadEnvConfigs(), loadFrequentSqls()])
  } catch (e: any) {
    ElMessage.error('预置失败: ' + (e?.response?.data?.error || e.message))
  }
}

async function handleLoadFromConfigCenter() {
  const env = currentEnv.value
  if (!env) {
    ElMessage.warning('请先选择环境')
    return
  }
  loadDbConfigFromConfigCenter()
}

// ========== 初始化 ==========
onMounted(async () => {
  await loadEnvConfigs()
  await loadFrequentSqls()
})
</script>

<style scoped>
.dev-env-view {
  }



.sql-section {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 16px;
  background: var(--el-fill-color-light);
}

.sql-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.truncate-text {
  display: inline-block;
  max-width: 350px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
