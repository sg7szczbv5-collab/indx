import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Mail, User } from 'lucide-react'
import { Wordmark, LogoMark } from '../../ds/Logo'
import { Button, Field, Input, Modal, OtpInput, PhoneInput, Surface, validSaudiMobile, cx, ICON } from '../../ds/ui'
import { useI18n } from '../../i18n/I18n'
import { CityMap } from '../../map/CityMap'
import { DEMO_CURRENT } from '../../core/geo'
import { actions, store } from '../../core/store'
import { DEMO_PASSENGER_ID } from '../../core/seed'
import { Screen, TopBar, screenMotion } from '../shared/mobile'

export function PassengerSplash({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  useEffect(() => {
    const id = setTimeout(onDone, 2200)
    return () => clearTimeout(id)
  }, [onDone])
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink text-white" onClick={onDone}>
      <motion.div initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
        <Wordmark tone="white" width={168} />
      </motion.div>
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.7, type: 'spring', damping: 12 }} className="relative mt-7 size-3">
        <span className="absolute inset-0 rounded-full bg-go" />
        <span className="absolute -inset-3 animate-ping rounded-full bg-go/25" />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="absolute inset-x-0 text-center" style={{ bottom: 'calc(var(--safe-bottom) + 48px)' }}>
        <p className="font-display text-[15px] font-semibold">{t('تنقّل بثقة', 'Move with confidence')}</p>
        <p className="mt-1 text-xs text-white/45">{t('صُنع في المملكة العربية السعودية', 'Made in Saudi Arabia')}</p>
      </motion.div>
    </div>
  )
}

type Step = 'phone' | 'otp' | 'signup'

