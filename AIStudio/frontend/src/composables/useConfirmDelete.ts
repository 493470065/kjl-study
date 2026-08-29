import { ElMessageBox } from 'element-plus'

/**
 * 全站统一的危险操作确认。
 * 用法：if (!await confirmDelete('Skill「xxx」')) return
 * 约定：文案统一"确定删除…吗？此操作不可恢复"；确认按钮为危险色；取消返回 false。
 */
export function useConfirmDelete() {
  async function confirmDelete(target = '该记录', title = '确认删除'): Promise<boolean> {
    try {
      await ElMessageBox.confirm(
        `确定删除 ${target} 吗？此操作不可恢复。`,
        title,
        {
          type: 'warning',
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button--danger'
        }
      )
      return true
    } catch {
      return false
    }
  }

  return { confirmDelete }
}
