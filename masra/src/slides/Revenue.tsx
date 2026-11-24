import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Info, RotateCcw } from 'lucide-react'
import { DemoBadge, SlideHeader, SlideShell, ease, sar } from '../components/ui'

const SCENARIOS = [100, 250, 500, 750, 1000]
const DEFAULTS = { fare: 32, commission: 18, trips: 100, days: 30 }

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  children,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  onChange: (v: number) => void
  children?: ReactNode
}) {
  const p = ((value - min) / (max - min)) * 100
  return (
    <div className="rounded-2xl border border-line bg-ink-2/80 p-4">
      <div className="flex items-baseline justify-between">
        <label className="text-sm text-white/60">{label}</label>
        <div className="num text-xl font-bold">
          {sar(value)} <span className="text-xs font-medium text-white/50">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        className="masra-range mt-3"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--p' as string]: `${p}%` }}
      />
      {children}
    </div>
  )
}

export function Revenue() {
  const [fare, setFare] = useState(DEFAULTS.fare)
  const [commission, setCommission] = useState(DEFAULTS.commission)
  const [trips, setTrips] = useState(DEFAULTS.trips)
  const [days, setDays] = useState(DEFAULTS.days)

  const dailyGmv = fare * trips
  const dailyRev = dailyGmv * (commission / 100)
  const monthlyGmv = dailyGmv * days
  const monthly = dailyRev * days
  const annual = monthly * 12

  const chart = useMemo(
    () =>
      SCENARIOS.map((t) => ({
        t,
        name: `${t}`,
        monthly: Math.round(fare * t * (commission / 100) * days),
      })),
    [fare, commission, days],
  )

  return (
    <SlideShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SlideHeader index={9} eyebrow="نموذج الإيرادات" title="الدخل من عمولة الرحلات المكتملة." subtitle="غيّر الافتراضات وشاهد الأثر فوراً." />
        <DemoBadge label="افتراضات تخطيطية — ليست أسعاراً معتمدة" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }} className="space-y-3">
          <Slider label="متوسط سعر الرحلة" value={fare} min={15} max={80} unit="ر.س" onChange={setFare} />
          <Slider label="نسبة عمولة المنصة" value={commission} min={5} max={30} unit="%" onChange={setCommission} />
          <Slider label="عدد الرحلات اليومية" value={trips} min={0} max={2000} step={10} unit="رحلة" onChange={setTrips}>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SCENARIOS.map((s) => (
                <button key={s} type="button" onClick={() => setTrips(s)} className={`num rounded-full px-3 py-1 text-xs font-semibold transition ${trips === s ? 'bg-green-3 text-ink' : 'bg-ink-4 text-white/60 hover:text-white'}`}>
                  {sar(s)}
                </button>
              ))}
            </div>
          </Slider>
          <Slider label="أيام التشغيل في الشهر" value={days} min={20} max={31} unit="يوم" onChange={setDays} />
          <button
            type="button"
            onClick={() => {
              setFare(DEFAULTS.fare)
              setCommission(DEFAULTS.commission)
              setTrips(DEFAULTS.trips)
              setDays(DEFAULTS.days)
            }}
            className="flex items-center gap-2 text-xs text-white/45 hover:text-white"
          >
            <RotateCcw size={12} /> استعادة الافتراضات الأساسية
          </button>
        </motion.div>

        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { l: 'GMV اليومي', v: dailyGmv, sub: 'إجمالي قيمة الرحلات' },
              { l: 'إيراد المنصة اليومي', v: dailyRev, sub: `عمولة ${commission}%` },
              { l: 'الإيراد الشهري', v: monthly, sub: `GMV شهري ${sar(monthlyGmv)}` },
              { l: 'الإيراد السنوي', v: annual, sub: 'شهري × 12', hero: true },
            ].map((x, i) => (
              <motion.div
                key={x.l}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, ease }}
                className={`rounded-2xl p-4 ${x.hero ? 'bg-white text-ink' : 'border border-line bg-ink-2/80'}`}
              >
                <div className={`text-xs ${x.hero ? 'text-ink/55' : 'text-white/50'}`}>{x.l}</div>
                <div className="num mt-2 text-[22px] font-bold leading-none sm:text-[26px]">
                  {sar(x.v)} <span className="text-xs font-medium opacity-60">ر.س</span>
                </div>
                <div className={`num mt-2 text-[11px] ${x.hero ? 'text-ink/45' : 'text-white/40'}`}>{x.sub}</div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-ink-2/80 p-4">
            <div className="mb-3 text-xs font-semibold text-white/50">المعادلات</div>
            <div className="num grid gap-2 text-[13px] text-white/75 sm:grid-cols-2" dir="rtl">
              <div className="rounded-xl bg-ink-3 px-3 py-2">GMV اليومي = {sar(fare)} × {sar(trips)} = <b className="text-white">{sar(dailyGmv)}</b></div>
              <div className="rounded-xl bg-ink-3 px-3 py-2">الإيراد اليومي = GMV × {commission}% = <b className="text-white">{sar(dailyRev, 2)}</b></div>
              <div className="rounded-xl bg-ink-3 px-3 py-2">الإيراد الشهري = يومي × {days} = <b className="text-white">{sar(monthly)}</b></div>
              <div className="rounded-xl bg-ink-3 px-3 py-2">الإيراد السنوي = شهري × 12 = <b className="text-green-3">{sar(annual)}</b></div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-ink-2/80 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/50">الإيراد الشهري للمنصة حسب سيناريو الرحلات اليومية</span>
              <span className="text-white/35">ر.س / شهر</span>
            </div>
            <div className="mt-2 h-44" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#232825" />
                  <XAxis dataKey="name" reversed tick={{ fill: '#9aa39e', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} رحلة/يوم`} />
                  <YAxis orientation="right" tick={{ fill: '#6b746f', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{ background: '#121513', border: '1px solid #2c332f', borderRadius: 12, direction: 'rtl', fontSize: 12 }}
                    labelFormatter={(l) => `${l} رحلة يومياً`}
                    formatter={(v) => [`${sar(Number(v))} ر.س`, 'إيراد شهري']}
                  />
                  <Bar dataKey="monthly" radius={[4, 4, 0, 0]} maxBarSize={56} onClick={(d) => setTrips((d as unknown as { t: number }).t)} style={{ cursor: 'pointer' }}>
                    {chart.map((c) => (
                      <Cell key={c.t} fill={c.t === trips ? '#1fa36a' : '#2f3833'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11.5px] leading-6 text-white/40">
            <Info size={14} className="mt-1 shrink-0" />
            الأرقام إيرادات إجمالية للمنصة قبل ضريبة القيمة المضافة ورسوم الدفع الإلكتروني وحوافز السائقين والتكاليف التشغيلية — وليست أرباحاً صافية. أحجام الرحلات سيناريوهات تخطيطية لا تمثل توقعات مؤكدة.
          </div>
        </div>
      </div>
    </SlideShell>
  )
}
