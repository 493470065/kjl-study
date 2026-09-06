<template>
  <page-container title="多语专项">
    <!-- ===== 顶部：例会入口 + 关键里程碑速览 ===== -->
    <div class="ml-topbar">
      <div class="ml-meeting">
        <div class="ml-meeting__title">
          <el-icon><Bell /></el-icon>
          <span>多语专项周例会 · 每周三 17:00-18:00</span>
          <el-tag size="small" type="info">2026-07-29 ~ 10-28</el-tag>
        </div>
        <div class="ml-meeting__ops">
          <el-button size="small" type="primary" plain @click="openUrl(MEETING.url)">
            <el-icon><VideoCamera /></el-icon> 进入会议
          </el-button>
          <el-button size="small" @click="copyText(MEETING.room, '会议号已复制')">会议号 {{ MEETING.room }}</el-button>
          <el-button size="small" @click="openUrl(DOC_SEEDS[0].url)">
            <el-icon><Document /></el-icon> 任务跟踪表
          </el-button>
        </div>
      </div>
      <div class="ml-kpis">
        <div v-for="k in kpis" :key="k.label" class="ml-kpi">
          <div class="ml-kpi__value" :style="{ color: k.color }">{{ k.value }}</div>
          <div class="ml-kpi__label">{{ k.label }}</div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="ml-tabs">
      <!-- ==================== Tab 1: 里程碑（甘特图 · 手动维护） ==================== -->
      <el-tab-pane label="甘特图" name="milestones">
        <div class="ml-toolbar">
          <el-button type="primary" size="small" @click="openMilestoneDialog()">
            <el-icon><Plus /></el-icon> 新增里程碑
          </el-button>
          <el-button size="small" @click="openUrl(DOC_SEEDS[0].url)">
            <el-icon><Document /></el-icon> 打开任务跟踪表
          </el-button>
          <el-button size="small" type="success" plain :loading="syncing" @click="syncFromSheet">
            <el-icon><Refresh /></el-icon> 同步跟踪表
          </el-button>
          <span class="ml-toolbar__tip">
            口径：点击「同步跟踪表」从金山文档拉取最新 WBS 覆盖甘特图；也可点击条形或名称手动编辑。
          </span>
          <el-radio-group v-model="ganttLevel" size="small" class="ml-level-switch">
            <el-radio-button value="l1">一级里程碑</el-radio-button>
            <el-radio-button value="all">含二级任务</el-radio-button>
          </el-radio-group>
          <span class="ml-legend">
            <span v-for="lg in GANTT_LEGEND" :key="lg.label" class="ml-legend__item">
              <i :style="{ background: lg.color }" />{{ lg.label }}
            </span>
          </span>
        </div>

        <!-- 甘特图 -->
        <div v-if="ganttDays.length" ref="ganttEl" class="gantt"
             :style="{ '--gantt-day-w': `${ganttDayW}px`, '--gantt-label-w': `${ganttLabelW}px`, '--gantt-eval-w': `${ganttEvalW}px` }" v-loading="false">
          <div class="gantt__inner" :style="{ width: `${ganttLabelW + ganttEvalW + ganttDays.length * ganttDayW}px` }">
            <!-- 表头：月份 + 日期 -->
            <div class="gantt__row gantt__row--head">
              <div class="gantt__label gantt__label--head">里程碑（{{ ganttMilestones.length }}）</div>
              <div class="gantt__track gantt__track--head">
                <div class="gantt__months">
                  <div v-for="mo in ganttMonths" :key="mo.key" class="gantt__month"
                       :style="{ width: `${mo.days * ganttDayW}px` }">{{ mo.label }}</div>
                </div>
                <div class="gantt__days">
                  <div v-for="(d, i) in ganttDays" :key="d" class="gantt__day"
                       :class="{ 'gantt__day--weekend': isWeekendDay(i), 'gantt__day--today': d === todayStr() }">
                    {{ dayNum(d) }}
                  </div>
                </div>
              </div>
              <div class="gantt__eval gantt__eval--head">AI 阶段评估</div>
            </div>
            <!-- 数据行 -->
            <div v-for="m in ganttMilestones" :key="m.id" class="gantt__row" :class="{ 'gantt__row--l2': m.level === 2 }">
              <div class="gantt__label" :title="`${milestoneStatus(m)} · ${m.planStart || '?'} ~ ${m.planEnd || '?'}${m.owner ? ' · ' + m.owner : ''}`"
                   @click="openMilestoneDialog(m)">
                <span class="gantt__label-name">{{ m.name }}</span>
                <span class="gantt__label-owner">{{ m.owner || m.phase }}</span>
              </div>
              <div class="gantt__track" @click="openMilestoneDialog(m)">
                <div class="gantt__bar" :style="ganttBarStyle(m)" :class="`gantt__bar--${milestoneStatus(m)}`"
                     :title="`${m.name}｜${milestoneStatus(m)}｜进度 ${m.progress || 0}%｜${m.planStart || '?'} ~ ${m.planEnd || '?'}${m.note ? '｜' + m.note : ''}`">
                  <div class="gantt__bar-progress" :style="{ width: `${m.progress || 0}%` }" />
                  <span class="gantt__bar-text">{{ m.progress || 0 }}%</span>
                </div>
              </div>
              <div class="gantt__eval">
                <template v-if="latestMsEval(m.id)">
                  <div class="gantt__eval-sum" title="点击查看 AI 评估详情" @click="openMsEval(m)">
                    <i class="gantt__eval-dot" :class="`gantt__eval-dot--${msEvalRisk(m.id)}`" />
                    <span class="gantt__eval-text">{{ msEvalSummary(m.id) }}</span>
                  </div>
                  <el-button class="gantt__eval-btn" size="small" link type="primary"
                             :loading="msEvaluating === m.id" @click="runMsEval(m)">
                    <el-icon v-if="msEvaluating !== m.id"><MagicStick /></el-icon>
                  </el-button>
                </template>
                <el-button v-else size="small" type="primary" plain
                           :loading="msEvaluating === m.id" @click="runMsEval(m)">
                  <el-icon v-if="msEvaluating !== m.id"><MagicStick /></el-icon> AI 评估
                </el-button>
              </div>
            </div>
            <!-- 今日线（覆盖所有行，绝对定位） -->
            <div v-if="todayX != null" class="gantt__today-line" :style="{ left: `${ganttLabelW + todayX + ganttDayPx / 2}px` }" />
          </div>
        </div>
        <el-empty v-else description="暂无已排期的里程碑：点击「新增里程碑」填写计划开始/完成日期后生成甘特图" />

        <!-- 未排期里程碑 -->
        <template v-if="unscheduledMilestones.length">
          <h3 class="ml-sec-title">未排期里程碑（{{ unscheduledMilestones.length }}）</h3>
          <div class="ml-unsched">
            <el-tag v-for="m in unscheduledMilestones" :key="m.id" class="ml-unsched__tag"
                    :type="milestoneTagType(m) as any" size="large" @click="openMilestoneDialog(m)">
              {{ m.name }} · {{ milestoneStatus(m) }}
            </el-tag>
          </div>
        </template>

        <!-- 里程碑 AI 评估详情抽屉：轻量评估（甘特图列） + 完整 6 维评估 -->
        <el-drawer v-model="showMsEval" :title="`AI 阶段评估 · ${msEvalMilestone?.name || ''}`" size="45%">
          <template v-if="msEvalMilestone">
            <div class="ml-eval-hist" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
              <el-button size="small" type="primary" plain :loading="msEvaluating === msEvalMilestone.id" @click="runMsEval(msEvalMilestone)">
                <el-icon v-if="msEvaluating !== msEvalMilestone.id"><MagicStick /></el-icon> 轻量评估（进度+风险）
              </el-button>
              <el-button size="small" type="success" plain :loading="msFullEvaluating === msEvalMilestone.id" @click="runMsFullEval(msEvalMilestone)">
                <el-icon v-if="msFullEvaluating !== msEvalMilestone.id"><MagicStick /></el-icon> 完整 6 维评估
              </el-button>
              <span class="ml-dim" style="font-size:12px;">完整评估：进度 / 质量风险 / 依赖阻塞 / 资源协作 / 时间窗口 / 趋势动量</span>
            </div>
            <!-- 最新完整 6 维评估 -->
            <template v-if="latestMsFullEval">
              <div class="ml-eval-hist__time" style="margin-top:12px;">
                最新完整评估 · {{ latestMsFullEval.at }}
                <el-tag v-if="msFullScore != null" size="small" :type="msFullScore >= 80 ? 'success' : msFullScore >= 60 ? 'warning' : 'danger'"
                        style="margin-left:8px;">健康分 {{ msFullScore }}</el-tag>
              </div>
              <div class="ml-md" v-html="renderMarkdown(latestMsFullEval.result)"></div>
            </template>
            <el-alert v-else type="info" :closable="false" style="margin-top:12px;"
                      title="尚未生成完整 6 维评估"
                      description="甘特图列展示的是轻量评估（仅进度+风险）。点击上方「完整 6 维评估」获取进度健康度、质量风险、依赖阻塞、资源协作、时间窗口、趋势动量的全景判断与健康分。" />
            <!-- 历史记录（轻量 + 完整） -->
            <div v-for="(ev, i) in msEvalHistory" :key="i" class="ml-eval-hist" style="margin-top:10px;">
              <div class="ml-eval-hist__time">
                {{ ev.at }}
                <el-tag size="small" :type="ev.type === 'full' ? 'success' : 'info'" style="margin-left:6px;">
                  {{ ev.type === 'full' ? '完整' : '轻量' }}
                </el-tag>
              </div>
              <div class="ml-md" v-html="renderMarkdown(ev.result)"></div>
            </div>
            <el-empty v-if="!msEvalHistory.length" description="暂无评估记录" />
          </template>
        </el-drawer>
      </el-tab-pane>

      <!-- ==================== Tab 2: 每周总结（人工录入） ==================== -->
      <el-tab-pane label="每周总结" name="weeks">
        <div class="ml-toolbar">
          <el-button type="primary" size="small" @click="openWeekDialog()">
            <el-icon><Plus /></el-icon> 录入本周总结
          </el-button>
          <span class="ml-toolbar__tip">口径：将每周例会后的邮件内容人工录入，AI 评估阶段进度时会自动参考最近 2 条。</span>
        </div>
        <el-empty v-if="!weeks.length" description="暂无每周总结，点击右上角「录入本周总结」开始" />
        <el-collapse v-else>
          <el-collapse-item v-for="w in weeks" :key="w.id" :name="w.id">
            <template #title>
              <div class="ml-week-title">
                <el-tag size="small" type="info" disable-transitions>{{ weekLabel(w) }}</el-tag>
                <span class="ml-week-title__text">{{ w.title }}</span>
                <span class="ml-week-title__date">{{ w.dateFrom }} ~ {{ w.dateTo }}</span>
                <span class="ml-week-title__ops" @click.stop>
                  <el-button link type="primary" size="small" @click="openWeekDialog(w)">编辑</el-button>
                  <el-popconfirm title="确认删除该周总结？" confirm-button-text="删除" cancel-button-text="取消"
                                 @confirm="removeWeek(w.id)">
                    <template #reference>
                      <el-button link type="danger" size="small">删除</el-button>
                    </template>
                  </el-popconfirm>
                </span>
              </div>
            </template>
            <div class="ml-week-body">{{ w.content }}</div>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>

      <!-- ==================== Tab 4: 重要文档 ==================== -->
      <el-tab-pane label="重要文档" name="docs">
        <div class="ml-toolbar">
          <el-button type="primary" size="small" @click="openDocDialog()">
            <el-icon><Plus /></el-icon> 新增文档
          </el-button>
          <span class="ml-toolbar__tip">口径：核心文档的概述与直达链接，点击卡片可跳转查看完整内容。</span>
        </div>
        <div class="ml-docs">
          <div v-for="d in docs" :key="d.id" class="ml-doc" @click="openUrl(d.url)">
            <div class="ml-doc__title">
              <el-icon><Document /></el-icon>
              <span>{{ d.name }}</span>
            </div>
            <div class="ml-doc__desc">{{ d.summary || '（未填写概述）' }}</div>
            <div class="ml-doc__ops">
              <span class="ml-doc__link">{{ d.url }}</span>
              <span class="ml-doc__btns" @click.stop>
                <el-button link type="primary" size="small" @click="openDocDialog(d)">编辑</el-button>
                <el-popconfirm title="确认删除该文档？" confirm-button-text="删除" cancel-button-text="取消"
                               @confirm="removeDoc(d.id)">
                  <template #reference>
                    <el-button link type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ==================== Tab 5: 环境与账号 ==================== -->
      <el-tab-pane label="环境与账号" name="env">
        <div class="ml-env-grid">
          <div class="ml-env">
            <div class="ml-env__title"><el-icon><Monitor /></el-icon> 运维环境</div>
            <div class="ml-env__rows">
              <div class="ml-env__row"><span class="k">入口</span>
                <span class="v"><a href="javascript:void(0)" @click="openUrl(ENV.opsUrl)">{{ ENV.opsUrl }}</a>
                  <el-button link size="small" @click="copyText(ENV.opsUrl)">复制</el-button></span></div>
              <div class="ml-env__row"><span class="k">微服务分组</span><span class="v">{{ ENV.microserviceGroup }}</span></div>
            </div>
          </div>
          <div class="ml-env">
            <div class="ml-env__title"><el-icon><Coin /></el-icon> 数据库（压测环境）</div>
            <div class="ml-env__rows">
              <div class="ml-env__row"><span class="k">分组</span><span class="v">{{ ENV.db.group }}</span></div>
              <div class="ml-env__row"><span class="k">地址</span>
                <span class="v">{{ ENV.db.ip }}:{{ ENV.db.port }} / {{ ENV.db.name }}
                  <el-button link size="small" @click="copyText(`${ENV.db.ip}:${ENV.db.port}/${ENV.db.name}`)">复制</el-button></span></div>
              <div class="ml-env__row"><span class="k">账号</span><span class="v">{{ ENV.db.user }} / {{ ENV.db.password }}</span></div>
              <div class="ml-env__row"><span class="k">SOID</span><span class="v">{{ ENV.db.soid }}</span></div>
            </div>
          </div>
          <div class="ml-env">
            <div class="ml-env__title"><el-icon><HomeFilled /></el-icon> WiNEX Portal</div>
            <div class="ml-env__rows">
              <div class="ml-env__row"><span class="k">地址</span>
                <span class="v"><a href="javascript:void(0)" @click="openUrl(ENV.portalUrl)">{{ ENV.portalUrl }}</a>
                  <el-button link size="small" @click="copyText(ENV.portalUrl)">复制</el-button></span></div>
              <div class="ml-env__row"><span class="k">默认密码</span><span class="v">{{ ENV.portalPassword }}</span></div>
              <div class="ml-env__row"><span class="k">访问医院</span><span class="v">{{ ENV.hospital }}</span></div>
              <div class="ml-env__row"><span class="k">超级管理员</span><span class="v">admin（注意：不要用超级管理员改其他条线信息）</span></div>
            </div>
          </div>
          <div class="ml-env">
            <div class="ml-env__title"><el-icon><Platform /></el-icon> 交付平台</div>
            <div class="ml-env__rows">
              <div class="ml-env__row"><span class="k">地址</span>
                <span class="v"><a href="javascript:void(0)" @click="openUrl(ENV.deliverUrl)">{{ ENV.deliverUrl }}</a>
                  <el-button link size="small" @click="copyText(ENV.deliverUrl)">复制</el-button></span></div>
              <div class="ml-env__row"><span class="k">说明文档</span>
                <span class="v"><a href="javascript:void(0)" @click="openUrl(ENV.deliverDocUrl)">多语数据资源流转说明图</a></span></div>
            </div>
          </div>
        </div>

        <h3 class="ml-sec-title">测试账号（{{ ENV.hospital }}）</h3>
        <el-table :data="ENV.accounts" border size="small">
          <el-table-column prop="code" label="账号" width="110" />
          <el-table-column prop="role" label="角色" min-width="180" />
          <el-table-column prop="password" label="密码" width="140" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- ===== 里程碑编辑弹窗 ===== -->
    <el-dialog v-model="msDialogVisible" :title="msForm.id ? '编辑里程碑' : '新增里程碑'" width="520px">
      <el-form :model="msForm" label-width="88px">
        <el-form-item label="名称" required>
          <el-input v-model="msForm.name" placeholder="如：多语功能合并公版 260330" />
        </el-form-item>
        <el-form-item label="所属阶段">
          <el-select v-model="msForm.phase" style="width: 100%">
            <el-option v-for="st in stages" :key="st.key" :label="st.title" :value="st.title" />
            <el-option label="未归类" value="未归类" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划时间">
          <div style="display:flex; gap:8px; width:100%">
            <el-date-picker v-model="msForm.planStart" type="date" value-format="YYYY-MM-DD" placeholder="开始"
                            style="flex:1" />
            <el-date-picker v-model="msForm.planEnd" type="date" value-format="YYYY-MM-DD" placeholder="完成"
                            style="flex:1" />
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="msForm.status" style="width: 100%">
            <el-option v-for="s in MS_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="进度">
          <el-slider v-model="msForm.progress" :max="100" show-input input-size="small" style="width:100%" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="msForm.owner" placeholder="可空" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="msForm.note" type="textarea" :rows="2" placeholder="对照跟踪表的更新说明/风险备注（可空）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="msDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMilestone">保存</el-button>
      </template>
    </el-dialog>

    <!-- ===== 每周总结编辑弹窗 ===== -->
    <el-dialog v-model="weekDialogVisible" :title="weekForm.id ? '编辑周总结' : '录入本周总结'" width="620px">
      <el-form :model="weekForm" label-width="88px">
        <el-form-item label="标题" required>
          <el-input v-model="weekForm.title" placeholder="如：W36 周报（邮件标题）" />
        </el-form-item>
        <el-form-item label="周期">
          <div style="display:flex; gap:8px; width:100%">
            <el-date-picker v-model="weekForm.dateFrom" type="date" value-format="YYYY-MM-DD" placeholder="开始"
                            style="flex:1" />
            <el-date-picker v-model="weekForm.dateTo" type="date" value-format="YYYY-MM-DD" placeholder="结束"
                            style="flex:1" />
          </div>
        </el-form-item>
        <el-form-item label="邮件内容" required>
          <el-input v-model="weekForm.content" type="textarea" :rows="10"
                    placeholder="粘贴每周邮件原文（可含进展、风险、下周计划），保存后供 AI 评估参考" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="weekDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitWeek">保存</el-button>
      </template>
    </el-dialog>

    <!-- ===== 文档编辑弹窗 ===== -->
    <el-dialog v-model="docDialogVisible" :title="docForm.id ? '编辑文档' : '新增文档'" width="520px">
      <el-form :model="docForm" label-width="72px">
        <el-form-item label="名称" required>
          <el-input v-model="docForm.name" placeholder="文档名称" />
        </el-form-item>
        <el-form-item label="概述">
          <el-input v-model="docForm.summary" type="textarea" :rows="3" placeholder="一句话说明文档用途" />
        </el-form-item>
        <el-form-item label="链接" required>
          <el-input v-model="docForm.url" placeholder="https://..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="docDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDoc">保存</el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Bell, VideoCamera, Document, Plus, MagicStick, Monitor, Coin, HomeFilled, Platform, Refresh
} from '@element-plus/icons-vue'
import PageContainer from '@/components/PageContainer.vue'
import { journalApi } from '@/api/journal'
import { chatApi } from '@/api/chat'
import { useMarkdown } from '@/composables/useMarkdown'

