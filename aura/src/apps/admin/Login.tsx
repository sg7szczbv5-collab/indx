import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { Wordmark } from '../../ds/Logo'
import { Badge, Button, ErrorState, Field, Input, OtpInput, Segmented, SuccessMark } from '../../ds/ui'
import { useI18n } from '../../i18n/I18n'
import { store, useEco } from '../../core/store'
import { ROLE_LABEL } from '../../core/seed'
import type { AdminUser } from '../../core/types'

const DEMO_PASSWORD = 'Aura@2026'
const DEMO_2FA = '246810'

export function AdminLogin({ onSuccess }: { onSuccess: (u: AdminUser) => void }) {
  const { t, L, lang, setLang, dir } = useI18n()
  const admins = useEco((s) => s.admins)
  const require2fa = useEco((s) => s.settings.twoFactorRequired)
  const [step, setStep] = useState<'creds' | '2fa' | 'forgot' | 'sent'>('creds')
  const [email, setEmail] = useState('admin@aura.demo')
  const [pw, setPw] = useState(DEMO_PASSWORD)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [user, setUser] = useState<AdminUser | null>(null)
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      const u = store.state.admins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
      if (!u || pw !== DEMO_PASSWORD) return setErr(t('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'Incorrect email or password'))
      if (!u.active) return setErr(t('هذا الحساب معطّل', 'This account is disabled'))
      setUser(u)
      if (u.twoFactor || require2fa) setStep('2fa')
      else onSuccess(u)
    }, 600)
  }

  const verify = (v: string) => {
    setCode(v)
    setErr('')
    if (v.length === 6) {
      if (v === DEMO_2FA && user) onSuccess(user)
      else setErr(t('رمز التحقق غير صحيح', 'Invalid verification code'))
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.1fr_1fr]" dir={dir}>
      <div className="aura-field relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <Wordmark tone="white" width={120} />
        <svg viewBox="0 0 400 300" className="absolute -end-16 top-28 w-[520px] opacity-80" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={i} d={`M${200 - 20 - i * 22} ${260} L200 ${70 - i * 24} L${200 + 20 + i * 22} 260`} fill="none" stroke="#fff" strokeOpacity={0.06 + (8 - i) * 0.025} strokeWidth="2.5" strokeLinejoin="round" />
          ))}
          <path d="M180 260 L200 226 L220 260" fill="none" stroke="#78B83F" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="200" cy="252" r="5" fill="#78B83F" />
        </svg>
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.25em] text-go">AURA ADMIN</p>
          <h1 className="mt-3 max-w-md font-display text-[40px] font-semibold leading-tight">{t('مركز التحكم والتشغيل', 'Operations control centre')}</h1>
          <p className="mt-3 max-w-md text-white/55">{t('راقب الرحلات مباشرة، أدر الكباتن والتسعير والمالية من مكان واحد.', 'Monitor trips live and manage captains, pricing and finance from one place.')}</p>
        </div>
      </div>

      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Wordmark width={90} />
          </div>
          <Segmented size="sm" className="ms-auto" value={lang} onChange={setLang} options={[{ value: 'ar', label: 'عربي' }, { value: 'en', label: 'English' }]} />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <AnimatePresence mode="wait">
            {step === 'creds' && (
              <motion.form key="c" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onSubmit={submit}>
                <h2 className="font-display text-[28px] font-semibold">{t('تسجيل الدخول', 'Sign in')}</h2>
                <p className="mt-1 text-sm text-mute">{t('لوحة إدارة أورا للموظفين المخوّلين فقط', 'AURA admin, authorised staff only')}</p>
                <div className="mt-7 space-y-3">
                  <Field label={t('البريد الإلكتروني', 'Email')}>
                    <Input type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!err} />
                  </Field>
                  <Field label={t('كلمة المرور', 'Password')}>
                    <Input type="password" dir="ltr" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} invalid={!!err} />
                  </Field>
                </div>
                {err && <div className="mt-3"><ErrorState title={err} /></div>}
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => { setStep('forgot'); setErr('') }} className="text-sm font-semibold text-mute hover:text-ink">
                    {t('نسيت كلمة المرور؟', 'Forgot password?')}
                  </button>
                </div>
                <Button type="submit" size="lg" full className="mt-4" loading={busy} iconEnd={<Arrow size={17} />}>
                  {t('دخول', 'Sign in')}
                </Button>
                <div className="mt-8 rounded-2xl bg-road p-4">
                  <p className="text-xs font-semibold">{t('حسابات تجريبية حسب الصلاحية', 'Demo accounts by role')}</p>
                  <p className="mt-0.5 text-[11.5px] text-mute">
                    {t('كلمة المرور', 'Password')} <span className="num font-semibold text-ink">{DEMO_PASSWORD}</span> · 2FA <span className="num font-semibold text-ink">{DEMO_2FA}</span>
                  </p>
                  <div className="mt-3 grid gap-1.5">
                    {admins.map((a) => (
                      <button type="button" key={a.id} onClick={() => { setEmail(a.email); setPw(DEMO_PASSWORD); setErr('') }} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-start text-[12.5px] ring-1 ring-line transition hover:ring-ink">
                        <span className="num" dir="ltr">
                          {a.email}
                        </span>
                        <Badge tone={a.role === 'super_admin' ? 'done' : 'neutral'}>{L(ROLE_LABEL[a.role])}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.form>
            )}
            {step === '2fa' && user && (
              <motion.div key="2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-ink text-go">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="mt-4 font-display text-[26px] font-semibold">{t('التحقق الثنائي', 'Two-factor authentication')}</h2>
                <p className="mt-1 text-sm text-mute">{t('أدخل الرمز المكوّن من ٦ أرقام من تطبيق المصادقة', 'Enter the 6-digit code from your authenticator app')}</p>
                <div className="mt-6">
                  <OtpInput length={6} value={code} onChange={verify} invalid={!!err} />
                </div>
                {err && <p className="mt-3 text-center text-sm text-danger">{err}</p>}
                <div className="mt-5 rounded-xl bg-road p-3 text-xs text-mute">
                  {t('الدور:', 'Role:')} <span className="font-semibold text-ink">{L(ROLE_LABEL[user.role])}</span> · {t('الرمز التجريبي', 'Demo code')} <span className="num font-semibold text-ink">{DEMO_2FA}</span>
                </div>
                <button onClick={() => { setStep('creds'); setCode('') }} className="mt-4 text-sm font-semibold text-mute">
                  {t('رجوع', 'Back')}
                </button>
              </motion.div>
            )}
            {step === 'forgot' && (
              <motion.form
                key="f"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onSubmit={(e) => {
                  e.preventDefault()
                  setBusy(true)
                  setTimeout(() => {
                    setBusy(false)
                    setStep('sent')
                  }, 600)
                }}
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-road">
                  <KeyRound size={22} />
                </div>
                <h2 className="mt-4 font-display text-[26px] font-semibold">{t('استعادة كلمة المرور', 'Reset password')}</h2>
                <p className="mt-1 text-sm text-mute">{t('سنرسل رابط إعادة التعيين إلى بريدك المسجّل', "We'll email a reset link to your registered address")}</p>
                <Field label={t('البريد الإلكتروني', 'Email')} className="mt-6">
                  <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Button type="submit" size="lg" full className="mt-4" loading={busy} icon={<Mail size={17} />} disabled={!/^\S+@\S+\.\S+$/.test(email)}>
                  {t('إرسال الرابط', 'Send link')}
                </Button>
                <button type="button" onClick={() => setStep('creds')} className="mt-4 text-sm font-semibold text-mute">
                  {t('العودة لتسجيل الدخول', 'Back to sign in')}
                </button>
              </motion.form>
            )}
            {step === 'sent' && (
              <motion.div key="s" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <div className="flex justify-center">
                  <SuccessMark />
                </div>
                <h2 className="mt-4 font-display text-2xl font-semibold">{t('تحقق من بريدك', 'Check your inbox')}</h2>
                <p className="mt-1 text-sm text-mute">{t('إن كان البريد مسجلاً فستصلك رسالة خلال دقائق. (لا تُرسل رسائل في النسخة التجريبية)', "If the address is registered you'll receive an email shortly. (No email is sent in the demo.)")}</p>
                <Button variant="secondary" className="mt-6" onClick={() => setStep('creds')}>
                  {t('العودة لتسجيل الدخول', 'Back to sign in')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-center text-[11px] text-mute-2">AURA Admin · {t('نسخة تجريبية — كل البيانات للعرض', 'Demo build — all data is illustrative')}</p>
      </div>
    </div>
  )
}
