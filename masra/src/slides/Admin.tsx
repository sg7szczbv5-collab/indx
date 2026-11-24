import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Car,
  CircleDollarSign,
  Coins,
  LayoutDashboard,
  Map as MapIcon,
  MessageSquareWarning,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { DemoBadge, SlideHeader, SlideShell, ease, sar } from '../components/ui'
import { EasternMap } from '../components/EasternMap'
import { LogoMark } from '../components/Logo'
import { CITIES } from '../data/content'

const RANGES = [
  { id: 'd', l: 'اليوم', m: 1 },
  { id: 'w', l: '7 أيام', m: 6.8 },
  { id: 'm', l: '30 يوماً', m: 27.5 },
] as const

const SHARE: Record<string, number> = { all: 1, dammam: 0.52, khobar: 0.34, dhahran: 0.14 }

const HOURLY = [
  6, 4, 3, 2, 3, 8, 18, 34, 41, 30, 24, 27, 33, 29, 26, 31, 38, 47, 52, 49, 44, 39, 28, 16,
].map((v, h) => ({ h: `${h}:00`, v }))

const RECENT = [
  { id: 'MS-10482', from: 'حي الشاطئ', to: 'كورنيش الخبر', city: 'dammam', st: 'نشطة', fare: 38 },
  { id: 'MS-10481', from: 'الظهران', to: 'حي الفيصلية', city: 'dhahran', st: 'مكتملة', fare: 29 },
  { id: 'MS-10480', from: 'الخبر الشمالية', to: 'جسر الملك فهد', city: 'khobar', st: 'مكتملة', fare: 46 },
  { id: 'MS-10479', from: 'محطة القطار', to: 'حي العزيزية', city: 'dammam', st: 'ملغاة', fare: 0 },
  { id: 'MS-10478', from: 'حي الروضة', to: 'المطار', city: 'dammam', st: 'مكتملة', fare: 71 },
]

function useTicker(base: number, spread: number) {
  const [v, setV] = useState(base)
  useEffect(() => {
    const iv = setInterval(() => setV(base + Math.round((Math.random() - 0.5) * spread)), 2200)
    return () => clearInterval(iv)
  }, [base, spread])
  return v
}

