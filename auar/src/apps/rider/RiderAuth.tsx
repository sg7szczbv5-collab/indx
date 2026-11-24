import { useState } from 'react'
import { Btn, Logo, StatusBar } from '../../components/ui'
import { signInRider, useStore } from '../../store/store'

export function RiderAuth() {
  const s = useStore()
  const r = s.riders.find((x) => x.id === s.me.riderId)!
  const [step, setStep] = useState<'splash' | 'phone' | 'otp' | 'name'>('splash')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState(r.name)

  if (step === 'splash')
    return (
      <div className="relative flex h-full flex-col bg-ink text-white">
        <StatusBar dark />
        <div className="flex flex-1 flex-col justify-center px-7">
          <Logo size={56} light />
          <h1 className="mt-10 text-[40px] font-bold leading-[1.15]">
            رحلتك تبدأ
            <br />
            <span className="text-lime">بضغطة واحدة.</span>
          </h1>
          <p className="mt-4 text-[16px] text-white/60">مشاوير يومية، سيارات فاخرة، توصيل طرود — كلها في تطبيق واحد وبأسعار واضحة قبل الطلب.</p>
        </div>
        <svg viewBox="0 0 400 120" className="w-full" aria-hidden>
          <path d="M-10 100 C 80 100, 120 40, 200 40 S 320 90, 410 30" fill="none" stroke="#c8f31d" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 14" />
          <circle cx="200" cy="40" r="9" fill="#c8f31d" />
        </svg>
        <div className="space-y-2 px-6 pb-8 pt-4">
          <Btn variant="lime" full size="lg" onClick={() => setStep('phone')}>
            ابدأ الآن
          </Btn>
          <Btn variant="light" full size="lg" onClick={() => signInRider('', '')}>
            الدخول بحساب تجريبي
          </Btn>
        </div>
      </div>
    )

  return (
    <div className="relative flex h-full flex-col bg-white">
      <StatusBar />
      <div className="flex-1 px-6 pt-16">
        <button onClick={() => setStep(step === 'phone' ? 'splash' : step === 'otp' ? 'phone' : 'otp')} className="mb-6 text-sm font-semibold text-mute">
          → رجوع
        </button>
        {step === 'phone' && (
          <>
            <h2 className="text-2xl font-bold">ما رقم جوالك؟</h2>
            <p className="mt-1 text-sm text-mute">سنرسل لك رمز تحقق عبر رسالة نصية.</p>
            <div className="mt-6 flex gap-2" dir="ltr">
              <span className="flex h-14 items-center gap-1.5 rounded-xl bg-mist px-3 font-semibold">🇸🇦 +966</span>
              <input autoFocus inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="5X XXX XXXX" className="h-14 flex-1 rounded-xl bg-mist px-4 text-lg font-semibold tracking-wider outline-none focus:ring-2 focus:ring-ink" />
            </div>
            <p className="mt-4 text-xs text-mute">بالمتابعة فإنك توافق على الشروط وسياسة الخصوصية.</p>
          </>
        )}
        {step === 'otp' && (
          <>
            <h2 className="text-2xl font-bold">أدخل رمز التحقق</h2>
            <p className="mt-1 text-sm text-mute">
              أُرسل الرمز إلى <span dir="ltr">+966 {phone}</span> — (تجريبي: أي ٤ أرقام)
            </p>
            <input autoFocus inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} dir="ltr" className="mt-6 h-16 w-full rounded-xl bg-mist text-center text-3xl font-bold tracking-[0.6em] outline-none focus:ring-2 focus:ring-ink" placeholder="••••" />
          </>
        )}
        {step === 'name' && (
          <>
            <h2 className="text-2xl font-bold">ما اسمك؟</h2>
            <p className="mt-1 text-sm text-mute">يظهر اسمك للكابتن عند الطلب.</p>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="mt-6 h-14 w-full rounded-xl bg-mist px-4 text-lg outline-none focus:ring-2 focus:ring-ink" />
          </>
        )}
      </div>
      <div className="p-6">
        <Btn
          full
          size="lg"
          disabled={(step === 'phone' && phone.length < 9) || (step === 'otp' && otp.length < 4) || (step === 'name' && name.trim().length < 2)}
          onClick={() => {
            if (step === 'phone') setStep('otp')
            else if (step === 'otp') setStep('name')
            else signInRider(name, `0${phone}`)
          }}
        >
          متابعة
        </Btn>
      </div>
    </div>
  )
}
