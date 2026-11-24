/**
 * SMS delivery for one-time codes.
 *   SMS_PROVIDER=console  (default) prints the code to the server log
 *   SMS_PROVIDER=unifonic  needs UNIFONIC_APP_SID (and optionally UNIFONIC_SENDER_ID)
 *   SMS_PROVIDER=twilio    needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 */
import { toE164 } from './auth'

export interface SmsSender {
  name: string
  send(phone: string, text: string): Promise<void>
}

const consoleSender: SmsSender = {
  name: 'console',
  async send(phone, text) {
    console.log(`[sms → ${phone}] ${text}`)
  },
}

function unifonic(appSid: string, sender?: string): SmsSender {
  return {
    name: 'unifonic',
    async send(phone, text) {
      const body = new URLSearchParams({ AppSid: appSid, Recipient: toE164(phone).slice(1), Body: text })
      if (sender) body.set('SenderID', sender)
      const res = await fetch('https://el.cloud.unifonic.com/rest/SMS/messages', { method: 'POST', body })
      const data = (await res.json().catch(() => ({}))) as { success?: boolean | string; message?: string }
      if (!res.ok || String(data.success) !== 'true') throw new Error(`Unifonic: ${data.message ?? res.status}`)
    },
  }
}

function twilio(sid: string, token: string, from: string): SmsSender {
  return {
    name: 'twilio',
    async send(phone, text) {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: { authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') },
        body: new URLSearchParams({ To: toE164(phone), From: from, Body: text }),
      })
      if (!res.ok) throw new Error(`Twilio: ${res.status} ${await res.text()}`)
    },
  }
}

export function smsFromEnv(env: NodeJS.ProcessEnv): SmsSender {
  const p = (env.SMS_PROVIDER ?? 'console').toLowerCase()
  if (p === 'unifonic') {
    if (!env.UNIFONIC_APP_SID) throw new Error('SMS_PROVIDER=unifonic needs UNIFONIC_APP_SID')
    return unifonic(env.UNIFONIC_APP_SID, env.UNIFONIC_SENDER_ID)
  }
  if (p === 'twilio') {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) throw new Error('SMS_PROVIDER=twilio needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM')
    return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, env.TWILIO_FROM)
  }
  return consoleSender
}
