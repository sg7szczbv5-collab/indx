import { motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Logo } from './Logo'
import { BUDGET, BUDGET_CAP } from '../data/content'
import { sar } from './ui'

const scen = [100, 250, 500, 750, 1000].map((t) => ({ t, monthly: 32 * t * 0.18 * 30, annual: 32 * t * 0.18 * 30 * 12 }))

export function Summary({ onClose, go }: { onClose: () => void; go: (i: number) => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6 print:static print:bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="الملخص الاستثماري"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white text-ink thin-scroll sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/5 bg-white/95 px-6 py-4 backdrop-blur">
          <Logo size={30} dark />
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full bg-mist-2 hover:bg-mist">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="space-y-7 px-6 py-6 sm:px-8">
          <div>
            <div className="text-xs font-semibold text-green-2">الملخص الاستثماري</div>
            <h3 className="mt-1 text-2xl font-bold">منصة سعودية ذكية لحجز وتوجيه رحلات الركاب</h3>
            <p className="mt-2 text-sm leading-7 text-ink/65">
              شركة سعودية مستقلة مملوكة للمؤسس، تربط الركاب بسائقين مؤهلين يعملون بسياراتهم الخاصة، وتحقق إيراداتها من عمولة الرحلات المكتملة. نموذج خفيف الأصول: لا شراء سيارات ولا رواتب سائقين.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: 'رأس المال المستهدف', v: `${sar(BUDGET_CAP)} ر.س` },
              { l: 'مصدر التمويل', v: 'المؤسس (ذاتي)' },
              { l: 'مدن المرحلة الأولى', v: 'الدمام · الخبر · الظهران' },
              { l: 'مصدر الدخل', v: 'عمولة الرحلات' },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-mist-2 p-3">
                <div className="text-[11px] text-ink/50">{x.l}</div>
                <div className="num mt-1 text-sm font-bold">{x.v}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 text-sm font-bold">سيناريوهات الإيراد (افتراض: 32 ر.س للرحلة، عمولة 18%، 30 يوماً)</div>
            <div className="overflow-hidden rounded-2xl border border-ink/8">
              <table className="num w-full text-sm">
                <thead className="bg-mist-2 text-[12px] text-ink/55">
                  <tr>
                    <th className="px-4 py-2 text-start font-semibold">الرحلات اليومية</th>
                    <th className="px-4 py-2 text-start font-semibold">الإيراد الشهري</th>
                    <th className="px-4 py-2 text-start font-semibold">الإيراد السنوي</th>
                  </tr>
                </thead>
                <tbody>
                  {scen.map((s) => (
                    <tr key={s.t} className="border-t border-ink/5">
                      <td className="px-4 py-2 font-semibold">{sar(s.t)}</td>
                      <td className="px-4 py-2">{sar(s.monthly)} ر.س</td>
                      <td className="px-4 py-2 font-bold">{sar(s.annual)} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-1.5 text-[11px] text-ink/45">إيرادات إجمالية للمنصة قبل الضرائب والرسوم والتكاليف — ليست أرباحاً.</div>
          </div>

          <div>
            <div className="mb-2 text-sm font-bold">توزيع الميزانية</div>
            <div className="space-y-1.5">
              {BUDGET.map((b) => (
                <div key={b.id} className="flex items-center gap-3 text-[13px]">
                  <span className="w-44 shrink-0 truncate text-ink/70 sm:w-64">{b.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-mist">
                    <div className="h-full rounded-full" style={{ width: `${(b.value / BUDGET_CAP) * 100}%`, background: b.nonOpex ? '#c9a45c' : '#137a4d' }} />
                  </div>
                  <span className="num w-20 shrink-0 text-left font-semibold">{sar(b.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-[13px] leading-6 text-amber-900">
            <AlertTriangle size={16} className="mt-1 shrink-0" />
            المشروع غير مرخّص بعد. الضمان المالي المحتمل (250,000 ر.س) ليس مصروفاً تشغيلياً، وتطبيقه وتكلفته الفعلية يتطلبان تأكيداً رسمياً من الهيئة العامة للنقل. جميع الأرقام افتراضات تخطيطية.
          </div>

          <div className="flex flex-col gap-2 pb-2 sm:flex-row">
            <button type="button" onClick={() => { onClose(); go(4) }} className="flex-1 rounded-full bg-ink py-3 text-sm font-semibold text-white hover:bg-ink-3">
              استكشف نموذج التطبيق
            </button>
            <button type="button" onClick={() => { onClose(); go(8) }} className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-semibold hover:bg-mist-2">
              حاسبة الإيرادات
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