const { renderMarkdown } = useMarkdown()
const SCOPE = 'ml-special'

// ==================== 常量：会议 / 文档 / 环境（预置种子，可编辑的存 journal） ====================

const MEETING = {
  title: '多语专项周例会',
  time: '每周三 17:00-18:00（2026-07-29 ~ 10-28）',
  url: 'https://meeting.tencent.com/dm/mnRGApQ3Loop',
  room: '415-3498-0360'
}

/** 重要文档预置（首次打开自动播种，可在界面增删改） */
const DOC_SEEDS = [
  { name: '多语专项各条线任务跟踪表', url: 'https://www.kdocs.cn/l/cbxysrydp6nH', summary: '各条线任务分配与进度总表；里程碑页签的数据来源与核对基准。' },
  { name: '多语言技术对接方案', url: 'https://www.kdocs.cn/l/ctxxw9YWrqwN', summary: '多语产品对接文档：技术方案、接入方式与各条线改造要点。' },
  { name: '规划单圣保罗医院模块清单-V1.0', url: 'https://www.kdocs.cn/l/cleqEEMGx6qW', summary: '越南项目上线产品清单（圣保罗医院模块规划）。' },
  { name: '如何识别代码仓库是否为原生产品', url: 'https://www.kdocs.cn/l/cuhQGt34FZSI', summary: '代码仓库原生产品识别方法，合并前判断仓库归属与基线用。' },
  { name: '多语分支策略', url: 'https://www.kdocs.cn/l/ca7Owm2byuru', summary: '多语分支管理策略：分支模型、合并规则与公版防污染约定。' },
  { name: '多语数据资源流转说明图', url: 'https://www.kdocs.cn/l/cgJxtzpdGIwq', summary: '多语数据资源在各平台间的流转路径说明（交付平台配套）。' },
  { name: '多语资源管理平台操作文档', url: 'https://winwiki.winning.com.cn/pages/viewpage.action?pageId=204178123', summary: '多语资源管理平台的操作手册（WiKi）。' },
  { name: '多语方案宣讲会录制', url: 'https://meeting.tencent.com/crm/2Gv6vw188b', summary: '2026-08-07 多语方案宣讲会录制回放。' },
  { name: '多语专项交付物共享目录', url: 'https://www.kdocs.cn/join/gq81eka', summary: '交付物协作目录：各条线交付文档统一归档入口。' }
]

