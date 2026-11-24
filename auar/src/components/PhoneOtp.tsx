import { useEffect, useState } from 'react'
import { Btn } from './ui'
import { requestOtp, verifyOtp } from '../store/store'

/**
 * Phone number → SMS code → verified session (remote mode).
 * Calls onVerified with the server's answer (isNew / needsRegistration).
 */
export function PhoneOtp({ role, dark, onBack, onVerified, title = 'ما رقم جوالك؟' }: { role: 'rider' | 'driver'; dark?: boolean; onBack: () => void; onVerified: (r: { isNew?: boolean; needsRegistration?: boolean; phone: string }) => void; title?: string }) {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [dev, setDev] = useState('')
  const [wait, setWait] = useState(0)
  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const full = `0${phone}`
  const inp = dark ? 'bg-white/10 text-white focus:ring-lime' : 'bg-mist focus:ring-ink'
  const sub = dark ? 'text-white/55' : 'text-mute'

  const send = async () => {
    setBusy(true)
    setErr('')
    try {
      const r = await requestOtp(role, full)
      setDev(r.devCode ?? '')
      setStep('code')
      setWait(30)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const verify = async () => {
    setBusy(true)
    setErr('')
    try {
      const r = await verifyOtp(role, full, code)
      onVerified({ ...r, phone: full })
    } catch (e) {
      setErr((e as Error).message)
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`flex h-full flex-col ${dark ? 'bg-ink text-white' : 'bg-white'}`}>
      <div className="flex-1 px-6 pt-16">
        <button onClick={() => (step === 'code' ? setStep('phone') : onBack())} className={`mb-6 text-sm font-semibold ${sub}`}>
          → رجوع
        </button>
        {step === 'phone' ? (
          <>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className={`mt-1 text-sm ${sub}`}>سنرسل لك رمز تحقق من ٦ أرقام عبر رسالة نصية.</p>
            <div className="mt-6 flex gap-2" dir="ltr">
              <span className={`flex h-14 items-center gap-1.5 rounded-xl px-3 font-semibold ${dark ? 'bg-white/10' : 'bg-mist'}`}>🇸🇦 +966</span>
              <input autoFocus inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').replace(/^0/, '').slice(0, 9))} placeholder="5X XXX XXXX" className={`h-14 flex-1 rounded-xl px-4 text-lg font-semibold tracking-wider outline-none focus:ring-2 ${inp}`} />
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold">أدخل رمز التحقق</h2>
            <p className={`mt-1 text-sm ${sub}`}>
              أُرسل إلى <span dir="ltr">+966 {phone}</span>
            </p>
            <input autoFocus inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} dir="ltr" className={`mt-6 h-16 w-full rounded-xl text-center text-3xl font-bold tracking-[0.4em] outline-none focus:ring-2 ${inp}`} placeholder="••••••" />
            {dev && <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${dark ? 'bg-white/10' : 'bg-amber-50 text-amber-900'}`}>وضع التطوير: الرمز هو <b dir="ltr">{dev}</b></p>}
            <button disabled={wait > 0 || busy} onClick={send} className={`mt-4 text-sm font-semibold disabled:opacity-50 ${sub}`}>
              {wait > 0 ? `إعادة الإرسال بعد ${wait} ث` : 'إعادة إرسال الرمز'}
            </button>
          </>
        )}
        {err && <p className="mt-3 text-sm text-bad">{err}</p>}
      </div>
      <div className="p-6">
        <Btn variant={dark ? 'lime' : 'primary'} full size="lg" disabled={busy || (step === 'phone' ? phone.length < 9 : code.length < 6)} onClick={step === 'phone' ? send : verify}>
          {busy ? '...' : step === 'phone' ? 'إرسال الرمز' : 'تأكيد'}
        </Btn>
      </div>
    </div>
  )
}

export function Loading({ dark }: { dark?: boolean }) {
  return (
    <div className={`grid h-full place-items-center ${dark ? 'bg-ink text-white' : 'bg-white'}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-current border-t-transparent opacity-60" aria-label="جارٍ التحميل" />
    </div>
  )
}
