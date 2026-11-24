import { useEffect, useMemo, useState } from 'react'
import { Megaphone, Send, TicketPercent, UserCheck } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, cx, DemoBadge, Field, Input, Select, Switch, useToast } from '../../../ds/ui'
import { useI18n } from '../../../i18n/I18n'
import { actions, getCustomer, getDriver, useEco } from '../../../core/store'
import { DAY, dateTime, day, int, pct, sar } from '../../../core/format'
import type { Campaign, Promo, Ticket } from '../../../core/types'
import { Can, CHART, DataTable, Drawer, FilterChips, Kpi, KV, PageHeader, Panel, useAdmin, type Col } from '../kit'
import { go, hashQuery } from '../../../app/router'

/* ============================== SUPPORT ============================== */

const CAT: Record<Ticket['category'], { ar: string; en: string }> = {
  complaint: { ar: 'شكوى', en: 'Complaint' },
  report: { ar: 'بلاغ', en: 'Report' },
  help: { ar: 'طلب مساعدة', en: 'Help request' },
  dispute: { ar: 'نزاع', en: 'Dispute' },
  lost_item: { ar: 'مفقودات', en: 'Lost item' },
  safety: { ar: 'أمان', en: 'Safety' },
}
const STATUS: Record<Ticket['status'], { ar: string; en: string; tone: 'live' | 'warn' | 'done' }> = {
  open: { ar: 'مفتوحة', en: 'Open', tone: 'live' },
  pending: { ar: 'قيد المعالجة', en: 'Pending', tone: 'warn' },
  resolved: { ar: 'محلولة', en: 'Resolved', tone: 'done' },
}
const PRIORITY_TONE = { low: 'outline', normal: 'neutral', high: 'warn', urgent: 'danger' } as const