const ENV = {
  opsUrl: 'http://172.16.9.87:8089/cluster/action/login/login',
  microserviceGroup: 'WiNEX多语开发测试环境',
  db: { group: '压测环境 WIN60_260815', ip: '172.16.6.136', port: '1521', name: 'WIN60_260815', user: 'WINDBA', password: 'Winex#WIN60#2026', soid: '995059' },
  portalUrl: 'http://172.16.6.130/portal/login',
  portalPassword: 'abcd@1234',
  hospital: '标准第一医院东院区',
  deliverUrl: 'http://172.16.6.133:8090/deliver/#/home',
  deliverDocUrl: 'https://www.kdocs.cn/l/cgJxtzpdGIwq',
  accounts: [
    { code: 'WN001', role: '收费操作员', password: 'abcd@1234' },
    { code: 'WN005', role: '医技操作员', password: 'abcd@1234' },
    { code: 'WN004', role: '药房操作员', password: 'abcd@1234' },
    { code: 'WN042', role: '麻醉医生', password: 'abcd@1234' },
    { code: 'WN003', role: '药库操作员', password: 'abcd@1234' },
    { code: 'WN006', role: '临床医生', password: 'abcd@1234' },
    { code: 'WN008', role: '门诊护士', password: 'abcd@1234' },
    { code: 'WN010', role: '病区护士长', password: 'abcd@1234' },
    { code: 'WN009', role: '病区护士', password: 'abcd@1234' },
    { code: 'WN011', role: '护理部主任', password: 'abcd@1234' },
    { code: 'WN015', role: '门诊药房操作员', password: 'abcd@1234' },
    { code: 'WN013', role: '业务科室主任', password: 'abcd@1234' },
    { code: 'WN012', role: '门办管理员', password: 'abcd@1234' }
  ]
}

// ==================== 数据模型与持久化 ====================

interface Milestone {
  id: string; name: string; phase: string
  planStart?: string; planEnd?: string
  status: string; progress: number
  owner?: string; note?: string
  /** WBS 层级：1=一级里程碑（汇总），2=二级任务；缺省视为 1 */
  level?: 1 | 2
}
interface WeekItem { id: string; title: string; dateFrom?: string; dateTo?: string; content: string }
interface DocItem { id: string; name: string; url: string; summary?: string }
interface AiEval { stage: string; type?: 'light' | 'full'; at: string; result: string }

const MS_STATUS = ['未开始', '进行中', '已完成', '已延期']
const stages = [
  { key: 'merge', title: '需求合并', desc: '多语功能逐需求合并进公版 260330（合并窗口 09-14 ~ 09-18）' },
  { key: 'verify', title: '回归验证', desc: '国内公版无污染验证 + 多语功能回归测试' },
  { key: 'release', title: '随版发布', desc: '2026-10-15 随公版 260330 发布' },
  { key: 'support', title: '上线支持', desc: '发布后条线支持与越南项目（圣保罗医院）准备' }
]

const activeTab = ref('milestones')
const milestones = ref<Milestone[]>([])
const weeks = ref<WeekItem[]>([])
const docs = ref<DocItem[]>([])

