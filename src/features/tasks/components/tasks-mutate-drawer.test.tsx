import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { type Task } from '../data/schema'
import { TasksMutateDrawer } from './tasks-mutate-drawer'

vi.mock('@/lib/show-submitted-data', () => ({ showSubmittedData: vi.fn() }))

const MOCK_TASK = {
  id: 'task-1',
  title: 'Existing task',
  status: 'in progress',
  label: 'feature',
  priority: 'medium',
} as const satisfies Task

describe('TasksMutateDrawer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders create title and description', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} />
    )

    const title = getByRole('heading', {
      level: 2,
      name: /创建 任务/i,
    })
    const desc = getByText(/通过提供必要信息来添加新任务/i)

    await expect.element(title).toBeInTheDocument()
    await expect.element(desc).toBeInTheDocument()
  })

  it('renders edit title, description, and prefilled title', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} currentRow={MOCK_TASK} />
    )

    const title = getByRole('heading', {
      level: 2,
      name: /编辑 任务/i,
    })
    const desc = getByText(/通过提供必要信息来更新任务/i)

    const titleInput = getByRole('textbox', { name: /标题/i })
    const statusSelect = getByRole('combobox', { name: /状态/i })
    const labelRadio = getByRole('radio', { name: '功能' })
    const priorityRadio = getByRole('radio', { name: '中' })

    await expect.element(title).toBeInTheDocument()
    await expect.element(desc).toBeInTheDocument()
    await expect.element(titleInput).toHaveValue(MOCK_TASK.title)
    // Status select shows Chinese label
    const statusLabelMap: Record<string, string> = {
      'in progress': '进行中',
      todo: '待执行',
      backlog: '待办',
      canceled: '已取消',
      done: '已完成',
    }
    await expect
      .element(statusSelect)
      .toHaveTextContent(statusLabelMap[MOCK_TASK.status])
    await expect.element(labelRadio).toBeChecked()
    await expect.element(priorityRadio).toBeChecked()
  })

  it('shows validation messages when submitting an empty form', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} />
    )

    const saveButton = getByRole('button', { name: /保存更改/i })
    await userEvent.click(saveButton)

    await expect.element(getByText(/标题不能为空。$/i)).toBeInTheDocument()
    await expect
      .element(getByText(/请选择状态。$/i))
      .toBeInTheDocument()
    await expect
      .element(getByText(/请选择标签。$/i))
      .toBeInTheDocument()
    await expect
      .element(getByText(/请选择优先级。$/i))
      .toBeInTheDocument()
  })

  it('submits create form and shows submitted data', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <TasksMutateDrawer open onOpenChange={onOpenChange} />
    )

    const titleInput = getByRole('textbox', { name: /标题/i })
    await userEvent.fill(titleInput, 'New task title')

    const statusSelect = getByRole('combobox', { name: /状态/i })
    await userEvent.click(statusSelect)
    await userEvent.click(getByRole('option', { name: /待执行/i }))

    await userEvent.click(getByRole('radio', { name: /^缺陷$/i }))
    await userEvent.click(getByRole('radio', { name: /^低$/i }))

    const saveButton = getByRole('button', { name: /保存更改/i })
    await userEvent.click(saveButton)

    expect(onOpenChange).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)

    expect(showSubmittedData).toHaveBeenCalledOnce()
    expect(showSubmittedData).toHaveBeenCalledWith({
      title: 'New task title',
      status: 'todo',
      label: 'bug',
      priority: 'low',
    })
  })

  it('closes when Close is clicked', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <TasksMutateDrawer open onOpenChange={onOpenChange} />
    )

    const closeButton = getByRole('button', { name: /关闭/i })

    await userEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets entered values when the sheet is closed and reopened', async () => {
    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button type='button' onClick={() => setOpen(true)}>
            重新打开
          </button>
          <TasksMutateDrawer open={open} onOpenChange={setOpen} />
        </>
      )
    }

    const { getByRole } = await render(<Harness />)

    const titleInput = getByRole('textbox', { name: /标题/i })
    await userEvent.fill(titleInput, 'Draft title')
    await expect.element(titleInput).toHaveValue('Draft title')

    const statusSelect = getByRole('combobox', { name: /状态/i })
    await userEvent.click(statusSelect)
    await userEvent.click(getByRole('option', { name: /待执行/i }))
    await expect.element(statusSelect).toHaveTextContent(/待执行/i)

    const labelRadio = getByRole('radio', { name: /^文档$/i })
    await userEvent.click(labelRadio)
    await expect.element(labelRadio).toBeChecked()

    const priorityRadio = getByRole('radio', { name: /^高$/i })
    await userEvent.click(priorityRadio)
    await expect.element(priorityRadio).toBeChecked()

    const closeButton = getByRole('button', { name: /关闭/i })
    await userEvent.click(closeButton)

    const reopenButton = getByRole('button', { name: /重新打开/i })
    await userEvent.click(reopenButton)

    await expect.element(titleInput).toHaveValue('')
    await expect.element(statusSelect).not.toHaveTextContent(/待执行/i)
    await expect.element(labelRadio).not.toBeChecked()
    await expect.element(priorityRadio).not.toBeChecked()
  })
})
