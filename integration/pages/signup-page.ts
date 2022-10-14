import { Page } from '@playwright/test'
import { Locator } from 'playwright'

export class SignupPage {
  private readonly page: Page

  private readonly inputUsername: Locator
  private readonly inputEmail: Locator
  private readonly inputPassword: Locator
  private readonly inputPasswordConfirm: Locator
  private readonly inputAgeConfirm: Locator
  private readonly inputPolicyAgreement: Locator

  private readonly buttonCreateAccount: Locator

  constructor(page: Page) {
    this.page = page

    this.inputUsername = page.locator('input[name="username"]')
    this.inputEmail = page.locator('input[name="email"]')
    this.inputPassword = page.locator('input[name="password"]')
    this.inputPasswordConfirm = page.locator('input[name="confirmPassword"]')
    this.inputAgeConfirm = page.locator('input[name="ageConfirmation"]')
    this.inputPolicyAgreement = page.locator('input[name="policyAgreement"]')

    this.buttonCreateAccount = page.locator('button[data-test=submit-button]')
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('/signup')
  }

  async signupWith({
    username,
    email,
    password,
  }: {
    username: string
    email: string
    password: string
  }): Promise<void> {
    await this.inputUsername.fill(username)
    await this.inputEmail.fill(email)
    await this.inputPassword.fill(password)
    await this.inputPasswordConfirm.fill(password)
    await this.inputAgeConfirm.check()
    // NOTE(tec27): This one needs a position because otherwise it falls on a link and opens a
    // dialog
    await this.inputPolicyAgreement.check({ position: { x: 4, y: 4 } })

    await this.buttonCreateAccount.click()
  }
}
