import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Check, Clock, FileCheck2, FileUp, ShieldCheck, X, XCircle } from 'lucide-react'
import { Wordmark } from '../../ds/Logo'
import { Button, cx, Field, ICON, Input, OtpInput, PhoneInput, Select, SuccessMark, validSaudiMobile } from '../../ds/ui'
import { useI18n } from '../../i18n/I18n'
import { actions, getDriver, store, useEco } from '../../core/store'
import { CITIES } from '../../core/geo'
import { VEHICLE_CLASSES } from '../../core/pricing'
import type { CityId, DriverDoc, VehicleClassId } from '../../core/types'
import { TopBar, screenMotion } from '../shared/mobile'

export function DriverSplash({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  useEffect(() => {
    const id = setTimeout(onDone, 2200)
    return () => clearTimeout(id)
  }, [onDone])
  return (
    <div className="aura-field absolute inset-0 flex flex-col items-center justify-center text-white" onClick={onDone}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
        <Wordmark tone="white" width={160} />
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6 font-display text-lg font-medium">
        {t('أهلاً بك في عالم أورا', 'Welcome to the world of AURA')}
      </motion.p>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-2 rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-white/60">
        CAPTAIN
      </motion.span>
    </div>
  )
}

type Step = 'phone' | 'otp' | 'personal' | 'id_docs' | 'vehicle' | 'vehicle_docs'
const STEPS: Step[] = ['personal', 'id_docs', 'vehicle', 'vehicle_docs']
const DEMO_CODE = '1357'

/** Login + 4-step captain application. Demo: 55 123 4567 signs in as the approved captain. */
export function DriverAuth({ onAuthed }: { onAuthed: (id: string) => void }) {
  const { t } = useI18n()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('551234567')
  const [code, setCode] = useState('')
  const [err, setErr] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ nameAr: '', nameEn: '', nationalId: '', email: '', city: 'riyadh' as CityId })
  const [docs, setDocs] = useState<Record<DriverDoc['id'], string | undefined>>({ national_id: undefined, license: undefined, registration: undefined, insurance: undefined, photo: undefined })
  const [veh, setVeh] = useState({ make: 'Toyota', model: 'Camry', year: '2023', color: 'white', digits: '', letters: '', classId: 'go' as VehicleClassId })

  useEffect(() => {
    if (step !== 'otp' || code.length < 4) return
    if (code !== DEMO_CODE) return setErr(true)
    const existing = store.state.drivers.find((d) => d.phone.replace(/\D/g, '').endsWith(phone))
    const id = setTimeout(() => (existing ? onAuthed(existing.id) : setStep('personal')), 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step])

  const stepIdx = STEPS.indexOf(step)
  const back = () => setStep(stepIdx <= 0 ? 'phone' : STEPS[stepIdx - 1])
  const validNid = /^[12]\d{9}$/.test(form.nationalId)

  const submit = () => {
    const colors: Record<string, { ar: string; en: string; hex: string }> = {
      white: { ar: 'أبيض', en: 'White', hex: '#F5F5F3' },
      black: { ar: 'أسود', en: 'Black', hex: '#141516' },
      silver: { ar: 'فضي', en: 'Silver', hex: '#B9BCBE' },
      grey: { ar: 'رمادي', en: 'Grey', hex: '#6E7174' },
    }
    const c = colors[veh.color]
    const letters = veh.letters.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
    const id = actions.submitDriverApplication({
      name: { ar: form.nameAr || form.nameEn, en: form.nameEn || form.nameAr },
      phone: `+966 ${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`,
      nationalId: form.nationalId,
      email: form.email || undefined,
      cityId: form.city,
      docs: (Object.keys(docs) as DriverDoc['id'][]).map((k) => ({ id: k, status: docs[k] ? 'uploaded' : 'missing', fileName: docs[k] })),
      vehicle: {
        make: veh.make,
        model: veh.model,
        year: Number(veh.year),
        color: { ar: c.ar, en: c.en },
        colorHex: c.hex,
        plate: { digits: veh.digits, lettersEn: letters, lettersAr: letters.split('').map((l) => LATIN_TO_AR[l] ?? l).join(' ') },
        classId: veh.classId,
      },
    })
    onAuthed(id)
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-ink text-white">
      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div key="phone" {...screenMotion} className="flex flex-1 flex-col px-6" style={{ paddingTop: 'calc(var(--safe-top) + 40px)' }}>
            <Wordmark tone="white" width={96} />
            <h1 className="mt-10 font-display text-[28px] font-semibold leading-tight">{t('ابدأ القيادة مع أورا', 'Start driving with AURA')}</h1>
            <p className="mt-2 text-sm text-white/55">{t('سجّل دخولك أو انضم ككابتن جديد برقم جوالك', 'Sign in or join as a new captain with your mobile')}</p>
            <div className="mt-8">
              <PhoneInput value={phone} onChange={setPhone} />
            </div>
            <Button
              variant="go"
              size="xl"
              full
              className="mt-4"
              disabled={!validSaudiMobile(phone)}
              loading={sending}
              onClick={() => {
                setSending(true)
                setTimeout(() => {
                  setSending(false)
                  setCode('')
                  setStep('otp')
                }, 600)
              }}
            >
              {t('متابعة', 'Continue')}
            </Button>
            <div className="mt-auto space-y-1.5 rounded-2xl bg-ink-2 p-4 text-xs text-white/55" style={{ marginBottom: 'calc(var(--safe-bottom) + 16px)' }}>
              <p className="font-semibold text-white/80">{t('نسخة تجريبية', 'Demo build')}</p>
              <p>
                {t('كابتن مسجّل:', 'Registered captain:')} <span className="num text-white">55 123 4567</span>
              </p>
              <p>{t('أي رقم آخر يبدأ تسجيل كابتن جديد يظهر للمراجعة في لوحة الإدارة.', 'Any other number starts a new application that appears for review in Admin.')}</p>
            </div>
          </motion.div>
        )}
        {step === 'otp' && (
          <motion.div key="otp" {...screenMotion} className="flex flex-1 flex-col">
            <TopBar onBack={() => setStep('phone')} />
            <div className="px-6">
              <h1 className="font-display text-[26px] font-semibold">{t('رمز التحقق', 'Verification code')}</h1>
              <p className="mt-1 text-sm text-white/55">
                {t('أدخل الرمز المرسل إلى', 'Enter the code sent to')} <span className="num inline-block text-white" dir="ltr">+966 {phone}</span>
              </p>
              <div className="mt-8">
                <OtpInput value={code} onChange={(v) => { setCode(v); setErr(false) }} invalid={err} />
              </div>
              {err && <p className="mt-3 text-center text-sm text-danger">{t('الرمز غير صحيح', 'Incorrect code')}</p>}
              <p className="mt-6 rounded-2xl bg-ink-2 p-3 text-center text-xs text-white/55">
                {t('الرمز التجريبي:', 'Demo code:')} <span className="num font-semibold text-white">{DEMO_CODE}</span>
              </p>
            </div>
          </motion.div>
        )}
        {STEPS.includes(step) && (
          <motion.div key={step} {...screenMotion} className="flex min-h-0 flex-1 flex-col">
            <TopBar title={t('تسجيل كابتن', 'Captain sign-up')} onBack={back} />
            <div className="px-5">
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <span key={s} className={cx('h-1 flex-1 rounded-full', i <= stepIdx ? 'bg-go' : 'bg-white/10')} />
                ))}
              </div>
              <p className="num mt-2 text-xs text-white/45">
                {t('الخطوة', 'Step')} {stepIdx + 1}/{STEPS.length}
              </p>
            </div>
            <div className="thin-scroll-dark flex-1 overflow-y-auto px-5 pt-3 pb-4">
              {step === 'personal' && (
                <>
                  <h2 className="font-display text-xl font-semibold">{t('البيانات الشخصية', 'Personal details')}</h2>
                  <div className="mt-4 space-y-3">
                    <Field label={t('الاسم بالعربية', 'Name in Arabic')}>
                      <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" />
                    </Field>
                    <Field label={t('الاسم بالإنجليزية', 'Name in English')}>
                      <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} dir="ltr" />
                    </Field>
                    <Field label={t('رقم الهوية / الإقامة', 'National ID / Iqama')} error={form.nationalId && !validNid ? t('١٠ أرقام تبدأ بـ ١ أو ٢', '10 digits starting with 1 or 2') : undefined}>
                      <Input value={form.nationalId} inputMode="numeric" dir="ltr" className="num" onChange={(e) => setForm({ ...form, nationalId: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                    </Field>
                    <Field label={t('البريد الإلكتروني (اختياري)', 'Email (optional)')}>
                      <Input value={form.email} dir="ltr" onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Field>
                    <Field label={t('مدينة العمل', 'City')}>
                      <Select className="h-12 w-full" value={form.city} onChange={(v) => setForm({ ...form, city: v as CityId })} options={CITIES.filter((c) => c.status !== 'planned').map((c) => ({ value: c.id, label: t(c.name.ar, c.name.en) }))} />
                    </Field>
                  </div>
                </>
              )}
              {step === 'id_docs' && (
                <>
                  <h2 className="font-display text-xl font-semibold">{t('الهوية ورخصة القيادة', 'ID & driving licence')}</h2>
                  <p className="mt-1 text-sm text-white/55">{t('صورة واضحة للوجهين. صيغ JPG أو PNG أو PDF.', 'Clear photo of both sides. JPG, PNG or PDF.')}</p>
                  <div className="mt-4 space-y-2.5">
                    <UploadTile label={t('الهوية الوطنية / الإقامة', 'National ID / Iqama')} file={docs.national_id} onFile={(f) => setDocs({ ...docs, national_id: f })} />
                    <UploadTile label={t('رخصة القيادة', 'Driving licence')} file={docs.license} onFile={(f) => setDocs({ ...docs, license: f })} />
                    <UploadTile label={t('صورة شخصية', 'Profile photo')} file={docs.photo} onFile={(f) => setDocs({ ...docs, photo: f })} icon={<Camera size={20} {...ICON} />} />
                  </div>
                </>
              )}
              {step === 'vehicle' && (
                <>
                  <h2 className="font-display text-xl font-semibold">{t('بيانات المركبة', 'Vehicle details')}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Field label={t('الشركة', 'Make')}>
                      <Input value={veh.make} onChange={(e) => setVeh({ ...veh, make: e.target.value })} dir="ltr" />
                    </Field>
                    <Field label={t('الطراز', 'Model')}>
                      <Input value={veh.model} onChange={(e) => setVeh({ ...veh, model: e.target.value })} dir="ltr" />
                    </Field>
                    <Field label={t('سنة الصنع', 'Year')} error={Number(veh.year) < 2018 ? t('٢٠١٨ أو أحدث', '2018 or newer') : undefined}>
                      <Input value={veh.year} inputMode="numeric" className="num" dir="ltr" onChange={(e) => setVeh({ ...veh, year: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                    </Field>
                    <Field label={t('اللون', 'Colour')}>
                      <Select className="h-12 w-full" value={veh.color} onChange={(v) => setVeh({ ...veh, color: v })} options={[{ value: 'white', label: t('أبيض', 'White') }, { value: 'black', label: t('أسود', 'Black') }, { value: 'silver', label: t('فضي', 'Silver') }, { value: 'grey', label: t('رمادي', 'Grey') }]} />
                    </Field>
                    <Field label={t('أرقام اللوحة', 'Plate digits')}>
                      <Input value={veh.digits} inputMode="numeric" className="num" dir="ltr" placeholder="1234" onChange={(e) => setVeh({ ...veh, digits: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                    </Field>
                    <Field label={t('حروف اللوحة (EN)', 'Plate letters')}>
                      <Input value={veh.letters} className="num uppercase" dir="ltr" placeholder="RHB" onChange={(e) => setVeh({ ...veh, letters: e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3) })} />
                    </Field>
                  </div>
                  <p className="mt-4 mb-2 text-[13px] font-medium text-white/70">{t('الفئة المطلوبة', 'Requested class')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_CLASSES.map((c) => (
                      <button key={c.id} onClick={() => setVeh({ ...veh, classId: c.id })} className={cx('rounded-xl px-3 py-2.5 text-start text-sm font-semibold', veh.classId === c.id ? 'bg-go text-ink' : 'bg-ink-3')} dir="ltr">
                        {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {step === 'vehicle_docs' && (
                <>
                  <h2 className="font-display text-xl font-semibold">{t('استمارة المركبة والتأمين', 'Registration & insurance')}</h2>
                  <div className="mt-4 space-y-2.5">
                    <UploadTile label={t('استمارة المركبة', 'Vehicle registration (Istimara)')} file={docs.registration} onFile={(f) => setDocs({ ...docs, registration: f })} />
                    <UploadTile label={t('وثيقة التأمين', 'Insurance policy')} file={docs.insurance} onFile={(f) => setDocs({ ...docs, insurance: f })} />
                  </div>
                  <div className="mt-4 flex gap-3 rounded-2xl bg-ink-2 p-3 text-xs text-white/60">
                    <ShieldCheck size={18} className="shrink-0 text-go" />
                    {t('تُراجع المستندات من فريق أورا خلال ٢٤–٤٨ ساعة وفق متطلبات الهيئة العامة للنقل.', 'Documents are reviewed by AURA within 24–48h per TGA requirements.')}
                  </div>
                </>
              )}
            </div>
            <div className="px-5 pt-2" style={{ paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}>
              {step === 'personal' && (
                <Button variant="go" size="xl" full disabled={!(form.nameAr || form.nameEn) || !validNid} onClick={() => setStep('id_docs')}>
                  {t('التالي', 'Next')}
                </Button>
              )}
              {step === 'id_docs' && (
                <Button variant="go" size="xl" full disabled={!docs.national_id || !docs.license} onClick={() => setStep('vehicle')}>
                  {t('التالي', 'Next')}
                </Button>
              )}
              {step === 'vehicle' && (
                <Button variant="go" size="xl" full disabled={!veh.make || !veh.model || Number(veh.year) < 2018 || veh.digits.length < 3 || veh.letters.length < 2} onClick={() => setStep('vehicle_docs')}>
                  {t('التالي', 'Next')}
                </Button>
              )}
              {step === 'vehicle_docs' && (
                <Button variant="go" size="xl" full disabled={!docs.registration || !docs.insurance} onClick={submit}>
                  {t('إرسال الطلب للمراجعة', 'Submit for review')}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const LATIN_TO_AR: Record<string, string> = { A: 'أ', B: 'ب', J: 'ح', D: 'د', R: 'ر', S: 'س', X: 'ص', T: 'ط', E: 'ع', G: 'ق', K: 'ك', L: 'ل', Z: 'م', N: 'ن', H: 'ه', U: 'و', V: 'ى' }

function UploadTile({ label, file, onFile, icon }: { label: string; file?: string; onFile: (f: string | undefined) => void; icon?: React.ReactNode }) {
  const { t } = useI18n()
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className={cx('flex items-center gap-3 rounded-2xl p-3.5', file ? 'bg-go/10 ring-1 ring-go/40' : 'bg-ink-2 ring-1 ring-white/8')}>
      <span className={cx('flex size-11 items-center justify-center rounded-xl', file ? 'bg-go text-ink' : 'bg-ink-3')}>{file ? <FileCheck2 size={20} {...ICON} /> : (icon ?? <FileUp size={20} {...ICON} />)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-white/50">{file ?? t('لم يتم الرفع', 'Not uploaded')}</p>
      </div>
      {file ? (
        <button aria-label={t('إزالة', 'Remove')} onClick={() => onFile(undefined)} className="text-white/60">
          <X size={18} />
        </button>
      ) : (
        <Button size="sm" variant="primary" onClick={() => ref.current?.click()}>
          {t('رفع', 'Upload')}
        </Button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f.name)
        }}
      />
    </div>
  )
}

/** Live application status (updates the moment Admin approves or rejects). */
export function ApplicationStatus({ driverId, onApproved, onLogout }: { driverId: string; onApproved: () => void; onLogout: () => void }) {
  const { t, L } = useI18n()
  useEco((s) => s.rev)
  const d = getDriver(driverId)
  if (!d) return null
  const docLabel: Record<DriverDoc['id'], string> = {
    national_id: t('الهوية', 'National ID'),
    license: t('رخصة القيادة', 'Licence'),
    registration: t('الاستمارة', 'Registration'),
    insurance: t('التأمين', 'Insurance'),
    photo: t('الصورة', 'Photo'),
  }
  if (d.status === 'approved')
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink px-8 text-center text-white">
        <SuccessMark size={76} />
        <h1 className="mt-5 font-display text-2xl font-semibold">{t('تم قبولك ككابتن في أورا', "You're an AURA captain")}</h1>
        <p className="mt-2 text-sm text-white/55">{t('تمت مراجعة مستنداتك واعتمادها. يمكنك الآن الاتصال واستقبال الرحلات.', 'Your documents are approved. You can go online and receive trips.')}</p>
        <Button variant="go" size="xl" full className="mt-8" onClick={onApproved}>
          {t('ابدأ الآن', 'Start now')}
        </Button>
      </div>
    )
  if (d.status === 'rejected')
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink px-8 text-center text-white">
        <XCircle size={68} className="text-danger" strokeWidth={1.5} />
        <h1 className="mt-5 font-display text-2xl font-semibold">{t('لم يتم قبول الطلب', 'Application not approved')}</h1>
        <p className="mt-2 text-sm text-white/55">{d.rejectionReason ?? t('يرجى مراجعة المستندات وإعادة التقديم.', 'Please review your documents and re-apply.')}</p>
        <Button variant="secondary" size="lg" full className="mt-8" onClick={onLogout}>
          {t('تسجيل الخروج', 'Log out')}
        </Button>
      </div>
    )
  return (
    <div className="absolute inset-0 flex flex-col bg-ink text-white">
      <TopBar title={t('حالة الطلب', 'Application status')} />
      <div className="flex-1 overflow-y-auto px-5">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="relative flex size-20 items-center justify-center rounded-full bg-ink-2">
            <Clock size={34} className="text-go" strokeWidth={1.6} />
            <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-go/30" />
          </div>
          <h1 className="mt-4 font-display text-xl font-semibold">{d.status === 'suspended' ? t('الحساب موقوف', 'Account suspended') : t('طلبك قيد المراجعة', 'Your application is under review')}</h1>
          <p className="mt-1 text-sm text-white/55">{t('سنُشعرك فور اعتماد طلبك. المدة المعتادة ٢٤–٤٨ ساعة.', "We'll notify you as soon as it's approved. Usually 24–48h.")}</p>
          <p className="num mt-2 text-xs text-white/40">
            {d.id} · {L(d.name)}
          </p>
        </div>
        <div className="space-y-2">
          {d.docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-2xl bg-ink-2 px-4 py-3">
              <span className={cx('flex size-7 items-center justify-center rounded-full', doc.status === 'approved' ? 'bg-go text-ink' : doc.status === 'rejected' ? 'bg-danger text-white' : 'bg-ink-4 text-white/60')}>
                {doc.status === 'approved' ? <Check size={15} strokeWidth={3} /> : doc.status === 'rejected' ? <X size={15} /> : <Clock size={14} />}
              </span>
              <span className="flex-1 text-sm">{docLabel[doc.id]}</span>
              <span className="text-xs text-white/50">
                {{ approved: t('معتمد', 'Approved'), rejected: t('مرفوض', 'Rejected'), uploaded: t('قيد المراجعة', 'In review'), missing: t('ناقص', 'Missing') }[doc.status]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-4 text-xs text-white/55">
          {t('للتجربة: افتح لوحة الإدارة ← الكباتن ← طلبات التسجيل، ثم اعتمد هذا الطلب وسيتحدث هذا الشاشة فوراً.', 'Try it: open Admin → Captains → Applications and approve this request. This screen updates instantly.')}
        </div>
      </div>
      <div className="px-5 pt-3" style={{ paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}>
        <Button variant="secondary" size="lg" full onClick={onLogout}>
          {t('تسجيل الخروج', 'Log out')}
        </Button>
      </div>
    </div>
  )
}
