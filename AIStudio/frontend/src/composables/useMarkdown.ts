import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

export function useMarkdown() {
  function renderMarkdown(content: string): string {
    if (!content) return ''
    return md.render(content)
  }

  return { renderMarkdown }
}