/** Demo: 55 765 4321 signs in as the seeded rider; any other valid number creates a new account. */
export function PassengerAuth({ onAuthed }: { onAuthed: (id: string) => void }) {
  const { t, lang } = useI18n()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('557654321')
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState(false)
  const [sending, setSending] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [provider, setProvider] = useState<null | 'Apple' | 'Google'>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [terms, setTerms] = useState(false)
  const DEMO_CODE = '2468'

  useEffect(() => {
    if (resendIn <= 0) return
    const id = setTimeout(() => setResendIn((x) => x - 1), 1000)
    return () => clearTimeout(id)
  }, [resendIn])

  const existing = () => store.state.customers.find((c) => c.phone.replace(/\D/g, '').endsWith(phone))

  const send = () => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setStep('otp')
      setResendIn(30)
      setCode('')
    }, 700)
  }

  useEffect(() => {
    if (step !== 'otp' || code.length < 4) return
    if (code !== DEMO_CODE) {
      setCodeErr(true)
      return
    }
    setCodeErr(false)
    const c = existing()
    const id = setTimeout(() => (c ? onAuthed(c.id) : setStep('signup')), 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step])

  const signup = () => {
    const id = actions.registerCustomer({ name: { ar: name, en: name }, phone: `+966 ${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`, email: email || undefined })
    onAuthed(id)
  }

  return (
    <Surface tone="light">
      <Screen>
        <AnimatePresence mode="wait">
          {step === 'phone' && (
            <motion.div key="phone" {...screenMotion} className="absolute inset-0 flex flex-col">
              <div className="relative h-[42%] shrink-0">
                <CityMap center={DEMO_CURRENT.pos} zoom={95} interactive={false} labels={false} />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/40 to-white" />
                <div className="absolute inset-x-0 bottom-6 flex justify-center">
                  <Wordmark width={128} />
                </div>
              </div>
              <div className="flex flex-1 flex-col px-6">
                <h1 className="font-display text-[26px] font-semibold">{t('أهلاً بك في أورا', 'Welcome to AURA')}</h1>
                <p className="mt-1 text-sm text-mute">{t('أدخل رقم جوالك للمتابعة', 'Enter your mobile number to continue')}</p>
                <div className="mt-5">
                  <PhoneInput value={phone} onChange={setPhone} />
                </div>
                <Button size="lg" full className="mt-3" disabled={!validSaudiMobile(phone)} loading={sending} onClick={send}>
                  {t('متابعة', 'Continue')}
                </Button>
                <div className="my-4 flex items-center gap-3 text-xs text-mute-2">
                  <span className="h-px flex-1 bg-line" />
                  {t('أو', 'or')}
                  <span className="h-px flex-1 bg-line" />
                </div>
                <div className="grid gap-2">
                  <Button variant="secondary" size="lg" full onClick={() => setProvider('Apple')} icon={<AppleGlyph />}>
                    {t('المتابعة عبر Apple', 'Continue with Apple')}
                  </Button>
                  <Button variant="secondary" size="lg" full onClick={() => setProvider('Google')} icon={<GoogleGlyph />}>
                    {t('المتابعة عبر Google', 'Continue with Google')}
                  </Button>
                </div>
                <p className="mt-auto pt-4 text-center text-[11px] leading-relaxed text-mute-2" style={{ paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}>
                  {t('بالمتابعة توافق على الشروط وسياسة الخصوصية', 'By continuing you agree to the Terms and Privacy Policy')}
                </p>
              </div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div key="otp" {...screenMotion} className="absolute inset-0 flex flex-col">
              <TopBar onBack={() => setStep('phone')} />
              <div className="flex flex-1 flex-col px-6">
                <h1 className="font-display text-[26px] font-semibold">{t('رمز التحقق', 'Verification code')}</h1>
                <p className="mt-1 text-sm text-mute">
                  {t('أرسلنا رمزاً من ٤ أرقام إلى', 'We sent a 4-digit code to')}{' '}
                  <span dir="ltr" className="num inline-block font-semibold text-ink">
                    +966 {phone}
                  </span>
                </p>
                <div className="mt-8">
                  <OtpInput value={code} onChange={(v) => { setCode(v); setCodeErr(false) }} invalid={codeErr} />
                </div>
                {codeErr && <p className="mt-3 text-center text-sm text-danger">{t('الرمز غير صحيح، حاول مرة أخرى', 'Incorrect code, try again')}</p>}
                <div className="mt-6 rounded-2xl bg-road p-3 text-center text-xs text-mute">
                  {t('نسخة تجريبية: الرمز هو', 'Demo build: the code is')} <span className="num font-semibold text-ink">{DEMO_CODE}</span>
                </div>
                <button disabled={resendIn > 0} onClick={send} className="mt-4 text-sm font-semibold disabled:text-mute-2">
                  {resendIn > 0 ? `${t('إعادة الإرسال خلال', 'Resend in')} ${resendIn}s` : t('إعادة إرسال الرمز', 'Resend code')}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'signup' && (
            <motion.div key="signup" {...screenMotion} className="absolute inset-0 flex flex-col">
              <TopBar title={t('حساب جديد', 'New account')} onBack={() => setStep('phone')} />
              <div className="flex flex-1 flex-col px-6">
                <h1 className="font-display text-[24px] font-semibold">{t('لنبدأ رحلتك الأولى', "Let's start your first ride")}</h1>
                <div className="mt-2 flex gap-1.5">
                  <span className="h-1 flex-1 rounded-full bg-go" />
                  <span className="h-1 flex-1 rounded-full bg-go" />
                  <span className={cx('h-1 flex-1 rounded-full', name ? 'bg-go' : 'bg-line')} />
                </div>
                <div className="mt-6 grid gap-3">
                  <Field label={t('الاسم الكامل', 'Full name')}>
                    <div className="relative">
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('مثال: سارة القحطاني', 'e.g. Sarah Al-Qahtani')} className="pe-11" autoFocus />
                      <User size={18} className="absolute end-4 top-1/2 -translate-y-1/2 text-mute-2" {...ICON} />
                    </div>
                  </Field>
                  <Field label={t('البريد الإلكتروني (اختياري)', 'Email (optional)')} error={email && !/^\S+@\S+\.\S+$/.test(email) ? t('صيغة البريد غير صحيحة', 'Invalid email') : undefined}>
                    <div className="relative">
                      <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="pe-11 text-start" />
                      <Mail size={18} className="absolute end-4 top-1/2 -translate-y-1/2 text-mute-2" {...ICON} />
                    </div>
                  </Field>
                  <Field label={t('رقم الجوال', 'Mobile')}>
                    <div dir="ltr" className="num flex h-12 items-center rounded-xl bg-road px-4 text-mute">+966 {phone}</div>
                  </Field>
                  <button onClick={() => setTerms(!terms)} className="mt-1 flex items-center gap-2.5 text-start text-sm">
                    <span className={cx('flex size-5 items-center justify-center rounded-md border', terms ? 'border-ink bg-ink text-white' : 'border-line-2')}>{terms && <Check size={14} strokeWidth={3} />}</span>
                    {t('أوافق على الشروط والأحكام', 'I agree to the Terms & Conditions')}
                  </button>
                </div>
                <div className="mt-auto" style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}>
                  <Button size="lg" full disabled={name.trim().length < 3 || !terms || (!!email && !/^\S+@\S+\.\S+$/.test(email))} onClick={signup}>
                    {t('إنشاء الحساب', 'Create account')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Modal contained open={!!provider} onClose={() => setProvider(null)} title={`${t('تسجيل الدخول عبر', 'Sign in with')} ${provider ?? ''}`} width={340}>
          <div className="flex flex-col items-center text-center">
            <LogoMark size={36} />
            <p className="mt-3 text-sm text-mute">
              {t(
                `تسجيل الدخول عبر ${provider} يتطلب ربط حساب المطوّر وإعداد مفاتيح OAuth. هذا التكامل غير مفعّل في النسخة التجريبية.`,
                `${provider} sign-in requires developer account setup and OAuth keys. This integration is not connected in the demo build.`,
              )}
            </p>
            <Button full className="mt-4" onClick={() => setProvider(null)}>
              {t('المتابعة برقم الجوال', 'Continue with mobile')}
            </Button>
            <button className="mt-3 text-xs font-semibold text-mute underline" onClick={() => { setProvider(null); onAuthed(DEMO_PASSENGER_ID) }}>
              {lang === 'ar' ? 'دخول كحساب تجريبي' : 'Enter as demo account'}
            </button>
          </div>
        </Modal>
      </Screen>
    </Surface>
  )
}

function AppleGlyph() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 19" aria-hidden>
      <path fill="currentColor" d="M13.2 10.1c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8C3.3 4.7 1.8 5.7 1 7.2c-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-4zM10.8 3c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
    </svg>
  )
}
function GoogleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
      <path fill="#101112" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
    </svg>
  )
}
