import { Fragment, useState } from 'react'
import { Lock, RotateCcw, Save, ShieldCheck, UserPlus } from 'lucide-react'
import { Badge, Button, cx, Field, Input, Modal, Select, Switch, useToast } from '../../../ds/ui'
import { useI18n } from '../../../i18n/I18n'
import { actions, useEco, type Settings } from '../../../core/store'
import { ALL_PERMISSIONS, ROLE_LABEL } from '../../../core/seed'
import { dateTime, relative } from '../../../core/format'
import type { AdminRole, AdminUser, AuditEntry, Permission } from '../../../core/types'
import { Can, DataTable, Drawer, FilterChips, PageHeader, Panel, useAdmin, type Col } from '../kit'

const ROLES: AdminRole[] = ['super_admin', 'operations_manager', 'finance_manager', 'customer_support', 'driver_manager', 'marketing_manager']

const PERM_GROUPS: { label: { ar: string; en: string }; perms: Permission[] }[] = [
  { label: { ar: 'التشغيل', en: 'Operations' }, perms: ['dashboard.view', 'livemap.view', 'trips.view', 'trips.cancel'] },
  { label: { ar: 'الكباتن والمركبات', en: 'Captains & vehicles' }, perms: ['drivers.view', 'drivers.edit', 'drivers.approve', 'drivers.suspend', 'vehicles.view', 'vehicles.edit'] },
  { label: { ar: 'العملاء والدعم', en: 'Customers & support' }, perms: ['customers.view', 'customers.block', 'support.view', 'support.reply'] },
  { label: { ar: 'المالية والتسعير', en: 'Finance & pricing' }, perms: ['finance.view', 'finance.settle', 'pricing.view', 'pricing.edit', 'zones.view', 'zones.edit'] },
  { label: { ar: 'التسويق والتقارير', en: 'Marketing & reports' }, perms: ['marketing.view', 'marketing.edit', 'reports.view', 'reports.export'] },
  { label: { ar: 'النظام', en: 'System' }, perms: ['roles.manage', 'settings.view', 'settings.edit', 'audit.view'] },
]

/* ============================== ROLES ============================== */

