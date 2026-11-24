/**
 * Card payments for wallet top-ups.
 *   PAYMENTS_PROVIDER=mock     (default) credits immediately — for development only
 *   PAYMENTS_PROVIDER=moyasar  creates a Moyasar invoice; the rider pays on Moyasar's hosted page and
 *                              the wallet is credited only after the server confirms the invoice is paid
 *                              (webhook or return URL, both re-checked against Moyasar's API).
 *   Needs MOYASAR_SECRET_KEY and PUBLIC_URL (the address riders reach this server at).
 */
export interface Invoice {
  id: string
  url: string
}

export interface PaymentGateway {
  name: 'mock' | 'moyasar'
  createTopUp(o: { amount: number; riderId: string; description: string }): Promise<Invoice | null>
  /** Returns the paid amount in SAR and the rider id if the invoice is paid, otherwise null. */
  confirm(invoiceId: string): Promise<{ amount: number; riderId: string } | null>
}

const mock: PaymentGateway = {
  name: 'mock',
  async createTopUp() {
    return null // null = no hosted page; the server credits right away
  },
  async confirm() {
    return null
  },
}

function moyasar(secret: string, publicUrl: string): PaymentGateway {
  const auth = 'Basic ' + Buffer.from(`${secret}:`).toString('base64')
  return {
    name: 'moyasar',
    async createTopUp({ amount, riderId, description }) {
      const res = await fetch('https://api.moyasar.com/v1/invoices', {
        method: 'POST',
        headers: { authorization: auth, 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // halalas
          currency: 'SAR',
          description,
          callback_url: `${publicUrl}/api/payments/moyasar/webhook`,
          success_url: `${publicUrl}/api/payments/moyasar/return`,
          back_url: `${publicUrl}/#rider`,
          metadata: { riderId, purpose: 'wallet_topup' },
        }),
      })
      const data = (await res.json()) as { id?: string; url?: string; message?: string }
      if (!res.ok || !data.id || !data.url) throw new Error(`Moyasar: ${data.message ?? res.status}`)
      return { id: data.id, url: data.url }
    },
    async confirm(invoiceId) {
      const res = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(invoiceId)}`, { headers: { authorization: auth } })
      if (!res.ok) return null
      const inv = (await res.json()) as { status?: string; amount?: number; metadata?: { riderId?: string } }
      if (inv.status !== 'paid' || !inv.metadata?.riderId || !inv.amount) return null
      return { amount: inv.amount / 100, riderId: inv.metadata.riderId }
    },
  }
}

export function paymentsFromEnv(env: NodeJS.ProcessEnv): PaymentGateway {
  const p = (env.PAYMENTS_PROVIDER ?? 'mock').toLowerCase()
  if (p === 'moyasar') {
    if (!env.MOYASAR_SECRET_KEY || !env.PUBLIC_URL) throw new Error('PAYMENTS_PROVIDER=moyasar needs MOYASAR_SECRET_KEY and PUBLIC_URL')
    return moyasar(env.MOYASAR_SECRET_KEY, env.PUBLIC_URL.replace(/\/$/, ''))
  }
  return mock
}