// ---- WBS 种子：来源「多语专项各条线任务跟踪表」- 公共技术中心WBS（2026-09-06 同步） ----
const WBS_L1: Milestone[] = [
  { id: 'wbs-1', name: '1 项目启动', phase: '前期准备', level: 1, planStart: '2026-07-27', planEnd: '2026-07-27', status: '已完成', progress: 100, owner: '薛文华' },
  { id: 'wbs-2', name: '2 框架改造', phase: '前期准备', level: 1, planStart: '2026-07-27', planEnd: '2026-08-04', status: '已完成', progress: 100, owner: '李超' },
  { id: 'wbs-3', name: '3 各条线拉多语分支', phase: '前期准备', level: 1, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '李超', note: '分支统一命名为：refactor/wi18n' },
  { id: 'wbs-4', name: '4 各条线多语功能改造', phase: '前期准备', level: 1, planStart: '2026-08-06', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '康景磊', note: '改造方案：https://www.kdocs.cn/l/ctxxw9YWrqwN' },
  { id: 'wbs-5', name: '5 资源提取/翻译', phase: '前期准备', level: 1, planStart: '2026-08-14', planEnd: '2026-08-28', status: '已完成', progress: 100, owner: '李超', note: '多语平台操作手册：https://winwiki.winning.com.cn/pages/viewpage.action?pageId=204178123' },
  { id: 'wbs-6', name: '6 各条线澳门多语翻译UED需求回归', phase: '回归验证', level: 1, planStart: '2026-08-17', planEnd: '2026-08-31', status: '已延期', progress: 0, owner: '康景磊', note: 'WinCode : tfs-git-analysis' },
  { id: 'wbs-7', name: '7 国际患者多语化服务', phase: '上线支持', level: 1, planStart: '2026-09-21', planEnd: '2026-09-30', status: '未开始', progress: 0, owner: '康景磊', note: '合并主分支后在主分支直接合并' },
  { id: 'wbs-8', name: '8 第一轮自测+UED界面调整', phase: '回归验证', level: 1, planStart: '', planEnd: '', status: '未开始', progress: 0 },
  { id: 'wbs-9', name: '9 第二轮集成测试+优化改造', phase: '回归验证', level: 1, planStart: '2026-09-01', planEnd: '2026-09-13', status: '进行中', progress: 0 },
  { id: 'wbs-10', name: '10 合并公版', phase: '需求合并', level: 1, planStart: '2026-09-14', planEnd: '2026-09-18', status: '未开始', progress: 0, note: '初定时间' },
  { id: 'wbs-11', name: '11 公版多语集成测试', phase: '回归验证', level: 1, planStart: '2026-09-21', planEnd: '2026-09-25', status: '未开始', progress: 0, note: '初定时间' },
  { id: 'wbs-12', name: '12 各条线澳门多语业务类需求回归', phase: '回归验证', level: 1, planStart: '2026-09-28', planEnd: '2026-10-15', status: '未开始', progress: 0, note: '初定时间' },
  { id: 'wbs-13', name: '13 多语言版本正式发布', phase: '随版发布', level: 1, planStart: '2026-10-15', planEnd: '2026-10-15', status: '未开始', progress: 0, note: '初定时间' },
]
const WBS_L2: Milestone[] = [
  { id: 'wbs-1_1', name: '多语专项启动会', phase: '前期准备', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0 },
  { id: 'wbs-2_1', name: '原生/生态/NET 三类技术栈产品对接技术方案', phase: '前期准备', level: 2, planStart: '2026-07-27', planEnd: '2026-08-04', status: '已完成', progress: 100, owner: '范慧芳' },
  { id: 'wbs-2_2', name: '原生/生态产品JAVA后端词条扫描SKILL', phase: '前期准备', level: 2, planStart: '2026-07-27', planEnd: '2026-08-04', status: '已完成', progress: 100, owner: '范慧芳', note: 'WinCode : i18n-scan' },
  { id: 'wbs-2_3', name: '生态产品JAVA后端翻译架包', phase: '前期准备', level: 2, planStart: '2026-07-27', planEnd: '2026-08-04', status: '已完成', progress: 100, owner: '范慧芳' },
  { id: 'wbs-2_4', name: '原生产品前端词条扫描SKILL', phase: '前期准备', level: 2, planStart: '2026-07-27', planEnd: '2026-08-04', status: '已完成', progress: 100, owner: '范慧芳', note: 'WinCode : vue-i18n-extract' },
  { id: 'wbs-2_5', name: '基础数据属性多语维护方案', phase: '前期准备', level: 2, planStart: '2026-07-27', planEnd: '2026-08-04', status: '已完成', progress: 100, owner: '范慧芳' },
  { id: 'wbs-2_6', name: '241215多语需求扫描SKILL', phase: '前期准备', level: 2, planStart: '2026-07-27', planEnd: '2026-08-04', status: '已完成', progress: 100, owner: '李超', note: 'WinCode : tfs-git-analysis' },
  { id: 'wbs-3_1', name: 'HIS财务', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '胡剑/匡匆尚', note: '【金山文档 | WPS云文档】 多语专项HIS财务任务跟踪表 https://www.kdocs.cn/l/cae9bDuYkmby' },
  { id: 'wbs-3_2', name: 'HIS药品', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '任春晖', note: '【金山文档 | WPS云文档】 药库药房仓库说明 https://www.kdocs.cn/l/cnIGb05YI9pZ' },
  { id: 'wbs-3_3', name: '临床住院医生站', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '朱礼深', note: 'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/W.in-MVP/_git/winning-winex-inpatient-doctor-order http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Inpatient/_git/winning-webui-inpatient-ordersearch http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Inpatient/_git/winning-webui-admin-clinical-inpatient http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Inpatient/_git/winning-webui-inpatient-bedcard-ipt http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Inpatient/_git/winning-webui-inpatient-ordersearch http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Inpatient/_git/winning-web-jindal' },
  { id: 'wbs-3_4', name: '临床病历文书', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '王国伟', note: 'https://www.kdocs.cn/l/ctftttAb3bAh 查看sheet【仓库列表】' },
  { id: 'wbs-3_5', name: '临床住院护士站', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '徐佳栋', note: 'https://www.kdocs.cn/l/ce7yLnNbvuy2 查看“单需求多语改造 - 护理仓库”SHEET页' },
  { id: 'wbs-3_6', name: '临床门急诊医生站', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '翟庄钦', note: 'https://www.kdocs.cn/l/ctKnFVp95RwL' },
  { id: 'wbs-3_7', name: '医技LIS', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '潘建军', note: 'http://tfs2018-web.winning.com.cn:8080/tfs/WN_TECH/_git/LIS60?_a=contents&version=GBdev_mlanguage' },
  { id: 'wbs-3_8', name: '医技RIS', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '姚艳彤', note: '前端： http://tfs2018-web.winning.com.cn:8080/tfs/WN_TECH/WiNEX_PACS/_git/winning-web-pacs http://tfs2018-web.winning.com.cn:8080/tfs/WN_TECH/WiNEX_PACS/_git/winning-web-screen 后端： http://tfs2018-web.winning.com.cn:8080/tfs/WN_TECH/WiNEX_PACS/_git/winning-bas-pacs http://tfs2018-web.winning.com.cn:8080/tfs/WN_TECH/WiNEX_PACS/_git/winning-bas-screen' },
  { id: 'wbs-3_9', name: '医技输血', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '潘建军', note: 'http://tfs2018-web.winning.com.cn:8080/tfs/WN_TECH/_git/LIS60?_a=contents&version=GBdev_mlanguage' },
  { id: 'wbs-3_10', name: 'WiNEX MY', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '王超', note: '多语专项MY任务跟踪表https://www.kdocs.cn/l/cmynDba5v0NE' },
  { id: 'wbs-3_11', name: '卫宁付', phase: '前期准备', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0, owner: '余涛', note: '就一套SAAS版本，已经支持多语。' },
  { id: 'wbs-3_12', name: '集成信息平台', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '程玮玲/郑德俊', note: 'esb-smms-aio-edge：http://tfs2018-web.winning.com.cn:8080/tfs/wn_data_platform/IP-01-%E9%9B%86%E6%88%90%E5%B9%B3%E5%8F%B0%E7%AE%A1%E7%90%86%E8%BD%AF%E4%BB%B6/IP-01-%E9%9B%86%E6%88%90%E5%B9%B3%E5%8F%B0%E7%AE%A1%E7%90%86%E8%BD%AF%E4%BB%B6%20%E5%9B%A2%E9%98%9F/_git/esb-smms-aio-edge esb-smms-aio-business：http://tfs2018-web.winning.com.cn:8080/tfs/wn_data_platform/IP-01-%E9%9B%86%E6%88%90%E5%B9%B3%E5%8F%B0%E7%AE%A1%E7%90%86%E8%BD%AF%E4%BB%B6/IP-01-%E9%9B%86%E6%88%90%E5%B9%B3%E5%8F%B0%E7%AE%A1%E7%90%86%E8%BD%AF%E4%BB%B6%20%E5%9B%A2%E9%98%9F/_git/esb-smms-aio-business' },
  { id: 'wbs-3_13', name: '闭环', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '程玮玲/黄明海', note: '闭环质控后端： http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-DCP/_git/winning-dcp-cycle-data-audit  闭环质控前端： http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-DCP/_git/winning-dcp-cycle-data-audit-web  闭环解析后端: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-DCP/_git/winning-dcp-ias-gateway  闭环定义态&调阅后端： http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-DCP/_git/winning-dcp-mas  闭环定义态前端： http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-DCP/_git/winning-webui-dcp-cycle  闭环业务态前端: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-DCP/_git/winning-webui-biz-cycle' },
  { id: 'wbs-3_14', name: '危急值', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '程玮玲/李小龙', note: '后端:  winning-winex-critical-report: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/W.in-MVP/_git/winning-winex-critical-report?_a=contents&version=GBrefactor%2Fwi18n 前端: winning-web-criticalvalue-manager: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/W.in-MVP/_git/winning-web-criticalvalue-manager?_a=contents&version=GBrefactor%2Fwi18n winning-webui-admin-mdm: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/W.in-MVP/_git/winning-webui-admin-mdm?_a=contents&version=GBrefactor%2Fwi18n' },
  { id: 'wbs-3_15', name: '医技报告', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '程玮玲/李小龙', note: '后端: winning-winex-report:  http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/W.in-MVP/_git/winning-winex-report?_a=contents&version=GBrefactor%2Fwi18n 前端: winning-webui-medtech-report: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Outpatient/_git/winning-webui-medtech-report?_a=contents&version=GBrefactor%2Fwi18n winning-webmaterial-bos: http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/W.in-MVP/_git/winning-webmaterial-bos?_a=contents&version=GBrefactor%2Fwi18n' },
  { id: 'wbs-3_16', name: 'FHIR集成', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '程玮玲/李小龙', note: 'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-Integration/_git/winning-ias-fhir-base?_a=contents&version=GBrefactor%2Fwi18n' },
  { id: 'wbs-3_18', name: '患者360', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '程玮玲/李坤' },
  { id: 'wbs-3_19', name: '数据中心平台', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '吴铭', note: '【金山文档 | WPS云文档】多语言改造，WBS与分支路径都在一个文档 https://www.kdocs.cn/l/clYLXs5m9O1h' },
  { id: 'wbs-3_2x', name: '主数据', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '徐龙', note: 'https://www.kdocs.cn/l/cgPz1ITxfKVu' },
  { id: 'wbs-3_21', name: '业务中台', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '范慧芳', note: 'https://www.kdocs.cn/l/cgPz1ITxfKVu' },
  { id: 'wbs-3_22', name: '医务管理系统', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '朱博君', note: 'https://www.kdocs.cn/l/cq0NFxzmbaGm' },
  { id: 'wbs-3_23', name: '自助服务管理系统', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '武兴亚/汪宁波', note: 'http://tfs2018-web.winning.com.cn:8080/tfs/WN_HIS/%E8%87%AA%E5%8A%A9%E6%9C%BA(HSS)/_git/HSSM_SERVER_60?version=GBdevelop-wining-i18n http://tfs2018-web.winning.com.cn:8080/tfs/WN_HIS/%E6%82%A3%E8%80%85%E6%9C%8D%E5%8A%A1%E5%B9%B3%E5%8F%B0/_git/pssp-boot.web?version=GBdevelop-hssm_i18n http://tfs2018-web.winning.com.cn:8080/tfs/WN_HIS/%E6%82%A3%E8%80%85%E6%9C%8D%E5%8A%A1%E5%B9%B3%E5%8F%B0/_git/pssp-boot.server/commits?itemPath=%2F&itemVersion=GBdevelop-hssm-wining-i18n http://tfs2018-web.winning.com.cn:8080/tfs/WN_HIS/%E6%82%A3%E8%80%85%E6%9C%8D%E5%8A%A1%E5%B9%B3%E5%8F%B0/_git/pssp-boot.tools/commits?itemPath=%2F&itemVersion=GBdevelop-winning-i18n http://tfs2018-web.winning.com.cn:8080/tfs/WN_HIS/%E8%87%AA%E5%8A%A9%E6%9C%BA(HSS)/_git/HSS_WEB_60?version=GBdevelop-wining-i18n' },
  { id: 'wbs-3_24', name: '门诊分诊与叫号管理系统', phase: '前期准备', level: 2, planStart: '2026-08-05', planEnd: '2026-08-05', status: '已完成', progress: 100, owner: '黄曦光', note: '后端： http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/W.in-MVP/_git/winning-winex-triage 前端： http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/W.in-MVP/_git/winning-webui-admin-triage-encounter http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/W.in-MVP/_git/winning-web-triage-main http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0/WiNEX-HospitalAdministration/_git/winning-web-triage-outpatient' },
  { id: 'wbs-4_1', name: 'HIS财务', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '胡剑/匡匆尚', note: '多语回归公版在后续计划中执行' },
  { id: 'wbs-4_2', name: 'HIS药品', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-14', status: '已完成', progress: 100, owner: '任春晖', note: '【金山文档 | WPS云文档】 药房药库公版多语改造计划 https://www.kdocs.cn/l/cdEv5NVvRZb6' },
  { id: 'wbs-4_3', name: '临床住院医生站', phase: '前期准备', level: 2, planStart: '2026-08-12', planEnd: '2026-08-14', status: '已完成', progress: 100, owner: '朱礼深', note: '存在大量常量+变量的组合，再用提示词修正，不包含功能改造和页面样式调整' },
  { id: 'wbs-4_4', name: '临床病历文书', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-14', status: '已完成', progress: 100, owner: '王国伟' },
  { id: 'wbs-4_5', name: '临床住院护士站', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-14', status: '已完成', progress: 100, owner: '徐佳栋', note: 'https://www.kdocs.cn/l/ce7yLnNbvuy2' },
  { id: 'wbs-4_6', name: '临床门急诊医生站', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '翟庄钦', note: 'https://www.kdocs.cn/l/ctKnFVp95RwL，   临床配置有个仓库在试点改造VUE3，后续改造' },
  { id: 'wbs-4_7', name: '医技LIS', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-14', status: '已完成', progress: 100, owner: '潘建军' },
  { id: 'wbs-4_8', name: '医技RIS', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '姚艳彤' },
  { id: 'wbs-4_9', name: '医技输血', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-14', status: '已完成', progress: 100, owner: '潘建军' },
  { id: 'wbs-4_10', name: 'WiNEX MY', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-26', status: '已完成', progress: 100, owner: '王超', note: '完成改造-部署环境链接完成-测试中 多语专项MY任务跟踪表：https://www.kdocs.cn/l/cmynDba5v0NE 8月13:MY已完成服务端的改造统一接入接口 8月19:提供多端接口改造给MY，接口开始对接，原生端+H5端临床业务改造开始 8月19-8月26:涉及改造项：原生端（安卓/iOS/鸿蒙）、平台基础H5、移动住院业务、移动门诊业务、移动医务审批业务、移动会诊业务 备注：涉及多原生端整体方案改造，需改造后提供给MY接口，MY任务项拆分为依赖接口后执行与非依赖接口改造（依赖项与8月19日提供接口后开始.MY非依赖改造与8月13日结束）' },
  { id: 'wbs-4_11', name: '卫宁付', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-21', status: '已完成', progress: 100, owner: '余涛', note: '3.0产品体系：前端管理、运维、配置页面支持多语言' },
  { id: 'wbs-4_12', name: '集成信息平台', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '程玮玲/郑德俊' },
  { id: 'wbs-4_13', name: '闭环', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-14', status: '已完成', progress: 100, owner: '程玮玲/黄明海' },
  { id: 'wbs-4_14', name: '危急值', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '程玮玲/李小龙' },
  { id: 'wbs-4_15', name: '医技报告', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '程玮玲/李小龙' },
  { id: 'wbs-4_16', name: 'FHIR集成', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '程玮玲/李小龙' },
  { id: 'wbs-4_18', name: '患者360', phase: '前期准备', level: 2, planStart: '2026-08-11', planEnd: '2026-08-14', status: '已完成', progress: 100, owner: '程玮玲/李坤' },
  { id: 'wbs-4_19', name: '数据中心平台', phase: '前期准备', level: 2, planStart: '2026-08-11', planEnd: '2026-08-14', status: '已完成', progress: 100, owner: '吴铭' },
  { id: 'wbs-4_2x', name: '主数据', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-16', status: '已完成', progress: 100, owner: '徐龙' },
  { id: 'wbs-4_21', name: '业务中台', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '范慧芳' },
  { id: 'wbs-4_22', name: '医务管理系统', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-21', status: '已完成', progress: 100, owner: '张丽琴', note: '1、spark改造完成  2、7个仓库 目前6个改造完成 ，剩余一个21日前完成' },
  { id: 'wbs-4_23', name: '自助服务管理系统', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '武兴亚/汪宁波', note: '5个仓库，改造完5个' },
  { id: 'wbs-4_24', name: '门诊分诊与叫号管理系统', phase: '前期准备', level: 2, planStart: '2026-08-10', planEnd: '2026-08-13', status: '已完成', progress: 100, owner: '黄曦光', note: '4个仓库，改造完4个' },
  { id: 'wbs-5_1', name: '增量资源提取', phase: '前期准备', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0 },
  { id: 'wbs-5_2', name: '增量资源翻译', phase: '前期准备', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0 },
  { id: 'wbs-6_1', name: '整理澳门多语需求清单', phase: '回归验证', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0, note: '正常整理，8/21需要整理完成' },
  { id: 'wbs-6_2', name: '澳门多语需求回归多语专项分支', phase: '回归验证', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0, note: 'UED，翻译类要合并，业务需求类，放到主分支合并' },
  { id: 'wbs-7_1', name: '国际患者双语化扩展多语化方案', phase: '上线支持', level: 2, planStart: '2026-08-03', planEnd: '2026-08-06', status: '已完成', progress: 100, owner: '康景磊', note: 'https://www.kdocs.cn/team/3143728609/549615785735' },
  { id: 'wbs-7_2', name: '多语化方案宣讲', phase: '上线支持', level: 2, planStart: '2026-08-06', planEnd: '2026-08-07', status: '已完成', progress: 100, owner: '康景磊', note: 'https://www.kdocs.cn/team/3143728609/549615785735' },
  { id: 'wbs-7_3', name: '术语、名称等基础数据的映射关系', phase: '上线支持', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0, owner: '李超', note: 'https://www.kdocs.cn/l/cguTA4SufcuY' },
  { id: 'wbs-7_4', name: '多语化改造', phase: '上线支持', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0 },
  { id: 'wbs-8_1', name: 'UED验证', phase: '回归验证', level: 2, planStart: '2026-08-31', planEnd: '2026-09-02', status: '已完成', progress: 100, owner: '李慧', note: '确定好的系统与模块已走查完成' },
  { id: 'wbs-8_2', name: '各条线根据UED要求调整', phase: '回归验证', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0 },
  { id: 'wbs-9_1', name: '集成测试', phase: '回归验证', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0, owner: '夏坤' },
  { id: 'wbs-9_2', name: 'BUG修复', phase: '回归验证', level: 2, planStart: '', planEnd: '', status: '未开始', progress: 0 },
]

/** 默认里程碑 = WBS 一级 + 二级 + 本页补充项 */
const MILESTONE_SEEDS: Milestone[] = [
  ...WBS_L1,
  ...WBS_L2,
  { id: 'wbs-x-sp', name: '越南项目（圣保罗医院）上线准备', phase: '上线支持', level: 1, planStart: '', planEnd: '', status: '未开始', progress: 0, note: '产品清单见「规划单圣保罗医院模块清单-V1.0」' }
]

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 展示状态：已延期自动派生（计划完成早于今天且未完成），其余用人工维护状态 */
function milestoneStatus(m: Milestone): string {
  if (m.status === '已完成') return '已完成'
  if (m.planEnd && m.planEnd < todayStr()) return '已延期'
  return m.status || '未开始'
}
function milestoneTagType(m: Milestone): string {
  const s = milestoneStatus(m)
  return s === '已完成' ? 'success' : s === '已延期' ? 'danger' : s === '进行中' ? 'primary' : 'info'
}

const sortedMilestones = computed(() =>
  [...milestones.value].sort((a, b) => (a.planEnd || '9999').localeCompare(b.planEnd || '9999')))

// ==================== 甘特图（纯 CSS 实现，无第三方依赖） ====================

const GANTT_DAY_W = 26
/** 时间轴步长：每列代表的天数（2 = 一列两天） */
const GANTT_STEP = 2
const GANTT_LABEL_W = 240
const GANTT_LEGEND = [
  { label: '未开始', color: 'var(--el-color-info)' },
  { label: '进行中', color: 'var(--el-color-primary)' },
  { label: '已完成', color: 'var(--el-color-success)' },
  { label: '已延期', color: 'var(--el-color-danger)' }
]

function parseDate(s: string): Date {
  return new Date(`${s}T00:00:00`)
}
function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
function addDays(s: string, n: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return fmtDate(d)
}
/** days from a to b（b-a，同为 YYYY-MM-DD） */
function diffDays(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000)
}

/** 层级筛选：l1=只看一级里程碑，all=一级+二级任务 */
const ganttLevel = ref<'l1' | 'all'>('l1')
/** 已排期里程碑（同时具备开始与完成日期），按开始日期排序 */
const ganttMilestones = computed(() =>
  sortedMilestones.value
    .filter(m => (ganttLevel.value === 'all' ? true : m.level !== 2))
    .filter(m => m.planStart && m.planEnd && m.planStart <= m.planEnd))
/** 未排期（缺日期或起止倒挂）——与甘特图同层级筛选 */
const unscheduledMilestones = computed(() =>
  milestones.value
    .filter(m => (ganttLevel.value === 'all' ? true : m.level !== 2))
    .filter(m => !ganttMilestones.value.includes(m)))

const ganttRange = computed(() => {
  if (!ganttMilestones.value.length) return null
  const starts = ganttMilestones.value.map(m => m.planStart!)
  const ends = ganttMilestones.value.map(m => m.planEnd!)
  const min = starts.reduce((a, b) => (a < b ? a : b))
  const max = ends.reduce((a, b) => (a > b ? a : b))
  const start = addDays(min, -2)
  const end = addDays(max, 4)
  return { start, end }
})

/** 时间轴列：每列代表 GANTT_STEP 天，标签取该槽位首日 */
const ganttDays = computed<string[]>(() => {
  const r = ganttRange.value
  if (!r) return []
  const days: string[] = []
  let cur = r.start
  const total = diffDays(r.start, r.end)
  for (let i = 0; i <= total; i += GANTT_STEP) {
    days.push(cur)
    cur = addDays(cur, GANTT_STEP)
  }
  return days
})

/** 容器实测宽度：甘特图表格整体自适应容器宽，不出横向滚动 */
const ganttEl = ref<HTMLElement | null>(null)
const ganttWrapW = ref(0)
let ganttRO: ResizeObserver | null = null
/** 标签列自适应：容器窄时压缩（下限 150px），宽时不超过 240px */
const ganttLabelW = computed(() => {
  if (!ganttWrapW.value) return GANTT_LABEL_W
  return Math.min(GANTT_LABEL_W, Math.max(150, ganttWrapW.value * 0.24))
})
/** AI 评估列自适应：容器宽的 26%，260~340px */
const ganttEvalW = computed(() => {
  if (!ganttWrapW.value) return 300
  return Math.min(340, Math.max(260, ganttWrapW.value * 0.26))
})
/** 动态列宽：严格按 (容器宽 − 标签列 − 评估列 − 边框) / 列数 铺满整个可视区；极窄时保底 14px 才出滚动 */
const GANTT_MIN_DAY_W = 14
const ganttDayW = computed(() => {
  const cols = ganttDays.value.length
  if (!cols || !ganttWrapW.value) return GANTT_DAY_W
  return Math.max(GANTT_MIN_DAY_W, (ganttWrapW.value - ganttLabelW.value - ganttEvalW.value - 2) / cols)
})
/** 每天像素宽（随动态列宽联动） */
const ganttDayPx = computed(() => ganttDayW.value / GANTT_STEP)

/** 月份分组表头 */
const ganttMonths = computed(() => {
  const groups: { key: string; label: string; days: number }[] = []
  for (const d of ganttDays.value) {
    const key = d.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.days++
    else groups.push({ key, label: `${Number(d.slice(5, 7))}月`, days: 1 })
  }
  return groups
})

/** 槽位（GANTT_STEP 天）内含周末则灰显 */
function isWeekendDay(i: number): boolean {
  for (let k = 0; k < GANTT_STEP; k++) {
    const d = addDays(ganttDays.value[i], k)
    const day = parseDate(d).getDay()
    if (day === 0 || day === 6) return true
  }
  return false
}
function dayNum(d: string): number {
  return Number(d.slice(8, 10))
}
/** 今日在时间轴上的 X（px，相对 track 区，按天换算）；不在范围内为 null */
const todayX = computed<number | null>(() => {
  const r = ganttRange.value
  const t = todayStr()
  if (!r || t < r.start || t > r.end) return null
  return diffDays(r.start, t) * ganttDayPx.value
})

function ganttBarStyle(m: Milestone): Record<string, string> {
  const r = ganttRange.value!
  const left = Math.max(0, diffDays(r.start, m.planStart!)) * ganttDayPx.value
  const span = Math.max(1, diffDays(m.planStart!, m.planEnd!) + 1)
  return { left: `${left + 2}px`, width: `${span * ganttDayPx.value - 4}px` }
}

const kpis = computed(() => {
  const total = milestones.value.length
  const done = milestones.value.filter(m => milestoneStatus(m) === '已完成').length
  const late = milestones.value.filter(m => milestoneStatus(m) === '已延期').length
  const overall = total ? Math.round(milestones.value.reduce((s, m) => s + (Number(m.progress) || 0), 0) / total) : 0
  return [
    { label: '里程碑总数', value: String(total), color: 'var(--ink-text)' },
    { label: '整体进度', value: `${overall}%`, color: 'var(--el-color-primary)' },
    { label: '已完成', value: String(done), color: 'var(--el-color-success)' },
    { label: '已延期', value: String(late), color: 'var(--el-color-danger)' }
  ]
})

// ==================== 里程碑 CRUD ====================

const msDialogVisible = ref(false)
const msForm = reactive<Milestone>({ id: '', name: '', phase: '需求合并', planStart: '', planEnd: '', status: '未开始', progress: 0, owner: '', note: '' })

function openMilestoneDialog(m?: Milestone) {
  Object.assign(msForm, m ? { ...m } : { id: '', name: '', phase: '需求合并', planStart: '', planEnd: '', status: '未开始', progress: 0, owner: '', note: '' })
  msDialogVisible.value = true
}
async function submitMilestone() {
  if (!msForm.name.trim()) { ElMessage.warning('请填写里程碑名称'); return }
  const item: Milestone = { ...msForm, id: msForm.id || `ms-${Date.now()}`, name: msForm.name.trim() }
  const idx = milestones.value.findIndex(m => m.id === item.id)
  if (idx >= 0) milestones.value[idx] = item
  else milestones.value.push(item)
  msDialogVisible.value = false
  await persist()
}
async function removeMilestone(id: string) {
  milestones.value = milestones.value.filter(m => m.id !== id)
  await persist()
}

// ==================== 每周总结 CRUD ====================

const weekDialogVisible = ref(false)
const weekForm = reactive<WeekItem>({ id: '', title: '', dateFrom: '', dateTo: '', content: '' })

function weekLabel(w: WeekItem): string {
  if (w.dateFrom) {
    const d = new Date(w.dateFrom)
    if (!Number.isNaN(d.getTime())) {
      const onejan = new Date(d.getFullYear(), 0, 1)
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
      return `W${week}`
    }
  }
  return '周报'
}
function openWeekDialog(w?: WeekItem) {
  Object.assign(weekForm, w ? { ...w } : { id: '', title: '', dateFrom: '', dateTo: '', content: '' })
  weekDialogVisible.value = true
}
async function submitWeek() {
  if (!weekForm.title.trim()) { ElMessage.warning('请填写标题'); return }
  if (!weekForm.content.trim()) { ElMessage.warning('请粘贴邮件内容'); return }
  const item: WeekItem = { ...weekForm, id: weekForm.id || `wk-${Date.now()}`, title: weekForm.title.trim() }
  const idx = weeks.value.findIndex(w => w.id === item.id)
  if (idx >= 0) weeks.value[idx] = item
  else weeks.value.push(item)
  weeks.value.sort((a, b) => (b.dateFrom || '').localeCompare(a.dateFrom || ''))
  weekDialogVisible.value = false
  await persist()
}
async function removeWeek(id: string) {
  weeks.value = weeks.value.filter(w => w.id !== id)
  await persist()
}

// ==================== 重要文档 CRUD ====================

const docDialogVisible = ref(false)
const docForm = reactive<DocItem>({ id: '', name: '', url: '', summary: '' })

function openDocDialog(d?: DocItem) {
  Object.assign(docForm, d ? { ...d } : { id: '', name: '', url: '', summary: '' })
  docDialogVisible.value = true
}
async function submitDoc() {
  if (!docForm.name.trim() || !docForm.url.trim()) { ElMessage.warning('请填写名称与链接'); return }
  const item: DocItem = { ...docForm, id: docForm.id || `doc-${Date.now()}`, name: docForm.name.trim(), url: docForm.url.trim() }
  const idx = docs.value.findIndex(d => d.id === item.id)
  if (idx >= 0) docs.value[idx] = item
  else docs.value.push(item)
  docDialogVisible.value = false
  await persist()
}
async function removeDoc(id: string) {
  docs.value = docs.value.filter(d => d.id !== id)
  await persist()
}

// ==================== 里程碑 AI 阶段评估（甘特图列） ====================

function formatNow(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** stage 字段存里程碑 id */
const msEvals = ref<AiEval[]>([])
const msEvaluating = ref('')
const msFullEvaluating = ref('')
const showMsEval = ref(false)
const msEvalFor = ref('')
const msEvalMilestone = computed(() => milestones.value.find(m => m.id === msEvalFor.value) || null)
const msEvalHistory = computed(() => (msEvalFor.value ? msEvalsOf(msEvalFor.value) : []))

const msEvalsOf = (id: string) => msEvals.value.filter(e => e.stage === id)
/** 甘特图列优先取轻量评估（进度+风险），无轻量时回落最新任意类型 */
const latestMsEval = (id: string) => msEvalsOf(id).find(e => e.type !== 'full') || msEvalsOf(id)[0] || null

function openMsEval(m: Milestone) {
  msEvalFor.value = m.id
  showMsEval.value = true
}

/** 从评估结果解析风险等级：高→danger，中→warn，低→ok，无→none */
function msEvalRisk(id: string): 'high' | 'med' | 'low' | 'none' {
  const r = latestMsEval(id)?.result || ''
  const m = r.match(/【\s*([高中低])\s*】/)
  if (m?.[1] === '高') return 'high'
  if (m?.[1] === '中') return 'med'
  if (m?.[1] === '低') return 'low'
  return 'none'
}

/** 单元格摘要：取结果首个非标题非空行，去 Markdown 标记后截断 */
function msEvalSummary(id: string): string {
  const r = latestMsEval(id)?.result || ''
  const line = r.split('\n').map(s => s.trim())
    .filter(s => s && !s.startsWith('#') && !s.startsWith('|') && !s.startsWith('---'))
    .join(' ')
  const text = line.replace(/[*_`#>【】]/g, '').replace(/\s+/g, ' ').trim()
  return text.length > 60 ? text.slice(0, 60) + '…' : text || '（无内容）'
}

/** 轻量评估（甘特图列展示）：只看进度 + 风险，输出 ≤3 行 */
async function runMsEval(m: Milestone) {
  msEvaluating.value = m.id
  try {
    const recentWeeks = weeks.value.slice(0, 1)
    const weekText = recentWeeks.length
      ? recentWeeks.map(w => `【${weekLabel(w)} ${w.dateFrom || ''}~${w.dateTo || ''}】${w.title}\n${w.content}`).join('\n---\n')
      : '（暂无每周总结）'
    const prompt = [
      `你是项目管理助手，请对「多语专项」里程碑【${m.name}】做轻量评估（只看进度与风险，回答务必精炼）。`,
      `所属阶段：${m.phase || '未分组'}｜责任人：${m.owner || '未指定'}`,
      `状态：${milestoneStatus(m)}｜进度：${m.progress || 0}%｜计划：${m.planStart || '?'} ~ ${m.planEnd || '?'}｜今日：${todayStr()}${m.note ? `｜备注：${m.note}` : ''}`,
      '',
      '最近每周总结（节选）：',
      weekText,
      '',
      '请用 Markdown 输出且总共不超过 3 行正文：',
      '## 进度',
      '一行：进度判断（百分比 + 是否偏离计划）；',
      '## 风险',
      '一行：风险等级【高/中/低】+ 一句话说明；无风险写"【低】暂无显著风险"。'
    ].join('\n')
    const resp = await chatApi.send(prompt, 'ml-special')
    const content = (resp && (resp.content || resp.reply)) || '（AI 未返回内容）'
    msEvals.value.unshift({ stage: m.id, type: 'light', at: formatNow(), result: content })
    if (msEvalFor.value !== m.id) msEvalFor.value = m.id
    await persist()
  } catch (e: any) {
    ElMessage.error('AI 评估失败：' + (e?.message || '未知错误'))
  } finally {
    msEvaluating.value = ''
  }
}

/** 抽屉内最新完整 6 维评估与健康分 */
const latestMsFullEval = computed(() => msEvalHistory.value.find(e => e.type === 'full') || null)
const msFullScore = computed<number | null>(() => {
  const r = latestMsFullEval.value?.result || ''
  const m = r.match(/健康分[:：]?\s*(\d{1,3})/)
  const n = m ? Number(m[1]) : NaN
  return Number.isFinite(n) ? Math.min(100, n) : null
})

/** 完整 6 维评估（抽屉展示）：进度健康度/质量风险/依赖阻塞/资源协作/时间窗口/趋势动量 + 健康分 + Top3 风险 + 下一步 */
async function runMsFullEval(m: Milestone) {
  msFullEvaluating.value = m.id
  try {
    const siblings = milestones.value.filter(x => x.phase === m.phase && x.id !== m.id).slice(0, 10)
    const sibText = siblings.length
      ? siblings.map(x => `- ${x.name}｜状态：${milestoneStatus(x)}｜进度：${x.progress || 0}%｜责任人：${x.owner || '未指定'}｜计划：${x.planStart || '?'} ~ ${x.planEnd || '?'}`).join('\n')
      : '（无同阶段其他任务）'
    const recentWeeks = weeks.value.slice(0, 2)
    const weekText = recentWeeks.length
      ? recentWeeks.map(w => `【${weekLabel(w)} ${w.dateFrom || ''}~${w.dateTo || ''}】${w.title}\n${w.content}`).join('\n---\n')
      : '（暂无每周总结）'
    const prevEvals = msEvalsOf(m.id).slice(0, 3)
    const prevText = prevEvals.length
      ? prevEvals.map(e => `【${e.type === 'full' ? '完整' : '轻量'} ${e.at}】${e.result.replace(/[#*`]/g, '').slice(0, 200)}`).join('\n---\n')
      : '（暂无历史评估，趋势维度请标注"暂无对比基线"）'
    const prompt = [
      `你是项目管理助手，请对「多语专项」里程碑节点【${m.name}】做完整 6 维阶段评估。`,
      `所属阶段：${m.phase || '未分组'}｜责任人：${m.owner || '未指定'}`,
      `状态：${milestoneStatus(m)}｜进度：${m.progress || 0}%｜计划：${m.planStart || '?'} ~ ${m.planEnd || '?'}｜今日：${todayStr()}${m.note ? `｜备注：${m.note}` : ''}`,
      `项目背景：多语功能合并进公版 260330，合并窗口 09-14~09-18，10-15 随版发布，最大风险是国内公版被多语功能污染。`,
      '',
      '同阶段其他任务：',
      sibText,
      '',
      '最近的每周总结（人工录入的邮件内容）：',
      weekText,
      '',
      '历史评估记录（用于趋势对比）：',
      prevText,
      '',
      '请用简洁 Markdown 输出，结构如下：',
      '对以下 6 个维度逐一评估，每个维度先给评级（🟢正常/🟡关注/🔴告警）再用 2~3 句给依据：',
      '## 1. 进度健康度',
      '计划 vs 实际：完成率、按期情况、是否处于关键路径、偏差天数；',
      '## 2. 质量与风险',
      '交付质量信号：回归/返工情况，重点评估国内公版污染风险；',
      '## 3. 依赖与阻塞',
      '跨条线依赖是否就绪：分支、翻译资源、上游任务对下一节点的支撑度；',
      '## 4. 资源与协作',
      '责任人负载、单点依赖、条线间进度均衡度；',
      '## 5. 时间窗口约束',
      '合并窗口与发布日的剩余缓冲是否被侵蚀；',
      '## 6. 趋势与动量',
      '对比历史评估：加速/停滞/倒退，周报遗留事项是否闭环；',
      '## 综合结论',
      '三部分：',
      '- 阶段健康分：0~100 的一个数字，格式严格为"健康分：XX"；',
      '- Top 风险：最多 3 条，每条标注【高/中/低】+ 责任人 + 建议动作；',
      '- 下一步安排：2~4 条可执行行动项。'
    ].join('\n')
    const resp = await chatApi.send(prompt, 'ml-special')
    const content = (resp && (resp.content || resp.reply)) || '（AI 未返回内容）'
    msEvals.value.unshift({ stage: m.id, type: 'full', at: formatNow(), result: content })
    if (msEvalFor.value !== m.id) msEvalFor.value = m.id
    await persist()
  } catch (e: any) {
    ElMessage.error('完整评估失败：' + (e?.message || '未知错误'))
  } finally {
    msFullEvaluating.value = ''
  }
}

// ==================== 持久化与初始化 ====================

/** 从金山文档跟踪表同步 WBS：覆盖全部 wbs-* 数据，保留手动新增的自定义里程碑 */
const syncing = ref(false)
async function syncFromSheet() {
  syncing.value = true
  try {
    const list = await journalApi.syncWbs()
    if (!Array.isArray(list) || !list.length) {
      ElMessage.warning('跟踪表中未解析到里程碑数据')
      return
    }
    const custom = milestones.value.filter(m => !String(m.id).startsWith('wbs-'))
    milestones.value = [...list, ...custom]
    await persist()
    ElMessage.success(`已同步 ${list.length} 条 WBS 里程碑（一级+二级）`)
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || '未知错误'
    ElMessage.error('同步失败：' + msg)
  } finally {
    syncing.value = false
  }
}

async function persist() {
  try {
    await Promise.all([
      journalApi.save(SCOPE, 'milestones', milestones.value),
      journalApi.save(SCOPE, 'weeks', weeks.value),
      journalApi.save(SCOPE, 'docs', docs.value),
      journalApi.save(SCOPE, 'ms-evals', msEvals.value)
    ])
  } catch (e: any) {
    ElMessage.error('保存失败：' + (e?.message || '未知错误'))
  }
}

// 甘特图容器宽度自适应：监听尺寸变化，列宽自动拉伸填满可视区
onMounted(() => {
  const el = ganttEl.value
  if (!el || typeof ResizeObserver === 'undefined') return
  ganttWrapW.value = el.clientWidth
  ganttRO = new ResizeObserver(entries => {
    for (const e of entries) ganttWrapW.value = e.contentRect.width
  })
  ganttRO.observe(el)
})
onBeforeUnmount(() => {
  ganttRO?.disconnect()
  ganttRO = null
})

onMounted(async () => {
  try {
    const data = await journalApi.loadAll(SCOPE)
    const persisted = Array.isArray(data.milestones) ? data.milestones : []
    // 一次性迁移：旧预置数据（无 wbs- 前缀 id）升级为跟踪表 WBS 种子
    milestones.value = persisted.length && persisted.some((m: any) => String(m?.id || '').startsWith('wbs-'))
      ? persisted
      : [...MILESTONE_SEEDS]
    docs.value = Array.isArray(data.docs) && data.docs.length ? data.docs : DOC_SEEDS.map(d => ({ id: `doc-${d.url.slice(-12)}`, ...d }))
    weeks.value = Array.isArray(data.weeks) ? data.weeks : []
    msEvals.value = Array.isArray(data['ms-evals']) ? data['ms-evals'] : []
  } catch {
    milestones.value = [...MILESTONE_SEEDS]
    msEvals.value = []
    docs.value = DOC_SEEDS.map(d => ({ id: `doc-${d.url.slice(-12)}`, ...d }))
  }
})

// ==================== 工具 ====================

function openUrl(url: string) {
  if (url) window.open(url, '_blank')
}
async function copyText(text: string, msg = '已复制') {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(msg)
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}
</script>

<style scoped>
/* ===== 顶部速览 ===== */
.ml-topbar {
  display: flex;
  gap: 16px;
  align-items: stretch;
  margin-bottom: 14px;
}
.ml-meeting {
  flex: 1.4;
  background: var(--paper-card);
  border: 1px solid var(--paper-border);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ml-meeting__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-text);
}
.ml-meeting__ops {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ml-kpis {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  background: var(--paper-card);
  border: 1px solid var(--paper-border);
  border-radius: 8px;
  padding: 12px 16px;
}
.ml-kpi { text-align: center; align-self: center; }
.ml-kpi__value { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ml-kpi__label { font-size: 11.5px; color: var(--ink-text-secondary); margin-top: 2px; }

/* ===== 工具栏与通用 ===== */
.ml-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.ml-toolbar__tip { font-size: 12px; color: var(--ink-text-secondary); }
.ml-dim { color: var(--el-text-color-placeholder); }
.ml-tip { margin-bottom: 14px; }
.ml-sec-title {
  font-size: 15px; color: var(--ink-text);
  margin: 18px 0 10px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
}

/* ===== Markdown 渲染 ===== */
.ml-md { font-size: 12.8px; line-height: 1.75; color: var(--ink-text); }
.ml-md :deep(h2) { font-size: 13.5px; margin: 8px 0 4px; }
.ml-md :deep(ul), .ml-md :deep(ol) { padding-left: 18px; margin: 4px 0; }
.ml-eval-hist { border-bottom: 1px dashed var(--paper-border); padding-bottom: 10px; margin-bottom: 10px; }
.ml-eval-hist__time { font-size: 12px; color: var(--el-text-color-placeholder); margin-bottom: 4px; }

/* ===== 每周总结 ===== */
.ml-week-title {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
}
.ml-week-title__text { font-size: 13.5px; color: var(--ink-text); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ml-week-title__date { font-size: 12px; color: var(--ink-text-secondary); font-variant-numeric: tabular-nums; }
.ml-week-title__ops { flex-shrink: 0; }
.ml-week-body { font-size: 13px; line-height: 1.85; color: var(--ink-text); white-space: pre-wrap; word-break: break-word; }

/* ===== 重要文档 ===== */
.ml-docs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ml-doc {
  background: var(--paper-card);
  border: 1px solid var(--paper-border);
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ml-doc:hover { border-color: var(--el-color-primary); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06); }
.ml-doc__title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13.5px; font-weight: 600; color: var(--ink-text);
}
.ml-doc__desc {
  font-size: 12.5px; line-height: 1.7; color: var(--ink-text-secondary);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  flex: 1;
}
.ml-doc__ops { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ml-doc__link {
  font-size: 11px; color: var(--el-text-color-placeholder);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 70%;
}
.ml-doc__btns { flex-shrink: 0; }

/* ===== 甘特图 ===== */
.ml-level-switch { margin-left: 4px; }
.ml-legend {
  display: inline-flex;
  gap: 12px;
  margin-left: auto;
}
.ml-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--ink-text-secondary);
}
.ml-legend__item i {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.gantt {
  --gantt-day-w: 26px;
  overflow-x: auto;
  border: 1px solid var(--paper-border);
  border-radius: 8px;
  background: var(--paper-card);
}
.gantt__inner {
  position: relative;
}
.gantt__row {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  min-height: 40px;
}
.gantt__row:last-child { border-bottom: none; }
/* 二级任务行：缩进 + 弱化 */
.gantt__row--l2 .gantt__label { padding-left: 26px; }
.gantt__row--l2 .gantt__label-name { font-weight: 400; font-size: 12px; color: var(--ink-text-secondary); }
.gantt__row--l2 { min-height: 32px; }
.gantt__row--head {
  position: sticky;
  top: 0;
  z-index: 3;
  background: var(--paper-light);
  border-bottom: 1px solid var(--paper-border);
}
.gantt__label {
  position: sticky;
  left: 0;
  z-index: 2;
  width: var(--gantt-label-w, 240px);
  flex-shrink: 0;
  padding: 6px 10px;
  background: var(--paper-card);
  border-right: 1px solid var(--paper-border);
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}
.gantt__row--head .gantt__label { background: var(--paper-light); cursor: default; }
/* ---- AI 阶段评估列 ---- */
.gantt__eval {
  width: var(--gantt-eval-w, 300px);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-left: 1px solid var(--paper-border);
  background: var(--paper-card);
  overflow: hidden;
}
.gantt__eval--head {
  background: var(--paper-light);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-text);
}
.gantt__eval-sum {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.gantt__eval-sum:hover .gantt__eval-text { color: var(--el-color-primary); }
.gantt__eval-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--el-color-info-light-5);
  border: 1px solid var(--el-color-info-light-7);
}
.gantt__eval-dot--high { background: var(--el-color-danger); border-color: var(--el-color-danger); }
.gantt__eval-dot--med { background: var(--el-color-warning); border-color: var(--el-color-warning); }
.gantt__eval-dot--low { background: var(--el-color-success); border-color: var(--el-color-success); }
.gantt__eval-text {
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--ink-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.gantt__eval-btn { flex-shrink: 0; }
.gantt__label-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gantt__label-name:hover { color: var(--el-color-primary); }
.gantt__label-owner {
  font-size: 11px;
  color: var(--ink-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gantt__track {
  position: relative;
  flex: 1;
  background-image: repeating-linear-gradient(
    to right,
    var(--el-border-color-extra-light) 0,
    var(--el-border-color-extra-light) 1px,
    transparent 1px,
    transparent var(--gantt-day-w)
  );
  cursor: pointer;
}
.gantt__track--head { cursor: default; }
.gantt__months { display: flex; height: 24px; }
.gantt__month {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-text);
  border-right: 1px solid var(--paper-border);
  padding: 4px 6px 0;
  box-sizing: border-box;
}
.gantt__days { display: flex; height: 20px; }
.gantt__day {
  width: var(--gantt-day-w);
  flex-shrink: 0;
  font-size: 10px;
  color: var(--ink-text-secondary);
  text-align: center;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
}
.gantt__day--weekend { color: var(--el-text-color-placeholder); background: rgba(0, 0, 0, 0.025); }
.gantt__day--today {
  color: #fff;
  background: var(--el-color-danger);
  border-radius: 3px 3px 0 0;
  font-weight: 700;
}
.gantt__bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 18px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.gantt__bar--未开始 { background: var(--el-color-info-light-5); border: 1px solid var(--el-color-info-light-7); }
.gantt__bar--进行中 { background: var(--el-color-primary-light-7); border: 1px solid var(--el-color-primary-light-5); }
.gantt__bar--已完成 { background: var(--el-color-success-light-7); border: 1px solid var(--el-color-success-light-5); }
.gantt__bar--已延期 { background: var(--el-color-danger-light-7); border: 1px solid var(--el-color-danger-light-5); }
.gantt__bar-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  opacity: 0.85;
}
.gantt__bar--进行中 .gantt__bar-progress { background: var(--el-color-primary); }
.gantt__bar--已完成 .gantt__bar-progress { background: var(--el-color-success); }
.gantt__bar--已延期 .gantt__bar-progress { background: var(--el-color-danger); }
.gantt__bar-text {
  position: relative;
  margin-left: auto;
  padding-right: 4px;
  font-size: 10px;
  color: var(--ink-text-secondary);
  font-variant-numeric: tabular-nums;
}
.gantt__today-line {
  position: absolute;
  top: 44px;
  bottom: 0;
  width: 2px;
  background: var(--el-color-danger);
  opacity: 0.55;
  z-index: 1;
  pointer-events: none;
}
.gantt__today-line::before {
  content: '今日';
  position: absolute;
  top: -2px;
  left: 3px;
  font-size: 10px;
  color: var(--el-color-danger);
  white-space: nowrap;
}
.ml-unsched {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ml-unsched__tag { cursor: pointer; }

/* ===== 环境与账号 ===== */
.ml-env-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 6px;
}
.ml-env {
  background: var(--paper-card);
  border: 1px solid var(--paper-border);
  border-radius: 8px;
  padding: 12px 16px;
}
.ml-env__title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13.5px; font-weight: 600; color: var(--ink-text);
  margin-bottom: 8px;
}
.ml-env__row {
  display: flex; gap: 10px;
  font-size: 12.5px; line-height: 2;
}
.ml-env__row .k { color: var(--ink-text-secondary); width: 76px; flex-shrink: 0; }
.ml-env__row .v { color: var(--ink-text); word-break: break-all; }
.ml-env__row .v a { color: var(--el-color-primary); text-decoration: none; }

@media (max-width: 1280px) {
  .ml-topbar { flex-direction: column; }
  .ml-docs, .ml-env-grid { grid-template-columns: 1fr; }
  .ml-kpis { grid-template-columns: repeat(4, 1fr); }
}
</style>
