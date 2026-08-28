<template>
  <page-container>
    <!-- 顶部：百度首页风格居中搜索区 -->
    <div class="kv-hero">
      <div class="kv-hero__title">知识库</div>
      <div class="kv-searchbar">
        <input
          v-model="searchQuery"
          class="kv-searchbar__input"
          placeholder="输入关键词，搜索知识库"
          @keyup.enter="handleSearch"
        />
        <button class="kv-searchbar__btn" @click="handleSearch">搜索</button>
      </div>
      <div class="kv-hero__links">
        <span class="kv-hero__links-label">检索模式：</span>
        <a class="kv-hero__link" :class="{ 'kv-hero__link--active': searchMode === 'default' }" @click="searchMode = 'default'">关键词</a>
        <a class="kv-hero__link" :class="{ 'kv-hero__link--active': searchMode === 'semantic' }" @click="searchMode = 'semantic'">语义向量</a>
        <a class="kv-hero__link" :class="{ 'kv-hero__link--active': searchMode === 'graphrag' }" @click="searchMode = 'graphrag'">GraphRAG</a>
        <a v-if="isSearchMode" class="kv-hero__link kv-hero__link--clear" @click="clearSearch">清除搜索</a>
      </div>
    </div>

    <!-- 视图切换：分段切换器（替代原左侧树形导航） -->
    <div class="kv-nav">
      <el-segmented v-model="activeTab" :options="navOptions" size="large" />
    </div>

    <div class="kv-content">
      <!-- Pane 1: Documents (manual upload) —— 文书Spec 与 SOP文档 共用此上传式列表面板，按 sourceType 区分 -->
      <div v-show="activeTab === 'documents' || activeTab === 'sop'" class="kv-pane">
        <!-- 主操作栏：标题 + 搜索 + 主按钮 -->
        <div class="kv-toolbar">
          <div class="kv-toolbar__right">
            <el-button type="primary" :icon="Upload" @click="uploadDialogVisible = true">
              {{ uploadButtonLabel }}
            </el-button>
            <el-button plain :icon="RefreshRight" @click="handleReindex">重新索引</el-button>
            <el-button plain :icon="DataAnalysis" @click="handleKnowledgeStatus">知识库状态</el-button>
          </div>
        </div>

        <!-- 高级筛选行：分类 / 产品线 / 模块 / 功能点 / 标签 + 列设置 -->
        <KnowledgeFilters
          :selected-category="selectedCategory"
          :selected-product-line="selectedProductLine"
          :filter-module="filterModule"
          :filter-function-point="filterFunctionPoint"
          :selected-tag="selectedTag"
          :categories="categories"
          :product-lines="productLines"
          :modules="modules"
          :function-points="functionPoints"
          :all-tags="allTags"
          :column-setting-options="columnSettingOptions"
          :column-setting-visible="columnSettingVisible"
          :has-active-filters="!!(filterModule || filterFunctionPoint || selectedTag || selectedCategory || selectedProductLine)"
          :is-column-visible="isSettingColumnVisible"
          :toggle-column="toggleSettingColumn"
          @update:selected-category="selectedCategory = $event"
          @update:selected-product-line="selectedProductLine = $event"
          @update:filter-module="filterModule = $event"
          @update:filter-function-point="filterFunctionPoint = $event"
          @update:selected-tag="selectedTag = $event"
          @update:column-setting-visible="columnSettingVisible = $event"
          @select-category="selectCategoryFromFilter"
          @select-product-line="selectProductLineFromFilter"
          @context-filter-change="onContextFilterChange"
          @clear-all-filters="clearAllFilters"
        />

        <!-- Search results mode -->
        <KnowledgeSearchResults
          v-if="isSearchMode"
          :search-results="searchResults"
          :search-loading="searchLoading"
          :search-mode="searchMode"
          :merged-context="mergedContext"
          :graph-contexts="graphContexts"
          :count="searchResults.length"
          :get-category-color="getCategoryColor"
          :get-score-color="getScoreColor"
          :highlight-snippet="highlightSnippet"
          @clear="clearSearch"
          @open-detail="openDetailById"
        />

        <!-- Document list mode -->
        <div v-else class="kv-document-list">
          <!-- P2 空状态引导 -->
          <div v-if="documents.length === 0 && !listLoading" class="kv-empty-state">
            <el-empty>
              <template #description>
                <div class="kv-empty-state__text">暂无文档，先上传或抓取一份知识库文档吧</div>
              </template>
              <el-button type="primary" :icon="Upload" @click="uploadDialogVisible = true">开始上传</el-button>
            </el-empty>
          </div>

          <el-table
            v-else
            v-loading="listLoading"
            :data="documents"
            stripe
            style="width: 100%"
            scrollbar-always-on
            @row-click="handleRowClick"
          >
            <el-table-column label="标题" min-width="200">
              <template #default="{ row }">
                <a class="kv-doc-title" @click.stop="openDetail(row)">{{ row.title }}</a>
              </template>
            </el-table-column>
            <el-table-column label="分类" width="120">
              <template #default="{ row }">
                <el-tag size="small" :color="getCategoryColor(row.category)" effect="dark">
                  {{ row.category }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="模块" min-width="130">
              <template #default="{ row }">
                <el-tag v-if="row.module" size="small" type="info">{{ row.module }}</el-tag>
                <span v-else class="kv-empty-text">-</span>
              </template>
            </el-table-column>
            <el-table-column label="功能点" min-width="130">
              <template #default="{ row }">
                <el-tag v-if="row.functionPoint" size="small" type="info">{{ row.functionPoint }}</el-tag>
                <span v-else class="kv-empty-text">-</span>
              </template>
            </el-table-column>

            <el-table-column label="产品线" width="120" v-if="isSettingColumnVisible('productLine')">
              <template #default="{ row }">
                <el-tag v-if="row.productLine" size="small" type="info">{{ getProductLineDisplayName(row.productLine) }}</el-tag>
                <span v-else class="kv-empty-text">-</span>
              </template>
            </el-table-column>

            <!-- 动态列：按实际字段/标签自动调整 -->
            <el-table-column
              v-for="col in visibleDynamicColumns"
              :key="col"
              :label="colLabel(col)"
              min-width="130"
            >
              <template #default="{ row }">
                <template v-if="col === 'sourceUrl'">
                  <a v-if="row.sourceUrl" :href="row.sourceUrl" target="_blank" class="kv-doc-link" @click.stop>{{ truncate(row.sourceUrl, 30) }}</a>
                  <span v-else class="kv-empty-text">-</span>
                </template>
                <template v-else-if="col.startsWith('field_')">
                  <span v-if="row['field_' + col.substring(6)] != null && row['field_' + col.substring(6)] !== ''">{{ row['field_' + col.substring(6)] }}</span>
                  <span v-else class="kv-empty-text">-</span>
                </template>
                <template v-else>
                  <el-tag v-if="row[col]" size="small" type="info">{{ row[col] }}</el-tag>
                  <span v-else class="kv-empty-text">-</span>
                </template>
              </template>
            </el-table-column>
            <el-table-column label="标签" min-width="160" v-if="isSettingColumnVisible('tags')">
              <template #default="{ row }">
                <el-tag
                  v-for="tag in parseTags(row.tags)"
                  :key="tag"
                  size="small"
                  type="info"
                  class="kv-tag"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="parseTags(row.tags).length === 0" class="kv-empty-text">-</span>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160" v-if="isSettingColumnVisible('createdAt')">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click.stop="openDetail(row)">
                  查看
                </el-button>
                <el-button v-if="row.sourceType === 'upload' || row.sourceType === 'FILE' || row.sourceType === 'TEXT' || row.sourceType === 'sop'" type="warning" text size="small" @click.stop="handleEdit(row)">
                  编辑
                </el-button>
                <el-popconfirm
                  title="确定要删除该文档吗？"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  @confirm="handleDelete(row.id)"
                >
                  <template #reference>
                    <el-button type="danger" text size="small" @click.stop>删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <!-- Pagination -->
          <div class="kv-pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="totalElements"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
      <!-- Pane 2: Code Scan -->
      <div v-show="activeTab === 'scan'" class="kv-pane">
        <!-- 高级筛选行：分类 / 产品线 / 模块 / 功能点 / 标签 + 列设置 -->
        <KnowledgeFilters
          :selected-category="selectedCategory"
          :selected-product-line="selectedProductLine"
          :filter-module="filterModule"
          :filter-function-point="filterFunctionPoint"
          :selected-tag="selectedTag"
          :categories="categories"
          :product-lines="productLines"
          :modules="modules"
          :function-points="functionPoints"
          :all-tags="allTags"
          :column-setting-options="scanColumnSettingOptions"
          :column-setting-visible="scanColumnSettingVisible"
          :has-active-filters="!!(filterModule || filterFunctionPoint || selectedTag || selectedCategory || selectedProductLine)"
          :is-column-visible="isScanSettingColumnVisible"
          :toggle-column="toggleScanSettingColumn"
          @update:selected-category="selectedCategory = $event"
          @update:selected-product-line="selectedProductLine = $event"
          @update:filter-module="filterModule = $event"
          @update:filter-function-point="filterFunctionPoint = $event"
          @update:selected-tag="selectedTag = $event"
          @update:column-setting-visible="scanColumnSettingVisible = $event"
          @select-category="selectCategoryFromFilter"
          @select-product-line="selectProductLineFromFilter"
          @context-filter-change="onContextFilterChange"
          @clear-all-filters="clearAllFilters"
        />

        <!-- Scan section -->
        <div class="kv-scan-section">
          <div class="kv-scan-header" @click="scanSectionExpanded = !scanSectionExpanded">
            <span class="kv-scan-header__title">代码扫描导入</span>
            <el-icon class="kv-scan-header__arrow" :class="{ 'kv-scan-header__arrow--expanded': scanSectionExpanded }">
              <ArrowRight />
            </el-icon>
          </div>
          <div v-if="scanSectionExpanded" class="kv-scan-body">
            <el-form :inline="true" class="kv-scan-form">
              <el-form-item label="项目目录">
                <el-input
                  v-model="scanDirectory"
                  placeholder="输入项目目录路径，如 D:/workspace/project"
                  style="width: 360px"
                  clearable
                />
              </el-form-item>
              <el-form-item label="分类">
                <el-input
                  v-model="scanCategory"
                  placeholder="分类名称（可选）"
                  style="width: 200px"
                  clearable
                />
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="scanPreviewLoading"
                  :disabled="!scanDirectory.trim()"
                  @click="handleScanPreview"
                >
                  预览
                </el-button>
                <el-button
                  type="success"
                  :loading="scanLoading"
                  :disabled="!scanDirectory.trim()"
                  @click="handleScan"
                >
                  开始扫描
                </el-button>
              </el-form-item>
            </el-form>

            <!-- Preview results -->
            <div v-if="scanPreviewData" class="kv-scan-preview">
              <div class="kv-scan-preview__summary">
                共发现 <strong>{{ scanPreviewData.files.length }}</strong> 个文件
                <template v-if="Object.keys(scanFileTypeCounts).length > 0">
                  &nbsp;-&nbsp;
                  <el-tag
                    v-for="(count, ext) in scanFileTypeCounts"
                    :key="ext"
                    size="small"
                    type="info"
                    class="kv-tag"
                  >
                    {{ ext }}: {{ count }}
                  </el-tag>
                </template>
              </div>
              <el-table :data="scanPreviewData.files" max-height="300" stripe size="small">
                <el-table-column label="文件路径" prop="path" min-width="300" show-overflow-tooltip />
                <el-table-column label="类型" prop="extension" width="100" />
                <el-table-column label="大小" prop="size" width="120">
                  <template #default="{ row }">
                    {{ formatFileSize(row.size) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- Scan results -->
            <div v-if="scanResult" class="kv-scan-result">
              <el-alert
                :title="`扫描完成：共 ${scanResult.totalFiles} 个文件，导入 ${scanResult.importedFiles} 个，跳过 ${scanResult.skippedFiles} 个`"
                :type="scanResult.errors.length > 0 ? 'warning' : 'success'"
                show-icon
                :closable="false"
              />
              <div v-if="scanResult.errors.length > 0" class="kv-scan-result__errors">
                <div class="kv-scan-result__errors-title">错误列表：</div>
                <div v-for="(error, idx) in scanResult.errors" :key="idx" class="kv-scan-result__error-item">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Search results mode -->
        <KnowledgeSearchResults
          v-if="isSearchMode"
          :search-results="searchResults"
          :search-loading="searchLoading"
          :search-mode="searchMode"
          :merged-context="mergedContext"
          :graph-contexts="graphContexts"
          :count="searchResults.length"
          :get-category-color="getCategoryColor"
          :get-score-color="getScoreColor"
          :highlight-snippet="highlightSnippet"
          @clear="clearSearch"
          @open-detail="openDetailById"
        />

        <!-- Document list mode (Scan Tab 专用优化列) -->
        <div v-else class="kv-document-list">
          <!-- P2 空状态引导 -->
          <div v-if="documents.length === 0 && !listLoading" class="kv-empty-state">
            <el-empty>
              <template #description>
                <div class="kv-empty-state__text">暂无扫描结果，请先执行代码扫描</div>
              </template>
            </el-empty>
          </div>

          <el-table
            v-else
            v-loading="listLoading"
            :data="documents"
            stripe
            style="width: 100%"
            scrollbar-always-on
            @row-click="handleRowClick"
          >
            <!-- 文件路径（主列，显示相对路径） -->
            <el-table-column label="文件路径" min-width="300">
              <template #default="{ row }">
                <a class="kv-doc-title" @click.stop="openDetail(row)">{{ row.title }}</a>
              </template>
            </el-table-column>
            <!-- 文件类型（从 tags 取扩展名） -->
            <el-table-column label="文件类型" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.tags" size="small" type="info">{{ row.tags }}</el-tag>
                <span v-else class="kv-empty-text">-</span>
              </template>
            </el-table-column>
            <!-- 分类 -->
            <el-table-column label="分类" width="120">
              <template #default="{ row }">
                <el-tag size="small" :color="getCategoryColor(row.category)" effect="dark">
                  {{ row.category || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <!-- 模块 -->
            <el-table-column label="模块" min-width="130">
              <template #default="{ row }">
                <el-tag v-if="row.module" size="small" type="info">{{ row.module }}</el-tag>
                <span v-else class="kv-empty-text">-</span>
              </template>
            </el-table-column>
            <!-- 功能点 -->
            <el-table-column label="功能点" min-width="130">
              <template #default="{ row }">
                <el-tag v-if="row.functionPoint" size="small" type="info">{{ row.functionPoint }}</el-tag>
                <span v-else class="kv-empty-text">-</span>
              </template>
            </el-table-column>
            <!-- 产品线（扫描 Tab 独立列显隐） -->
            <el-table-column label="产品线" width="120" v-if="isScanSettingColumnVisible('productLine')">
              <template #default="{ row }">
                <el-tag v-if="row.productLine" size="small" type="info">{{ getProductLineDisplayName(row.productLine) }}</el-tag>
                <span v-else class="kv-empty-text">-</span>
              </template>
            </el-table-column>
            <!-- 创建时间（扫描 Tab 默认可见） -->
            <el-table-column label="创建时间" width="160" v-if="isScanSettingColumnVisible('createdAt')">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <!-- 操作 -->
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click.stop="openDetail(row)">
                  查看
                </el-button>
                <el-popconfirm
                  title="确定要删除该文档吗？"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  @confirm="handleDelete(row.id)"
                >
                  <template #reference>
                    <el-button type="danger" text size="small" @click.stop>删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <!-- Pagination -->
          <div class="kv-pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="totalElements"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>

      <!-- Pane 3: Wiki Pages（已隐藏，保留代码便于后续恢复） -->
      <div v-if="activeTab === 'wiki'" class="kv-pane">
        <WikiPageTab
          :wiki-pages="wikiPages"
          :wiki-list-loading="wikiListLoading"
          :wiki-selected-doc-id="wikiSelectedDocId"
          :wiki-generate-loading="wikiGenerateLoading"
          :documents="documents"
          :wiki-regenerate-loading="wikiRegenerateLoading"
          @update:wiki-selected-doc-id="wikiSelectedDocId = $event"
          @fetch-wiki-pages="fetchWikiPages"
          @generate-wiki="handleGenerateWiki"
          @regenerate-wiki="handleRegenerateWiki"
          @delete-wiki="handleDeleteWiki"
          @open-wiki-detail="openWikiDetail"
        />
      </div>

      <!-- Pane 4: Knowledge Graph（已隐藏，保留代码便于后续恢复） -->
      <div v-if="activeTab === 'graph'" class="kv-pane">
        <KnowledgeGraphTab
          :graph-data="graphData"
          :graph-data-loading="graphDataLoading"
          :graph-stats="graphStats"
          :graph-search-query="graphSearchQuery"
          :graph-search-mode="graphSearchMode"
          :graph-target-entity="graphTargetEntity"
          :graph-search-loading="graphSearchLoading"
          :graph-entity-type-filter="graphEntityTypeFilter"
          :graph-entity-types="graphEntityTypes"
          :filtered-graph-entities="filteredGraphEntities"
          @update:graph-search-query="graphSearchQuery = $event"
          @update:graph-search-mode="graphSearchMode = $event"
          @update:graph-target-entity="graphTargetEntity = $event"
          @update:graph-entity-type-filter="graphEntityTypeFilter = $event"
          @search="handleGraphSearch"
          @filter-entities="filterGraphEntities"
          @open-entity-detail="openEntityDetail"
          @node-click="handleGraphNodeClick"
        />
      </div>
    </div>

    <!-- Upload dialog (shared across tabs, used for both create and edit) -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      destroy-on-close
    >
      <el-form
        ref="uploadFormRef"
        :model="uploadForm"
        :rules="uploadRules"
        label-width="80px"
      >
        <el-form-item label="上传方式">
          <el-radio-group v-model="uploadMode">
            <el-radio value="file">文件上传</el-radio>
            <el-radio value="text">文本输入</el-radio>
            <el-radio value="link">链接抓取</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- File upload mode -->
        <el-form-item v-if="uploadMode === 'file'" label="选择文件">
          <el-upload
            ref="uploadRef"
            v-model:file-list="fileList"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".md,.txt,.java,.xml,.json,.yml,.yaml,.doc,.docx,.pdf"
            :on-exceed="handleUploadExceed"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .md, .txt, .java, .xml, .json, .yml，以及 Word（.doc/.docx）、PDF（.pdf）格式
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- Text input mode -->
        <el-form-item v-else-if="uploadMode === 'text'" label="文档内容">
          <el-input
            v-model="uploadForm.textContent"
            type="textarea"
            :rows="10"
            placeholder="粘贴文档内容..."
          />
        </el-form-item>

        <!-- Link fetch mode -->
        <el-form-item v-else-if="uploadMode === 'link'" label="文档链接">
          <el-input
            v-model="uploadForm.url"
            placeholder="https://example.com/docs/xxx"
          >
            <template #prepend><el-icon><Link /></el-icon></template>
          </el-input>
          <div class="el-upload__tip">抓取后正文自动入库（sourceType=link），支持 HTML 页面正文提取</div>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="uploadForm.title" placeholder="输入文档标题" />
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-select v-model="uploadForm.category" placeholder="选择分类" style="width: 100%">
            <el-option
              v-for="cat in predefinedCategories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="产品线">
          <el-select v-model="uploadForm.productLine" placeholder="选择产品线" clearable style="width: 100%">
            <el-option
              v-for="pl in productLines"
              :key="pl.name"
              :label="pl.displayName"
              :value="pl.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-input
            v-model="uploadForm.tags"
            placeholder="多个标签用逗号分隔"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false; resetUploadForm()">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="handleUpload">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- Document detail dialog (shared across tabs) -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="detailDoc?.title"
      width="800px"
      top="5vh"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="kv-detail">
        <template v-if="detailDoc">
          <div class="kv-detail__meta">
            <el-tag :color="getCategoryColor(detailDoc.category)" effect="dark">
              {{ detailDoc.category }}
            </el-tag>
            <el-tag v-if="detailDoc.productLine" size="small" type="info">{{ getProductLineDisplayName(detailDoc.productLine) }}</el-tag>
            <el-tag
              v-for="tag in parseTags(detailDoc.tags)"
              :key="tag"
              size="small"
              type="info"
              class="kv-tag"
            >
              {{ tag }}
            </el-tag>
            <span class="kv-detail__source">
              <el-icon><Document v-if="detailDoc.sourceType === 'FILE'" /><EditPen v-else /></el-icon>
              {{ detailDoc.sourceType === 'FILE' ? detailDoc.fileName : '文本输入' }}
            </span>
            <span class="kv-detail__date">{{ formatDate(detailDoc.createdAt) }}</span>
          </div>
          <el-divider />
          <div
            class="kv-detail__content markdown-body"
            v-html="renderedDetailContent"
          />
        </template>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Wiki detail dialog -->
    <el-dialog
      v-model="wikiDetailVisible"
      :title="wikiDetailPage?.title"
      width="900px"
      top="5vh"
      destroy-on-close
    >
      <div v-loading="wikiDetailLoading" class="kv-wiki-detail">
        <template v-if="wikiDetailPage">
          <div class="kv-wiki-detail__meta">
            <el-tag :type="getWikiStatusType(wikiDetailPage.status)" effect="dark">
              {{ getWikiStatusLabel(wikiDetailPage.status) }}
            </el-tag>
            <span class="kv-wiki-detail__date">{{ formatDate(wikiDetailPage.updatedAt) }}</span>
          </div>
          <el-divider />
          <div class="kv-wiki-detail__summary">
            <h4>摘要</h4>
            <p>{{ wikiDetailPage.summary }}</p>
          </div>
          <div class="kv-wiki-detail__concepts">
            <h4>关键概念</h4>
            <div>
              <el-tag
                v-for="concept in parseWikiConcepts(wikiDetailPage.keyConcepts)"
                :key="concept"
                size="small"
                type="info"
                class="kv-tag"
              >
                {{ concept }}
              </el-tag>
            </div>
          </div>
          <el-divider />
          <div class="kv-wiki-detail__sections">
            <div v-for="(section, idx) in parsedWikiSections" :key="idx">
              <h3>{{ section.heading }}</h3>
              <div class="markdown-body" v-html="renderWikiSection(section.content)" />
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="wikiDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Entity detail dialog -->
    <el-dialog
      v-model="entityDetailVisible"
      :title="entityDetail?.name"
      width="600px"
      destroy-on-close
    >
      <div v-loading="entityDetailLoading" class="kv-entity-detail">
        <template v-if="entityDetail">
          <div class="kv-entity-detail__meta">
            <el-tag type="info">{{ entityDetail.type }}</el-tag>
          </div>
          <el-divider />
          <div class="kv-entity-detail__description">
            <h4>描述</h4>
            <p>{{ entityDetail.description || '暂无描述' }}</p>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="entityDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadInstance, UploadRawFile } from 'element-plus'
import {
  Upload, UploadFilled, Document, EditPen, ArrowRight,
  RefreshRight, DataAnalysis, Link
} from '@element-plus/icons-vue'
import {
  knowledgeApi,
  type KnowledgeDocument,
  type SearchResult,
  type GraphContext,
  type KnowledgeStatus
} from '@/api/knowledge'
import { wikiApi, type WikiPage, type WikiSection } from '@/api/wiki'
import { scanApi, type ScanPreview, type ScanResult } from '@/api/scan'
import { graphApi, type GraphEntity, type GraphData, type GraphStats } from '@/api/graph'
import { useMarkdown } from '@/composables/useMarkdown'

import KnowledgeFilters from './components/KnowledgeFilters.vue'
import KnowledgeSearchResults from './components/KnowledgeSearchResults.vue'
import WikiPageTab from './components/WikiPageTab.vue'
import KnowledgeGraphTab from './components/KnowledgeGraphTab.vue'

// ---- Composables ----
const { renderMarkdown } = useMarkdown()

// ---- State ----

// Active pane（由左侧树形导航驱动，沿用原 activeTab 语义）
const activeTab = ref('documents')

// 视图切换选项（分段切换器，替代原 Tab / 树形导航）
const navOptions = [
  { label: '文书Spec', value: 'documents' },
  { label: '代码扫描', value: 'scan' },
  { label: 'SOP文档', value: 'sop' }
]

// Computed source type based on active tab
const currentSourceType = computed(() => {
  if (activeTab.value === 'documents') return 'upload'
  if (activeTab.value === 'scan') return 'scan'
  if (activeTab.value === 'sop') return 'sop'
  return undefined
})

// 上传按钮文案 / 弹窗标题 / 入库 sourceType：SOP 视图独立成桶（sourceType='sop'）
const isSopView = computed(() => activeTab.value === 'sop')
const uploadButtonLabel = computed(() => isSopView.value ? '上传SOP文档' : '上传文档')
// 上传时写入的 sourceType：SOP 视图落 'sop'；其余视图返回 undefined 以沿用原有逻辑/后端默认值
const uploadSourceType = computed<string | undefined>(() => isSopView.value ? 'sop' : undefined)

// Document list
const documents = ref<KnowledgeDocument[]>([])
const listLoading = ref(false)
const totalElements = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedCategory = ref('')
const categories = ref<string[]>([])
const selectedProductLine = ref('')
const productLines = ref<{name: string, displayName: string}[]>([])

// Search
const searchQuery = ref('')
const isSearchMode = ref(false)
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)
const searchMode = ref<'default' | 'graphrag'>('default')
const graphContexts = ref<GraphContext[]>([])
const mergedContext = ref('')

// Upload
const uploadDialogVisible = ref(false)
const editDialogVisible = ref(false)
const editDocId = ref<number | null>(null)

const dialogVisible = computed({
  get: () => editDocId.value ? editDialogVisible.value : uploadDialogVisible.value,
  set: (val: boolean) => {
    if (editDocId.value) {
      editDialogVisible.value = val
    } else {
      uploadDialogVisible.value = val
    }
  }
})

const dialogTitle = computed(() => {
  if (editDocId.value) return '编辑文档'
  return isSopView.value ? '上传SOP文档' : '上传知识文档'
})

const uploadMode = ref<'file' | 'text' | 'link'>('file')
const uploadLoading = ref(false)
const uploadFormRef = ref<FormInstance>()
const uploadRef = ref<UploadInstance>()
const fileList = ref<any[]>([])
const uploadForm = ref({
  title: '',
  category: '',
  tags: '',
  productLine: '',
  module: '',
  functionPoint: '',
  textContent: '',
  url: ''
})

const predefinedCategories = ['开发规范', '业务规则', 'CLAUDE.md', '技术文档', '其他']

// 模块 / 功能点（用于上下文检索筛选与文档组织）
const modules = ref<string[]>([])
const functionPoints = ref<string[]>([])

// 动态列描述（由后端根据实际字段/标签返回）
const columnsDescriptor = ref<{ columns: string[]; tags: string[]; hasModule: boolean; hasFunctionPoint: boolean; hasSourceUrl: boolean }>({
  columns: [], tags: [], hasModule: false, hasFunctionPoint: false, hasSourceUrl: false
})
// 用户可勾选的额外列显隐（localStorage 持久化）
const columnVisibility = ref<Record<string, boolean>>({})
const columnSettingVisible = ref(false)

// 扫描 Tab 独立列显隐状态
const scanColumnSettingVisible = ref(false)

// 固定列（产品线/标签/创建时间）显隐：默认仅显示 标题|分类|模块|功能点|操作
// 注：来源(sourceType)、内容预览(contentPreview) 已按需求从列表移除，不再提供勾选
const FIXED_COLUMNS = [
  { key: 'productLine', label: '产品线', defaultVisible: false },
  { key: 'tags', label: '标签', defaultVisible: false },
  { key: 'createdAt', label: '创建时间', defaultVisible: false }
] as const
const fixedColumnVisibility = ref<Record<string, boolean>>({})
const FIXED_COLUMN_KEYS: string[] = FIXED_COLUMNS.map(c => c.key)

// 扫描 Tab 专用列定义（与文书Spec Tab 独立）
const SCAN_FIXED_COLUMNS = [
  { key: 'productLine', label: '产品线', defaultVisible: false },
  { key: 'createdAt', label: '创建时间', defaultVisible: true }  // 扫描 Tab 默认显示创建时间
] as const
const scanFixedColumnVisibility = ref<Record<string, boolean>>({})
const SCAN_FIXED_COLUMN_KEYS: string[] = SCAN_FIXED_COLUMNS.map(c => c.key)

// 标签筛选（来自数据实际标签）
const selectedTag = ref('')
const allTags = ref<string[]>([])

// 实际可见的动态列（按字段/标签自动调整 + 用户显隐）
// 注意：module/functionPoint 已有专门的硬编码固定列（模块/功能点），须从动态列中排除，避免列表重复渲染
const HARDCODED_FIXED_COLUMNS = ['module', 'functionPoint']
const visibleDynamicColumns = computed(() =>
  columnsDescriptor.value.columns.filter(c => !HARDCODED_FIXED_COLUMNS.includes(c) && isColumnVisible(c))
)

// 列设置面板数据源：固定列（始终可选）+ 后端返回的扩展动态列
const columnSettingOptions = computed(() => [
  ...FIXED_COLUMNS.map(c => ({ key: c.key, label: c.label })),
  ...columnsDescriptor.value.columns.map(c => ({ key: c, label: colLabel(c) }))
])
function isSettingColumnVisible(key: string): boolean {
  if (FIXED_COLUMN_KEYS.includes(key)) {
    const def = FIXED_COLUMNS.find(c => c.key === key)?.defaultVisible ?? false
    return fixedColumnVisibility.value[key] !== undefined ? fixedColumnVisibility.value[key] : def
  }
  return isColumnVisible(key)
}
function toggleSettingColumn(key: string) {
  if (FIXED_COLUMN_KEYS.includes(key)) {
    const def = FIXED_COLUMNS.find(c => c.key === key)?.defaultVisible ?? false
    const cur = fixedColumnVisibility.value[key] !== undefined ? fixedColumnVisibility.value[key] : def
    fixedColumnVisibility.value[key] = !cur
    saveFixedColumnVisibility()
  } else {
    toggleColumn(key)
  }
}

// 扫描 Tab 列设置选项
const scanColumnSettingOptions = computed(() => [
  ...SCAN_FIXED_COLUMNS.map(c => ({ key: c.key, label: c.label })),
  ...columnsDescriptor.value.columns.map(c => ({ key: c, label: colLabel(c) }))
])
function isScanSettingColumnVisible(key: string): boolean {
  if (SCAN_FIXED_COLUMN_KEYS.includes(key)) {
    const def = SCAN_FIXED_COLUMNS.find(c => c.key === key)?.defaultVisible ?? false
    return scanFixedColumnVisibility.value[key] !== undefined ? scanFixedColumnVisibility.value[key] : def
  }
  return isColumnVisible(key)
}
function toggleScanSettingColumn(key: string) {
  if (SCAN_FIXED_COLUMN_KEYS.includes(key)) {
    const def = SCAN_FIXED_COLUMNS.find(c => c.key === key)?.defaultVisible ?? false
    const cur = scanFixedColumnVisibility.value[key] !== undefined ? scanFixedColumnVisibility.value[key] : def
    scanFixedColumnVisibility.value[key] = !cur
    saveScanFixedColumnVisibility()
  } else {
    toggleColumn(key)
  }
}

// 上下文检索筛选
const filterModule = ref('')
const filterFunctionPoint = ref('')

// Scan state
const scanSectionExpanded = ref(false)
const scanDirectory = ref('')
const scanCategory = ref('')
const scanPreviewLoading = ref(false)
const scanLoading = ref(false)
const scanPreviewData = ref<ScanPreview | null>(null)
const scanResult = ref<ScanResult | null>(null)

const scanFileTypeCounts = computed(() => {
  if (!scanPreviewData.value?.files) return {}
  const counts: Record<string, number> = {}
  for (const f of scanPreviewData.value.files) {
    const ext = f.extension || '(unknown)'
    counts[ext] = (counts[ext] || 0) + 1
  }
  return counts
})

const uploadRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

// Detail dialog
const detailDialogVisible = ref(false)
const detailDoc = ref<KnowledgeDocument | null>(null)
const detailLoading = ref(false)

const renderedDetailContent = computed(() => {
  if (!detailDoc.value?.content) return ''
  return renderMarkdown(detailDoc.value.content)
})

// Wiki state
const wikiPages = ref<WikiPage[]>([])
const wikiListLoading = ref(false)
const wikiSelectedDocId = ref<number | undefined>()
const wikiGenerateLoading = ref(false)
const wikiRegenerateLoading = ref<number | null>(null)
const wikiDetailVisible = ref(false)
const wikiDetailPage = ref<WikiPage | null>(null)
const wikiDetailLoading = ref(false)

const parsedWikiSections = computed(() => {
  if (!wikiDetailPage.value?.sections) return []
  try {
    return JSON.parse(wikiDetailPage.value.sections) as WikiSection[]
  } catch {
    return []
  }
})

// Graph state
const graphData = ref<GraphData | null>(null)
const graphDataLoading = ref(false)
const graphStats = ref<GraphStats>({ entityCount: 0, relationshipCount: 0, entityTypes: {}, relationshipTypes: {} })
const graphSearchQuery = ref('')
const graphSearchMode = ref('关联')
const graphTargetEntity = ref('')
const graphSearchLoading = ref(false)
const graphEntityTypeFilter = ref('')
const graphEntityTypes = ref<string[]>([])
const filteredGraphEntities = ref<GraphEntity[]>([])
const entityDetailVisible = ref(false)
const entityDetail = ref<GraphEntity | null>(null)
const entityDetailLoading = ref(false)

// ---- Category color mapping ----
const categoryColors: Record<string, string> = {
  '开发规范': '#409EFF',
  '业务规则': '#67C23A',
  'CLAUDE.md': '#E6A23C',
  '技术文档': '#909399',
  '其他': '#F56C6C'
}

function getCategoryColor(category: string): string {
  return categoryColors[category] || '#909399'
}

function getProductLineDisplayName(name: string): string {
    const pl = productLines.value.find(p => p.name === name)
    return pl?.displayName || name
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return '#67C23A'
  if (score >= 0.5) return '#E6A23C'
  return '#F56C6C'
}

// ---- Helpers ----

function parseTags(tags: string): string[] {
  if (!tags) return []
  return tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

function truncate(text: string | undefined, maxLen: number): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function highlightSnippet(content: string): string {
  const snippet = truncate(content, 200)
  // Escape HTML
  const escaped = snippet
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Highlight search query if present
  if (searchQuery.value) {
    const query = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(${query})`, 'gi')
    return escaped.replace(re, '<mark>$1</mark>')
  }
  return escaped
}

// ---- Data fetching ----

async function fetchDocuments() {
  listLoading.value = true
  try {
    const result = await knowledgeApi.listDocuments(
      selectedCategory.value || undefined,
      currentSourceType.value,
      selectedProductLine.value || undefined,
      filterModule.value || undefined,
      filterFunctionPoint.value || undefined,
      selectedTag.value || undefined,
      currentPage.value - 1,
      pageSize.value
    )
    documents.value = result.content
    totalElements.value = result.totalElements
    fetchProductLines()
    fetchColumns()
  } catch (err: any) {
    ElMessage.error('获取文档列表失败: ' + (err.message || '未知错误'))
  } finally {
    listLoading.value = false
  }
}

async function fetchModules() {
  try {
    modules.value = await knowledgeApi.listModules(currentSourceType.value || undefined)
  } catch { /* optional */ }
}

async function fetchFunctionPoints() {
  try {
    functionPoints.value = await knowledgeApi.listFunctionPoints(currentSourceType.value || undefined)
  } catch { /* optional */ }
}

async function fetchColumns() {
  try {
    const desc: any = await knowledgeApi.listColumns()
    columnsDescriptor.value = {
      columns: desc.columns ?? [],
      tags: desc.tags ?? [],
      hasModule: !!desc.hasModule,
      hasFunctionPoint: !!desc.hasFunctionPoint,
      hasSourceUrl: !!desc.hasSourceUrl
    }
    allTags.value = desc.tags ?? []
    // 初始化列显隐（默认全部显示），从 localStorage 恢复
    const saved = loadColumnVisibility()
    const vis: Record<string, boolean> = {}
    for (const c of columnsDescriptor.value.columns) {
      vis[c] = saved[c] !== undefined ? saved[c] : true
    }
    columnVisibility.value = vis
    // 固定列显隐（默认按 FIXED_COLUMNS 的 defaultVisible，从 localStorage 恢复）
    const savedFixed = loadFixedColumnVisibility()
    const fvis: Record<string, boolean> = {}
    for (const c of FIXED_COLUMNS) {
      fvis[c.key] = savedFixed[c.key] !== undefined ? savedFixed[c.key] : c.defaultVisible
    }
    fixedColumnVisibility.value = fvis
    // 扫描 Tab 列显隐（独立于文书Spec Tab）
    const savedScanFixed = loadScanFixedColumnVisibility()
    const sfvis: Record<string, boolean> = {}
    for (const c of SCAN_FIXED_COLUMNS) {
      sfvis[c.key] = savedScanFixed[c.key] !== undefined ? savedScanFixed[c.key] : c.defaultVisible
    }
    scanFixedColumnVisibility.value = sfvis
  } catch { /* optional */ }
}

function loadColumnVisibility(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem('kv_column_visibility') || '{}')
  } catch { return {} }
}

function saveColumnVisibility() {
  try {
    localStorage.setItem('kv_column_visibility', JSON.stringify(columnVisibility.value))
  } catch { /* ignore */ }
}

function loadFixedColumnVisibility(): Record<string, boolean> {
  try {
    const raw = JSON.parse(localStorage.getItem('kv_fixed_column_visibility') || '{}')
    // 过滤掉已不在 FIXED_COLUMN_KEYS 中的历史键（如已移除的 sourceType/contentPreview）
    const cleaned: Record<string, boolean> = {}
    for (const k of Object.keys(raw)) {
      if (FIXED_COLUMN_KEYS.includes(k)) cleaned[k] = raw[k]
    }
    return cleaned
  } catch { return {} }
}

function saveFixedColumnVisibility() {
  try {
    localStorage.setItem('kv_fixed_column_visibility', JSON.stringify(fixedColumnVisibility.value))
  } catch { /* ignore */ }
}

function loadScanFixedColumnVisibility(): Record<string, boolean> {
  try {
    const raw = JSON.parse(localStorage.getItem('kv_scan_fixed_column_visibility') || '{}')
    const cleaned: Record<string, boolean> = {}
    for (const k of Object.keys(raw)) {
      if (SCAN_FIXED_COLUMN_KEYS.includes(k)) cleaned[k] = raw[k]
    }
    return cleaned
  } catch { return {} }
}

function saveScanFixedColumnVisibility() {
  try {
    localStorage.setItem('kv_scan_fixed_column_visibility', JSON.stringify(scanFixedColumnVisibility.value))
  } catch { /* ignore */ }
}

function isColumnVisible(col: string): boolean {
  return columnVisibility.value[col] !== false
}

function toggleColumn(col: string) {
  columnVisibility.value[col] = !isColumnVisible(col)
  saveColumnVisibility()
}

function onContextFilterChange() {
  currentPage.value = 1
  fetchDocuments()
}

function clearContextFilters() {
  filterModule.value = ''
  filterFunctionPoint.value = ''
  selectedTag.value = ''
  currentPage.value = 1
  fetchDocuments()
}

// 高级筛选行：分类 / 产品线下拉（Element select 的 change 事件传值）
function selectCategoryFromFilter(val: string) {
  selectedCategory.value = val
  if (isSearchMode.value) {
    isSearchMode.value = false
    searchQuery.value = ''
    searchResults.value = []
  }
  currentPage.value = 1
  fetchDocuments()
}

function selectProductLineFromFilter(val: string) {
  selectedProductLine.value = val
  currentPage.value = 1
  fetchDocuments()
}

// 清除全部筛选（分类/产品线/模块/功能点/标签）
function clearAllFilters() {
  selectedCategory.value = ''
  selectedProductLine.value = ''
  filterModule.value = ''
  filterFunctionPoint.value = ''
  selectedTag.value = ''
  currentPage.value = 1
  fetchDocuments()
}

function colLabel(col: string): string {
  if (col === 'module') return '模块'
  if (col === 'functionPoint') return '功能点'
  if (col === 'sourceUrl') return '来源链接'
  if (col.startsWith('field_')) return col.substring(6)
  return col
}

async function fetchCategories() {
  try {
    categories.value = await knowledgeApi.listCategories(currentSourceType.value || undefined)
  } catch {
    // Silently fail - categories are optional enhancement
  }
}

async function fetchProductLines() {
  try {
    productLines.value = await knowledgeApi.listProductLines()
  } catch {
    // Silently fail
  }
}

// ---- Event handlers ----

function selectCategory(cat: string) {
  selectedCategory.value = cat
  currentPage.value = 1
  // Clear search mode if active
  if (isSearchMode.value) {
    isSearchMode.value = false
    searchQuery.value = ''
    searchResults.value = []
  }
  fetchDocuments()
}

function selectProductLine(productLine: string) {
  selectedProductLine.value = productLine
  currentPage.value = 1
  fetchDocuments()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchDocuments()
}

function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  fetchDocuments()
}

async function handleSearch() {
  const q = searchQuery.value.trim()
  if (!q) {
    clearSearch()
    return
  }
  isSearchMode.value = true
  searchLoading.value = true
  try {
    const result: any = await knowledgeApi.searchKnowledge(q, 20, searchMode.value, {
      category: selectedCategory.value || undefined,
      sourceType: currentSourceType.value || undefined,
      productLine: selectedProductLine.value || undefined,
      module: filterModule.value || undefined,
      functionPoint: filterFunctionPoint.value || undefined
    })
    searchResults.value = result.results ?? []
    graphContexts.value = result.graphContexts ?? []
    mergedContext.value = result.mergedContext ?? ''
    if (result.degraded) {
      ElMessage.warning(result.degradeReason || '已降级为关键词检索')
    }
  } catch (err: any) {
    ElMessage.error('搜索失败: ' + (err.message || '未知错误'))
  } finally {
    searchLoading.value = false
  }
}

function clearSearch() {
  isSearchMode.value = false
  searchQuery.value = ''
  searchResults.value = []
  graphContexts.value = []
  mergedContext.value = ''
}

function handleRowClick(row: KnowledgeDocument) {
  openDetail(row)
}

async function openDetail(doc: KnowledgeDocument) {
  detailDialogVisible.value = true
  detailLoading.value = true
  detailDoc.value = null
  try {
    detailDoc.value = await knowledgeApi.getDocument(doc.id)
  } catch (err: any) {
    ElMessage.error('获取文档详情失败: ' + (err.message || '未知错误'))
  } finally {
    detailLoading.value = false
  }
}

async function openDetailById(id: number) {
  detailDialogVisible.value = true
  detailLoading.value = true
  detailDoc.value = null
  try {
    detailDoc.value = await knowledgeApi.getDocument(id)
  } catch (err: any) {
    ElMessage.error('获取文档详情失败: ' + (err.message || '未知错误'))
  } finally {
    detailLoading.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await knowledgeApi.deleteDocument(id)
    ElMessage.success('删除成功')
    fetchDocuments()
    fetchCategories()
  } catch (err: any) {
    ElMessage.error('删除失败: ' + (err.message || '未知错误'))
  }
}

async function handleReindex() {
  try {
    const res = await knowledgeApi.reindex()
    ElMessage.success(`重新索引完成，处理 ${res.processed} 个文档`)
  } catch (err: any) {
    ElMessage.error('重新索引失败: ' + (err.message || '未知错误'))
  }
}

async function handleKnowledgeStatus() {
  try {
    const status: KnowledgeStatus = await knowledgeApi.status()
    const lines = [
      `文档总数: ${status.totalDocuments}`,
      `向量检索: ${status.vectorSearchEnabled ? '已启用' : '未启用'}`,
      `Wiki 页数: ${status.wikiTotal}`,
      `Wiki 状态: ${JSON.stringify(status.wikiByStatus || {})}`,
      `图谱实体/关系: ${JSON.stringify(status.graphStats || {})}`
    ]
    ElMessageBox.alert(lines.join('<br/>'), '知识库状态', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    })
  } catch (err: any) {
    ElMessage.error('获取状态失败: ' + (err.message || '未知错误'))
  }
}

function handleUploadExceed() {
  ElMessage.warning('只能上传一个文件')
}

const handleEdit = async (row: any) => {
  editDocId.value = row.id
  // 获取完整文档内容（列表接口只返回摘要）
  try {
    const detail = await knowledgeApi.getDocument(row.id)
    uploadForm.value = {
      title: detail.title || '',
      category: detail.category || '',
      tags: detail.tags || '',
      productLine: detail.productLine || '',
      module: detail.module || '',
      functionPoint: detail.functionPoint || '',
      url: '',
      textContent: detail.content || ''
    }
  } catch {
    uploadForm.value = {
      title: row.title || '',
      category: row.category || '',
      tags: row.tags || '',
      productLine: row.productLine || '',
      module: row.module || '',
      functionPoint: row.functionPoint || '',
      url: '',
      textContent: row.content || ''
    }
  }
  uploadMode.value = 'text'
  editDialogVisible.value = true
}

async function handleUpload() {
  if (!uploadFormRef.value) return
  const valid = await uploadFormRef.value.validate().catch(() => false)
  if (!valid) return

  uploadLoading.value = true
  try {
    if (editDocId.value) {
      // Update mode
      await knowledgeApi.updateDocument(editDocId.value, {
        title: uploadForm.value.title,
        category: uploadForm.value.category,
        tags: uploadForm.value.tags,
        productLine: uploadForm.value.productLine || undefined,
        module: uploadForm.value.module || undefined,
        functionPoint: uploadForm.value.functionPoint || undefined,
        content: uploadForm.value.textContent
      })
      ElMessage.success('更新成功')
    } else {
      // Create mode
      if (uploadMode.value === 'link') {
        if (!uploadForm.value.url.trim()) {
          ElMessage.warning('请输入链接 URL')
          uploadLoading.value = false
          return
        }
        await knowledgeApi.uploadDocument({
          title: uploadForm.value.title || uploadForm.value.url,
          content: '',
          category: uploadForm.value.category,
          tags: uploadForm.value.tags,
          sourceType: uploadSourceType.value || 'link',
          sourceUrl: uploadForm.value.url,
          productLine: uploadForm.value.productLine || undefined,
          module: uploadForm.value.module || undefined,
          functionPoint: uploadForm.value.functionPoint || undefined
        })
      } else if (uploadMode.value === 'file') {
        if (fileList.value.length === 0) {
          ElMessage.warning('请选择文件')
          uploadLoading.value = false
          return
        }
        const rawFile = fileList.value[0]?.raw as UploadRawFile
        if (!rawFile) {
          ElMessage.warning('文件无效')
          uploadLoading.value = false
          return
        }
        const formData = new FormData()
        formData.append('file', rawFile)
        formData.append('title', uploadForm.value.title)
        formData.append('category', uploadForm.value.category)
        formData.append('tags', uploadForm.value.tags)
        if (uploadSourceType.value) formData.append('sourceType', uploadSourceType.value)
        if (uploadForm.value.productLine) formData.append('productLine', uploadForm.value.productLine)
        if (uploadForm.value.module) formData.append('module', uploadForm.value.module)
        if (uploadForm.value.functionPoint) formData.append('functionPoint', uploadForm.value.functionPoint)
        await knowledgeApi.uploadDocument(formData)
      } else {
        if (!uploadForm.value.textContent.trim()) {
          ElMessage.warning('请输入文档内容')
          uploadLoading.value = false
          return
        }
        await knowledgeApi.uploadDocument({
          title: uploadForm.value.title,
          content: uploadForm.value.textContent,
          category: uploadForm.value.category,
          tags: uploadForm.value.tags,
          sourceType: uploadSourceType.value || 'TEXT',
          productLine: uploadForm.value.productLine || undefined,
          module: uploadForm.value.module || undefined,
          functionPoint: uploadForm.value.functionPoint || undefined
        })
      }
      ElMessage.success('上传成功')
    }
    editDialogVisible.value = false
    uploadDialogVisible.value = false
    editDocId.value = null
    resetUploadForm()
    fetchDocuments()
    fetchCategories()
  } catch (err: any) {
    ElMessage.error('上传失败: ' + (err.message || '未知错误'))
  } finally {
    uploadLoading.value = false
  }
}

function resetUploadForm() {
  uploadForm.value = { title: '', category: '', tags: '', productLine: '', module: '', functionPoint: '', textContent: '', url: '' }
  fileList.value = []
  editDocId.value = null
  uploadFormRef.value?.resetFields()
}

// ---- Scan helpers ----

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

async function handleScanPreview() {
  const dir = scanDirectory.value.trim()
  if (!dir) return
  scanPreviewLoading.value = true
  scanPreviewData.value = null
  try {
    scanPreviewData.value = await scanApi.preview(dir)
  } catch (err: any) {
    ElMessage.error('预览失败: ' + (err.message || '未知错误'))
  } finally {
    scanPreviewLoading.value = false
  }
}

async function handleScan() {
  const dir = scanDirectory.value.trim()
  if (!dir) return
  scanLoading.value = true
  scanResult.value = null
  try {
    scanResult.value = await scanApi.scan(dir, scanCategory.value.trim() || undefined)
    ElMessage.success('扫描完成')
    fetchDocuments()
    fetchCategories()
  } catch (err: any) {
    ElMessage.error('扫描失败: ' + (err.message || '未知错误'))
  } finally {
    scanLoading.value = false
  }
}

// ---- Wiki helpers ----

function parseWikiConcepts(concepts: string): string[] {
  if (!concepts) return []
  return concepts.split(/[,，]/).map(c => c.trim()).filter(Boolean)
}

function getWikiStatusType(status: string): 'success' | 'warning' | 'danger' | 'primary' | 'info' {
  const typeMap: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'info'> = {
    GENERATED: 'success',
    GENERATING: 'warning',
    FAILED: 'danger',
    GRAPH_READY: 'primary'
  }
  return typeMap[status] || 'info'
}

function getWikiStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    GENERATED: '已生成',
    GENERATING: '生成中',
    FAILED: '失败',
    GRAPH_READY: '图谱就绪'
  }
  return labelMap[status] || status
}

function renderWikiSection(content: string): string {
  return renderMarkdown(content)
}

async function fetchWikiPages() {
  if (!wikiSelectedDocId.value) {
    wikiPages.value = []
    return
  }
  wikiListLoading.value = true
  try {
    wikiPages.value = await wikiApi.listByDocument(wikiSelectedDocId.value)
  } catch (err: any) {
    ElMessage.error('获取 Wiki 页面列表失败: ' + (err.message || '未知错误'))
  } finally {
    wikiListLoading.value = false
  }
}

async function handleGenerateWiki() {
  if (!wikiSelectedDocId.value) return
  wikiGenerateLoading.value = true
  try {
    await wikiApi.generateForDocument(wikiSelectedDocId.value)
    ElMessage.success('Wiki 生成任务已启动')
    fetchWikiPages()
  } catch (err: any) {
    ElMessage.error('启动 Wiki 生成失败: ' + (err.message || '未知错误'))
  } finally {
    wikiGenerateLoading.value = false
  }
}

async function handleRegenerateWiki(id: number) {
  wikiRegenerateLoading.value = id
  try {
    await wikiApi.regenerate(id)
    ElMessage.success('重新生成任务已启动')
    fetchWikiPages()
  } catch (err: any) {
    ElMessage.error('启动重新生成失败: ' + (err.message || '未知错误'))
  } finally {
    wikiRegenerateLoading.value = null
  }
}

async function handleDeleteWiki(id: number) {
  try {
    await wikiApi.delete(id)
    ElMessage.success('删除成功')
    fetchWikiPages()
  } catch (err: any) {
    ElMessage.error('删除失败: ' + (err.message || '未知错误'))
  }
}

async function openWikiDetail(page: WikiPage) {
  wikiDetailVisible.value = true
  wikiDetailLoading.value = true
  wikiDetailPage.value = null
  try {
    wikiDetailPage.value = await wikiApi.getById(page.id)
  } catch (err: any) {
    ElMessage.error('获取 Wiki 详情失败: ' + (err.message || '未知错误'))
  } finally {
    wikiDetailLoading.value = false
  }
}

// ---- Graph helpers ----

async function fetchGraphData() {
  graphDataLoading.value = true
  try {
    graphData.value = await graphApi.getVisualizationData(200)
    if (graphData.value?.nodes) {
      filteredGraphEntities.value = graphData.value.nodes
      graphEntityTypes.value = [...new Set(graphData.value.nodes.map(n => n.type))]
    }
  } catch (err: any) {
    ElMessage.error('获取图谱数据失败: ' + (err.message || '未知错误'))
  } finally {
    graphDataLoading.value = false
  }
}

async function fetchGraphStats() {
  try {
    graphStats.value = await graphApi.getStats()
  } catch (err: any) {
    ElMessage.error('获取图谱统计失败: ' + (err.message || '未知错误'))
  }
}

function filterGraphEntities() {
  if (!graphData.value?.nodes) {
    filteredGraphEntities.value = []
    return
  }
  if (!graphEntityTypeFilter.value) {
    filteredGraphEntities.value = graphData.value.nodes
  } else {
    filteredGraphEntities.value = graphData.value.nodes.filter(
      n => n.type === graphEntityTypeFilter.value
    )
  }
}

function handleGraphSearch() {
  // For now, just filter the existing data by name
  if (!graphData.value?.nodes) return
  const query = graphSearchQuery.value.trim().toLowerCase()
  if (!query) {
    filteredGraphEntities.value = graphData.value.nodes
  } else {
    filteredGraphEntities.value = graphData.value.nodes.filter(
      n => n.name.toLowerCase().includes(query)
    )
  }
}

function handleGraphNodeClick(entity: GraphEntity) {
  openEntityDetail(entity)
}

async function openEntityDetail(entity: GraphEntity) {
  entityDetailVisible.value = true
  entityDetailLoading.value = true
  entityDetail.value = null
  try {
    entityDetail.value = await graphApi.getById(entity.id)
  } catch (err: any) {
    ElMessage.error('获取实体详情失败: ' + (err.message || '未知错误'))
  } finally {
    entityDetailLoading.value = false
  }
}

// ---- Lifecycle ----

// Watch for tab changes to load data
watch(activeTab, (newTab, oldTab) => {
  // Always clear search state when switching between different tabs
  if (newTab !== oldTab) {
    isSearchMode.value = false
    searchQuery.value = ''
    searchResults.value = []
    graphContexts.value = []
    mergedContext.value = ''
    currentPage.value = 1
  }

  // Load tab-specific data
  if (newTab === 'documents' || newTab === 'scan' || newTab === 'sop') {
    fetchDocuments()
    fetchProductLines()
  } else if (newTab === 'wiki') {
    if (documents.value.length === 0) {
      fetchDocuments()
    }
  } else if (newTab === 'graph') {
    fetchGraphData()
    fetchGraphStats()
  }
})

onMounted(() => {
  fetchDocuments()
  fetchCategories()
  fetchProductLines()
  fetchModules()
  fetchFunctionPoints()
  fetchColumns()
})
</script>

<style scoped>
/* 知识库页面使用全宽，不受全局 max-width: 1400px 限制 */
.page-container {
  max-width: 100%;
}

.knowledge-view {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 百度首页风格：居中搜索区（对照经典版 baidu.com 真实样式参数） ===== */
.kv-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px 28px;
}

.kv-hero__title {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 8px;
  color: #222;
  margin-bottom: 26px;
  text-indent: 8px; /* 抵消 letter-spacing 末字符间距，保持视觉居中 */
}

/* 搜索框：直角、灰边框（对应 .s_ipt_wr，hover 加深 / focus 变蓝 #4791ff） */
.kv-searchbar {
  display: flex;
  width: 640px;
  max-width: 100%;
  height: 36px;
  background: #fff;
  border: 1px solid #b6b6b6;
  border-color: #7b7b7b #b6b6b6 #b6b6b6 #7b7b7b;
  transition: border-color 0.15s;
}

.kv-searchbar:hover {
  border-color: #999 #b3b3b3 #b3b3b3 #999;
}

.kv-searchbar:focus-within {
  border-color: #4791ff #4791ff #4791ff #4791ff;
}

.kv-searchbar__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  padding: 0 7px;
  font-size: 16px;
  font-family: arial, "Microsoft YaHei", sans-serif;
  color: #222;
  background: transparent;
}

.kv-searchbar__input::placeholder {
  color: #aaa;
}

/* 搜索按钮：对应 .s_btn（#3385ff，hover #317ef3，按下 #3075dc 内阴影） */
.kv-searchbar__btn {
  width: 100px;
  flex-shrink: 0;
  border: none;
  border-bottom: 1px solid #2d78f4;
  background: #3385ff;
  color: #fff;
  font-size: 15px;
  letter-spacing: 1px;
  cursor: pointer;
}

.kv-searchbar__btn:hover {
  background: #317ef3;
  border-bottom-color: #2868c8;
  box-shadow: 1px 1px 1px #ccc;
}

.kv-searchbar__btn:active {
  background: #3075dc;
  box-shadow: inset 1px 1px 5px #2964bb;
}

/* 搜索框下方文字链接：对应 .mnav（加粗 13px #333 下划线，hover #0000cc） */
.kv-hero__links {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  line-height: 24px;
}

.kv-hero__links-label {
  color: #999;
  font-size: 13px;
}

.kv-hero__link {
  color: #333;
  font-size: 13px;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.kv-hero__link:hover {
  color: #0000cc;
}

.kv-hero__link--active {
  color: #0000cc;
}

.kv-hero__link--clear {
  color: #f56c6c;
}

.kv-hero__link--clear:hover {
  color: #f23c3c;
}

/* ===== 操作按钮栏：右对齐 ===== */
.kv-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-top: 12px;
}
.kv-toolbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}


/* ===== P2 空状态引导 ===== */
.kv-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  background: var(--el-bg-color);
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}
.kv-empty-state__text {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 12px;
}

/* Category tabs (legacy) */
.kv-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.kv-category-tag {
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.kv-category-tag:hover {
  opacity: 0.85;
}

.kv-category-tag--active {
  font-weight: bold;
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.kv-product-lines {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
  margin-bottom: 8px;
}

.kv-product-line-tag {
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.kv-product-line-tag:hover {
  opacity: 0.85;
}

.kv-product-line-tag--active {
  font-weight: bold;
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

/* Source type tabs */
.kv-source-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
  margin-bottom: 8px;
}

.kv-source-tag {
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.kv-source-tag:hover {
  opacity: 0.85;
}

.kv-source-tag--active {
  font-weight: bold;
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

/* Document list */
.kv-document-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.kv-doc-title {
  color: var(--el-color-primary);
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
}

.kv-doc-title:hover {
  text-decoration: underline;
}

.kv-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}

.kv-preview {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.kv-empty-text {
  color: var(--el-text-color-placeholder);
}

.kv-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
  flex-shrink: 0;
}


/* Detail dialog */
.kv-detail__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.kv-detail__source {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.kv-detail__date {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

.kv-detail__content {
  line-height: 1.8;
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-word;
  overflow: auto;
  max-height: 60vh;
}

/* Markdown content styling */
.kv-detail__content :deep(h1),
.kv-detail__content :deep(h2),
.kv-detail__content :deep(h3) {
  margin: 16px 0 8px;
  color: var(--el-text-color-primary);
}

.kv-detail__content :deep(h1) { font-size: 22px; }
.kv-detail__content :deep(h2) { font-size: 18px; }
.kv-detail__content :deep(h3) { font-size: 16px; }

.kv-detail__content :deep(p) {
  margin: 8px 0;
}

.kv-detail__content :deep(ul),
.kv-detail__content :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}

.kv-detail__content :deep(code) {
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}

.kv-detail__content :deep(pre) {
  background: var(--el-fill-color-light);
  padding: 12px 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.kv-detail__content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.kv-detail__content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.kv-detail__content :deep(th),
.kv-detail__content :deep(td) {
  border: 1px solid var(--el-border-color-lighter);
  padding: 8px 12px;
  text-align: left;
}

.kv-detail__content :deep(th) {
  background: var(--el-fill-color-light);
  font-weight: 600;
}

.kv-detail__content :deep(blockquote) {
  border-left: 4px solid var(--el-color-primary);
  padding: 8px 16px;
  margin: 12px 0;
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-regular);
}

.kv-detail__content :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}

.kv-detail__content :deep(a:hover) {
  text-decoration: underline;
}

.kv-detail__content :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

/* Upload dialog */
.el-upload__text em {
  color: var(--el-color-primary);
  font-style: normal;
}

/* 视图切换 + 内容布局（分段切换器，替代原树形导航） */
.kv-nav {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.kv-content {
  min-width: 0;
}

.kv-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
}



/* Scan section */
.kv-scan-section {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.kv-scan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  background: var(--el-fill-color-lighter);
  border-radius: 6px 6px 0 0;
  transition: background 0.2s;
}

.kv-scan-header:hover {
  background: var(--el-fill-color-light);
}

.kv-scan-header__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kv-scan-header__arrow {
  transition: transform 0.2s;
  color: var(--el-text-color-secondary);
}

.kv-scan-header__arrow--expanded {
  transform: rotate(90deg);
}

.kv-scan-body {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kv-scan-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0;
}

.kv-scan-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kv-scan-preview__summary {
  font-size: 13px;
  color: var(--el-text-color-regular);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.kv-scan-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kv-scan-result__errors {
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-8);
  border-radius: 4px;
  padding: 10px 12px;
}

.kv-scan-result__errors-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-danger);
  margin-bottom: 6px;
}

.kv-scan-result__error-item {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  padding: 2px 0;
}

/* 上下文筛选 */
.kv-context-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}
.kv-context-filters__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}


/* 链接相关 */
.kv-doc-link {
  color: var(--el-color-primary);
  text-decoration: none;
  word-break: break-all;
}
.kv-doc-link:hover {
  text-decoration: underline;
}
</style>
