import MarkdownIt from 'markdown-it'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

let codeIdSeq = 0

const md = new MarkdownIt({
  // 安全基线：禁止渲染原始 HTML，杜绝 AI 回复中的 <img onerror=...> 类 XSS
  html: false,
  linkify: true,
  typographer: true
})

/**
 * 代码块渲染器：语言标签 + 复制按钮 + 深色头栏。
 * ChatView 已为 .code-block-wrapper/.copy-btn 备好样式与事件委托，此处补齐缺失的渲染端。
 */
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  const lang = (token.info || '').trim()
  const codeId = `code-block-${++codeIdSeq}`
  return (
    `<div class="code-block-wrapper">` +
    `<div class="code-block-header">` +
    `<span class="code-lang">${escapeHtml(lang) || 'text'}</span>` +
    `<button type="button" class="copy-btn" data-code-id="${codeId}" aria-label="复制代码">复制</button>` +
    `</div>` +
    `<pre id="${codeId}" class="code-block"><code>${escapeHtml(token.content)}</code></pre>` +
    `</div>`
  )
}

export function useMarkdown() {
  function renderMarkdown(content: string): string {
    if (!content) return ''
    return md.render(content)
  }

  return { renderMarkdown }
}
