import { expect, test } from '@playwright/test'
import { suppressChangelog } from '../../changelog-utils'
import { LoginPage } from '../../pages/login-page'
import { SignupPage } from '../../pages/signup-page'
import { SentEmailChecker } from '../../sent-email-checker'
import { generateUsername } from '../../username-generator'
import { VERIFICATION_LINK_REGEX } from './utils'

const sentEmailChecker = new SentEmailChecker()

let loginPage: LoginPage
let signupPage: SignupPage

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page)
  signupPage = new SignupPage(page)
})

test('sign up and verify email with different user', async ({ context, page }) => {
  const username = generateUsername()
  const email = `${username}@example.org`

  await signupPage.navigateTo()
  await signupPage.signupWith({ username, password: 'password123', email })

  await suppressChangelog(page)

  await page.click('[data-test=notifications-button]')
  await page.waitForSelector('[data-test=email-verification-notification]')

  const emails = await sentEmailChecker.retrieveSentEmails(email)
  expect(emails).toHaveLength(1)
  const link = VERIFICATION_LINK_REGEX.exec(emails[0].text)?.groups?.link
  expect(link).toBeDefined()

  await context.clearCookies()
  await loginPage.navigateTo()
  await loginPage.loginWith('admin', 'admin1234')
  await page.waitForSelector('[data-test=left-nav]')

  await page.goto(link!)

  await page.waitForSelector('[data-test=wrong-user-error]')
  await page.click('[data-test=switch-user-button]')

  await loginPage.loginWith(username, 'password123')

  await page.click('[data-test=continue-button]')
  await page.click('[data-test=notifications-button]')
  await page.waitForSelector('[data-test=notifications-clear-button]')

  await expect(page.locator('[data-test=email-verification-notification]')).toHaveCount(0)
})
