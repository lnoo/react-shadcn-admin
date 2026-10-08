import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { UsersInviteDialog } from './users-invite-dialog'

vi.mock('@/lib/show-submitted-data', () => ({ showSubmittedData: vi.fn() }))

describe('UsersInviteDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the dialog title and description', async () => {
    const { getByRole, getByText } = await render(
      <UsersInviteDialog open onOpenChange={vi.fn()} />
    )

    const title = getByRole('heading', {
      level: 2,
      name: /邀请用户/i,
    })
    const desc = getByText(/通过发送邮件邀请新用户加入您的团队/i)

    await expect.element(title).toBeInTheDocument()
    await expect.element(desc).toBeInTheDocument()
  })

  it('closes when the dialog close button is clicked', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <UsersInviteDialog open onOpenChange={onOpenChange} />
    )

    const closeButton = getByRole('button', { name: /取消/i })
    await userEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes when Cancel is clicked', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <UsersInviteDialog open onOpenChange={onOpenChange} />
    )

    const cancelButton = getByRole('button', { name: /取消/i })
    await userEvent.click(cancelButton)

    expect(onOpenChange).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows error messages when submitting empty form, and clears them as fields are filled', async () => {
    const onOpenChange = vi.fn()
    const { getByRole, getByText } = await render(
      <UsersInviteDialog open onOpenChange={onOpenChange} />
    )

    const emailErrorMessage = getByText(/请输入要邀请的邮箱。/i)
    const roleErrorMessage = getByText(/角色不能为空。/i)

    const submitButton = getByRole('button', { name: /邀请/i })
    await userEvent.click(submitButton)

    await expect.element(emailErrorMessage).toBeInTheDocument()
    await expect.element(roleErrorMessage).toBeInTheDocument()

    const emailInput = getByRole('textbox', { name: /邮箱/i })
    await userEvent.fill(emailInput, 'test@example.com')

    const roleSelect = getByRole('combobox', { name: /角色/i })
    await userEvent.click(roleSelect)
    await userEvent.click(getByRole('option', { name: /Superadmin/i }))

    await expect.element(emailErrorMessage).not.toBeInTheDocument()
    await expect.element(roleErrorMessage).not.toBeInTheDocument()
  })

  it('resets entered values when the dialog is closed and reopened', async () => {
    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button type='button' onClick={() => setOpen(true)}>
            重新打开
          </button>
          <UsersInviteDialog open={open} onOpenChange={setOpen} />
        </>
      )
    }

    const { getByRole } = await render(<Harness />)

    const EMAIL_VALUE = 'test@example.com'
    const ROLE_VALUE = 'Superadmin'
    const DESC_VALUE = 'This is a test description'

    const emailInput = getByRole('textbox', { name: /邮箱/i })
    await userEvent.fill(emailInput, EMAIL_VALUE)

    const roleSelect = getByRole('combobox', { name: /角色/i })
    await userEvent.click(roleSelect)
    await userEvent.click(getByRole('option', { name: ROLE_VALUE }))

    const descInput = getByRole('textbox', { name: /描述/i })
    await userEvent.fill(descInput, DESC_VALUE)

    await expect.element(emailInput).toHaveValue(EMAIL_VALUE)
    await expect.element(roleSelect).toHaveTextContent(ROLE_VALUE)
    await expect.element(descInput).toHaveValue(DESC_VALUE)

    const cancelButton = getByRole('button', { name: /取消/i })
    await userEvent.click(cancelButton)

    const reopenButton = getByRole('button', { name: /重新打开/i })
    await userEvent.click(reopenButton)

    await expect.element(emailInput).toHaveValue('')
    await expect.element(roleSelect).toHaveTextContent('选择角色')
    await expect.element(descInput).toHaveValue('')
  })

  it('shows submitted data when the form is submitted successfully', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <UsersInviteDialog open onOpenChange={onOpenChange} />
    )

    const EMAIL_VALUE = 'test@example.com'
    const ROLE_VALUE = 'superadmin'
    const DESC_VALUE = 'Welcome aboard!'

    const emailInput = getByRole('textbox', { name: /邮箱/i })
    await userEvent.fill(emailInput, EMAIL_VALUE)

    const roleSelect = getByRole('combobox', { name: /角色/i })
    await userEvent.click(roleSelect)
    await userEvent.click(getByRole('option', { name: ROLE_VALUE }))

    const descInput = getByRole('textbox', { name: /描述/i })
    await userEvent.fill(descInput, DESC_VALUE)

    const submitButton = getByRole('button', { name: /邀请/i })
    await userEvent.click(submitButton)

    expect(onOpenChange).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)

    expect(showSubmittedData).toHaveBeenCalledOnce()
    expect(showSubmittedData).toHaveBeenCalledWith({
      email: EMAIL_VALUE,
      role: ROLE_VALUE,
      desc: DESC_VALUE,
    })
  })
})
