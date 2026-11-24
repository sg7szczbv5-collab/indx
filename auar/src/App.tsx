import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, Car, LayoutDashboard, Smartphone, MonitorSmartphone } from 'lucide-react'
import { Logo, PhoneFrame } from './components/ui'
import { AdminApp as AdminAppInner } from './apps/admin/AdminApp'
import { RiderApp as RiderAppInner } from './apps/rider/RiderApp'
import { DriverApp as DriverAppInner } from './apps/driver/DriverApp'
import { RoleCtx, getMode } from './store/store'

const RiderApp = () => (
  <RoleCtx.Provider value="rider">
    <RiderAppInner />
  </RoleCtx.Provider>
)
const DriverApp = () => (
  <RoleCtx.Provider value="driver">
    <DriverAppInner />
  </RoleCtx.Provider>
)
const AdminApp = () => (
  <RoleCtx.Provider value="admin">
    <AdminAppInner />
  </RoleCtx.Provider>
)

type Route = 'home' | 'rider' | 'driver' | 'admin' | 'demo'
const parse = (): Route => {
  const h = (typeof location !== 'undefined' ? location.hash : '').replace(/^#\/?/, '')
  return (['rider', 'driver', 'admin', 'demo'].includes(h) ? h : 'home') as Route
}

function useRoute() {
  const [r, setR] = useState<Route>(parse())
  useEffect(() => {
    const f = () => setR(parse())
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return r
}

function useIsPhone() {
  const q = '(max-width: 520px)'
  const [m, setM] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches)
  useEffect(() => {
    const mm = matchMedia(q)
    const f = () => setM(mm.matches)
    mm.addEventListener('change', f)
    return () => mm.removeEventListener('change', f)
  }, [])
  return m
}

function PhoneShell({ children, dark, title, other }: { children: ReactNode; dark?: boolean; title: string; other: [string, string] }) {
  const phone = useIsPhone()
  if (phone) return <div className="h-[100dvh] w-full overflow-hidden">{children}</div>
  return (
    <div className={`flex min-h-[100dvh] items-center justify-center gap-12 p-5 ${dark ? 'bg-[#1a1a1a]' : 'bg-mist'}`}>
      <div className={`hidden max-w-[260px] xl:block ${dark ? 'text-white' : ''}`}>
        <Logo size={34} light={dark} />
        <h1 className="mt-6 text-3xl font-bold">{title}</h1>
        <p className={`mt-2 text-sm ${dark ? 'text-white/55' : 'text-mute'}`}>افتح التطبيق الآخر في نافذة ثانية — كل شيء يتزامن مباشرة بين الراكب والكابتن ولوحة الإدارة.</p>
        <div className="mt-6 flex flex-col gap-2 text-sm font-semibold">
          <a href={other[0]} target="_blank" rel="noreferrer" className="text-sky">{other[1]} ↗</a>
          <a href="#admin" target="_blank" rel="noreferrer" className="text-sky">لوحة الإدارة ↗</a>
          <a href="#home" className={dark ? 'text-white/60' : 'text-mute'}>← بوابة AUAR</a>
        </div>
      </div>
      <PhoneFrame dark={dark}>{children}</PhoneFrame>
    </div>
  )
}

export function App() {
  const r = useRoute()
  useEffect(() => {
    document.title = { home: 'AUAR', rider: 'AUAR — الراكب', driver: 'AUAR Driver', admin: 'AUAR Admin', demo: 'AUAR — العرض المباشر' }[r]
  }, [r])
  if (r === 'rider')
    return (
      <PhoneShell title="تطبيق الراكب" other={['#driver', 'تطبيق الكابتن']}>
        <RiderApp />
      </PhoneShell>
    )
  if (r === 'driver')
    return (
      <PhoneShell dark title="تطبيق الكابتن" other={['#rider', 'تطبيق الراكب']}>
        <DriverApp />
      </PhoneShell>
    )
  if (r === 'admin') return <div className="h-[100dvh]"><AdminApp /></div>
  if (r === 'demo') return <Demo />
  return <Launcher />
}

function Demo() {
  return (
    <div className="min-h-[100dvh] bg-[#e9e9e5]">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-ink px-6 py-4 text-white">
        <Logo size={30} light />
        <p className="text-sm text-white/60">العرض المباشر: الراكب والكابتن والإدارة في شاشة واحدة — اطلب رحلة وتابعها في كل مكان</p>
        <a href="#home" className="text-sm font-semibold text-lime">← البوابة</a>
      </header>
      <div className="flex flex-wrap items-start justify-center gap-8 p-6">
        <div>
          <p className="mb-3 text-center font-bold">١. تطبيق الراكب</p>
          <PhoneFrame><RiderApp /></PhoneFrame>
        </div>
        <div>
          <p className="mb-3 text-center font-bold">٢. تطبيق الكابتن <span className="text-xs font-normal text-mute">(اضغط «اتصل» أولاً)</span></p>
          <PhoneFrame dark><DriverApp /></PhoneFrame>
        </div>
      </div>
      <div className="px-6 pb-10">
        <p className="mb-3 text-center font-bold">٣. لوحة تحكم الإدارة</p>
        <div className="mx-auto h-[860px] max-w-[1400px] overflow-hidden rounded-3xl border border-line bg-white shadow-xl">
          <AdminApp />
        </div>
      </div>
    </div>
  )
}

function Launcher() {
  const apps: { href: string; title: string; sub: string; icon: typeof Car; dark?: boolean; lime?: boolean; points: string[] }[] = [
    { href: '#rider', title: 'تطبيق الراكب', sub: 'اطلب رحلتك في ثوانٍ', icon: Smartphone, points: ['٧ خدمات: Go، Comfort، XL، Black، Her، Moto، توصيل', 'تتبع مباشر، رمز PIN، محادثة واتصال مخفي', 'جدولة، أكواد خصم، محفظة، تقييم وإكرامية'] },
    { href: '#driver', title: 'تطبيق الكابتن', sub: 'قُد واكسب بوقتك', icon: Car, dark: true, points: ['استقبال الطلبات مع عداد قبول', 'ملاحة خطوة بخطوة وبدء الرحلة برمز التحقق', 'الأرباح الأسبوعية والسحب الفوري والتسجيل'] },
    { href: '#admin', title: 'لوحة تحكم الإدارة', sub: 'تحكم كامل في المنصة', icon: LayoutDashboard, lime: true, points: ['خريطة العمليات المباشرة والإحصاءات', 'قبول الكباتن، حظر الركاب، استرداد المبالغ', 'التسعير والذروة والعروض والدعم والإشعارات'] },
  ]
  return (
    <div className="min-h-[100dvh] bg-ink text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <header className="flex items-center justify-between">
          <Logo size={40} light />
          <span className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getMode() === 'remote' ? 'bg-lime text-ink' : 'bg-white/10 text-white/70'}`}>{getMode() === 'remote' ? '● متصل بالخادم' : 'وضع العرض المحلي'}</span>
            <a href="#demo" className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10 sm:inline-flex">العرض المباشر</a>
          </span>
        </header>
        <section className="mt-14 md:mt-20">
          <p className="text-sm font-semibold tracking-wide text-lime">منصة نقل ذكي متكاملة</p>
          <h1 className="mt-3 max-w-3xl text-[40px] font-bold leading-[1.12] md:text-6xl">تنقّل بلا توتر، <br className="hidden md:block" />في أي وقت.</h1>
          <p className="mt-5 max-w-xl text-lg text-white/60">ثلاثة تطبيقات تعمل معاً لحظة بلحظة: الراكب يطلب، الكابتن يقبل ويوصل، والإدارة تراقب وتتحكم في كل شيء.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#demo" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-lime px-6 text-base font-bold text-ink hover:bg-lime-2">
              <MonitorSmartphone size={20} /> جرّب الثلاثة معاً
            </a>
            <a href="#rider" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-white/10 px-6 text-base font-bold hover:bg-white/15">
              اطلب رحلة <ArrowLeft size={18} />
            </a>
          </div>
        </section>
        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {apps.map((a) => (
            <a key={a.href} href={a.href} className={`group flex flex-col rounded-3xl p-6 transition hover:-translate-y-1 ${a.lime ? 'bg-lime text-ink' : a.dark ? 'bg-ink-3' : 'bg-white text-ink'}`}>
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${a.lime ? 'bg-ink text-lime' : a.dark ? 'bg-lime text-ink' : 'bg-ink text-white'}`}>
                <a.icon size={22} />
              </span>
              <h2 className="mt-5 text-2xl font-bold">{a.title}</h2>
              <p className={`text-sm ${a.dark ? 'text-white/55' : 'opacity-60'}`}>{a.sub}</p>
              <ul className={`mt-5 flex-1 space-y-2 text-[14px] ${a.dark ? 'text-white/75' : 'opacity-80'}`}>
                {a.points.map((p) => (
                  <li key={p} className="flex gap-2"><span>•</span>{p}</li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-1 font-bold">فتح <ArrowLeft size={16} className="transition group-hover:-translate-x-1" /></span>
            </a>
          ))}
        </section>
        <section className="mt-16 rounded-3xl border border-white/10 p-6 md:p-8">
          <h3 className="text-xl font-bold">جرّب رحلة كاملة في دقيقة</h3>
          <ol className="mt-5 grid gap-4 text-[14px] text-white/70 md:grid-cols-4">
            {[
              'افتح تطبيق الكابتن، ادخل بالحساب التجريبي واضغط «اتصل».',
              'من تطبيق الراكب اختر وجهة وخدمة AUAR Go واضغط «اطلب».',
              'اقبل الطلب عند الكابتن، اضغط «وصلت» ثم أدخل رمز PIN الظاهر عند الراكب.',
              'تابع الرحلة مباشرة من لوحة الإدارة، ثم أنهِها وقيّم الطرفين.',
            ].map((t, i) => (
              <li key={i} className="rounded-2xl bg-white/5 p-4">
                <span className="mb-2 grid h-7 w-7 place-items-center rounded-full bg-lime text-sm font-bold text-ink">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-white/40">إذا كان تطبيق الكابتن غير متصل، يقبل كباتن المحاكاة الطلب تلقائياً. البيانات تجريبية وتُحفظ في متصفحك فقط.</p>
        </section>
        <footer className="mt-12 text-center text-xs text-white/35">AUAR © 2026</footer>
      </div>
    </div>
  )
}