export function RolesPage() {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const { admin, can } = useAdmin()
  const rolePerms = useEco((s) => s.rolePerms)
  const admins = useEco((s) => s.admins)
  const [tab, setTab] = useState<'matrix' | 'users'>('matrix')
  const [edit, setEdit] = useState<AdminUser | null>(null)
  const manage = can('roles.manage')
  const toggle = (role: AdminRole, p: Permission) => {
    if (!manage || role === 'super_admin') return
    const has = rolePerms[role].includes(p)
    actions.setRolePermissions(role, has ? rolePerms[role].filter((x) => x !== p) : [...rolePerms[role], p], admin)
  }
  const cols: Col<AdminUser>[] = [
    { key: 'n', header: t('الموظف', 'Staff member'), cell: (u) => <span><span className="block font-semibold">{u.name}</span><span className="block text-xs text-mute" dir="ltr">{u.email}</span></span> },
    { key: 'r', header: t('الدور', 'Role'), cell: (u) => <Badge tone={u.role === 'super_admin' ? 'done' : 'neutral'}>{L(ROLE_LABEL[u.role])}</Badge> },
    { key: '2', header: '2FA', cell: (u) => (u.twoFactor ? <Badge tone="live">{t('مفعّل', 'On')}</Badge> : <Badge tone="warn">{t('غير مفعّل', 'Off')}</Badge>) },
    { key: 's', header: t('الحالة', 'Status'), cell: (u) => (u.active ? <Badge tone="live">{t('نشط', 'Active')}</Badge> : <Badge tone="outline">{t('معطّل', 'Disabled')}</Badge>) },
    { key: 'l', header: t('آخر دخول', 'Last seen'), cell: (u) => <span className="num text-mute">{u.lastSeen ? relative(u.lastSeen, lang) : '—'}</span> },
  ]
  return (
    <div>
      <PageHeader
        title={t('المستخدمون والصلاحيات', 'Users & permissions')}
        sub={t('كل دور يرى ويعدّل ما يخصّه فقط. المدير العام وحده يدير الصلاحيات.', 'Each role sees and edits only what it needs. Only Super Admin manages permissions.')}
        actions={
          <Can perm="roles.manage">
            <Button size="sm" icon={<UserPlus size={15} />} onClick={() => setEdit({ id: `adm-${Date.now().toString(36)}`, name: '', email: '', role: 'customer_support', active: true, twoFactor: true })}>
              {t('إضافة موظف', 'Add staff')}
            </Button>
          </Can>
        }
      />
      <div className="mb-3">
        <FilterChips value={tab} onChange={setTab} options={[{ value: 'matrix', label: t('مصفوفة الصلاحيات', 'Permission matrix') }, { value: 'users', label: t('الموظفون', 'Staff'), count: admins.length }]} />
      </div>
      {tab === 'matrix' ? (
        <div className="thin-scroll overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-start text-[12px] font-medium text-mute">{t('الصلاحية', 'Permission')}</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-2 py-3 text-center text-[12px] font-semibold">
                    {L(ROLE_LABEL[r])}
                    <span className="num block text-[10.5px] font-normal text-mute">{rolePerms[r].length}/{ALL_PERMISSIONS.length}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERM_GROUPS.map((g) => (
                <Fragment key={g.label.en}>
                  <tr className="bg-road/70">
                    <td colSpan={ROLES.length + 1} className="px-4 py-2 text-[12px] font-semibold text-mute">
                      {L(g.label)}
                    </td>
                  </tr>
                  {g.perms.map((p) => (
                    <tr key={p} className="border-b border-line/70">
                      <td className="num px-4 py-2 text-[12.5px]" dir="ltr" style={{ textAlign: 'start' }}>
                        {p}
                      </td>
                      {ROLES.map((r) => {
                        const on = rolePerms[r].includes(p)
                        const locked = r === 'super_admin' || !manage
                        return (
                          <td key={r} className="px-2 py-2 text-center">
                            <button
                              aria-label={`${r} ${p}`}
                              aria-pressed={on}
                              disabled={locked}
                              onClick={() => toggle(r, p)}
                              className={cx('inline-flex size-6 items-center justify-center rounded-md transition', on ? 'bg-ink text-white' : 'bg-road text-transparent ring-1 ring-line-2', !locked && 'hover:scale-110', locked && 'cursor-not-allowed', r === 'super_admin' && 'opacity-70')}
                            >
                              {r === 'super_admin' ? <Lock size={11} /> : '✓'}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <DataTable rows={admins} cols={cols} rowKey={(u) => u.id} onRow={(u) => manage && setEdit(u)} search={(u, q) => u.name.toLowerCase().includes(q) || u.email.includes(q)} />
      )}
      {!manage && <p className="mt-3 text-xs text-mute">{t('عرض فقط: إدارة الصلاحيات للمدير العام.', 'Read-only: permission management is for Super Admin.')}</p>}
      <Drawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.name || t('موظف جديد', 'New staff member')}
        footer={
          <Button
            icon={<Save size={15} />}
            disabled={!edit || edit.name.length < 3 || !/^\S+@\S+\.\S+$/.test(edit.email) || (edit.id === admin.id && edit.role !== 'super_admin')}
            onClick={() => {
              actions.upsertAdmin(edit!, admin)
              toast(t('تم الحفظ', 'Saved'))
              setEdit(null)
            }}
          >
            {t('حفظ', 'Save')}
          </Button>
        }
      >
        {edit && (
          <div className="space-y-3">
            <Field label={t('الاسم', 'Name')}>
              <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label={t('البريد الإلكتروني', 'Email')}>
              <Input dir="ltr" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            </Field>
            <Field label={t('الدور', 'Role')} hint={edit.id === admin.id ? t('لا يمكنك تغيير دورك بنفسك', "You can't change your own role") : undefined}>
              <Select className="h-12 w-full" value={edit.role} onChange={(v) => edit.id !== admin.id && setEdit({ ...edit, role: v as AdminRole })} options={ROLES.map((r) => ({ value: r, label: L(ROLE_LABEL[r]) }))} />
            </Field>
            <label className="flex items-center justify-between rounded-xl bg-road px-3 py-3 text-sm">
              {t('التحقق الثنائي إلزامي', 'Require 2FA')}
              <Switch checked={edit.twoFactor} onChange={(v) => setEdit({ ...edit, twoFactor: v })} />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-road px-3 py-3 text-sm">
              {t('الحساب نشط', 'Account active')}
              <Switch checked={edit.active} disabled={edit.id === admin.id} onChange={(v) => setEdit({ ...edit, active: v })} />
            </label>
            <div className="rounded-xl ring-1 ring-line p-3">
              <p className="mb-2 text-xs font-semibold text-mute">{t('صلاحيات هذا الدور', 'Permissions of this role')}</p>
              <div className="flex flex-wrap gap-1">
                {rolePerms[edit.role].map((p) => (
                  <span key={p} className="num rounded-md bg-road px-1.5 py-0.5 text-[11px]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3.5 last:border-0">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {sub && <p className="text-xs text-mute">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

/* ============================== SETTINGS ============================== */

type Section = 'company' | 'app' | 'languages' | 'taxes' | 'payments' | 'notifications' | 'security' | 'audit'

export function SettingsPage() {
  const { t, L, lang } = useI18n()
  const toast = useToast()
  const { admin, can } = useAdmin()
  const settings = useEco((s) => s.settings)
  const vat = useEco((s) => s.pricing.vatRate)
  const auditLog = useEco((s) => s.audit)
  const [sec, setSec] = useState<Section>('company')
  const [draft, setDraft] = useState<Settings>(settings)
  const [confirmReset, setConfirmReset] = useState(false)
  const ed = can('settings.edit')
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)
  const save = () => {
    actions.updateSettings(draft, admin, sec)
    toast(t('تم حفظ الإعدادات', 'Settings saved'))
  }
  const sections: { id: Section; label: string; perm?: 'audit.view' }[] = [
    { id: 'company', label: t('بيانات الشركة', 'Company') },
    { id: 'app', label: t('إعدادات التطبيق', 'App settings') },
    { id: 'languages', label: t('اللغات', 'Languages') },
    { id: 'taxes', label: t('الضرائب', 'Taxes') },
    { id: 'payments', label: t('بوابات الدفع', 'Payment gateways') },
    { id: 'notifications', label: t('الإشعارات', 'Notifications') },
    { id: 'security', label: t('إعدادات الأمان', 'Security') },
    { id: 'audit', label: t('سجل العمليات', 'Audit log'), perm: 'audit.view' },
  ]
  const auditCols: Col<AuditEntry>[] = [
    { key: 'at', header: t('الوقت', 'Time'), cell: (a) => <span className="num whitespace-nowrap text-mute">{dateTime(a.at, lang)}</span>, sort: (a) => a.at, csv: (a) => new Date(a.at).toISOString() },
    { key: 'actor', header: t('المنفّذ', 'Actor'), cell: (a) => <span><span className="block font-semibold">{a.actor}</span><span className="block text-xs text-mute">{a.role in ROLE_LABEL ? L(ROLE_LABEL[a.role as AdminRole]) : a.role}</span></span>, csv: (a) => a.actor },
    { key: 'action', header: t('العملية', 'Action'), cell: (a) => <span className="num rounded-md bg-road px-1.5 py-0.5 text-[12px]">{a.action}</span>, csv: (a) => a.action },
    { key: 'target', header: t('الهدف', 'Target'), cell: (a) => a.target ?? '—', csv: (a) => a.target ?? '' },
    { key: 'detail', header: t('التفاصيل', 'Detail'), cell: (a) => <span className="num block max-w-72 truncate text-mute" dir="ltr">{a.detail ?? ''}</span>, csv: (a) => a.detail ?? '' },
  ]

  return (
    <div>
      <PageHeader
        title={t('إعدادات المنصة', 'Platform settings')}
        actions={
          sec !== 'audit' && (
            <Can perm="settings.edit">
              <Button size="sm" icon={<Save size={15} />} disabled={!dirty} onClick={save}>
                {t('حفظ', 'Save')}
              </Button>
            </Can>
          )
        }
      />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {sections
            .filter((s) => !s.perm || can(s.perm))
            .map((s) => (
              <button key={s.id} onClick={() => setSec(s.id)} className={cx('shrink-0 rounded-xl px-3.5 py-2.5 text-start text-sm font-medium transition', sec === s.id ? 'bg-ink text-white' : 'hover:bg-white')}>
                {s.label}
              </button>
            ))}
        </nav>
        <div>
          {!ed && sec !== 'audit' && <p className="mb-3 rounded-xl bg-warn-soft px-4 py-2.5 text-sm text-warn">{t('عرض فقط', 'Read-only')}</p>}
          {sec === 'company' && (
            <Panel>
              <div className="grid gap-3 md:grid-cols-2">
                {(Object.keys(draft.company) as (keyof Settings['company'])[]).map((k) => (
                  <Field key={k} label={{ name: t('الاسم التجاري', 'Brand name'), legalName: t('الاسم القانوني', 'Legal name'), cr: t('السجل التجاري', 'Commercial registration'), vatNumber: t('الرقم الضريبي', 'VAT number'), email: t('البريد', 'Email'), phone: t('الهاتف', 'Phone'), address: t('العنوان', 'Address') }[k]}>
                    <Input disabled={!ed} value={draft.company[k]} onChange={(e) => setDraft({ ...draft, company: { ...draft.company, [k]: e.target.value } })} />
                  </Field>
                ))}
              </div>
            </Panel>
          )}
          {sec === 'app' && (
            <Panel>
              <Row label={t('التوزيع التلقائي (تجريبي)', 'Auto-dispatch (demo)')} sub={t('كابتن محاكى يقبل الطلب إن لم يقبله كابتن التطبيق', 'A simulated captain accepts if no app captain does')}>
                <Switch checked={draft.autoDispatch} disabled={!ed} onChange={(v) => setDraft({ ...draft, autoDispatch: v })} />
              </Row>
              <Row label={t('مهلة قبول الطلب (ثانية)', 'Offer timeout (seconds)')}>
                <Input disabled={!ed} className="num w-24" dir="ltr" value={String(draft.offerSeconds)} onChange={(e) => setDraft({ ...draft, offerSeconds: Math.max(5, Math.min(60, Number(e.target.value.replace(/\D/g, '')) || 5)) })} />
              </Row>
              <Row label={t('مهلة البحث عن كابتن (ثانية)', 'Search timeout (seconds)')}>
                <Input disabled={!ed} className="num w-24" dir="ltr" value={String(draft.searchTimeoutSec)} onChange={(e) => setDraft({ ...draft, searchTimeoutSec: Math.max(20, Math.min(600, Number(e.target.value.replace(/\D/g, '')) || 20)) })} />
              </Row>
              <Row label={t('رمز التحقق إلزامي لبدء الرحلة', 'Trip code required to start')}>
                <Switch checked={draft.requireOtp} disabled={!ed} onChange={(v) => setDraft({ ...draft, requireOtp: v })} />
              </Row>
              <Row label={t('تسريع وقت المحاكاة', 'Demo time acceleration')} sub={t('١ = زمن حقيقي', '1 = real time')}>
                <Select value={String(draft.demoSpeed)} onChange={(v) => ed && setDraft({ ...draft, demoSpeed: Number(v) })} options={[1, 4, 8, 12, 20].map((n) => ({ value: String(n), label: `×${n}` }))} />
              </Row>
            </Panel>
          )}
          {sec === 'languages' && (
            <Panel>
              <Row label="العربية" sub="RTL">
                <Switch checked={draft.languages.ar} disabled onChange={() => {}} />
              </Row>
              <Row label="English" sub="LTR">
                <Switch checked={draft.languages.en} disabled={!ed} onChange={(v) => setDraft({ ...draft, languages: { ...draft.languages, en: v } })} />
              </Row>
              <Row label={t('اللغة الافتراضية', 'Default language')}>
                <Select value={draft.defaultLanguage} onChange={(v) => ed && setDraft({ ...draft, defaultLanguage: v as 'ar' | 'en' })} options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} />
              </Row>
            </Panel>
          )}
          {sec === 'taxes' && (
            <Panel>
              <Row label={t('ضريبة القيمة المضافة', 'VAT')} sub={t('تُعدّل من صفحة التسعير مع سجل التغييرات', 'Edited from Pricing with change log')}>
                <span className="num text-lg font-semibold">{Math.round(vat * 100)}%</span>
              </Row>
              <Row label={t('الرقم الضريبي', 'VAT number')}>
                <span className="num">{draft.company.vatNumber}</span>
              </Row>
              <Row label={t('الفوترة الإلكترونية (فاتورة)', 'E-invoicing (FATOORA)')} sub={t('تتطلب الربط مع منصة هيئة الزكاة والضريبة والجمارك', 'Requires ZATCA integration')}>
                <Badge tone="warn">{t('غير مربوط', 'Not connected')}</Badge>
              </Row>
            </Panel>
          )}
          {sec === 'payments' && (
            <Panel>
              {(Object.keys(draft.gateways) as (keyof Settings['gateways'])[]).map((g) => (
                <Row key={g} label={{ mada: 'mada', apple_pay: 'Apple Pay', stc_pay: 'STC Pay', cash: t('نقداً', 'Cash'), wallet: t('محفظة أورا', 'AURA Wallet') }[g]} sub={g === 'cash' || g === 'wallet' ? t('داخلي', 'Internal') : t('يتطلب عقد بوابة دفع مرخّصة ومفاتيح API', 'Requires a licensed gateway contract and API keys')}>
                  <span className="flex items-center gap-3">
                    {g !== 'cash' && g !== 'wallet' && <Badge tone="outline">{t('وضع تجريبي', 'Sandbox')}</Badge>}
                    <Switch checked={draft.gateways[g]} disabled={!ed} onChange={(v) => setDraft({ ...draft, gateways: { ...draft.gateways, [g]: v } })} />
                  </span>
                </Row>
              ))}
              <p className="mt-2 text-xs text-mute">{t('إيقاف بوابة يخفيها فوراً من خيارات الدفع في تطبيق العميل.', 'Disabling a gateway hides it immediately from payment options in the Passenger app.')}</p>
            </Panel>
          )}
          {sec === 'notifications' && (
            <Panel>
              {(Object.keys(draft.notify) as (keyof Settings['notify'])[]).map((k) => (
                <Row key={k} label={{ tripUpdates: t('تحديثات الرحلات', 'Trip updates'), marketing: t('الرسائل التسويقية', 'Marketing messages'), driverDocsExpiry: t('تنبيه انتهاء مستندات الكباتن', 'Captain document expiry alerts'), payoutReady: t('إشعار جاهزية التحويل', 'Payout ready notices') }[k]}>
                  <Switch checked={draft.notify[k]} disabled={!ed} onChange={(v) => setDraft({ ...draft, notify: { ...draft.notify, [k]: v } })} />
                </Row>
              ))}
            </Panel>
          )}
          {sec === 'security' && (
            <Panel>
              <Row label={t('التحقق الثنائي إلزامي لكل الموظفين', 'Require 2FA for all staff')}>
                <Switch checked={draft.twoFactorRequired} disabled={!ed} onChange={(v) => setDraft({ ...draft, twoFactorRequired: v })} />
              </Row>
              <Row label={t('مهلة انتهاء الجلسة (دقيقة)', 'Session timeout (minutes)')}>
                <Select value={String(draft.sessionMinutes)} onChange={(v) => ed && setDraft({ ...draft, sessionMinutes: Number(v) })} options={[15, 30, 60, 240].map((n) => ({ value: String(n), label: String(n) }))} />
              </Row>
              <Row label={t('إعادة ضبط البيانات التجريبية', 'Reset demo data')} sub={t('يحذف رحلات الجلسة ويعيد البيانات الأولية', 'Clears session trips and restores seed data')}>
                <Button variant="danger" size="sm" icon={<RotateCcw size={14} />} disabled={admin.role !== 'super_admin'} onClick={() => setConfirmReset(true)}>
                  {t('إعادة ضبط', 'Reset')}
                </Button>
              </Row>
              <p className="mt-2 flex items-center gap-2 text-xs text-mute">
                <ShieldCheck size={14} /> {t('تسجيل الدخول في النسخة التجريبية محلي. الإنتاج يتطلب خادم مصادقة وتشفير وجلسات آمنة.', 'Demo sign-in is local. Production requires an auth server, encryption and secure sessions.')}
              </p>
            </Panel>
          )}
          {sec === 'audit' && can('audit.view') && <DataTable rows={auditLog} cols={auditCols} rowKey={(a) => a.id} exportName="aura-audit-log" initialSort={{ key: 'at', dir: -1 }} search={(a, q) => `${a.actor} ${a.action} ${a.target ?? ''}`.toLowerCase().includes(q)} dense pageSize={15} />}
        </div>
      </div>
      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('إعادة ضبط البيانات التجريبية؟', 'Reset demo data?')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button variant="danger" onClick={() => { actions.resetDemo(); setConfirmReset(false); toast(t('تمت إعادة الضبط', 'Demo data reset')) }}>
              {t('إعادة ضبط', 'Reset')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-mute">{t('سيتم حذف كل الرحلات والتعديلات التي أنشئت في هذه الجلسة في التطبيقات الثلاثة.', 'All trips and changes made in this session across the three apps will be removed.')}</p>
      </Modal>
    </div>
  )
}
