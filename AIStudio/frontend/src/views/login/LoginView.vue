<template>
  <div class="login-page">
    <!-- 水墨江南 · 泼墨山水（湍流位移滤镜做渗化飞白；装饰层，不进无障碍树） -->
    <svg class="scene" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="w-stop0" />
          <stop offset="1" class="w-stop1" />
        </linearGradient>
        <!-- 泼墨：大幅位移 + 微 blur，模拟宣纸洇墨 -->
        <filter id="f-splash" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="7" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="46" />
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <!-- 积墨：中幅位移 -->
        <filter id="f-bleed" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="4" seed="11" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="24" />
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <!-- 笔触/墨点：小幅毛边 -->
        <filter id="f-edge" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves="3" seed="3" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="10" />
        </filter>
        <!-- 云雾：低频扰动 + 重晕开 -->
        <filter id="f-mist" x="-60%" y="-160%" width="220%" height="420%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="5" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="60" />
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <!-- 宣纸颗粒（顶层做旧） -->
        <filter id="f-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" result="n" />
          <feColorMatrix in="n" type="matrix"
                         values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
        </filter>
      </defs>

      <!-- 淡远峰 -->
      <path class="wash-far" filter="url(#f-bleed)"
            d="M-80 390 Q 40 250 150 330 Q 210 255 320 350 Q 380 400 450 385 L 450 480 Q 200 510 -80 470 Z" />
      <path class="wash-far" filter="url(#f-bleed)"
            d="M1120 320 Q 1210 190 1310 275 Q 1390 205 1500 300 Q 1580 355 1680 330 L 1680 440 L 1120 450 Z" />

      <!-- 归雁 -->
      <g class="geese">
        <path d="M238 182 q9 -9 18 0 q9 -9 18 0" />
        <path d="M300 150 q7 -7 14 0 q7 -7 14 0" />
        <path d="M192 218 q6 -6 12 0 q6 -6 12 0" />
      </g>

      <!-- 左岸墨山 -->
      <g>
        <path class="wash-mid" filter="url(#f-splash)"
              d="M-80 760 Q -10 560 90 590 Q 140 430 260 480 Q 330 390 430 500 Q 500 570 560 700 Q 580 745 600 770 Z" />
        <path class="wash-deep" filter="url(#f-bleed)"
              d="M40 700 Q 120 500 230 540 Q 290 450 380 540 Q 440 610 470 700 Q 260 740 40 730 Z" />
      </g>

      <!-- 右幅泼墨主峰（三层积墨） -->
      <g>
        <path class="wash-mid" filter="url(#f-splash)"
              d="M880 800 Q 930 620 1010 570 Q 1030 430 1130 400 Q 1180 260 1300 315
                 Q 1360 215 1470 275 Q 1560 205 1680 320 L 1680 830 Z" />
        <path class="wash-deep" filter="url(#f-bleed)"
              d="M970 820 Q 1010 650 1090 600 Q 1120 480 1210 455 Q 1270 340 1370 385
                 Q 1440 300 1540 370 Q 1620 330 1680 410 L 1680 840 L 990 845 Z" />
        <path class="wash-core" filter="url(#f-bleed)"
              d="M1080 790 Q 1130 620 1200 570 Q 1240 470 1320 490 Q 1380 400 1470 460
                 Q 1560 420 1680 510 L 1680 800 L 1120 810 Z" />
        <!-- 山脚积墨 -->
        <path class="wash-core" filter="url(#f-splash)"
              d="M930 810 Q 1140 720 1360 760 Q 1540 715 1680 770 L 1680 840 L 920 850 Z" />
        <!-- 山脊飞白（淡纸破浓墨） -->
        <g class="stroke-paper" stroke-width="4" filter="url(#f-edge)">
          <path d="M1150 500 Q 1240 440 1340 420" opacity=".26" />
          <path d="M1330 350 Q 1430 300 1550 330" opacity=".22" />
          <path d="M1050 600 Q 1130 530 1220 490" opacity=".2" />
        </g>
        <!-- 劈麻皴：纵向墨线 -->
        <g class="stroke-ink" stroke-width="5" opacity=".45" filter="url(#f-edge)">
          <path d="M1230 500 Q 1250 620 1225 740" />
          <path d="M1380 420 Q 1420 560 1400 700" />
          <path d="M1500 470 Q 1530 590 1520 700" />
        </g>
        <!-- 浓墨点睛 -->
        <g class="stroke-ink" stroke-width="8" opacity=".6" filter="url(#f-edge)">
          <path d="M1020 750 Q 1220 680 1420 730 Q 1560 700 1670 750" />
        </g>
      </g>

      <!-- 主峰山脚淡晕 -->
      <path class="wash-mtn-echo" filter="url(#f-bleed)"
            d="M1000 830 Q 1300 810 1600 818 L 1600 860 Q 1300 850 1000 868 Z" />

      <!-- 溅墨点（重点泼墨的标志性细节） -->
      <g class="splash-dots" filter="url(#f-edge)">
        <circle cx="1160" cy="560" r="6" fill-opacity=".35" />
        <circle cx="1176" cy="578" r="3" fill-opacity=".25" />
        <circle cx="1290" cy="330" r="5" fill-opacity=".3" />
        <circle cx="1310" cy="345" r="2.5" fill-opacity=".2" />
        <circle cx="1478" cy="470" r="4.5" fill-opacity=".28" />
        <circle cx="1062" cy="668" r="5" fill-opacity=".22" />
        <circle cx="1040" cy="690" r="2.5" fill-opacity=".16" />
        <circle cx="1235" cy="470" r="3.5" fill-opacity=".25" />
        <circle cx="1602" cy="418" r="4" fill-opacity=".22" />
        <circle cx="1590" cy="438" r="2" fill-opacity=".16" />
        <circle cx="880" cy="772" r="4" fill-opacity=".18" />
        <circle cx="905" cy="788" r="2" fill-opacity=".13" />
        <ellipse cx="1355" cy="758" rx="7" ry="3" fill-opacity=".16" />
        <ellipse cx="1462" cy="728" rx="6" ry="2.5" fill-opacity=".14" />
        <circle cx="90" cy="560" r="4" fill-opacity=".18" />
        <circle cx="110" cy="578" r="2" fill-opacity=".12" />
        <circle cx="400" cy="530" r="3.5" fill-opacity=".2" />
        <circle cx="560" cy="700" r="4" fill-opacity=".14" />
        <circle cx="582" cy="714" r="2" fill-opacity=".1" />
        <circle cx="340" cy="700" r="3" fill-opacity=".12" />
        <circle cx="198" cy="810" r="4" fill-opacity=".22" />
        <circle cx="176" cy="828" r="2" fill-opacity=".14" />
        <circle cx="388" cy="848" r="3" fill-opacity=".18" />
      </g>

      <!-- 水面 -->
      <rect class="water" x="-40" y="770" width="1680" height="270" />

      <!-- 云雾留白（山腰锁云，托出登录卡） -->
      <g filter="url(#f-mist)">
        <ellipse class="mist" cx="380" cy="660" rx="520" ry="44" />
        <ellipse class="mist" cx="950" cy="706" rx="640" ry="52" />
        <ellipse class="mist" cx="1440" cy="652" rx="420" ry="40" />
        <ellipse class="mist-soft" cx="800" cy="782" rx="920" ry="26" />
      </g>

      <!-- 水面淡痕 -->
      <g class="ripples" filter="url(#f-edge)">
        <path d="M120 806 Q 320 798 520 806" />
        <path d="M700 794 Q 850 788 1000 795" />
        <path d="M60 884 Q 200 876 330 886" />
        <path d="M560 862 Q 760 852 960 862" />
        <path d="M880 926 Q 1120 914 1360 928" />
        <path d="M1180 856 Q 1380 848 1560 858" />
        <path d="M1020 896 Q 1220 886 1420 898" />
      </g>

      <!-- 近景浓岩 -->
      <g>
        <path class="wash-core" filter="url(#f-bleed)"
              d="M-80 980 Q 30 800 150 840 Q 215 775 300 835 Q 370 880 420 970 L 420 1040 L -80 1040 Z" />
        <path class="wash-mtn" filter="url(#f-bleed)"
              d="M-60 1000 Q 60 870 160 900 Q 240 860 320 930 Q 220 975 60 990 Z" />
        <!-- 岩上飞白 -->
        <path class="stroke-paper" stroke-width="4" opacity=".25" filter="url(#f-edge)"
              d="M40 920 Q 140 895 240 918" />
      </g>

      <!-- 芦苇数茎 -->
      <g class="stroke-ink" filter="url(#f-edge)" stroke-width="3">
        <path d="M362 918 Q 348 862 366 812" />
        <path d="M388 924 Q 384 872 404 834" />
        <path d="M412 930 Q 416 884 438 852" />
        <path d="M336 916 Q 322 872 330 830" />
      </g>
      <g class="splash-dots" filter="url(#f-edge)">
        <ellipse cx="366" cy="806" rx="2.5" ry="6" fill-opacity=".5" />
        <ellipse cx="405" cy="828" rx="2.5" ry="6" fill-opacity=".5" transform="rotate(14 405 828)" />
      </g>

      <!-- 水心一叶 -->
      <g filter="url(#f-edge)">
        <path class="wash-mtn" d="M628 884 Q 712 906 796 882 L 786 874 Q 712 890 640 874 Z" />
        <path class="wash-core" d="M664 874 Q 712 846 760 874 L 748 875 Q 712 856 676 875 Z" />
        <g class="stroke-ink" stroke-width="3">
          <path d="M806 878 L 782 888" />
          <path d="M650 872 v-10" />
        </g>
        <circle class="splash-dot" cx="650" cy="858" r="3.5" />
        <path class="ripple-strong" d="M640 902 Q 712 912 790 900" />
        <path class="ripple-strong" d="M664 916 Q 722 922 780 914" />
      </g>

      <!-- 宣纸颗粒 · 顶层做旧 -->
      <rect class="grain" x="0" y="0" width="1600" height="1000" filter="url(#f-grain)" />
    </svg>

    <div class="login-card">
      <h2>景磊的AI工作站</h2>
      <p class="subtitle">AI 驱动的工作台</p>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large"
                    autocomplete="username" aria-label="用户名" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" placeholder="密码" prefix-icon="Lock"
                    type="password" show-password size="large" autocomplete="current-password"
                    aria-label="密码" @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" native-type="submit" style="width: 100%"
                     @click="handleLogin" :loading="loading">
            登 录
          </el-button>
        </el-form-item>
        <div v-if="error" class="error-msg" role="alert">{{ error }}</div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  password: '',
  remember: true
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  error.value = ''
  try {
    await auth.login(form.username, form.password, form.remember)
    // 回跳原页面；无指定时落到该用户第一个可访问菜单
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    router.push(redirect || auth.firstAccessibleMenu())
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.response?.data?.error || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 登录页：水墨江南 · 泼墨山水 —— 宣纸为底、泼墨成山、留白为云 */
.login-page {
  position: relative;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f7f4ec 0%, #f1ecdf 55%, #e7e0cd 100%);
}

/* 画卷铺满整屏（xMidYMax：水面与近岩始终贴底） */
.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* —— 墨分五色：浓破淡，层层积墨（色彩全部走令牌） —— */
.wash-far  { fill: var(--el-color-primary); opacity: .10; }
.wash-mid  { fill: var(--ink);       opacity: .22; }
.wash-deep { fill: var(--ink-deep);  opacity: .34; }
.wash-core { fill: var(--ink-deep);  opacity: .52; }
.wash-mtn  { fill: var(--ink-deep);  opacity: .5; }
.wash-mtn-echo { fill: var(--ink-deep); opacity: .07; }
.mist  { fill: var(--paper); opacity: .85; }
.mist-soft { fill: var(--paper); opacity: .5; }
.grain { opacity: .05; }
.w-stop0 { stop-color: var(--el-color-primary); stop-opacity: .10; }
.w-stop1 { stop-color: var(--ink-deep);         stop-opacity: .15; }
.water { fill: url(#waterGrad); }

.stroke-ink path {
  fill: none;
  stroke: var(--ink-deep);
  stroke-linecap: round;
  opacity: .6;
}
.stroke-paper path, path.stroke-paper {
  fill: none;
  stroke: var(--paper);
  stroke-linecap: round;
}

.splash-dots circle, .splash-dots ellipse { fill: var(--ink-deep); }
.splash-dot { fill: var(--ink-deep); opacity: .7; }

.ripples path {
  fill: none;
  stroke: var(--ink-deep);
  stroke-width: 3;
  stroke-linecap: round;
  opacity: .1;
}
.ripple-strong {
  fill: none;
  stroke: var(--ink-deep);
  stroke-width: 2.5;
  stroke-linecap: round;
  opacity: .3;
}

.geese path {
  fill: none;
  stroke: var(--ink-light);
  stroke-width: 2.4;
  stroke-linecap: round;
  opacity: .5;
}

.login-card {
  position: relative;
  z-index: 1;
  background: rgba(251, 249, 244, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 40px;
  width: 380px;
  box-shadow: 0 20px 60px rgba(44, 42, 38, 0.22);
  text-align: center;
}

/* 标题上方一枚朱砂小印 */
.login-card::before {
  content: '景';
  position: absolute;
  top: 18px;
  right: 20px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--seal);
  color: var(--paper);
  font-size: 13px;
  font-weight: 600;
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
}

.login-card h2 {
  font-size: 24px;
  color: var(--ink-text);
  margin-bottom: 4px;
  letter-spacing: 2px;
}

.subtitle {
  color: var(--ink-text-secondary);
  font-size: 14px;
  margin-bottom: 30px;
  letter-spacing: 4px;
}

.login-form {
  text-align: left;
}

.error-msg {
  color: #f56c6c;
  font-size: 13px;
  text-align: center;
  margin-top: -8px;
}
</style>