export function SupportPage() {
  const { t, L, lang } = useI18n()
  const tickets = useEco((s) => s.tickets)
  const [status, setStatus] = useState<'all' | Ticket['status']>('all')
  const [cat, setCat] = useState('all')
  const [open, setOpen] = useState<string | null>(() => hashQuery().id ?? null)
  useEffect(() => {
    const on = () => setOpen(hashQuery().id ?? null)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const rows = tickets.filter((x) => (status === 'all' || x.status === status) && (cat === 'all' || x.category === cat))
  const requesterName = (x: Ticket) => L(x.requester.kind === 'customer' ? getCustomer(x.requester.id)?.name : getDriver(x.requester.id)?.name) || x.requester.id
  const cols: Col<Ticket>[] = [
    { key: 'id', header: t('التذكرة', 'Ticket'), cell: (x) => <span className="num font-semibold">{x.id}</span>, csv: (x) => x.id },
    { key: 'subj', header: t('الموضوع', 'Subject'), cell: (x) => <span className="block max-w-64 truncate">{x.subject}</span>, csv: (x) => x.subject },
    { key: 'cat', header: t('النوع', 'Category'), cell: (x) => <Badge tone={x.category === 'safety' ? 'danger' : x.category === 'dispute' ? 'warn' : 'neutral'}>{L(CAT[x.category])}</Badge>, csv: (x) => x.category },
    { key: 'req', header: t('مقدّم الطلب', 'Requester'), cell: (x) => <span className="whitespace-nowrap">{requesterName(x)} <span className="text-xs text-mute">· {x.requester.kind === 'customer' ? t('عميل', 'customer') : t('كابتن', 'captain')}</span></span>, csv: (x) => requesterName(x) },
    { key: 'pri', header: t('الأولوية', 'Priority'), cell: (x) => <Badge tone={PRIORITY_TONE[x.priority]}>{x.priority}</Badge>, sort: (x) => ['low', 'normal', 'high', 'urgent'].indexOf(x.priority), csv: (x) => x.priority },
    { key: 'status', header: t('الحالة', 'Status'), cell: (x) => <Badge tone={STATUS[x.status].tone} dot={x.status === 'open'}>{L(STATUS[x.status])}</Badge>, csv: (x) => x.status },
    { key: 'assignee', header: t('المسؤول', 'Assignee'), cell: (x) => x.assignee ?? <span className="text-mute-2">—</span>, csv: (x) => x.assignee ?? '' },
    { key: 'upd', header: t('آخر تحديث', 'Updated'), cell: (x) => <span className="num whitespace-nowrap text-mute">{dateTime(x.updatedAt, lang)}</span>, sort: (x) => x.updatedAt, csv: (x) => new Date(x.updatedAt).toISOString() },
  ]
  const avgFirst = useMemo(() => {
    const ds = tickets.map((x) => x.messages.find((m) => m.from === 'agent')?.at).map((a, i) => (a ? a - tickets[i].createdAt : null)).filter((x): x is number => x !== null)
    return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length / 60000 : 0
  }, [tickets])
  return (
    <div>
      <PageHeader title={t('خدمة العملاء', 'Support center')} sub={<span className="flex items-center gap-2">{t('الشكاوى والبلاغات والنزاعات بين الكابتن والعميل', 'Complaints, reports and captain–customer disputes')} <DemoBadge /></span>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t('تذاكر مفتوحة', 'Open tickets')} value={int(tickets.filter((x) => x.status === 'open').length)} live />
        <Kpi label={t('عاجلة / أمان', 'Urgent / safety')} value={int(tickets.filter((x) => x.status !== 'resolved' && (x.priority === 'urgent' || x.category === 'safety')).length)} />
        <Kpi label={t('نزاعات قائمة', 'Open disputes')} value={int(tickets.filter((x) => x.status !== 'resolved' && x.category === 'dispute').length)} />
        <Kpi label={t('متوسط أول رد', 'Avg first response')} value={avgFirst.toFixed(0)} unit={t('د', 'min')} />
      </div>
      <DataTable
        rows={rows}
        cols={cols}
        rowKey={(x) => x.id}
        onRow={(x) => setOpen(x.id)}
        exportName="aura-tickets"
        initialSort={{ key: 'upd', dir: -1 }}
        search={(x, q) => x.id.toLowerCase().includes(q) || x.subject.toLowerCase().includes(q) || (x.tripId ?? '').toLowerCase().includes(q) || requesterName(x).toLowerCase().includes(q)}
        filters={
          <>
            <FilterChips value={status} onChange={setStatus} options={[{ value: 'all', label: t('الكل', 'All'), count: tickets.length }, ...(['open', 'pending', 'resolved'] as const).map((s) => ({ value: s, label: L(STATUS[s]), count: tickets.filter((x) => x.status === s).length }))]} />
            <Select value={cat} onChange={setCat} options={[{ value: 'all', label: t('كل الأنواع', 'All categories') }, ...(Object.keys(CAT) as Ticket['category'][]).map((k) => ({ value: k, label: L(CAT[k]) }))]} />
          </>
        }
      />
      <TicketDrawer ticket={tickets.find((x) => x.id === open)} requesterName={requesterName} onClose={() => { setOpen(null); if (hashQuery().id) window.history.replaceState(null, '', '#/admin/support') }} />
    </div>
  )
}

function TicketDrawer({ ticket, onClose, requesterName }: { ticket?: Ticket; onClose: () => void; requesterName: (x: Ticket) => string }) {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const { admin, can } = useAdmin()
  const [reply, setReply] = useState('')
  const macros = [t('شكراً لتواصلك، نراجع سجل الرحلة الآن.', 'Thanks for reaching out, we are reviewing the trip log.'), t('تم إصدار رصيد في محفظتك كاعتذار.', 'We have added credit to your wallet as an apology.'), t('تم التواصل مع الكابتن وسنعود إليك خلال ساعة.', 'We contacted the captain and will update you within an hour.')]
  return (
    <Drawer
      open={!!ticket}
      onClose={onClose}
      width={600}
      title={ticket && <span className="flex items-center gap-3"><span className="num">{ticket.id}</span><Badge tone={STATUS[ticket.status].tone}>{L(STATUS[ticket.status])}</Badge></span>}
    >
      {ticket && (
        <div className="space-y-4">
          <div>
            <p className="font-display text-lg font-semibold">{ticket.subject}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="neutral">{L(CAT[ticket.category])}</Badge>
              <Badge tone={PRIORITY_TONE[ticket.priority]}>{ticket.priority}</Badge>
            </div>
          </div>
          <div className="rounded-2xl bg-road p-3">
            <KV k={t('مقدّم الطلب', 'Requester')} v={<button className="font-semibold hover:underline" onClick={() => go(ticket.requester.kind === 'driver' ? `/admin/drivers?id=${ticket.requester.id}` : '/admin/customers')}>{requesterName(ticket)}</button>} />
            {ticket.tripId && <KV k={t('الرحلة المرتبطة', 'Linked trip')} v={<button className="num font-semibold hover:underline" onClick={() => go(`/admin/trips?id=${ticket.tripId}`)}>{ticket.tripId}</button>} />}
            <KV k={t('أُنشئت', 'Created')} v={<span className="num">{dateTime(ticket.createdAt, lang)}</span>} />
            <KV k={t('المسؤول', 'Assignee')} v={ticket.assignee ?? '—'} />
          </div>
          <Can perm="support.reply">
            <div className="flex flex-wrap gap-2">
              <Select value={ticket.status} onChange={(v) => { actions.updateTicket(ticket.id, { status: v as Ticket['status'] }, admin); toast(t('تم تحديث الحالة', 'Status updated')) }} options={(['open', 'pending', 'resolved'] as const).map((s) => ({ value: s, label: L(STATUS[s]) }))} />
              <Select value={ticket.priority} onChange={(v) => actions.updateTicket(ticket.id, { priority: v as Ticket['priority'] }, admin)} options={['low', 'normal', 'high', 'urgent'].map((p) => ({ value: p, label: p }))} />
              {ticket.assignee !== admin.name && (
                <Button size="sm" variant="secondary" icon={<UserCheck size={15} />} onClick={() => actions.updateTicket(ticket.id, { assignee: admin.name }, admin)}>
                  {t('إسناد لي', 'Assign to me')}
                </Button>
              )}
            </div>
          </Can>
          <section>
            <h3 className="mb-2 text-[13px] font-semibold text-mute">{t('سجل المحادثات', 'Conversation')}</h3>
            <div className="space-y-2">
              {ticket.messages.map((m, i) => (
                <div key={i} className={cx('max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm', m.from === 'agent' ? 'ms-auto bg-ink text-white' : 'bg-road')}>
                  <p className={cx('mb-0.5 text-[11px] font-semibold', m.from === 'agent' ? 'text-go' : 'text-mute')}>{m.from === 'agent' ? (m.author ?? 'AURA') : m.from === 'customer' ? t('العميل', 'Customer') : m.from === 'driver' ? t('الكابتن', 'Captain') : 'System'}</p>
                  {m.text}
                  <p className="num mt-1 text-[10.5px] opacity-50">{dateTime(m.at, lang)}</p>
                </div>
              ))}
            </div>
          </section>
          {can('support.reply') && ticket.status !== 'resolved' && (
            <section className="rounded-2xl ring-1 ring-line">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('اكتب رداً يصل للعميل/الكابتن في التطبيق…', 'Write a reply delivered in the app…')} className="h-24 w-full resize-none rounded-t-2xl p-3 text-sm outline-none" />
              <div className="flex flex-wrap items-center gap-2 border-t border-line p-2">
                {macros.map((m) => (
                  <button key={m} onClick={() => setReply(m)} className="max-w-48 truncate rounded-lg bg-road px-2 py-1 text-[11.5px]">
                    {m}
                  </button>
                ))}
                <Button size="sm" className="ms-auto" icon={<Send size={14} />} disabled={!reply.trim()} onClick={() => { actions.replyTicket(ticket.id, { from: 'agent', author: admin.name, text: reply }, ticket.status === 'open' ? 'pending' : undefined, admin); setReply(''); toast(t('تم إرسال الرد', 'Reply sent')) }}>
                  {t('إرسال', 'Send')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { actions.replyTicket(ticket.id, { from: 'agent', author: admin.name, text: reply }, 'resolved', admin); setReply(''); toast(t('تم حل التذكرة', 'Ticket resolved')) }}>
                  {t('إرسال وإغلاق', 'Send & resolve')}
                </Button>
              </div>
            </section>
          )}
        </div>
      )}
    </Drawer>
  )
}

/* ============================== MARKETING ============================== */

export function MarketingPage() {
  const { t, L, lang } = useI18n()
  const promos = useEco((s) => s.promos)
  const campaigns = useEco((s) => s.campaigns)
  const [tab, setTab] = useState<'promos' | 'campaigns'>('promos')
  const [editPromo, setEditPromo] = useState<Promo | null>(null)
  const [editCamp, setEditCamp] = useState<Campaign | null>(null)
  const now = Date.now()
  const sent = campaigns.filter((c) => c.status === 'sent')
  const chart = sent.map((c) => ({ name: c.name, sent: c.metrics.sent, opened: c.metrics.opened, converted: c.metrics.converted }))
  const newPromo = (): Promo => ({ id: `pr-${Date.now().toString(36)}`, code: '', title: { ar: '', en: '' }, kind: 'percent', value: 20, maxDiscount: 2000, audience: 'all', active: true, startsAt: now, endsAt: now + 30 * DAY, used: 0, limit: 1000 })
  const newCamp = (): Campaign => ({ id: `cm-${Date.now().toString(36)}`, name: '', audience: 'passengers', channel: 'push', title: { ar: '', en: '' }, body: { ar: '', en: '' }, status: 'draft', metrics: { sent: 0, opened: 0, converted: 0 } })
  return (
    <div>
      <PageHeader
        title={t('التسويق والعروض', 'Marketing')}
        sub={<span className="flex items-center gap-2">{t('الكوبونات والحملات والإشعارات وقياس النتائج', 'Coupons, campaigns, notifications and results')} <DemoBadge /></span>}
        actions={
          <Can perm="marketing.edit">
            <Button size="sm" variant="secondary" icon={<TicketPercent size={15} />} onClick={() => setEditPromo(newPromo())}>
              {t('كوبون جديد', 'New coupon')}
            </Button>
            <Button size="sm" icon={<Megaphone size={15} />} onClick={() => setEditCamp(newCamp())}>
              {t('حملة جديدة', 'New campaign')}
            </Button>
          </Can>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t('كوبونات نشطة', 'Active coupons')} value={promos.filter((p) => p.active && p.endsAt > now).length} />
        <Kpi label={t('مرات الاستخدام', 'Redemptions')} value={int(promos.reduce((a, p) => a + p.used, 0))} />
        <Kpi label={t('معدل الفتح', 'Open rate')} value={pct(sent.reduce((a, c) => a + c.metrics.opened, 0) / Math.max(1, sent.reduce((a, c) => a + c.metrics.sent, 0)), 1)} />
        <Kpi label={t('معدل التحويل', 'Conversion')} value={pct(sent.reduce((a, c) => a + c.metrics.converted, 0) / Math.max(1, sent.reduce((a, c) => a + c.metrics.sent, 0)), 1)} />
      </div>
      <div className="mb-3">
        <FilterChips value={tab} onChange={setTab} options={[{ value: 'promos', label: t('أكواد الخصم', 'Discount codes'), count: promos.length }, { value: 'campaigns', label: t('الحملات والإشعارات', 'Campaigns & notifications'), count: campaigns.length }]} />
      </div>
      {tab === 'promos' ? (
        <DataTable
          rows={promos}
          rowKey={(p) => p.id}
          onRow={(p) => setEditPromo(p)}
          exportName="aura-promos"
          search={(p, q) => p.code.toLowerCase().includes(q)}
          cols={[
            { key: 'code', header: t('الكود', 'Code'), cell: (p) => <span className="num font-semibold tracking-wider">{p.code}</span>, csv: (p) => p.code },
            { key: 'title', header: t('العرض', 'Offer'), cell: (p) => L(p.title), csv: (p) => p.title.en },
            { key: 'val', header: t('القيمة', 'Value'), cell: (p) => <span className="num">{p.kind === 'percent' ? `${p.value}%` : `${sar(p.value, 0)} SAR`}{p.maxDiscount ? ` · max ${sar(p.maxDiscount, 0)}` : ''}</span>, csv: (p) => `${p.value}` },
            { key: 'aud', header: t('الفئة المستهدفة', 'Audience'), cell: (p) => ({ new: t('عملاء جدد', 'New riders'), all: t('الجميع', 'Everyone'), gold: 'Gold' })[p.audience], csv: (p) => p.audience },
            { key: 'used', header: t('الاستخدام', 'Used'), cell: (p) => <span className="num">{int(p.used)}{p.limit ? ` / ${int(p.limit)}` : ''}</span>, sort: (p) => p.used, csv: (p) => p.used },
            { key: 'ends', header: t('ينتهي', 'Ends'), cell: (p) => <span className="num text-mute">{day(p.endsAt, lang)}</span>, sort: (p) => p.endsAt, csv: (p) => new Date(p.endsAt).toISOString() },
            { key: 'st', header: t('الحالة', 'Status'), cell: (p) => (p.active && p.endsAt > now ? <Badge tone="live">{t('نشط', 'Active')}</Badge> : <Badge tone="outline">{p.endsAt < now ? t('منتهٍ', 'Expired') : t('موقوف', 'Paused')}</Badge>), csv: (p) => (p.active ? 'active' : 'paused') },
          ]}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <DataTable
            rows={campaigns}
            rowKey={(c) => c.id}
            onRow={(c) => setEditCamp(c)}
            cols={[
              { key: 'name', header: t('الحملة', 'Campaign'), cell: (c) => <span className="font-semibold">{c.name}</span> },
              { key: 'aud', header: t('الجمهور', 'Audience'), cell: (c) => ({ passengers: t('العملاء', 'Riders'), captains: t('الكباتن', 'Captains'), all: t('الجميع', 'All') })[c.audience] },
              { key: 'ch', header: t('القناة', 'Channel'), cell: (c) => <Badge tone="outline">{c.channel}</Badge> },
              { key: 'st', header: t('الحالة', 'Status'), cell: (c) => <Badge tone={c.status === 'sent' ? 'done' : c.status === 'scheduled' ? 'warn' : 'outline'}>{{ sent: t('مُرسلة', 'Sent'), scheduled: t('مجدولة', 'Scheduled'), draft: t('مسودة', 'Draft') }[c.status]}</Badge> },
              { key: 'res', header: t('النتائج', 'Results'), cell: (c) => (c.status === 'sent' ? <span className="num text-xs">{int(c.metrics.sent)} · {pct(c.metrics.opened / Math.max(1, c.metrics.sent))} {t('فتح', 'open')} · {pct(c.metrics.converted / Math.max(1, c.metrics.sent), 1)} {t('تحويل', 'conv.')}</span> : '—') },
            ]}
          />
          <Panel title={t('قياس نتائج الحملات', 'Campaign results')}>
            <div className="h-64" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={chart} margin={{ left: -10 }}>
                  <CartesianGrid vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: CHART.mid }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: CHART.mid }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#101112', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="sent" name={t('مُرسل', 'Sent')} fill={CHART.faint} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="opened" name={t('فُتح', 'Opened')} fill={CHART.mid} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="converted" name={t('تحويل', 'Converted')} fill={CHART.go} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}
      <PromoDrawer promo={editPromo} onClose={() => setEditPromo(null)} />
      <CampaignDrawer campaign={editCamp} onClose={() => setEditCamp(null)} />
    </div>
  )
}

function PromoDrawer({ promo, onClose }: { promo: Promo | null; onClose: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const { admin, can } = useAdmin()
  const [p, setP] = useState<Promo | null>(promo)
  useEffect(() => setP(promo), [promo])
  const ed = can('marketing.edit')
  return (
    <Drawer
      open={!!promo}
      onClose={onClose}
      title={promo?.code || t('كوبون جديد', 'New coupon')}
      footer={
        <Can perm="marketing.edit">
          <Button disabled={!p || p.code.length < 3 || !p.title.ar || !p.title.en || p.value <= 0} onClick={() => { actions.upsertPromo(p!, admin); toast(t('تم حفظ الكوبون. متاح فوراً في تطبيق العميل.', 'Coupon saved. Live in the Passenger app now.')); onClose() }}>
            {t('حفظ', 'Save')}
          </Button>
        </Can>
      }
    >
      {p && (
        <div className="space-y-3">
          <Field label={t('الكود', 'Code')}>
            <Input disabled={!ed} dir="ltr" className="num uppercase tracking-widest" value={p.code} onChange={(e) => setP({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14) })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('العنوان (ع)', 'Title (AR)')}>
              <Input disabled={!ed} value={p.title.ar} onChange={(e) => setP({ ...p, title: { ...p.title, ar: e.target.value } })} />
            </Field>
            <Field label={t('العنوان (EN)', 'Title (EN)')}>
              <Input disabled={!ed} dir="ltr" value={p.title.en} onChange={(e) => setP({ ...p, title: { ...p.title, en: e.target.value } })} />
            </Field>
            <Field label={t('النوع', 'Type')}>
              <Select className="h-12 w-full" value={p.kind} onChange={(v) => ed && setP({ ...p, kind: v as Promo['kind'], value: v === 'fixed' ? 1000 : 20 })} options={[{ value: 'percent', label: t('نسبة مئوية', 'Percentage') }, { value: 'fixed', label: t('مبلغ ثابت', 'Fixed amount') }]} />
            </Field>
            <Field label={p.kind === 'percent' ? t('النسبة %', 'Percent %') : t('المبلغ (SAR)', 'Amount (SAR)')}>
              <Input disabled={!ed} dir="ltr" className="num" value={p.kind === 'percent' ? String(p.value) : String(p.value / 100)} onChange={(e) => { const n = Number(e.target.value.replace(/[^\d.]/g, '')); setP({ ...p, value: p.kind === 'percent' ? Math.min(100, n) : Math.round(n * 100) }) }} />
            </Field>
            <Field label={t('أقصى خصم (SAR)', 'Max discount (SAR)')}>
              <Input disabled={!ed} dir="ltr" className="num" value={p.maxDiscount ? String(p.maxDiscount / 100) : ''} onChange={(e) => setP({ ...p, maxDiscount: Math.round(Number(e.target.value.replace(/[^\d.]/g, '')) * 100) || undefined })} />
            </Field>
            <Field label={t('حد الاستخدام', 'Usage limit')}>
              <Input disabled={!ed} dir="ltr" className="num" value={p.limit ? String(p.limit) : ''} onChange={(e) => setP({ ...p, limit: Number(e.target.value.replace(/\D/g, '')) || undefined })} />
            </Field>
            <Field label={t('الفئة المستهدفة', 'Audience')}>
              <Select className="h-12 w-full" value={p.audience} onChange={(v) => ed && setP({ ...p, audience: v as Promo['audience'] })} options={[{ value: 'all', label: t('الجميع', 'Everyone') }, { value: 'new', label: t('عملاء جدد', 'New riders') }, { value: 'gold', label: 'Gold' }]} />
            </Field>
            <Field label={t('المدة (أيام)', 'Duration (days)')}>
              <Input disabled={!ed} dir="ltr" className="num" value={String(Math.round((p.endsAt - p.startsAt) / DAY))} onChange={(e) => setP({ ...p, endsAt: p.startsAt + (Number(e.target.value.replace(/\D/g, '')) || 1) * DAY })} />
            </Field>
          </div>
          <label className="flex items-center justify-between rounded-xl bg-road px-3 py-3 text-sm">
            {t('مفعّل', 'Active')}
            <Switch checked={p.active} disabled={!ed} onChange={(v) => setP({ ...p, active: v })} />
          </label>
        </div>
      )}
    </Drawer>
  )
}

function CampaignDrawer({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const { admin, can } = useAdmin()
  const promos = useEco((s) => s.promos)
  const [c, setC] = useState<Campaign | null>(campaign)
  useEffect(() => setC(campaign), [campaign])
  const ed = can('marketing.edit') && c?.status !== 'sent'
  const valid = !!c && c.name.length > 2 && !!c.title.ar && !!c.title.en && !!c.body.ar && !!c.body.en
  return (
    <Drawer
      open={!!campaign}
      onClose={onClose}
      title={campaign?.name || t('حملة جديدة', 'New campaign')}
      footer={
        ed && (
          <>
            <Button variant="secondary" disabled={!valid} onClick={() => { actions.saveCampaignDraft(c!, admin); toast(t('تم حفظ المسودة', 'Draft saved')); onClose() }}>
              {t('حفظ كمسودة', 'Save draft')}
            </Button>
            <Button icon={<Send size={15} />} disabled={!valid} onClick={() => { actions.sendCampaign(c!, admin); toast(t('تم الإرسال. يظهر الإشعار الآن في التطبيقات.', 'Sent. The notification now appears in the apps.')); onClose() }}>
              {t('إرسال الآن', 'Send now')}
            </Button>
          </>
        )
      }
    >
      {c && (
        <div className="space-y-3">
          <Field label={t('اسم الحملة (داخلي)', 'Campaign name (internal)')}>
            <Input disabled={!ed} value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('الجمهور', 'Audience')}>
              <Select className="h-12 w-full" value={c.audience} onChange={(v) => ed && setC({ ...c, audience: v as Campaign['audience'] })} options={[{ value: 'passengers', label: t('العملاء', 'Riders') }, { value: 'captains', label: t('الكباتن', 'Captains') }, { value: 'all', label: t('الجميع', 'Everyone') }]} />
            </Field>
            <Field label={t('القناة', 'Channel')}>
              <Select className="h-12 w-full" value={c.channel} onChange={(v) => ed && setC({ ...c, channel: v as Campaign['channel'] })} options={[{ value: 'push', label: 'Push' }, { value: 'in_app', label: 'In-app' }, { value: 'sms', label: 'SMS' }]} />
            </Field>
          </div>
          <Field label={t('العنوان (ع)', 'Title (AR)')}>
            <Input disabled={!ed} value={c.title.ar} onChange={(e) => setC({ ...c, title: { ...c.title, ar: e.target.value } })} />
          </Field>
          <Field label={t('النص (ع)', 'Message (AR)')}>
            <Input disabled={!ed} value={c.body.ar} onChange={(e) => setC({ ...c, body: { ...c.body, ar: e.target.value } })} />
          </Field>
          <Field label={t('العنوان (EN)', 'Title (EN)')}>
            <Input disabled={!ed} dir="ltr" value={c.title.en} onChange={(e) => setC({ ...c, title: { ...c.title, en: e.target.value } })} />
          </Field>
          <Field label={t('النص (EN)', 'Message (EN)')}>
            <Input disabled={!ed} dir="ltr" value={c.body.en} onChange={(e) => setC({ ...c, body: { ...c.body, en: e.target.value } })} />
          </Field>
          <Field label={t('ربط بكوبون (اختياري)', 'Attach coupon (optional)')}>
            <Select className="h-12 w-full" value={c.promoCode ?? ''} onChange={(v) => ed && setC({ ...c, promoCode: v || undefined })} options={[{ value: '', label: '—' }, ...promos.map((p) => ({ value: p.code, label: p.code }))]} />
          </Field>
          <div className="rounded-2xl bg-ink p-4 text-white">
            <p className="text-[11px] text-white/50">{t('معاينة الإشعار', 'Notification preview')}</p>
            <p className="mt-1 font-semibold">{c.title.ar || '—'}</p>
            <p className="text-sm text-white/65">{c.body.ar || '—'}</p>
          </div>
          {c.status === 'sent' && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                [int(c.metrics.sent), t('مُرسل', 'Sent')],
                [int(c.metrics.opened), t('فُتح', 'Opened')],
                [int(c.metrics.converted), t('تحويل', 'Converted')],
              ].map(([v, k]) => (
                <div key={k} className="rounded-xl bg-road py-3">
                  <p className="num font-semibold">{v}</p>
                  <p className="text-[11px] text-mute">{k}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}