export function Admin() {
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('d')
  const [city, setCity] = useState<string>('all')
  const m = RANGES.find((r) => r.id === range)!.m
  const sh = SHARE[city]
  const active = useTicker(Math.round(38 * sh), Math.max(2, Math.round(8 * sh)))
  const onlineDrivers = useTicker(Math.round(126 * sh), Math.max(2, Math.round(10 * sh)))

  const k = useMemo(() => {
    const trips = Math.round(612 * m * sh)
    const gmv = trips * 32
    return {
      trips,
      gmv,
      commission: gmv * 0.18,
      cancelled: Math.round(trips * 0.067),
      complaints: Math.max(1, Math.round(7 * m * sh)),
      drivers: Math.round(840 * sh),
      customers: Math.round(9450 * sh),
    }
  }, [m, sh])

  const KPIS = [
    { I: Route, l: 'إجمالي الرحلات', v: sar(k.trips), d: '+12%' },
    { I: Activity, l: 'الرحلات النشطة', v: sar(active), live: true },
    { I: Car, l: 'السائقون المسجلون', v: sar(k.drivers), d: '+34' },
    { I: UserCheck, l: 'السائقون المتصلون', v: sar(onlineDrivers), live: true },
    { I: Users, l: 'العملاء', v: sar(k.customers), d: '+5.1%' },
    { I: CircleDollarSign, l: 'الإيرادات (GMV)', v: `${sar(k.gmv)} ر.س`, d: '+9%' },
    { I: Coins, l: 'عمولات المنصة', v: `${sar(k.commission)} ر.س`, d: '18%' },
    { I: XCircle, l: 'الرحلات الملغاة', v: sar(k.cancelled), d: '6.7%', warn: true },
    { I: MessageSquareWarning, l: 'الشكاوى', v: sar(k.complaints), d: 'مفتوحة 2', warn: true },
    { I: Star, l: 'تقييم الخدمة', v: '4.81', d: 'من 5' },
  ]

  const hourly = useMemo(() => HOURLY.map((x) => ({ ...x, v: Math.round(x.v * sh * (range === 'd' ? 1 : m / 1)) })), [sh, m, range])

  return (
    <SlideShell className="!max-w-[1440px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <SlideHeader index={7} eyebrow="نظام الإدارة" title="لوحة تحكم تشغيلية لحظية." />
        <DemoBadge label="جميع الأرقام بيانات تجريبية لسيناريو ما بعد الإطلاق" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="overflow-hidden rounded-2xl border border-white/10 bg-[#202422] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        {/* browser chrome */}
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5" dir="ltr">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-md bg-black/30 px-3 py-1 text-[11px] text-white/45">
            <ShieldCheck size={11} /> admin.masra.demo
          </div>
        </div>

        <div className="flex bg-mist-2 text-ink" dir="rtl">
          {/* sidebar */}
          <aside className="hidden w-52 shrink-0 flex-col border-l border-ink/5 bg-white p-4 md:flex">
            <div className="flex items-center gap-2">
              <LogoMark size={30} />
              <div className="leading-tight">
                <div className="text-sm font-bold">مَسْرى</div>
                <div className="text-[10px] text-ink/45">لوحة الإدارة</div>
              </div>
            </div>
            <nav className="mt-6 space-y-1 text-[13px]">
              {[
                { I: LayoutDashboard, t: 'نظرة عامة', on: true },
                { I: MapIcon, t: 'الخريطة الحية' },
                { I: Route, t: 'الرحلات' },
                { I: Car, t: 'السائقون' },
                { I: Users, t: 'العملاء' },
                { I: BarChart3, t: 'التقارير المالية' },
                { I: MessageSquareWarning, t: 'الشكاوى' },
                { I: Settings, t: 'الإعدادات' },
              ].map(({ I, t, on }) => (
                <div key={t} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${on ? 'bg-ink text-white' : 'text-ink/60'}`}>
                  <I size={16} /> {t}
                </div>
              ))}
            </nav>
            <div className="mt-auto rounded-xl bg-green-soft p-3 text-[11px] leading-5 text-green">
              بيئة عرض تجريبية — غير مرتبطة بأي أنظمة حقيقية.
            </div>
          </aside>

          {/* main */}
          <main className="min-w-0 flex-1 p-4 lg:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <div className="text-lg font-bold">نظرة عامة على التشغيل</div>
                <div className="text-[11px] text-ink/45">المنطقة الشرقية · الدمام، الخبر، الظهران</div>
              </div>
              <div className="ms-auto flex flex-wrap items-center gap-2">
                <div className="hidden items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-[12px] text-ink/40 ring-1 ring-ink/5 xl:flex">
                  <Search size={14} /> بحث عن رحلة أو سائق…
                </div>
                <div className="flex rounded-lg bg-white p-0.5 text-[12px] ring-1 ring-ink/5">
                  {RANGES.map((r) => (
                    <button key={r.id} type="button" onClick={() => setRange(r.id)} className={`rounded-md px-3 py-1 font-semibold ${range === r.id ? 'bg-ink text-white' : 'text-ink/55'}`}>
                      {r.l}
                    </button>
                  ))}
                </div>
                <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="المدينة" className="rounded-lg bg-white px-2 py-1.5 text-[12px] font-semibold ring-1 ring-ink/5 outline-none">
                  <option value="all">كل المدن</option>
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-white ring-1 ring-ink/5">
                  <Bell size={15} />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
                </span>
              </div>
            </div>

            {/* KPIs */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {KPIS.map(({ I, l, v, d, live, warn }, i) => (
                <motion.div key={l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.03 }} className="rounded-xl bg-white p-3 ring-1 ring-ink/5">
                  <div className="flex items-center justify-between text-[11px] text-ink/50">
                    <span>{l}</span>
                    <I size={14} className={warn ? 'text-amber-600' : 'text-ink/35'} />
                  </div>
                  <div className="num mt-1.5 text-[19px] font-bold leading-none">{v}</div>
                  <div className="mt-1.5 text-[10.5px]">
                    {live ? (
                      <span className="inline-flex items-center gap-1 text-green-2">
                        <motion.span className="h-1.5 w-1.5 rounded-full bg-green-3" animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                        مباشر
                      </span>
                    ) : (
                      <span className={`num ${warn ? 'text-amber-700' : 'text-ink/45'}`}>{d}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_1fr]">
              {/* map */}
              <div className="rounded-xl bg-white p-3 ring-1 ring-ink/5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[13px] font-bold">الخريطة الحية — نقاط رحلات افتراضية</div>
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-green-2">
                    <span className="h-2 w-2 rounded-full bg-green-3" /> رحلة
                    <span className="ms-2 h-2 w-2 rounded-full bg-ink" /> مركبة متحركة
                  </span>
                </div>
                <div className="h-[240px] overflow-hidden rounded-lg lg:h-[270px]">
                  <EasternMap light active={city === 'all' ? null : city} onCity={(c) => setCity(c === city ? 'all' : c)} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* hourly */}
                <div className="rounded-xl bg-white p-3 ring-1 ring-ink/5">
                  <div className="flex items-center justify-between text-[13px] font-bold">
                    <span>توزيع الرحلات حسب الساعة</span>
                    <span className="text-[10.5px] font-normal text-ink/45">{range === 'd' ? 'اليوم' : 'إجمالي الفترة'}</span>
                  </div>
                  <div className="mt-1 h-[118px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourly} margin={{ top: 6, right: 4, left: -26, bottom: 0 }}>
                        <defs>
                          <linearGradient id="adm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#1fa36a" stopOpacity={0.35} />
                            <stop offset="1" stopColor="#1fa36a" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#eef1ef" />
                        <XAxis dataKey="h" tick={{ fontSize: 9, fill: '#9aa39e' }} interval={3} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#9aa39e' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ stroke: '#0b0d0c', strokeOpacity: 0.2 }}
                          contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,.12)', fontSize: 12, direction: 'rtl' }}
                          formatter={(v) => [`${v} رحلة`, 'الرحلات']}
                        />
                        <Area type="monotone" dataKey="v" stroke="#137a4d" strokeWidth={2} fill="url(#adm)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* recent trips */}
                <div className="rounded-xl bg-white p-3 ring-1 ring-ink/5">
                  <div className="mb-1.5 text-[13px] font-bold">آخر الرحلات</div>
                  <div className="divide-y divide-ink/5 text-[11.5px]">
                    {RECENT.filter((r) => city === 'all' || r.city === city).slice(0, 4).map((r) => (
                      <div key={r.id} className="flex items-center gap-2 py-1.5">
                        <span className="num w-16 shrink-0 text-ink/40" dir="ltr">{r.id}</span>
                        <span className="min-w-0 flex-1 truncate">{r.from} ← {r.to}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.st === 'نشطة' ? 'bg-green-soft text-green' : r.st === 'ملغاة' ? 'bg-red-50 text-red-700' : 'bg-mist text-ink/60'}`}>{r.st}</span>
                        <span className="num w-12 shrink-0 text-left font-semibold">{r.fare ? `${r.fare} ر.س` : '—'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[10.5px] text-amber-800">
                    <AlertTriangle size={12} /> شكوى جديدة: تأخر وصول السائق — رحلة MS-10476 (تجريبي)
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </motion.div>
    </SlideShell>
  )
}
