<template>
  <page-container title="需求归集">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- ==================== 各条线详情（快照排版 · 实时数据） ==================== -->
      <el-tab-pane
        v-for="(d, lineKey) in LINE_DATA"
        :key="lineKey"
        :label="lineLabel(lineKey)"
        :name="lineKey"
      >
        <!-- ===== TFS 实时归集 ===== -->
        <h3 class="sec-title" style="margin-top: 0">TFS 实时归集（按配置链接拉取）</h3>
        <div class="collect-toolbar">
          <el-button
            type="primary" size="small"
            :loading="collecting"
            :disabled="!(lineLinks[lineKey] || []).length && !skillConfigured(lineKey)"
            @click="collect(lineKey)"
          >
            <el-icon><Refresh /></el-icon> 手动刷新
          </el-button>
          <el-button size="small" @click="openLinkDialog(lineKey)">
            <el-icon><Setting /></el-icon> 配置数据源
          </el-button>
          <span class="filter-count">
            已配置 {{ (lineLinks[lineKey] || []).length }} 条 TFS 链接{{ skillConfigured(lineKey) ? ' · 技能数据源已配置' : '' }} ·
            口径：剩余需求 = 已建议+活动+已分析；待分析 = 已建议+活动；待开发 = 已分析
          </span>
        </div>

        <template v-if="(lineLinks[lineKey] || []).length > 0">
          <el-table :data="collectRows(lineKey)" border size="small" row-key="rowKey">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div v-if="row.remainItems && row.remainItems.length" class="remain-wrap">
                  <div class="remain-title">未完结工单明细（{{ row.remainItems.length }} 条）</div>
                  <el-table :data="row.remainItems" size="small" max-height="320" border>
                    <el-table-column prop="id" label="ID" width="90" />
                    <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
                    <el-table-column prop="type" label="类型" width="100" />
                    <el-table-column prop="state" label="状态" width="90" />
                    <el-table-column prop="customerName" label="客户" min-width="140" show-overflow-tooltip />
                    <el-table-column label="创建时间" width="110">
                      <template #default="{ row: it }">{{ (it.createdDate || '').slice(0, 10) }}</template>
                    </el-table-column>
                  </el-table>
                </div>
                <div v-else class="remain-empty">该链接下暂无未完结工单</div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="数据源链接" min-width="150" show-overflow-tooltip />
            <el-table-column prop="queryId" label="查询 GUID" width="240" show-overflow-tooltip>
              <template #default="{ row }">{{ row.isSummary ? '—' : row.queryId }}</template>
            </el-table-column>
            <el-table-column prop="total" label="工单总数" width="90" align="right" sortable />
            <el-table-column label="医院提出" width="140" align="right" sortable prop="hospital">
              <template #default="{ row }">
                <div>{{ row.hospital }}</div>
                <div class="split-sub">合并 {{ row.hospitalMerge }} · 非合并 {{ row.hospitalNonMerge }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="internal" label="内部优化" width="90" align="right" sortable />
            <el-table-column label="剩余需求" width="95" align="right" sortable prop="remainReq">
              <template #default="{ row }">
                <span :class="{ hot: row.remainReq > 0 && !row.isSummary }">{{ row.remainReq }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="remainSoft" label="剩余软质" width="95" align="right" sortable />
            <el-table-column prop="waitAnalysis" label="待分析数" width="95" align="right" sortable />
            <el-table-column prop="waitDev" label="待开发数" width="95" align="right" sortable />
            <el-table-column label="拉取状态" min-width="150">
              <template #default="{ row }">
                <el-tag v-if="row.isSummary" type="info" size="small" effect="plain">多条链接去重合计</el-tag>
                <el-tag v-else-if="!row.error" type="success" size="small" effect="plain">拉取成功</el-tag>
                <el-tooltip v-else :content="row.error" placement="top">
                  <el-tag type="danger" size="small" effect="plain">拉取失败</el-tag>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <el-card v-else shadow="never" class="no-link-card">
          <el-empty description="尚未配置 TFS 数据源链接，配置后按链接拉取工单进行归集" :image-size="70">
            <el-button type="primary" @click="openLinkDialog(lineKey)">配置 TFS 链接</el-button>
          </el-empty>
        </el-card>

        <el-empty
          v-if="(lineLinks[lineKey] || []).length > 0 && !a(lineKey).total"
          description="尚未拉取到数据：点击「手动刷新」或检查链接查询是否有效"
          :image-size="70"
        />

        <!-- ===== FPI 等级分布（技能数据源 · 功能点粒度） ===== -->
        <template v-if="skillConfigured(lineKey)">
          <h3 class="sec-title">功能点健康度</h3>
          <el-alert
            v-if="skillErrorMsg(lineKey)"
            :title="`技能调用失败：${skillErrorMsg(lineKey)}`"
            type="error" :closable="false" show-icon style="margin-bottom: 10px"
          />
          <template v-else-if="skillRows(lineKey).length">
            <div class="fpi-note">
              数据来源：技能「{{ skillToolLabel(lineKey) }}」返回的全部功能点数据（覆盖 {{ skillRows(lineKey).length }} 个功能点，含未产生工单的功能点）。
            </div>
            <div class="level-chips">
              <div
                v-for="meta in FPI_LEVELS" :key="meta.key"
                class="level-chip" :class="{ active: filtersOf(lineKey).fpi === meta.key }"
                :style="{ borderColor: meta.color }"
                @click="toggleFpiFilter(lineKey, meta.key)"
              >
                <span class="level-count" :style="{ color: meta.color }">{{ fpiLevelCount(lineKey, meta.key) }}</span>
                <span class="level-label">{{ meta.label }}</span>
              </div>
              <span class="level-hint">点击筛选 / 再点取消</span>
            </div>

            <!-- 筛选栏 -->
            <div class="filter-bar">
              <el-input v-model="filtersOf(lineKey).kw" placeholder="搜索编码 / 名称 / 模块" clearable style="width: 220px" @input="resetFpiPage(lineKey)">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-button :disabled="!filtersOf(lineKey).fpi && !filtersOf(lineKey).kw.trim()" @click="resetFilters(lineKey)">
                <el-icon><RefreshLeft /></el-icon> 重置
              </el-button>
              <span class="filter-count">筛选出 {{ filteredFpiRows(lineKey).length }} 条（功能点 {{ skillRows(lineKey).length }} 个 + 未匹配工单 {{ unmatchedTableRows(lineKey).length }} 条）</span>
            </div>

            <!-- FPI 明细表（功能点粒度，技能数据源，分页每页默认 20 条） -->
            <el-table :data="pagedFpiRows(lineKey)" border size="small" max-height="520">
              <el-table-column prop="code" label="功能点编码" width="170" show-overflow-tooltip />
              <el-table-column prop="name" label="功能点名称" min-width="180" show-overflow-tooltip />
              <el-table-column prop="module" label="所属模块" width="120" show-overflow-tooltip />
              <el-table-column prop="total" label="工单数" width="85" align="right" sortable />
              <el-table-column prop="req" label="需求数" width="110" align="right" sortable />
              <el-table-column prop="soft" label="软质数" width="100" align="right" sortable />
              <el-table-column prop="avgMonthly" label="月均工单" width="95" align="right" sortable />
              <el-table-column label="软质/需求" width="100" align="right" sortable prop="softRatioNum">
                <template #default="{ row }">{{ row.softRatioText }}</template>
              </el-table-column>
              <el-table-column label="趋势" width="100" align="right" sortable prop="trendPct">
                <template #default="{ row }">
                  <span v-if="row.trendPct !== null" :style="{ color: row.trendPct > 0 ? '#c0392b' : row.trendPct < 0 ? '#27865c' : '#909399' }">{{ row.trendText }}</span>
                  <span v-else>{{ row.trendText || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="等级" width="95" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row._unmatched" type="warning" effect="plain" size="small">未匹配</el-tag>
                  <el-tag
                    v-else-if="row.level"
                    :color="FPI_LEVEL_META[row.level].color" effect="dark" size="small" style="border: none"
                  >{{ FPI_LEVEL_META[row.level].label }}</el-tag>
                  <span v-else>—</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="130" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button v-if="!row._unmatched" link type="primary" size="small" @click="openFpiAnalysis(row)">合理性设计</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="fpi-pager">
              <el-pagination
                :current-page="fpiPageOf(lineKey)"
                :page-size="fpiSizeOf(lineKey)"
                :page-sizes="[20, 50, 100]"
                :total="filteredFpiRows(lineKey).length"
                layout="total, sizes, prev, pager, next"
                background
                @current-change="(p: number) => { fpiPage[String(lineKey)] = p }"
                @size-change="(s: number) => { fpiSize[String(lineKey)] = s; resetFpiPage(lineKey) }"
              />
            </div>
          </template>
          <el-empty
            v-else
            description="技能已配置但未返回功能点数据：检查工具参数与结果路径，或点击「手动刷新」重试"
            :image-size="70"
          />
        </template>
        <el-card v-else shadow="never" class="no-link-card">
          <el-empty description="尚未配置技能数据源：功能点 FPI 数据需通过技能（MCP 工具）获取" :image-size="70">
            <el-button type="primary" @click="openLinkDialog(lineKey)">配置技能数据源</el-button>
          </el-empty>
        </el-card>

        <!-- 月度趋势（实时，依赖 TFS 拉取数据） -->
        <template v-if="a(lineKey).total > 0">
          <h3 class="sec-title">月度工作量趋势（按创建时间；月份范围 = 拉取数据最早月 ~ 当前月，括号为去年同期）</h3>
          <div v-if="!a(lineKey).trendPrevCovered" class="fpi-note">
            当前拉取数据最早为 {{ a(lineKey).trend[0]?.month || '—' }}，未覆盖去年同期，括号暂无去年统计；如需去年对比，请在链接配置中改用包含去年工单的 TFS 查询。
          </div>
          <el-table :data="a(lineKey).trend" border size="small">
            <el-table-column prop="month" label="月份" width="100" />
            <el-table-column label="需求" align="center">
              <template #default="{ row }">{{ row.req }}<span class="prev">（{{ a(lineKey).trendPrevCovered ? row.reqPrev : '—' }}）</span></template>
            </el-table-column>
            <el-table-column label="软质" align="center">
              <template #default="{ row }">{{ row.soft }}<span class="prev">（{{ a(lineKey).trendPrevCovered ? row.softPrev : '—' }}）</span></template>
            </el-table-column>
            <el-table-column label="其他" align="center">
              <template #default="{ row }">{{ row.other }}<span class="prev">（{{ a(lineKey).trendPrevCovered ? row.otherPrev : '—' }}）</span></template>
            </el-table-column>
            <el-table-column label="合计" align="center">
              <template #default="{ row }">
                <b>{{ row.total }}</b><span class="prev">（{{ a(lineKey).trendPrevCovered ? row.totalPrev : '—' }}）</span>
              </template>
            </el-table-column>
          </el-table>
          <div class="concl-box">{{ a(lineKey).trendConcl }}</div>
        </template>

      </el-tab-pane>
    </el-tabs>

    <!-- ===== 数据源配置对话框（TFS 链接 + 技能） ===== -->
    <el-dialog
      v-model="linkDialogVisible"
      :title="`配置数据源 - ${lineLabel(editLine)}`"
      width="760px"
    >
      <el-tabs v-model="srcTab" type="border-card">
        <!-- ===== Tab 1：链接配置 ===== -->
        <el-tab-pane label="链接配置" name="links">
          <el-table :data="draftLinks" size="small" border>
            <el-table-column label="链接名称" width="220">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="如：库存需求" />
              </template>
            </el-table-column>
            <el-table-column label="TFS 查询 GUID">
              <template #default="{ row }">
                <el-input v-model="row.queryId" placeholder="粘贴 GUID 或完整查询 URL，自动提取 GUID" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="draftLinks.splice($index, 1)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button size="small" style="margin-top: 10px" @click="draftLinks.push({ name: '', queryId: '' })">
            + 添加链接
          </el-button>
        </el-tab-pane>

        <!-- ===== Tab 2：技能配置 ===== -->
        <el-tab-pane label="技能配置" name="skill">
          <el-form label-width="92px" size="small">
            <el-form-item label="技能来源">
              <el-radio-group v-model="draftSkillKind" :disabled="!draftSkillEnabled">
                <el-radio value="skill">平台技能（Skill 管理）</el-radio>
                <el-radio value="mcp">MCP 工具</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="启用技能">
              <el-switch v-model="draftSkillEnabled" />
            </el-form-item>
            <template v-if="draftSkillEnabled && draftSkillKind === 'skill'">
              <el-form-item label="技能名称">
                <el-select v-model="draftSkill.skillName" filterable placeholder="选择技能（来自 Skill 管理）" style="width: 100%" @change="onSkillNameChange">
                  <el-option v-for="s in platformSkills" :key="s.name" :label="s.name" :value="s.name">
                    <span>{{ s.name }}</span>
                    <span style="float: right; color: #909399; font-size: 12px; max-width: 340px; overflow: hidden; text-overflow: ellipsis">{{ s.description }}</span>
                  </el-option>
                </el-select>
                <div v-if="platformSkills.length === 0" class="config-hint">
                  未找到平台技能，请先在「Skill 管理」中创建或导入
                </div>
              </el-form-item>
              <el-form-item label="脚本入口">
                <el-select v-model="draftSkill.entry" filterable allow-create default-first-option clearable :loading="entryLoading"
                  placeholder="选择或输入如 scripts/xxx.js；留空自动探测（frontmatter entry: → scripts/）" style="width: 100%">
                  <el-option v-for="p in entryOptions" :key="p" :label="p" :value="p" />
                </el-select>
                <div v-if="entryHint" class="config-hint">{{ entryHint }}</div>
              </el-form-item>
              <el-form-item label="调用参数">
                <el-input v-model="draftSkill.argumentsText" type="textarea" :rows="2" placeholder='JSON，如 {"line": "inpatient"}；留空则传空对象' />
              </el-form-item>
              <el-form-item label="结果路径">
                <el-input v-model="draftSkill.resultPath" placeholder="可选：从返回 JSON 取数组的路径，留空自动识别" />
              </el-form-item>
              <el-form-item>
                <el-button size="small" :loading="skillTesting" :disabled="!draftSkill.skillName" @click="testSkillCall">测试调用</el-button>
                <span v-if="skillTestInfo" class="filter-count" style="margin-left: 10px">{{ skillTestInfo }}</span>
              </el-form-item>
            </template>
            <template v-if="draftSkillEnabled && draftSkillKind === 'mcp'">
              <el-form-item label="MCP 服务器">
                <el-select v-model="draftSkill.serverId" placeholder="选择 MCP 服务器" style="width: 100%" @change="onSkillServerChange">
                  <el-option
                    v-for="s in mcpServers" :key="s.id"
                    :label="s.displayName || s.name" :value="s.id"
                  >
                    <span>{{ s.displayName || s.name }}</span>
                    <span style="float: right; color: #909399; font-size: 12px">{{ s.status }}</span>
                  </el-option>
                </el-select>
                <div v-if="mcpServers.length === 0" class="config-hint">
                  未找到可用 MCP 服务器，请先在「MCP 管理」中注册并启动
                </div>
              </el-form-item>
              <el-form-item label="工具名称">
                <el-select
                  v-model="draftSkill.toolName"
                  filterable placeholder="选择或输入工具名"
                  :loading="mcpToolsLoading" style="width: 100%"
                >
                  <el-option v-for="t in mcpTools" :key="t.name" :label="t.name" :value="t.name">
                    <span>{{ t.name }}</span>
                    <span style="float: right; color: #909399; font-size: 12px; max-width: 380px; overflow: hidden; text-overflow: ellipsis">{{ t.description }}</span>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-collapse class="skill-advanced">
                <el-collapse-item name="adv" title="高级选项">
                  <el-form-item label="调用参数">
                    <el-input v-model="draftSkill.argumentsText" type="textarea" :rows="2" placeholder='JSON，如 {"line": "inpatient"}；留空则不传参' />
                  </el-form-item>
                  <el-form-item label="结果路径">
                    <el-input v-model="draftSkill.resultPath" placeholder="可选：从返回值取数组的路径，留空自动识别" />
                  </el-form-item>
                </el-collapse-item>
              </el-collapse>
              <el-form-item>
                <el-button size="small" :loading="skillTesting" :disabled="!draftSkill.serverId || !draftSkill.toolName" @click="testSkillCall">测试调用</el-button>
                <span v-if="skillTestInfo" class="filter-count" style="margin-left: 10px">{{ skillTestInfo }}</span>
              </el-form-item>
            </template>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="linkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSources">保存并归集</el-button>
      </template>
    </el-dialog>

    <!-- 合理性设计抽屉：需求 + 软质 + 技能分析 -->
    <el-drawer
      v-model="fpiAnalysisVisible"
      :title="`合理性设计 — ${fpiAnalysisRow?.name || ''}`"
      size="1240px"
      @close="closeFpiAnalysis"
    >
      <div v-if="fpiAnalysisRow" class="fpi-analysis-meta">
        <el-tag size="small" effect="plain">{{ fpiAnalysisRow.code || '无编码' }}</el-tag>
        <el-tag
          v-if="fpiAnalysisRow.level" size="small" effect="dark"
          :color="FPI_LEVEL_META[fpiAnalysisRow.level].color" style="border: none"
        >{{ FPI_LEVEL_META[fpiAnalysisRow.level].label }}</el-tag>
        <span class="filter-count">FPI {{ fpiAnalysisRow.fpi ?? '—' }} · 工单 {{ fpiAnalysisRow.total ?? '—' }} · 需求 {{ fpiAnalysisRow.req ?? '—' }} · 软质 {{ fpiAnalysisRow.soft ?? '—' }} · 趋势 {{ fpiAnalysisRow.trendText || '—' }}</span>
      </div>

      <!-- 三段内容以 Tab 展示 -->
      <el-tabs v-if="fpiAnalysisRow" v-model="fpiAnalysisTab">
        <el-tab-pane :label="`需求（${analysisReqItems(fpiAnalysisRow).length}）`" name="req">
          <el-table :data="analysisReqItems(fpiAnalysisRow)" border size="small" max-height="320">
            <el-table-column prop="id" label="工单号" width="100" />
            <el-table-column prop="title" label="标题" min-width="300" show-overflow-tooltip />
            <el-table-column prop="state" label="状态" width="95" />
            <el-table-column label="创建时间" width="110" align="center">
              <template #default="{ row }">{{ (row.createdDate || '').slice(0, 10) || '—' }}</template>
            </el-table-column>
            <template #empty>暂无数据（旧缓存无工单明细，手动刷新归集后展示）</template>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="`软质（${analysisSoftItems(fpiAnalysisRow).length}）`" name="soft">
          <el-table :data="analysisSoftItems(fpiAnalysisRow)" border size="small" max-height="320">
            <el-table-column prop="id" label="工单号" width="100" />
            <el-table-column prop="title" label="标题" min-width="300" show-overflow-tooltip />
            <el-table-column prop="state" label="状态" width="95" />
            <el-table-column label="创建时间" width="110" align="center">
              <template #default="{ row }">{{ (row.createdDate || '').slice(0, 10) || '—' }}</template>
            </el-table-column>
            <template #empty>暂无数据（旧缓存无工单明细，手动刷新归集后展示）</template>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="合理性设计分析" name="analysis">
          <div class="ana-cfg-bar">
            <el-select v-model="anaCfg.skillName" filterable clearable placeholder="选择分析技能（平台技能）" style="width: 250px" @change="persistAnaCfg">
              <el-option v-for="s in platformSkills" :key="s.name" :label="s.name" :value="s.name" />
            </el-select>
            <el-input v-model="anaCfg.entry" placeholder="脚本入口（留空自动探测）" style="width: 190px" @change="persistAnaCfg" />
            <el-button type="primary" :loading="fpiAnalyzing" :disabled="!anaCfg.skillName" @click="runFpiAnalysis">执行分析</el-button>
          </div>
          <el-input
            v-model="anaCfg.argumentsText" type="textarea" :rows="2"
            placeholder="调用参数 JSON（选填；执行时会自动附加 fp 功能点数据与 reqItems/softItems 工单明细）"
            @change="persistAnaCfg"
          />
          <template v-if="fpiReportParsed">
            <div class="fpi-report-head">
              <div class="fpi-report-head-info">
                <div class="fpi-report-title">{{ fpiReportParsed.meta.title }}</div>
                <div class="fpi-report-tags">
                  <span class="fpi-tag fpi-tag-mono">{{ fpiReportParsed.meta.code }}</span>
                  <span class="fpi-tag">模块 {{ fpiReportParsed.meta.module }}</span>
                </div>
              </div>
              <div class="fpi-report-kpis">
                <div v-for="k in fpiReportParsed.meta.kpis" :key="k.label" class="fpi-kpi" :class="'tone-' + k.tone">
                  <div class="fpi-kpi-label">{{ k.label }}</div>
                  <div class="fpi-kpi-value">{{ k.value }}</div>
                  <div class="fpi-kpi-sub">{{ k.sub }}</div>
                </div>
              </div>
            </div>
            <div class="fpi-report-toc">
              <span class="fpi-toc-label">目录</span>
              <button
                v-for="(c, i) in fpiReportParsed.meta.chapters" :key="c" class="fpi-toc-pill"
                :style="{ color: FPI_CHAPTER_COLORS[i]?.fg, background: FPI_CHAPTER_COLORS[i]?.bg }"
                @click="scrollToChapter(i)"
              >{{ c }}</button>
            </div>
            <div class="fpi-verdict" :class="'v-' + fpiReportParsed.meta.verdict.tone">
              <div class="fpi-verdict-head">
                <strong>功能点级判定：{{ fpiReportParsed.meta.verdict.text }}</strong>
                <span class="fpi-verdict-cause">根因主导：{{ fpiReportParsed.meta.verdict.cause }}</span>
              </div>
              <div class="fpi-verdict-detail">{{ fpiReportParsed.meta.verdict.detail }}</div>
            </div>
            <div class="fpi-report-metrics">
              <div v-for="mc in fpiReportParsed.meta.metrics" :key="mc.label" class="fpi-metric-card">
                <div class="fpi-mc-label">{{ mc.label }}</div>
                <div class="fpi-mc-value">{{ mc.value }}</div>
                <div class="fpi-mc-sub">{{ mc.sub }}</div>
              </div>
            </div>
          </template>
          <div
            v-loading="fpiAnalyzing && !fpiAnalysisText"
            element-loading-text="技能正在分析…"
            class="fpi-analysis-body markdown-body"
            v-html="renderMarkdown(fpiReportParsed ? fpiReportParsed.body : (fpiAnalysisText || ''))"
          />
          <div v-if="fpiAnalyzing && fpiAnalysisText" class="fpi-analysis-streaming">▍技能正在输出…</div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button size="small" :loading="fpiAnalyzing" :disabled="!fpiAnalysisRow" @click="runFpiAnalysis">重新分析</el-button>
        <el-button size="small" @click="fpiAnalysisVisible = false">关闭</el-button>
      </template>
    </el-drawer>
  </page-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { Search, RefreshLeft, Refresh, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  PRODUCT_LINES, LINE_DATA, FPI_LEVEL_META,
  type FpiLevel
} from '@/data/reqCollectData'
import { tfsApi, type TfsWorkItem } from '@/api/tfs'
import { mcpApi, type McpServer, type McpToolInfo } from '@/api/mcp'
import { useMarkdown } from '@/composables/useMarkdown'
import { skillApi } from '@/api/skill'

const activeTab = ref('inpatient')

function lineLabel(key: string) {
  return PRODUCT_LINES.find(l => l.key === key)?.label ?? key
}

// ============================================================
// TFS 实时归集：链接配置 + 拉取 + 聚合
// ============================================================

interface TfsLink { name: string; queryId: string }
interface LinkResult extends TfsLink { items: TfsWorkItem[]; error: string }

const LINE_KEYS = ['inpatient', 'outpatient', 'emergency'] as const
const LS_LINKS_KEY = 'reqcollect.links.v1'

/** 每条线配置的 TFS 查询链接（持久化 localStorage） */
const lineLinks = reactive<Record<string, TfsLink[]>>({ inpatient: [], outpatient: [], emergency: [] })
/** 每条线最近一次归集的拉取结果（与链接顺序对应） */
const linkResults = reactive<Record<string, LinkResult[]>>({ inpatient: [], outpatient: [], emergency: [] })
const collecting = ref(false)
const collectedLines = new Set<string>()

function loadLinks() {
  try {
    const raw = localStorage.getItem(LS_LINKS_KEY)
    if (!raw) return
    const o = JSON.parse(raw)
    for (const k of LINE_KEYS) {
      if (Array.isArray(o[k])) {
        lineLinks[k] = o[k].filter((l: any) => l && (l.queryId || l.name))
      }
    }
  } catch { /* 忽略损坏的本地配置 */ }
}

function persistLinks() {
  localStorage.setItem(LS_LINKS_KEY, JSON.stringify(lineLinks))
}

// ---- 技能数据源（功能点 FPI 数据，经平台技能或 MCP 工具获取） ----
/** kind='skill'：平台技能（Skill 管理，经 /api/skills/{name}/exec 执行脚本）
 *  kind='mcp'：MCP 工具（经 /api/mcp/servers/{id}/tools/{tool} 调用） */
interface SkillSource {
  kind: 'skill' | 'mcp'
  skillName: string
  entry: string
  serverId: number
  toolName: string
  argumentsText: string
  resultPath: string
}
const LS_SKILL_KEY = 'reqcollect.skills.v1'

/** 每条线配置的技能数据源（null = 未启用） */
const lineSkills = reactive<Record<string, SkillSource | null>>({ inpatient: null, outpatient: null, emergency: null })
/** 每条线最近一次技能调用解析出的功能点行 */
interface FpiSkillRow {
  code: string
  name: string
  module: string
  total: number | null
  req: number | null
  soft: number | null
  avgMonthly: number | null
  softRatioNum: number | null
  softRatioText: string
  trendText: string
  trendPct: number | null
  fpi: number | null
  level: FpiLevel | ''
  /** 未匹配功能点的工单行（功能点列显示 -） */
  _unmatched?: boolean
  _title?: string
  _state?: string
  _kind?: string
  /** 该功能点/工单行关联的工单明细（技能 items 或未匹配单条） */
  items?: FpiWorkItemRef[]
}
/** 功能点下挂的工单明细（技能 JSON 输出 items） */
interface FpiWorkItemRef {
  id: string | number
  title: string
  state?: string
  type?: string
  reqType?: string
  createdDate?: string
}
/** 技能返回的未匹配功能点汇总（需求=建议新增、软质=模块级归类） */
interface FpiUnmatched {
  req: number
  soft: number
  total: number
  softByModule: { module: string; count: number }[]
  samples: { id: string; title: string; kind: string; module: string }[]
  reqItems?: { id: string; title: string; state: string; module: string; suggestedCode: string }[]
  softItems?: { id: string; title: string; state: string; module: string }[]
}
interface SkillResult { rows: FpiSkillRow[]; error: string; toolLabel: string; unmatched?: FpiUnmatched }
const skillResults = reactive<Record<string, SkillResult | null>>({ inpatient: null, outpatient: null, emergency: null })

const { renderMarkdown } = useMarkdown()

// ---- 功能点健康度分析（AI 流式） ----
const fpiAnalysisVisible = ref(false)
const fpiAnalyzing = ref(false)
const fpiAnalysisText = ref('')
const fpiAnalysisRow = ref<FpiSkillRow | null>(null)

// ===== 深挖报告结构化渲染（fpd-meta 数据块 → 卡片组件） =====
interface FpiReportMeta {
  title: string; code: string; module: string
  kpis: { label: string; value: string; sub: string; tone: 'danger' | 'warn' | 'neutral' }[]
  verdict: { tone: 'danger' | 'warn' | 'ok'; text: string; cause: string; detail: string }
  metrics: { label: string; value: string; sub: string }[]
  chapters: string[]
}
const FPI_CHAPTER_COLORS = [
  { fg: '#185FA5', bg: '#E6F1FB' },
  { fg: '#A32D2D', bg: '#FCEBEB' },
  { fg: '#3B6D11', bg: '#EAF3DE' },
  { fg: '#534AB7', bg: '#EEEDFE' }
]
const fpiReportParsed = computed(() => {
  const text = fpiAnalysisText.value || ''
  const m = text.match(/^```fpd-meta\s*\n([\s\S]*?)\n```/)
  if (!m) return null
  try {
    const meta = JSON.parse(m[1]) as FpiReportMeta
    if (!meta || !meta.verdict || !Array.isArray(meta.chapters) || !meta.chapters.length) return null
    return { meta, body: text.slice(m[0].length).trim() }
  } catch { return null }
})
function scrollToChapter(i: number) {
  const host = document.querySelector('.fpi-analysis-body')
  if (!host) return
  const hs = host.querySelectorAll('h2')
  hs[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ===== 深挖报告 mermaid 流程图渲染（代码块 → SVG 图；按需动态加载，不拖慢页面首屏） =====
type MermaidApi = { initialize: (cfg: unknown) => void; render: (id: string, code: string) => Promise<{ svg: string }> }
let mermaidApi: MermaidApi | null = null
async function ensureMermaid(): Promise<MermaidApi | null> {
  if (mermaidApi) return mermaidApi
  try {
    const mod = await import('mermaid')
    const m = (mod.default || mod) as MermaidApi
    m.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'base',
      themeVariables: {
        fontSize: '13px',
        primaryColor: '#E6F1FB',
        primaryBorderColor: '#185FA5',
        primaryTextColor: '#1F2D3D',
        lineColor: '#909399',
        secondaryColor: '#EAF3DE',
        tertiaryColor: '#F5F7FA',
        noteBkgColor: '#FAEEDA',
        noteBorderColor: '#EF9F27',
        actorBkg: '#E6F1FB',
        actorBorder: '#185FA5',
        actorTextColor: '#1F2D3D',
        signalColor: '#606266',
        signalTextColor: '#606266'
      },
      flowchart: { curve: 'basis', padding: 12 },
      sequence: { actorMargin: 40, boxMargin: 8 }
    })
    mermaidApi = m
    return m
  } catch (e) { return null /* 加载失败降级保留代码块 */ }
}
let fpiMmdSeq = 0
async function renderFpiMermaid() {
  const host = document.querySelector('.fpi-analysis-body')
  if (!host) return
  const wraps = host.querySelectorAll('.code-block-wrapper')
  let hasMmd = false
  for (const w of Array.from(wraps)) {
    if (w.getAttribute('data-mmd') === '1') continue
    const lang = w.querySelector('.code-lang')?.textContent?.trim()
    if (lang === 'mermaid' && (w.querySelector('pre code')?.textContent || '').trim()) { hasMmd = true; break }
  }
  if (!hasMmd) return
  const m = await ensureMermaid()
  if (!m) return
  for (const w of Array.from(wraps)) {
    if (w.getAttribute('data-mmd') === '1') continue
    const lang = w.querySelector('.code-lang')?.textContent?.trim()
    if (lang !== 'mermaid') continue
    const code = w.querySelector('pre code')?.textContent || ''
    if (!code.trim()) continue
    w.setAttribute('data-mmd', '1')
    try {
      const { svg } = await m.render(`fpi-mmd-${Date.now()}-${fpiMmdSeq++}`, code)
      const div = document.createElement('div')
      div.className = 'fpi-mermaid'
      div.innerHTML = svg
      w.replaceWith(div)
    } catch { w.removeAttribute('data-mmd') /* 渲染失败保留原代码块 */ }
  }
}
watch([fpiAnalysisText, fpiAnalysisVisible], () => { nextTick(renderFpiMermaid) })
// ===== 合理性设计分析：技能配置（localStorage 持久化） =====
const LS_ANA_KEY = 'reqcollect.analysis.v1'
const anaCfg = reactive({ skillName: '', entry: '', argumentsText: '' })
function loadAnaCfg() {
  try {
    const raw = localStorage.getItem(LS_ANA_KEY)
    if (raw) Object.assign(anaCfg, JSON.parse(raw))
  } catch { /* 忽略损坏的缓存 */ }
}
function persistAnaCfg() {
  try { localStorage.setItem(LS_ANA_KEY, JSON.stringify(anaCfg)) } catch { /* 忽略容量错误 */ }
}

function openFpiAnalysis(row: FpiSkillRow) {
  fpiAnalysisRow.value = row
  fpiAnalysisTab.value = 'analysis' // 打开时默认展示合理性设计分析
  fpiAnalysisVisible.value = true
  loadPlatformSkills()
  if (anaCfg.skillName) runFpiAnalysis()
  else fpiAnalysisText.value = '> 请先在上方选择用于合理性设计分析的平台技能，然后点击「执行分析」。'
}

// ===== 合理性设计对话框：需求/软件治理列表 =====
const fpiAnalysisTab = ref('analysis')
function isSoftRef(x: FpiWorkItemRef): boolean {
  return x.reqType === '软件质量' || x.reqType === '软质' || x.type === '软件质量' || x.type === 'Bug'
}
function analysisReqItems(row: FpiSkillRow | null): FpiWorkItemRef[] {
  return (row?.items || []).filter(x => !isSoftRef(x))
}
function analysisSoftItems(row: FpiSkillRow | null): FpiWorkItemRef[] {
  return (row?.items || []).filter(x => isSoftRef(x))
}

/** 触发分析技能执行合理性设计分析：自动附加功能点数据（fp/reqItems/softItems），stdout（Markdown）作为分析内容 */
async function runFpiAnalysis() {
  const row = fpiAnalysisRow.value
  if (!row) return
  if (!anaCfg.skillName) {
    fpiAnalysisText.value = '> 请先在上方选择用于合理性设计分析的平台技能，然后点击「执行分析」。'
    return
  }
  fpiAnalyzing.value = true
  fpiAnalysisText.value = ''
  try {
    const args: Record<string, unknown> = parseArgsText(anaCfg.argumentsText)
    args.fp = {
      code: row.code, name: row.name, module: row.module,
      total: row.total, req: row.req, soft: row.soft,
      avgMonthly: row.avgMonthly, softRatio: row.softRatioNum,
      trend: row.trendText, fpi: row.fpi, level: row.level || undefined
    }
    args.reqItems = analysisReqItems(row)
    args.softItems = analysisSoftItems(row)
    const res = await skillApi.executeSkill(anaCfg.skillName, {
      entry: anaCfg.entry || undefined,
      args,
      timeoutMs: 300000
    })
    if (!res.success) {
      fpiAnalysisText.value = `> ⚠ 技能执行失败（exit=${res.exitCode ?? '?'}）\n\n\`\`\`\n${(res.stderr || res.stdout || '无输出').slice(-800)}\n\`\`\``
      return
    }
    const out = (res.stdout || '').trim()
    fpiAnalysisText.value = out || '> ⚠ 技能未返回分析内容（stdout 为空，检查脚本输出）'
  } catch (e: any) {
    fpiAnalysisText.value = `> ⚠ 分析失败：${e?.response?.data?.error || e?.message || '未知错误'}`
  } finally {
    fpiAnalyzing.value = false
  }
}

function closeFpiAnalysis() {
  fpiAnalyzing.value = false
}

function skillConfigured(lineKey: string | number): boolean {
  const s = lineSkills[String(lineKey)]
  if (!s) return false
  return s.kind === 'mcp' ? !!(s.serverId && s.toolName) : !!s.skillName
}
function skillRows(lineKey: string | number): FpiSkillRow[] {
  return skillResults[String(lineKey)]?.rows || []
}
function skillErrorMsg(lineKey: string | number): string {
  return skillResults[String(lineKey)]?.error || ''
}
function skillToolLabel(lineKey: string | number): string {
  return skillResults[String(lineKey)]?.toolLabel || '—'
}
function unmatchedOf(lineKey: string | number): FpiUnmatched | undefined {
  return skillResults[String(lineKey)]?.unmatched
}

function loadSkills() {
  try {
    const raw = localStorage.getItem(LS_SKILL_KEY)
    if (!raw) return
    const o = JSON.parse(raw)
    for (const k of LINE_KEYS) {
      if (o[k] && typeof o[k] === 'object') {
        const kind: 'skill' | 'mcp' = o[k].kind === 'mcp' ? 'mcp' : 'skill'
        // 旧版配置（无 kind 但有 serverId）视为 MCP 来源
        const resolved: 'skill' | 'mcp' = o[k].kind ? kind : (o[k].serverId ? 'mcp' : 'skill')
        lineSkills[k] = {
          kind: resolved,
          skillName: String(o[k].skillName || ''),
          entry: String(o[k].entry || ''),
          serverId: Number(o[k].serverId || 0),
          toolName: String(o[k].toolName || ''),
          argumentsText: String(o[k].argumentsText || '{}'),
          resultPath: String(o[k].resultPath || '')
        }
      }
    }
  } catch { /* 忽略损坏的本地配置 */ }
}

function persistSkills() {
  localStorage.setItem(LS_SKILL_KEY, JSON.stringify(lineSkills))
}

/** 归集结果缓存：页面加载/切 Tab 时展示上一次手动刷新的数据，不自动拉取 */
const LS_RESULT_KEY = 'reqcollect.results.v1'

function persistResults() {
  try {
    // 描述/复现步骤截断，防止超出 localStorage 容量
    const trimItems = (items: TfsWorkItem[]) => (items || []).map(it => ({
      ...it,
      description: (it.description || '').slice(0, 1000),
      reproSteps: (it.reproSteps || '').slice(0, 1000)
    }))
    const snapshot: Record<string, { linkResults: LinkResult[]; skill: SkillResult | null }> = {}
    for (const k of LINE_KEYS) {
      snapshot[k] = {
        linkResults: (linkResults[k] || []).map(r => ({ ...r, items: trimItems(r.items) })),
        skill: skillResults[k]
      }
    }
    localStorage.setItem(LS_RESULT_KEY, JSON.stringify({ collectedLines: [...collectedLines], snapshot }))
  } catch { /* 容量不足时忽略缓存写入 */ }
}

function loadResults() {
  try {
    const raw = localStorage.getItem(LS_RESULT_KEY)
    if (!raw) return
    const o = JSON.parse(raw)
    const saved: string[] = o.collectedLines || []
    for (const k of LINE_KEYS) {
      const s = o.snapshot?.[k]
      if (!s) continue
      if (Array.isArray(s.linkResults)) linkResults[k] = s.linkResults
      if (s.skill && typeof s.skill === 'object') skillResults[k] = s.skill
      if (saved.includes(k)) collectedLines.add(k)
    }
  } catch { /* 忽略损坏的缓存 */ }
}

onMounted(() => {
  loadLinks()
  loadSkills()
  loadResults() // 仅恢复上次归集结果，不自动拉取
  loadAnaCfg() // 恢复合理性设计分析技能配置
})

/** 切 Tab：仅展示该线上一次归集的数据（缓存），不自动拉取 */
function handleTabChange(_key: string | number) { /* 恢复逻辑由 loadResults 统一处理 */ }

async function collect(lineKey: string) {
  const links = lineLinks[lineKey] || []
  const hasSkill = skillConfigured(lineKey)
  if (!links.length && !hasSkill) return
  collecting.value = true
  try {
    // TFS 链接归集（工单级）
    if (links.length) {
      const results: LinkResult[] = []
      for (const link of links) {
        if (!link.queryId.trim()) {
          results.push({ ...link, items: [], error: '查询 GUID 为空' })
          continue
        }
        try {
          const items = await tfsApi.getWorkItemsByQuery(extractGuid(link.queryId))
          results.push({ ...link, items: Array.isArray(items) ? items : [], error: '' })
        } catch (e: any) {
          results.push({ ...link, items: [], error: e?.message || '拉取失败' })
        }
      }
      linkResults[lineKey] = results
    } else {
      linkResults[lineKey] = []
    }
    // 技能数据源归集（功能点 FPI 级）
    if (hasSkill) await fetchSkillFpi(lineKey)
    collectedLines.add(lineKey)
    persistResults() // 缓存本次归集结果，页面刷新/切 Tab 后仍展示
  } finally {
    collecting.value = false
  }
}

// ---- 口径定义 ----
/** 需求类工单类型（TFS 实测为「需求」，兼容报告口径「功能性的/接口」） */
const REQ_TYPES = ['需求', '功能性的', '接口']
/** 软质类工单类型 */
const SOFT_TYPES = ['软件质量', 'Bug']
/** 剩余需求状态（用户口径：已建议、活动、已分析） */
const OPEN_REQ_STATES = ['已建议', '活动', '已分析']
/** 完结态（用于剩余软质判定） */
const DONE_STATES = ['已解决', '已关闭', '已完成', '完成', '关闭', '已取消', '已删除', 'Resolved', 'Closed', 'Done', 'Removed']

interface LineMetrics { total: number; remainReq: number; remainSoft: number; waitAnalysis: number; waitDev: number }

/** 软质判定（双口径）：工单类型为软件质量/Bug，或需求性质字段（RequirementType）为软件质量/软质 */
function isSoftItem(it: TfsWorkItem): boolean {
  if (SOFT_TYPES.includes((it.type || '').trim())) return true
  const rt = (it.requirementType || '').trim()
  return rt === '软件质量' || rt === '软质'
}

/** 需求判定：工单类型属需求类且不是软质（RequirementType=软件质量的需求归软质） */
function isReqItem(it: TfsWorkItem): boolean {
  return REQ_TYPES.includes((it.type || '').trim()) && !isSoftItem(it)
}

function metricsOf(items: TfsWorkItem[]): LineMetrics {
  const m: LineMetrics = { total: items.length, remainReq: 0, remainSoft: 0, waitAnalysis: 0, waitDev: 0 }
  for (const it of items) {
    const state = (it.state || '').trim()
    if (isReqItem(it)) {
      if (OPEN_REQ_STATES.includes(state)) m.remainReq++
      if (state === '已建议' || state === '活动') m.waitAnalysis++
      if (state === '已分析') m.waitDev++
    } else if (isSoftItem(it)) {
      if (!DONE_STATES.includes(state)) m.remainSoft++
    }
  }
  return m
}

/** 未完结工单（用于展开明细） */
function remainItemsOf(items: TfsWorkItem[]): TfsWorkItem[] {
  return items.filter(it => !DONE_STATES.includes((it.state || '').trim()))
}

interface CollectRow extends LineMetrics {
  rowKey: string
  name: string
  queryId: string
  isSummary: boolean
  error: string
  remainItems: TfsWorkItem[]
  /** 医院提出（客户名称非空） */
  hospital: number
  /** 医院提出-合并类 */
  hospitalMerge: number
  /** 医院提出-非合并类 */
  hospitalNonMerge: number
  /** 内部优化（客户名称为空） */
  internal: number
}

/** 合并类工单命名规则（与 consolidate-requirements-v1 技能 MERGE_REGEX 保持一致） */
const MERGE_REGEX = /合并\d{3,}|@1?\d{6,}|（合并|合并多|合并代码|合代码|合并需求\d|合并需求至|合并需求：|合并【\d+】|克隆主数据|历史需求合并|合并升级|合并单|合并到版本|合并至版本|至\d{6}迭代|到\d{6}迭代|至\d{6}版本|至泰康\d/

/** 医院提出/内部优化口径：客户名称（Winning.Custom.Name）非空=医院提出，为空=内部优化；医院提出按标题命名规则区分合并类/非合并类 */
function sourceMetricsOf(items: TfsWorkItem[]) {
  const m = { hospital: 0, hospitalMerge: 0, hospitalNonMerge: 0, internal: 0 }
  for (const it of items) {
    if ((it.customerName || '').trim()) {
      m.hospital++
      if (MERGE_REGEX.test(it.title || '')) m.hospitalMerge++
      else m.hospitalNonMerge++
    } else {
      m.internal++
    }
  }
  return m
}

/** 跨链接去重后的全量工单（按 ID） */
function mergedItemsOf(lineKey: string): TfsWorkItem[] {
  const merged = new Map<number, TfsWorkItem>()
  for (const r of linkResults[lineKey] || []) {
    for (const it of r.items) if (!merged.has(it.id)) merged.set(it.id, it)
  }
  return [...merged.values()]
}

/** 归集列表行：每条链接一行 */
function collectRows(lineKey: string): CollectRow[] {
  const results = linkResults[lineKey] || []
  const rows: CollectRow[] = results.map((r, i) => ({
    rowKey: `link-${i}`,
    name: r.name || '未命名链接',
    queryId: r.queryId,
    isSummary: false,
    error: r.error,
    ...metricsOf(r.items),
    ...sourceMetricsOf(r.items),
    remainItems: remainItemsOf(r.items)
  }))
  return rows
}

// ---- 数据源配置对话框（TFS 链接 + 技能） ----
const linkDialogVisible = ref(false)
const editLine = ref('inpatient')
const srcTab = ref<'links' | 'skill'>('links')
const draftLinks = ref<TfsLink[]>([])
const draftSkillEnabled = ref(false)
const draftSkillKind = ref<'skill' | 'mcp'>('skill')
const draftSkill = reactive<SkillSource>({ kind: 'skill', skillName: '', entry: '', serverId: 0, toolName: '', argumentsText: '{}', resultPath: '' })

const mcpServers = ref<McpServer[]>([])
const mcpTools = ref<McpToolInfo[]>([])
const mcpToolsLoading = ref(false)
const skillTesting = ref(false)
const skillTestInfo = ref('')

/** 平台技能（Skill 管理）列表 */
interface PlatformSkill { name: string; description?: string }
const platformSkills = ref<PlatformSkill[]>([])

async function loadPlatformSkills() {
  try { platformSkills.value = await skillApi.listSkills() } catch { platformSkills.value = [] }
}

/** 脚本入口候选：选中技能后从技能详情 fileTree 提取可执行脚本清单 */
const entryOptions = ref<string[]>([])
const entryLoading = ref(false)
const entryHint = ref('')

function collectScriptPaths(nodes: any[] | undefined, out: string[]) {
  if (!nodes?.length) return
  for (const n of nodes) {
    if (n.type === 'directory') collectScriptPaths(n.children, out)
    else if (/\.(js|py|ps1|cmd|bat|sh)$/i.test(n.path || n.name || '')) out.push(n.path || n.name)
  }
}

async function loadEntryOptions(name: string, applyDefault = false) {
  entryOptions.value = []
  entryHint.value = ''
  if (!name) return
  entryLoading.value = true
  try {
    const d = await skillApi.getSkillDetail(name)
    const scripts: string[] = []
    collectScriptPaths(d.fileTree, scripts)
    entryOptions.value = scripts
    const fmEntry = String(d.frontmatter?.entry || '').trim()
    if (fmEntry) {
      entryHint.value = `SKILL.md 声明入口：${fmEntry}`
      if (!draftSkill.entry || applyDefault) draftSkill.entry = fmEntry
    } else if (applyDefault && scripts.length === 1) {
      draftSkill.entry = scripts[0]
    }
  } catch { /* 拉取失败时下拉为空，仍可手输 */ }
  finally { entryLoading.value = false }
}

function onSkillNameChange(name: string) {
  draftSkill.entry = ''
  loadEntryOptions(name, true)
}

/** 从粘贴内容提取查询 GUID：兼容完整 TFS 查询 URL（含 id= 参数或路径末段）与裸 GUID。
 *  直接粘贴整条 URL 会导致 TFS（ASP.NET）报「Request.Path 潜在危险值」而被拒，必须先提取。 */
const GUID_RE = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
function extractGuid(raw: string): string {
  const m = (raw || '').match(GUID_RE)
  return m ? m[0] : (raw || '').trim()
}

function openLinkDialog(lineKey: string) {
  editLine.value = lineKey
  srcTab.value = 'links'
  draftLinks.value = (lineLinks[lineKey] || []).map(l => ({ ...l }))
  if (!draftLinks.value.length) draftLinks.value = [{ name: '', queryId: '' }]
  const s = lineSkills[lineKey]
  draftSkillEnabled.value = !!s
  draftSkillKind.value = s?.kind || 'skill'
  draftSkill.kind = draftSkillKind.value
  draftSkill.skillName = s?.skillName || ''
  draftSkill.entry = s?.entry || ''
  draftSkill.serverId = s?.serverId || 0
  draftSkill.toolName = s?.toolName || ''
  draftSkill.argumentsText = s?.argumentsText || '{}'
  draftSkill.resultPath = s?.resultPath || ''
  if (draftSkillEnabled.value && draftSkillKind.value === 'mcp' && draftSkill.serverId) loadSkillTools(draftSkill.serverId, true)
  if (draftSkillEnabled.value && draftSkillKind.value === 'skill' && draftSkill.skillName) loadEntryOptions(draftSkill.skillName)
  loadMcpServers()
  loadPlatformSkills()
  linkDialogVisible.value = true
}

function saveSources() {
  const links = draftLinks.value
    .map(l => ({ name: (l.name || '').trim(), queryId: extractGuid(l.queryId || '') }))
    .filter(l => l.queryId || l.name)
  lineLinks[editLine.value] = links
  persistLinks()
  const kind = draftSkillKind.value
  const skillValid = draftSkillEnabled.value && (kind === 'mcp'
    ? !!(draftSkill.serverId && draftSkill.toolName)
    : !!draftSkill.skillName.trim())
  lineSkills[editLine.value] = skillValid
    ? {
        kind,
        skillName: draftSkill.skillName.trim(),
        entry: draftSkill.entry.trim(),
        serverId: kind === 'mcp' ? draftSkill.serverId : 0,
        toolName: kind === 'mcp' ? draftSkill.toolName : '',
        argumentsText: draftSkill.argumentsText.trim() || '{}',
        resultPath: draftSkill.resultPath.trim()
      }
    : null
  persistSkills()
  linkDialogVisible.value = false
  collectedLines.delete(editLine.value)
  if (links.length || skillConfigured(editLine.value)) collect(editLine.value)
  else {
    linkResults[editLine.value] = []
    skillResults[editLine.value] = null
  }
}

// ---- 技能（MCP 工具）调用与结果解析 ----
function parseArgsText(t: string): Record<string, any> {
  try {
    const v = JSON.parse(t || '{}')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  } catch { return {} }
}

/** 从技能返回值中取出记录数组：优先按 resultPath，其次识别常见包裹字段 */
function extractArray(raw: any, resultPath?: string): any[] {
  let node: any = raw
  if (resultPath && resultPath.trim()) {
    for (const seg of resultPath.split('.')) {
      const s = seg.trim()
      if (!s) continue
      node = node == null ? undefined : node[s]
    }
  }
  if (Array.isArray(node)) return node
  if (node && typeof node === 'object') {
    for (const k of ['items', 'data', 'value', 'results', 'list', 'rows', 'records', 'functionalPoints', 'fpiRows']) {
      if (Array.isArray(node[k])) return node[k]
    }
  }
  return []
}

/** 功能点字段别名 → 标准字段 */
const FPI_FIELD_ALIASES: Record<string, string[]> = {
  code: ['code', 'fp', 'fpCode', '编码', '功能点编码', 'functionPoint'],
  name: ['name', 'fpName', '名称', '功能点名称', 'title'],
  module: ['module', 'moduleName', '所属模块', '模块'],
  total: ['total', 'count', 'totalCount', '工单数'],
  req: ['req', 'reqCount', 'requirementCount', '需求数', '需求'],
  soft: ['soft', 'softCount', '软质数', '软质'],
  avgMonthly: ['avgMonthly', 'avgReq', 'monthlyAvg', 'avg', '月均工单', '月均', '月均需求'],
  softRatio: ['softRatio', 'softRatioNum', '软质比', '软质/需求', '软质需求比'],
  trend: ['trend', '趋势'],
  fpi: ['fpi', 'FPI', 'score', 'fpiScore'],
  level: ['level', '等级', 'healthLevel']
}

function pickField(raw: Record<string, any>, std: string): any {
  for (const a of FPI_FIELD_ALIASES[std] || [std]) {
    const v = raw[a]
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}

/** 等级归一：接受 danger/warn/watch/health 或 危险/预警/关注/健康；缺省按 FPI 分自动评级 */
function normalizeLevel(raw: any, fpi: number | null): FpiLevel | '' {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'danger' || s === '危险') return 'danger'
  if (s === 'warn' || s === 'warning' || s === '预警') return 'warn'
  if (s === 'watch' || s === '关注') return 'watch'
  if (s === 'health' || s === 'healthy' || s === '健康') return 'health'
  if (fpi !== null) return fpiLevelOf(fpi)
  return ''
}

/** 趋势文本 → 可排序数值（百分比；「↑↑ 封顶」按 999 处理） */
function trendPctOf(raw: any): number | null {
  if (raw === undefined || raw === null || raw === '') return null
  if (typeof raw === 'number') return raw
  const s = String(raw).trim()
  if (s.includes('封顶')) return 999
  const m = s.match(/[+-]?\d+(\.\d+)?\s*%/)
  if (m) return parseFloat(m[0])
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

/** 把技能返回的单条记录归一为 FPI 功能点行 */
function normalizeFpiRow(raw: any): FpiSkillRow {
  if (raw == null || typeof raw !== 'object') return { code: String(raw ?? ''), name: '', module: '', total: null, req: null, soft: null, avgMonthly: null, softRatioNum: null, softRatioText: '—', trendText: '', trendPct: null, fpi: null, level: '' }
  const num = (v: any): number | null => {
    if (v === undefined || v === null || v === '') return null
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.+-]/g, ''))
    return isNaN(n) ? null : n
  }
  const fpi = num(pickField(raw, 'fpi'))
  const softRatio = num(pickField(raw, 'softRatio'))
  const trendRaw = pickField(raw, 'trend')
  return {
    code: String(pickField(raw, 'code') ?? ''),
    name: String(pickField(raw, 'name') ?? ''),
    module: String(pickField(raw, 'module') ?? ''),
    total: num(pickField(raw, 'total')),
    req: num(pickField(raw, 'req')),
    soft: num(pickField(raw, 'soft')),
    avgMonthly: num(pickField(raw, 'avgMonthly')),
    softRatioNum: softRatio,
    softRatioText: softRatio === null ? '—' : (softRatio > 1e6 ? '∞' : softRatio.toFixed(2)),
    trendText: trendRaw === undefined ? '' : String(trendRaw),
    trendPct: trendPctOf(trendRaw),
    fpi,
    level: normalizeLevel(pickField(raw, 'level'), fpi),
    items: Array.isArray(raw.items)
      ? raw.items.map((x: any) => ({
          id: x?.id ?? '',
          title: String(x?.title ?? ''),
          state: x?.state ? String(x.state) : undefined,
          type: x?.type ? String(x.type) : undefined,
          reqType: x?.reqType ? String(x.reqType) : undefined,
          createdDate: x?.createdDate ? String(x.createdDate) : undefined
        }))
      : undefined
  }
}

async function loadMcpServers() {
  if (mcpServers.value.length) return
  try { mcpServers.value = await mcpApi.listServers() } catch { /* 列表加载失败不阻塞配置 */ }
}

async function loadSkillTools(serverId: number, keepTool = false) {
  mcpToolsLoading.value = true
  try {
    mcpTools.value = await mcpApi.getServerTools(serverId)
    if (!keepTool && !mcpTools.value.some(t => t.name === draftSkill.toolName)) draftSkill.toolName = ''
  } catch { mcpTools.value = [] } finally { mcpToolsLoading.value = false }
}

async function onSkillServerChange(id: number) {
  mcpTools.value = []
  if (!id) return
  draftSkill.toolName = ''
  await loadSkillTools(id)
}

async function testSkillCall() {
  skillTestInfo.value = ''
  skillTesting.value = true
  try {
    if (draftSkillKind.value === 'skill') {
      // 平台技能：执行脚本
      const res = await skillApi.executeSkill(draftSkill.skillName.trim(), {
        entry: draftSkill.entry.trim() || undefined,
        args: parseArgsText(draftSkill.argumentsText)
      })
      if (!res.success) {
        skillTestInfo.value = `执行失败（exit=${res.exitCode ?? '超时'}）：${(res.stderr || res.stdout || '无输出').slice(0, 300)}`
        return
      }
      const rows = extractArray(res.data ?? res.stdout, draftSkill.resultPath).map(normalizeFpiRow)
      skillTestInfo.value = rows.length
        ? `执行成功（${res.entry}，${res.durationMs}ms），解析出 ${rows.length} 个功能点（含编码的 ${rows.filter(r => r.code).length} 个）`
        : `执行成功（${res.entry}，${res.durationMs}ms），但未解析出功能点数组——请检查入口脚本输出或结果路径`
    } else {
      // MCP 工具：调用工具
      const raw = await mcpApi.callTool(draftSkill.serverId, draftSkill.toolName, parseArgsText(draftSkill.argumentsText))
      const rows = extractArray(raw, draftSkill.resultPath).map(normalizeFpiRow)
      skillTestInfo.value = rows.length
        ? `调用成功，解析出 ${rows.length} 个功能点（含编码的 ${rows.filter(r => r.code).length} 个）`
        : '调用成功，但未解析出功能点数组——请检查结果路径或返回结构'
    }
  } catch (e: any) {
    skillTestInfo.value = `调用失败：${e?.response?.data?.error || e?.message || '未知错误'}`
  } finally {
    skillTesting.value = false
  }
}

/** 导出技能生成的 MD 报告（{"md":true} 模式，stdout 即 MD 全文，前端下载）——按钮已隐藏，逻辑保留备用 */
// const exportingMd = reactive<Record<string, boolean>>({})
// async function exportMd(lineKey: string) {
//   const cfg = lineSkills[String(lineKey)]
//   if (!cfg || cfg.kind !== 'skill' || !cfg.skillName) { ElMessage.warning('导出 MD 需先配置平台技能数据源'); return }
//   exportingMd[lineKey] = true
//   try {
//     const args = parseArgsText(cfg.argumentsText) as Record<string, unknown>
//     args.md = true
//     args.line = lineKey // 强制按当前 tab 条线过滤，保证导出文档与 tab 产品对应
//     const res = await skillApi.executeSkill(cfg.skillName, { entry: cfg.entry || undefined, args, timeoutMs: 180000 })
//     if (!res.success) {
//       ElMessage.error(`技能执行失败：${(res.stderr || res.stdout || '无输出').slice(-200)}`)
//       return
//     }
//     const md = res.stdout || ''
//     if (!md.trim()) { ElMessage.error('技能未返回 MD 内容'); return }
//     const blob = new Blob(['\ufeff' + md], { type: 'text/markdown;charset=utf-8' })
//     const url = URL.createObjectURL(blob)
//     const a = document.createElement('a')
//     const d = new Date()
//     const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
//     a.href = url
//     a.download = `${lineLabel(lineKey)}需求归集-${dateStr}.md`
//     a.click()
//     URL.revokeObjectURL(url)
//     ElMessage.success(`已导出 MD（${(blob.size / 1024).toFixed(1)} KB）`)
//   } catch (e: any) {
//     ElMessage.error(e?.response?.data?.error || e?.message || '导出失败')
//   } finally {
//     exportingMd[lineKey] = false
//   }
// }

/** 归集时调用技能获取功能点 FPI 数据 */
async function fetchSkillFpi(lineKey: string) {
  const cfg = lineSkills[lineKey]
  if (!cfg) { skillResults[lineKey] = null; return }
  const isMcp = cfg.kind === 'mcp'
  if (isMcp && (!cfg.serverId || !cfg.toolName)) { skillResults[lineKey] = null; return }
  if (!isMcp && !cfg.skillName) { skillResults[lineKey] = null; return }
  const toolLabel = isMcp ? cfg.toolName : `${cfg.skillName} · ${cfg.entry || '自动入口'}`
  try {
    let raw: any
    if (isMcp) {
      raw = await mcpApi.callTool(cfg.serverId, cfg.toolName, parseArgsText(cfg.argumentsText))
    } else {
      const res = await skillApi.executeSkill(cfg.skillName, {
        entry: cfg.entry || undefined,
        args: parseArgsText(cfg.argumentsText)
      })
      if (!res.success) {
        skillResults[lineKey] = { rows: [], error: `执行失败（exit=${res.exitCode ?? '超时'}）：${(res.stderr || res.stdout || '无输出').slice(0, 300)}`, toolLabel }
        return
      }
      raw = res.data ?? res.stdout
    }
    const rows = extractArray(raw, cfg.resultPath).map(normalizeFpiRow)
    // 未匹配功能点汇总（技能输出 { rows, unmatched } 对象时携带）
    const unmatched: FpiUnmatched | undefined =
      raw && typeof raw === 'object' && !Array.isArray(raw) && (raw as any).unmatched ? (raw as any).unmatched : undefined
    skillResults[lineKey] = { rows, error: rows.length ? '' : '技能返回内容中未解析出功能点数组（检查脚本输出/结果路径）', toolLabel, unmatched }
  } catch (e: any) {
    skillResults[lineKey] = { rows: [], error: e?.response?.data?.error || e?.message || '技能调用失败', toolLabel }
  }
}

// ============================================================
// 实时分析引擎：快照排版的各区块均由拉取数据计算
// ============================================================

interface TrendRow { month: string; req: number; soft: number; other: number; total: number; reqPrev: number; softPrev: number; otherPrev: number; totalPrev: number }

interface Analysis {
  total: number
  req: number
  soft: number
  other: number
  otherRatio: string
  waitAnalysis: number
  waitDev: number
  funnel: { label: string; value: number; keep?: boolean }[]
  trend: TrendRow[]
  trendConcl: string
  /** 拉取数据是否覆盖去年同期（未覆盖时括号显示 —） */
  trendPrevCovered: boolean
}

/** 等级元数据（复用盘点报告的配色与命名） */
const FPI_LEVELS = (Object.keys(FPI_LEVEL_META) as FpiLevel[]).map(k => ({ key: k, ...FPI_LEVEL_META[k] }))

/** 实时 FPI 评级阈值（技能未返回等级时按 FPI 分自动评级） */
function fpiLevelOf(score: number): FpiLevel {
  if (score >= 75) return 'health'
  if (score >= 55) return 'watch'
  if (score >= 35) return 'warn'
  return 'danger'
}

/** 最近 N 个月的 YYYY-MM 键（含当月，新→旧） */
function recentMonths(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

function analyze(lineKey: string): Analysis {
  const items = mergedItemsOf(lineKey)
  const total = items.length
  const m = metricsOf(items)
  const req = items.filter(isReqItem).length
  const soft = items.filter(isSoftItem).length
  const other = total - req - soft

  // 归集漏斗（实时）：拉取原始 → 去重 → 未完结 → 剩余需求
  const rawTotal = (linkResults[lineKey] || []).reduce((s, r) => s + r.items.length, 0)
  const remain = remainItemsOf(items).length
  const funnel = [
    { label: '各链接拉取合计', value: rawTotal },
    { label: '跨链接去重', value: total },
    { label: '未完结工单', value: remain },
    { label: '剩余需求（已建议+活动+已分析）', value: m.remainReq, keep: true }
  ]

  // 月度分类计数（全条线，供趋势使用）
  const monthCls = new Map<string, { req: number; soft: number; other: number }>()
  for (const it of items) {
    const mk = (it.createdDate || '').slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(mk)) continue
    let mc = monthCls.get(mk)
    if (!mc) { mc = { req: 0, soft: 0, other: 0 }; monthCls.set(mk, mc) }
    if (isSoftItem(it)) mc.soft++
    else if (isReqItem(it)) mc.req++
    else mc.other++
  }

  // 月度趋势：从拉取数据的最早月份起，到当前月（旧→新），含去年同期
  const curKey = recentMonths(1)[0]
  const monthKeys = [...monthCls.keys()]
  const monthsAsc: string[] = []
  if (monthKeys.length) {
    const minKey = monthKeys.reduce((a, b) => (a < b ? a : b))
    const [sy, sm] = minKey.split('-').map(Number)
    const [ey, em] = curKey.split('-').map(Number)
    for (let y = sy, m = sm; y < ey || (y === ey && m <= em);) {
      monthsAsc.push(`${y}-${String(m).padStart(2, '0')}`)
      m++
      if (m > 12) { m = 1; y++ }
    }
  }
  const prevKeyOf = (mo: string) => {
    const [y, mm] = mo.split('-').map(Number)
    return `${y - 1}-${String(mm).padStart(2, '0')}`
  }
  const zero = { req: 0, soft: 0, other: 0 }
  const trend: TrendRow[] = monthsAsc.map(mo => {
    const c = monthCls.get(mo) || zero
    const p = monthCls.get(prevKeyOf(mo)) || zero
    return {
      month: mo,
      req: c.req, soft: c.soft, other: c.other, total: c.req + c.soft + c.other,
      reqPrev: p.req, softPrev: p.soft, otherPrev: p.other, totalPrev: p.req + p.soft + p.other
    }
  })

  // 自动结论
  let trendConcl = '—'
  const r3Keys = recentMonths(3)
  const p3Keys = recentMonths(6).slice(3)
  const r3 = r3Keys.reduce((s, k) => s + (monthCls.get(k)?.req ?? 0) + (monthCls.get(k)?.soft ?? 0) + (monthCls.get(k)?.other ?? 0), 0)
  const p3 = p3Keys.reduce((s, k) => s + (monthCls.get(k)?.req ?? 0) + (monthCls.get(k)?.soft ?? 0) + (monthCls.get(k)?.other ?? 0), 0)
  if (r3 || p3) {
    const pct = p3 > 0 ? Math.abs((r3 - p3) / p3 * 100).toFixed(0) : '—'
    const dir = r3 >= p3 ? '增长' : '回落'
    const peak = trend.reduce((a, b) => (b.total > a.total ? b : a), trend[0])
    trendConcl = `近 3 月新建 ${r3} 条，较前 3 月（${p3} 条）${dir}${p3 > 0 ? ` ${pct}%` : ''}；峰值月 ${peak.month}（${peak.total} 条）。`
  }

  // 拉取数据是否覆盖去年同期（决定括号显示真实去年统计还是 —）
  const trendPrevCovered = monthsAsc.some(mo => {
    const p = monthCls.get(prevKeyOf(mo))
    return !!p && (p.req + p.soft + p.other) > 0
  })

  return {
    total,
    req, soft, other,
    otherRatio: total ? `${(other / total * 100).toFixed(1)}%` : '—',
    waitAnalysis: m.waitAnalysis,
    waitDev: m.waitDev,
    funnel,
    trend,
    trendConcl,
    trendPrevCovered
  }
}

/** 各条线实时分析结果（响应式：linkResults 变化自动重算） */
const analysisMap = computed<Record<string, Analysis>>(() => {
  const m: Record<string, Analysis> = {}
  for (const k of LINE_KEYS) m[k] = analyze(k)
  return m
})

function a(lineKey: string | number): Analysis {
  return analysisMap.value[String(lineKey)]
}

// ---- 实时筛选（按条线独立） ----
interface ItemFilter { fpi: FpiLevel | ''; kw: string }
function emptyFilter(): ItemFilter { return { fpi: '', kw: '' } }
const filters = reactive<Record<string, ItemFilter>>({ inpatient: emptyFilter(), outpatient: emptyFilter(), emergency: emptyFilter() })

function filtersOf(lineKey: string | number): ItemFilter {
  const k = String(lineKey)
  if (!filters[k]) filters[k] = emptyFilter()
  return filters[k]
}

function toggleFpiFilter(lineKey: string | number, level: FpiLevel) {
  const f = filtersOf(lineKey)
  f.fpi = f.fpi === level ? '' : level
  resetFpiPage(lineKey)
}

function fpiLevelCount(lineKey: string | number, level: FpiLevel): number {
  return skillRows(lineKey).filter(r => r.level === level).length
}

/** 未匹配工单 → 明细表行（功能点编码/名称显示 -，等级列显示「未匹配」） */
function unmatchedTableRows(lineKey: string | number): FpiSkillRow[] {
  const u = unmatchedOf(lineKey)
  if (!u) return []
  const mk = (id: string | number, title: string, kind: string, state: string, module: string, req: number, soft: number): FpiSkillRow => ({
    code: '-', name: '-', module: module || '—',
    total: 1, req, soft, avgMonthly: null, softRatioNum: null, softRatioText: '—',
    trendText: '', trendPct: null, fpi: null, level: '',
    _unmatched: true, _title: `#${id} ${title}`, _state: state, _kind: kind,
    items: [{ id, title, state, reqType: kind === '软质' ? '软件质量' : '功能性的' }]
  })
  return [
    ...(u.reqItems || []).map(x => mk(x.id, x.title, '需求', x.state, x.module, 1, 0)),
    ...(u.softItems || []).map(x => mk(x.id, x.title, '软质', x.state, x.module, 0, 1))
  ]
}

function filteredFpiRows(lineKey: string | number): FpiSkillRow[] {
  const f = filtersOf(lineKey)
  const kw = f.kw.trim().toLowerCase()
  return [...skillRows(lineKey), ...unmatchedTableRows(lineKey)].filter(r => {
    if (f.fpi && r.level !== f.fpi) return false // 未匹配行无等级，等级筛选时自动排除
    if (kw && !(`${r.code} ${r.name} ${r.module} ${r._title || ''}`.toLowerCase().includes(kw))) return false
    return true
  }).sort((x, y) => (x.fpi ?? 999) - (y.fpi ?? 999)) // 默认按 FPI 升序（未匹配行排最后）；分页下排序需在数据侧完成
}

// ---- 功能点明细分页（每页默认 20 条） ----
const fpiPage = reactive<Record<string, number>>({})
const fpiSize = reactive<Record<string, number>>({})

function fpiPageOf(lineKey: string | number): number {
  return fpiPage[String(lineKey)] || 1
}
function fpiSizeOf(lineKey: string | number): number {
  return fpiSize[String(lineKey)] || 20
}
function pagedFpiRows(lineKey: string | number): FpiSkillRow[] {
  const rows = filteredFpiRows(lineKey)
  const size = fpiSizeOf(lineKey)
  const maxPage = Math.max(1, Math.ceil(rows.length / size))
  const page = Math.min(Math.max(fpiPageOf(lineKey), 1), maxPage)
  return rows.slice((page - 1) * size, page * size)
}
function resetFpiPage(lineKey: string | number) {
  fpiPage[String(lineKey)] = 1
}

function resetFilters(lineKey: string | number) {
  filters[String(lineKey)] = emptyFilter()
  resetFpiPage(lineKey)
}
</script>

<style scoped>
/* ---- 实时归集 ---- */
.collect-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.hot { color: var(--seal, #409eff); font-weight: 700; }
.no-link-card { margin-bottom: 8px; }
.remain-wrap { padding: 4px 12px; }
.remain-title { font-size: 12px; color: #909399; margin-bottom: 6px; }
.remain-empty { font-size: 12px; color: #c0c4cc; padding: 8px 0; }

/* ---- 区块标题 ---- */
.sec-title { font-size: 14px; margin: 20px 0 10px; color: #303133; }
.fpi-note { font-size: 12px; color: #909399; line-height: 1.8; margin: -4px 0 10px; }
.fpi-pager { display: flex; justify-content: flex-end; margin-top: 10px; }

/* ---- 功能点健康度分析对话框 ---- */
.fpi-analysis-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.wi-sec-title { font-size: 13px; font-weight: 600; color: #303133; margin: 14px 0 8px; }
.ana-cfg-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.fpi-analysis-body { margin-top: 8px; min-height: 80px; }

/* ---- 深挖报告 Markdown 排版（:deep 穿透 v-html） ---- */
.fpi-analysis-body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 13.5px; line-height: 1.85; color: #303133;
  letter-spacing: 0.2px; font-variant-numeric: tabular-nums;
}
.fpi-analysis-body :deep(h1) {
  font-size: 20px; font-weight: 600; color: #1f2d3d; letter-spacing: 0.3px;
  margin: 0 0 6px; padding-bottom: 12px; border-bottom: 2px solid #dcdfe6; line-height: 1.4;
}
.fpi-analysis-body :deep(h2) {
  font-size: 16px; font-weight: 600; color: #1f2d3d; letter-spacing: 0.3px;
  margin: 30px 0 14px; padding: 6px 0 6px 12px;
  border-left: 4px solid #185fa5; background: linear-gradient(90deg, #f0f6fd 0%, #ffffff 70%);
  position: sticky; top: 0; z-index: 1; line-height: 1.5;
}
.fpi-analysis-body :deep(h3) {
  font-size: 14px; font-weight: 600; color: #34495e;
  margin: 22px 0 10px; padding-left: 9px;
  border-left: 3px solid #b5d4f4; line-height: 1.5;
}
.fpi-analysis-body :deep(h4) {
  font-size: 13.5px; font-weight: 600; color: #34495e; margin: 16px 0 8px; line-height: 1.5;
}
.fpi-analysis-body :deep(blockquote) {
  margin: 14px 0; padding: 10px 16px;
  background: #f8f9fb; border: 1px solid #ebeef5; border-left: 3px solid #909399;
  border-radius: 8px; color: #606266; font-size: 12.5px; line-height: 1.8;
}
.fpi-analysis-body :deep(blockquote p) { margin: 3px 0; }
.fpi-analysis-body :deep(blockquote strong) { color: #303133; }
.fpi-analysis-body :deep(table) {
  width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12.5px; line-height: 1.7; table-layout: auto;
}
.fpi-analysis-body :deep(th) {
  background: #f5f7fa; color: #34495e; font-weight: 600; text-align: left;
  padding: 8px 12px; border: 1px solid #ebeef5; white-space: nowrap;
}
.fpi-analysis-body :deep(td) { padding: 8px 12px; border: 1px solid #ebeef5; vertical-align: top; }
.fpi-analysis-body :deep(tbody tr:nth-child(even)) { background: #fafbfc; }
.fpi-analysis-body :deep(tbody tr:hover) { background: #f0f6fd; }
.fpi-analysis-body :deep(hr) { border: none; border-top: 1px dashed #dcdfe6; margin: 26px 0; }
.fpi-analysis-body :deep(p) { margin: 10px 0; }
.fpi-analysis-body :deep(ul), .fpi-analysis-body :deep(ol) { margin: 8px 0; padding-left: 24px; }
.fpi-analysis-body :deep(li) { margin: 6px 0; line-height: 1.85; }
.fpi-analysis-body :deep(li::marker) { color: #909399; }
.fpi-analysis-body :deep(code) {
  font-family: 'JetBrains Mono', Consolas, monospace; font-size: 12px;
  background: #f1f3f5; border-radius: 4px; padding: 1px 6px; color: #476582;
}
.fpi-analysis-body :deep(pre) {
  background: #f8f9fb; border: 1px solid #ebeef5; border-radius: 8px;
  padding: 12px 14px; overflow-x: auto; font-size: 12px; line-height: 1.7; margin: 12px 0;
}
.fpi-analysis-body :deep(pre code) { background: transparent; padding: 0; color: #34495e; }
.fpi-analysis-body :deep(strong) { color: #1f2d3d; font-weight: 600; }

/* ---- 深挖报告结构化报告头（fpd-meta 卡片组件） ---- */
.fpi-report-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; background: #fff; border: 0.5px solid #dcdfe6; border-radius: 12px; padding: 18px 22px; }
.fpi-report-title { font-size: 18px; font-weight: 600; color: #1f2d3d; letter-spacing: 0.3px; }
.fpi-report-tags { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.fpi-tag { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #f1f3f5; color: #606266; }
.fpi-tag-mono { font-family: 'JetBrains Mono', Consolas, monospace; }
.fpi-report-kpis { display: flex; gap: 8px; flex-shrink: 0; }
.fpi-kpi { border-radius: 8px; padding: 8px 14px; text-align: center; min-width: 72px; }
.fpi-kpi-label { font-size: 11px; }
.fpi-kpi-value { font-size: 20px; font-weight: 600; margin: 1px 0; }
.fpi-kpi-sub { font-size: 11px; }
.fpi-kpi.tone-danger { background: #fcebeb; color: #a32d2d; }
.fpi-kpi.tone-warn { background: #faeeda; color: #854f0b; }
.fpi-kpi.tone-neutral { background: #f1f3f5; color: #5f5e5a; }
.fpi-report-toc { display: flex; align-items: center; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.fpi-toc-label { font-size: 11px; color: #909399; }
.fpi-toc-pill { font-size: 12px; padding: 3px 10px; border-radius: 99px; border: none; cursor: pointer; font-weight: 500; }
.fpi-toc-pill:hover { opacity: 0.8; }
.fpi-verdict { margin-top: 12px; background: #fff; border: 0.5px solid #dcdfe6; border-radius: 12px; padding: 12px 16px; border-left-width: 3px; }
.fpi-verdict.v-danger { border-left-color: #e24b4a; }
.fpi-verdict.v-warn { border-left-color: #ef9f27; }
.fpi-verdict.v-ok { border-left-color: #639922; }
.fpi-verdict-head { display: flex; align-items: center; gap: 10px; }
.fpi-verdict.v-danger .fpi-verdict-head strong { color: #a32d2d; }
.fpi-verdict.v-warn .fpi-verdict-head strong { color: #854f0b; }
.fpi-verdict.v-ok .fpi-verdict-head strong { color: #3b6d11; }
.fpi-verdict-cause { font-size: 11px; color: #909399; }
.fpi-verdict-detail { font-size: 12.5px; color: #606266; margin-top: 4px; line-height: 1.6; }
.fpi-report-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
.fpi-metric-card { background: #f5f6f7; border-radius: 8px; padding: 12px 14px; }
.fpi-mc-label { font-size: 12px; color: #606266; }
.fpi-mc-value { font-size: 20px; font-weight: 600; color: #1f2d3d; margin-top: 2px; }
.fpi-mc-sub { font-size: 11px; color: #909399; margin-top: 2px; }
.fpi-mermaid {
  background: #fff; border: 0.5px solid #dcdfe6; border-radius: 8px;
  padding: 14px; margin: 12px 0; display: flex; justify-content: center; overflow-x: auto;
}
.fpi-mermaid svg { max-width: 100%; height: auto; }
.fpi-analysis-streaming { font-size: 12px; color: #909399; margin-top: 6px; }

/* ---- FPI 等级 chips ---- */
.level-chips { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.level-chip { display: flex; align-items: baseline; gap: 6px; border: 1.5px solid; border-radius: 8px; padding: 6px 14px; cursor: pointer; user-select: none; background: #fff; }
.level-chip.active { background: #f5f7fa; box-shadow: 0 0 0 2px rgba(0,0,0,0.06) inset; }
.level-count { font-size: 20px; font-weight: 700; }
.level-label { font-size: 13px; color: #606266; }
.level-hint { font-size: 12px; color: #c0c4cc; }

/* ---- 筛选栏 ---- */
.filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.filter-count { font-size: 12px; color: #909399; }

/* ---- 模块量级条 ---- */
.bar-wrap { display: flex; align-items: center; gap: 8px; }
.bar { height: 10px; border-radius: 5px; background: var(--seal, #409eff); opacity: 0.75; min-width: 4px; }
.bar-pct { font-size: 12px; color: #909399; width: 48px; }

/* ---- 结论框 ---- */
.concl-box { margin-top: 10px; padding: 10px 14px; background: #f5f7fa; border-left: 3px solid var(--seal, #409eff); border-radius: 4px; font-size: 13px; line-height: 1.8; color: #606266; }

/* ---- 月度趋势同期数 ---- */
.prev { color: #c0c4cc; font-size: 12px; }

/* ---- 统计卡 ---- */
.stat-row { display: flex; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
.split-sub { font-size: 11px; color: #909399; line-height: 1.5; }
.stat-card { flex: 1; min-width: 130px; text-align: center; }
.stat-num { font-size: 24px; font-weight: 700; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }

/* ---- 快照折叠区 ---- */

/* ---- 配置对话框 ---- */
.config-hint { font-size: 12px; color: #e6a23c; line-height: 1.6; margin-top: 4px; }
.skill-advanced { margin: 4px 0 8px; border-top: none; }
.skill-advanced :deep(.el-collapse-item__header) { font-size: 12px; color: #909399; height: 32px; border-bottom: none; }
.skill-advanced :deep(.el-collapse-item__wrap) { border-bottom: none; }
</style>
