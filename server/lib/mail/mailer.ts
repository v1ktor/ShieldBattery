import formData from 'form-data'
import { readFile } from 'fs/promises'
import handlebars, { TemplateDelegate } from 'handlebars'
import Mailgun from 'mailgun.js'
import path from 'path'
import log from '../logging/logger'

const enabled = !!process.env.SB_MAILGUN_KEY

const FROM = enabled ? process.env.SB_MAILGUN_FROM : ''
const HOST = process.env.SB_CANONICAL_HOST
const DOMAIN = process.env.SB_MAILGUN_DOMAIN
const mailgunClient = enabled
  ? new Mailgun(formData).client({
      username: 'api',
      key: process.env.SB_MAILGUN_KEY!,
      // NOTE(tec27): This is optional and only really meant to be used for testing
      url: process.env.SB_MAILGUN_URL,
    })
  : undefined

interface TemplateCollection {
  html: TemplateDelegate
  text: TemplateDelegate
}

const templates = new Map<string, Promise<TemplateCollection>>()

async function readTemplate(name: string): Promise<TemplateCollection> {
  const htmlContents = readFile(path.join(__dirname, 'templates', name + '.html'), 'utf8')
  const textContents = readFile(path.join(__dirname, 'templates', name + '.txt'), 'utf8')
  return {
    html: handlebars.compile(await htmlContents),
    text: handlebars.compile(await textContents),
  }
}

export default async function sendMail({
  to,
  subject,
  templateName,
  templateData,
}: {
  to: string
  subject: string
  templateName: string
  templateData: any
}) {
  if (!templates.has(templateName)) {
    templates.set(templateName, readTemplate(templateName))
  }

  const { html: htmlTemplate, text: textTemplate } = await templates.get(templateName)!
  const templateContext = { ...templateData, HOST }
  const html = htmlTemplate(templateContext)
  const text = textTemplate(templateContext)
  const mailData = {
    from: FROM,
    to,
    subject,
    html,
    text,
  }

  if (!enabled) {
    if (process.env.NODE_ENV !== 'production') {
      // In dev, we log out the emails to console to make them easy to test links, etc.
      log.debug(
        {},
        '\n\n==EMAIL==\n\nTo: ' + to + '\nSubject: ' + subject + '\nBody:\n' + text + '\n\n====',
      )
    }
    return undefined
  } else {
    return mailgunClient?.messages.create(DOMAIN!, mailData)
  }
}
