import { useState, type ReactNode } from 'react'
import { Bell, Car, Clock, CreditCard, Gift, Globe, Home, MapPin, MessageSquare, Phone, Route, Share2, ShieldCheck, Star, User, Briefcase, Plus } from 'lucide-react'
import { AppIcon, BilingualLockup, LogoMark, Wordmark } from '../ds/Logo'
import { Avatar, Badge, Button, Card, CountdownRing, DemoBadge, EmptyState, ErrorState, Field, ICON, Input, Modal, Money, OtpInput, PhoneInput, Row, Segmented, Select, Skeleton, Spinner, Stars, SuccessMark, Surface, Switch, ToastHost, TripStatusBadge, useToast, cx } from '../ds/ui'
import { CarArt, Plate } from '../ds/vehicle'
import { CityMap } from '../map/CityMap'
import { useI18n } from '../i18n/I18n'
import { TRIP_STATUSES } from '../core/trip'
import { PLACES, routeBetween } from '../core/geo'

export function DesignSystemPage() {
  return (
    <Surface tone="light">
      <ToastHost>
        <DS />
      </ToastHost>
    </Surface>
  )
}

function Section({ id, n, title, sub, children, dark }: { id: string; n: string; title: string; sub?: string; children: ReactNode; dark?: boolean }) {
  return (
    <section id={id} className={cx('px-5 py-14 md:px-10', dark ? 'bg-ink text-white' : '')}>
      <div className="mx-auto max-w-6xl">
        <p className="num text-xs font-semibold tracking-[0.22em] text-go">{n}</p>
        <h2 className="mt-2 font-display text-[30px] font-semibold">{title}</h2>
        {sub && <p className={cx('mt-1 max-w-2xl text-sm', dark ? 'text-white/55' : 'text-mute')}>{sub}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}

function DS() {
  const { t, dir, lang, setLang } = useI18n()
  const toast = useToast()
  const [otp, setOtp] = useState('47')
  const [phone, setPhone] = useState('5512')
  const [sw, setSw] = useState(true)
  const [seg, setSeg] = useState<'a' | 'b' | 'c'>('a')
  const [stars, setStars] = useState(4)
  const [modal, setModal] = useState(false)
  const colors = [
    { name: 'Aura Black', hex: '#101112', use: t('الأساس: الشعار، النصوص، الأزرار الرئيسية', 'Base: logo, text, primary buttons'), ratio: '30%', cls: 'bg-ink text-white' },
    { name: 'Pure White', hex: '#FFFFFF', use: t('المساحة والهدوء: الخلفيات', 'Space & calm: backgrounds'), ratio: '45%', cls: 'bg-white ring-1 ring-line' },
    { name: 'Road Gray', hex: '#F3F4F2', use: t('الأسطح الثانوية، الخرائط، الحقول', 'Secondary surfaces, maps, fields'), ratio: '17%', cls: 'bg-road ring-1 ring-line' },
    { name: 'Motion Green', hex: '#78B83F', use: t('الحركة فقط: المسارات، المواقع، الحالة الحية، التفاعل', 'Motion only: routes, locations, live state, interaction'), ratio: '≤ 8%', cls: 'bg-go text-ink' },
  ]
  const type = [
    { k: 'Display · 56/64 · SemiBold', el: <p className="font-display text-[56px] leading-[64px] font-semibold">{t('تنقّل بثقة', 'Move with confidence')}</p> },
    { k: 'H1 · 32/40 · SemiBold', el: <p className="font-display text-[32px] leading-10 font-semibold">{t('إلى أين اليوم؟', 'Where to today?')}</p> },
    { k: 'H2 · 22/30 · Medium', el: <p className="font-display text-[22px] leading-[30px] font-medium">{t('اختر فئة السيارة', 'Choose a car class')}</p> },
    { k: 'Body · 16/26 · Regular', el: <p className="text-base leading-[26px]">{t('السعر يظهر قبل الطلب ولا يتغير بعد التأكيد.', 'The price is shown before you request and never changes.')}</p> },
    { k: 'Figure · 40 · Readex', el: <Money h={4600} size="xl" /> },
    { k: 'Caption · 13/18 · Regular', el: <p className="text-[13px] leading-[18px] text-mute">{t('الأسعار شاملة ضريبة القيمة المضافة ١٥٪', 'Prices include 15% VAT')}</p> },
  ]
  const icons = [
    [MapPin, t('موقع', 'Location')], [Route, t('مسار', 'Route')], [Car, t('سيارة', 'Car')], [Clock, t('وقت', 'Time')], [ShieldCheck, t('أمان', 'Safety')], [CreditCard, t('دفع', 'Payment')], [Star, t('تقييم', 'Rating')], [User, t('حساب', 'Account')],
    [Home, t('المنزل', 'Home')], [Briefcase, t('العمل', 'Work')], [Phone, t('اتصال', 'Call')], [MessageSquare, t('رسالة', 'Message')], [Share2, t('مشاركة', 'Share')], [Gift, t('عروض', 'Offers')], [Bell, t('إشعار', 'Notify')], [Globe, t('اللغة', 'Language')],
  ] as const
  const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 56]
  return (
    <div dir={dir} className="min-h-screen bg-white text-ink">
      <header className="aura-field px-5 pt-6 pb-16 text-white md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="#/">
            <Wordmark tone="white" width={86} />
          </a>
          <Segmented size="sm" value={lang} onChange={setLang} options={[{ value: 'ar', label: 'عربي' }, { value: 'en', label: 'EN' }]} />
        </div>
        <div className="mx-auto mt-16 max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.25em] text-go">AURA DESIGN SYSTEM · v1.0</p>
          <h1 className="mt-3 font-display text-[44px] font-semibold leading-tight">{t('نظام تصميم واحد لثلاث منتجات', 'One design system, three products')}</h1>
          <p className="mt-3 max-w-xl text-white/55">{t('مبني من دليل الهوية: لونان وأخضر واحد للحركة، خطّان فقط، وعناصر مأخوذة من لغة الخريطة.', 'Built from the brand book: two colours plus one green for motion, two typefaces, and elements taken from the map language.')}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {['logo', 'color', 'type', 'space', 'components', 'forms', 'feedback', 'map'].map((s, i) => (
              <a key={s} href={`#/design`} onClick={(e) => { e.preventDefault(); document.getElementById(s)?.scrollIntoView({ behavior: 'smooth' }) }} className="rounded-lg border border-white/15 px-3 py-1.5 text-white/70 hover:bg-white/5">
                <span className="num text-go">0{i + 1}</span> {s}
              </a>
            ))}
          </div>
        </div>
      </header>

      <Section id="logo" n="01 — LOGO" title={t('الشعار', 'Logo')} sub={t('مأخوذ مباشرة من الملف الأصلي. حرف A المفتوح بلا خط أفقي هو توقيع العلامة. أسود أو أبيض فقط.', 'Traced directly from the original artwork. The open A without a crossbar is the signature. Black or white only.')}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex h-44 items-center justify-center rounded-3xl bg-white ring-1 ring-line">
            <Wordmark width={220} />
          </div>
          <div className="flex h-44 items-center justify-center rounded-3xl bg-ink">
            <Wordmark tone="white" width={220} />
          </div>
          <div className="flex h-44 items-center justify-center rounded-3xl bg-ink md:col-span-2">
            <BilingualLockup tone="white" height={52} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-6 rounded-3xl bg-road p-6">
          <AppIcon size={96} />
          <AppIcon size={72} variant="light" />
          <AppIcon size={60} variant="campaign" />
          <AppIcon size={40} />
          <AppIcon size={24} />
          <span className="ms-auto flex items-center gap-4">
            <LogoMark size={40} />
            <LogoMark size={16} />
          </span>
        </div>
        <p className="mt-3 text-xs text-mute">{t('الحد الأدنى: ٨٠ بكسل للشعار الكامل، ١٦ بكسل للرمز Λ. الأخضر لا يُستخدم للشعار نفسه.', 'Minimum: 80 px for the wordmark, 16 px for the Λ mark. Green is never used on the logo itself.')}</p>
      </Section>

      <Section id="color" n="02 — COLOR" title={t('الألوان', 'Colour')} sub={t('الأسود والأبيض يحملان الهوية. الأخضر لون الحركة فقط ولا يتجاوز ١٠٪.', 'Black and white carry the identity. Green is for motion only, never above 10%.')}>
        <div className="grid gap-3 md:grid-cols-4">
          {colors.map((c) => (
            <div key={c.hex} className="overflow-hidden rounded-3xl ring-1 ring-line">
              <div className={cx('flex h-32 items-end p-4', c.cls)}>
                <span className="num text-2xl font-semibold">{c.ratio}</span>
              </div>
              <div className="p-4">
                <p className="font-semibold">{c.name}</p>
                <p className="num text-sm text-mute">{c.hex}</p>
                <p className="mt-2 text-xs text-mute">{c.use}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-5">
          {[
            ['bg-ink text-white', t('أبيض على أسود', 'White on black'), '18.9:1'],
            ['bg-road text-ink', t('أسود على رمادي', 'Black on gray'), '17.1:1'],
            ['bg-go text-ink', t('أسود على أخضر', 'Black on green'), '7.9:1'],
            ['bg-ink text-go', t('أخضر على أسود', 'Green on black'), '7.9:1'],
            ['bg-white text-go ring-1 ring-line', t('أخضر على أبيض: خطوط فقط', 'Green on white: lines only'), '2.4:1'],
          ].map(([cls, l, r]) => (
            <div key={l} className={cx('rounded-2xl p-4', cls)}>
              <p className="font-display text-lg font-semibold">Aura</p>
              <p className="text-xs opacity-80">{l}</p>
              <p className="num text-xs font-semibold">{r}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-mute">{t('ألوان وظيفية غير تابعة للهوية تُستخدم فقط للأخطاء والطوارئ والانتظار:', 'Functional, non-brand colours used only for errors, emergencies and pending states:')} <span className="num text-danger">#D64541</span> · <span className="num text-warn">#C98A00</span></p>
      </Section>

      <Section id="type" n="03 — TYPE" title={t('الخطوط', 'Typography')} sub="Readex Pro — headings & figures · IBM Plex Sans Arabic — text & UI">
        <div className="divide-y divide-line rounded-3xl ring-1 ring-line">
          {type.map((x) => (
            <div key={x.k} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
              <div className="min-w-0">{x.el}</div>
              <span className="num text-xs text-mute">{x.k}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="space" n="04 — SPACE & ICONS" title={t('المسافات والأيقونات', 'Spacing & icons')} sub={t('شبكة ٤ بكسل. أيقونات بخط واحد ١٫٨ وزوايا مستديرة على شبكة ٢٤.', '4 px grid. Single 1.8 stroke icons with rounded joins on a 24 grid.')}>
        <div className="flex flex-wrap items-end gap-4">
          {spacing.map((s) => (
            <div key={s} className="text-center">
              <div className="rounded-md bg-ink" style={{ width: s, height: s }} />
              <p className="num mt-1 text-[11px] text-mute">{s}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-4 overflow-hidden rounded-3xl ring-1 ring-line md:grid-cols-8">
          {icons.map(([Icon, l]) => (
            <div key={l} className="flex flex-col items-center gap-2 border-line py-5 text-xs text-mute [&:not(:nth-child(8n))]:border-e">
              <Icon size={24} {...ICON} className="text-ink" />
              {l}
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">
          {[8, 12, 14, 20, 28].map((r) => (
            <div key={r} className="flex h-20 items-center justify-center bg-road text-xs text-mute" style={{ borderRadius: r }}>
              <span className="num">r {r}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="components" n="05 — COMPONENTS" title={t('المكوّنات', 'Components')} sub={t('نفس المكوّنات بتون فاتح للعميل والإدارة، وتون داكن للكابتن.', 'The same components in a light tone for Passenger/Admin and a dark tone for Driver.')}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <p className="mb-4 text-xs font-semibold text-mute">{t('الأزرار · فاتح', 'Buttons · light')}</p>
            <div className="flex flex-wrap gap-2">
              <Button>{t('تأكيد الرحلة', 'Confirm ride')}</Button>
              <Button variant="secondary">{t('ثانوي', 'Secondary')}</Button>
              <Button variant="soft">{t('هادئ', 'Soft')}</Button>
              <Button variant="go">{t('اتصل الآن', 'Go online')}</Button>
              <Button variant="ghost">{t('نص', 'Ghost')}</Button>
              <Button variant="danger">{t('طوارئ', 'Emergency')}</Button>
              <Button loading>{t('تحميل', 'Loading')}</Button>
              <Button disabled>{t('معطّل', 'Disabled')}</Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm">SM</Button>
              <Button size="md">MD</Button>
              <Button size="lg">LG</Button>
              <Button size="xl">XL</Button>
            </div>
          </Card>
          <Surface tone="dark">
            <div className="rounded-2xl bg-ink p-6 text-white">
              <p className="mb-4 text-xs font-semibold text-white/50">{t('الأزرار · داكن (الكابتن)', 'Buttons · dark (Driver)')}</p>
              <div className="flex flex-wrap gap-2">
                <Button>{t('قبول', 'Accept')}</Button>
                <Button variant="secondary">{t('رفض', 'Decline')}</Button>
                <Button variant="soft">{t('رسالة', 'Message')}</Button>
                <Button variant="go">{t('وصلت', 'Arrived')}</Button>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <CountdownRing total={15} left={9} />
                <Badge tone="live" dot>{t('متصل', 'Online')}</Badge>
                <Switch checked={sw} onChange={setSw} />
              </div>
            </div>
          </Surface>
          <Card className="p-6">
            <p className="mb-4 text-xs font-semibold text-mute">{t('حالات الرحلة الموحّدة', 'Unified trip statuses')}</p>
            <div className="flex flex-wrap gap-2">
              {TRIP_STATUSES.map((s) => (
                <TripStatusBadge key={s} status={s} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>Neutral</Badge>
              <Badge tone="done">Done</Badge>
              <Badge tone="warn">Warn</Badge>
              <Badge tone="danger">Danger</Badge>
              <Badge tone="outline">Outline</Badge>
              <DemoBadge />
            </div>
          </Card>
          <Card className="p-6">
            <p className="mb-2 text-xs font-semibold text-mute">{t('القوائم والبطاقات', 'Lists & cards')}</p>
            <Row icon={<Home size={18} {...ICON} />} title={t('المنزل', 'Home')} sub={t('حي الياسمين', 'Al Yasmin')} />
            <Row icon={<User size={18} {...ICON} />} title={<span className="flex items-center gap-2">{t('فيصل العتيبي', 'Faisal Al-Otaibi')} <span className="num text-xs text-mute">★ 4.96</span></span>} sub="Toyota Camry · Black" end={<Plate digits="1234" lettersAr="ر ح ب" lettersEn="RHB" size="sm" />} />
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-road px-4 py-3">
              <CarArt classId="comfort" color="#141516" width={110} />
              <Money h={4600} size="lg" />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name="Sarah Q" size={40} />
              <Stars value={stars} onChange={setStars} size={24} />
            </div>
          </Card>
        </div>
      </Section>

      <Section id="forms" n="06 — INPUTS" title={t('حقول الإدخال', 'Inputs')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-4 p-6">
            <Field label={t('الاسم الكامل', 'Full name')} hint={t('كما في الهوية', 'As on your ID')}>
              <Input placeholder={t('سارة القحطاني', 'Sarah Al-Qahtani')} />
            </Field>
            <Field label={t('البريد الإلكتروني', 'Email')} error={t('صيغة البريد غير صحيحة', 'Invalid email')}>
              <Input invalid defaultValue="sarah@" dir="ltr" />
            </Field>
            <Field label={t('المدينة', 'City')}>
              <Select className="h-12 w-full" value="riyadh" onChange={() => {}} options={[{ value: 'riyadh', label: t('الرياض', 'Riyadh') }]} />
            </Field>
            <Segmented value={seg} onChange={setSeg} options={[{ value: 'a', label: t('اليوم', 'Today') }, { value: 'b', label: t('الأسبوع', 'Week') }, { value: 'c', label: t('الشهر', 'Month') }]} />
          </Card>
          <Card className="space-y-5 p-6">
            <Field label={t('رقم الجوال', 'Mobile')}>
              <PhoneInput value={phone} onChange={setPhone} />
            </Field>
            <Field label={t('رمز التحقق', 'Verification code')}>
              <OtpInput value={otp} onChange={setOtp} autoFocus={false} />
            </Field>
          </Card>
        </div>
      </Section>

      <Section id="feedback" n="07 — STATES" title={t('التحميل والأخطاء والنجاح والفراغ', 'Loading, error, success, empty')}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="space-y-2 p-6">
            <p className="text-xs font-semibold text-mute">{t('تحميل', 'Loading')}</p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full" />
            <Spinner />
          </Card>
          <Card className="p-6">
            <p className="mb-3 text-xs font-semibold text-mute">{t('خطأ', 'Error')}</p>
            <ErrorState title={t('تعذّر تحميل الرحلات', "Couldn't load trips")} body={t('تحقق من الاتصال', 'Check your connection')} onRetry={() => toast(t('إعادة المحاولة…', 'Retrying…'), 'info')} />
          </Card>
          <Card className="flex flex-col items-center p-6">
            <p className="mb-3 self-start text-xs font-semibold text-mute">{t('نجاح', 'Success')}</p>
            <SuccessMark />
            <p className="mt-3 font-display font-semibold">{t('وصلت بالسلامة', 'You arrived safely')}</p>
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => toast(t('تم حفظ التغييرات', 'Changes saved'))}>
              Toast
            </Button>
          </Card>
          <Card pad={false}>
            <EmptyState title={t('لا توجد رحلات', 'No trips yet')} body={t('ستظهر رحلاتك هنا', 'Your trips appear here')} action={<Button size="sm" icon={<Plus size={14} />} onClick={() => setModal(true)}>{t('نافذة', 'Modal')}</Button>} />
          </Card>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} title={t('نافذة منبثقة', 'Modal dialog')} footer={<Button onClick={() => setModal(false)}>{t('حسناً', 'OK')}</Button>}>
          <p className="text-sm text-mute">{t('النوافذ تُغلق بزر Esc أو بالنقر خارجها.', 'Dialogs close with Esc or by clicking outside.')}</p>
        </Modal>
      </Section>

      <Section id="map" n="08 — MAP" title={t('لغة الخريطة', 'Map language')} sub={t('نقطة الانطلاق دائرة، والوجهة مربع، والمسار خط أخضر بسماكة ثابتة ونهايات مستديرة.', 'Pickup is a circle, destination is a square, the route is a constant-weight green line with round caps.')} dark>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-80 overflow-hidden rounded-3xl">
            <CityMap fit={[PLACES[1].pos, PLACES[3].pos]} padding={[50, 50, 50, 50]} routes={[{ id: 'r', pts: routeBetween(PLACES[1].pos, PLACES[3].pos) }]} markers={[{ id: 'a', pos: PLACES[1].pos, kind: 'pickup', pulse: true }, { id: 'b', pos: PLACES[3].pos, kind: 'dropoff' }, { id: 'c', pos: PLACES[16].pos, kind: 'car', heading: 30 }]} />
          </div>
          <div className="h-80 overflow-hidden rounded-3xl">
            <CityMap theme="dark" fit={[PLACES[1].pos, PLACES[3].pos]} padding={[50, 50, 50, 50]} routes={[{ id: 'r', pts: routeBetween(PLACES[1].pos, PLACES[3].pos) }]} markers={[{ id: 'a', pos: PLACES[1].pos, kind: 'pin' }, { id: 'b', pos: PLACES[3].pos, kind: 'dropoff' }, { id: 'c', pos: PLACES[16].pos, kind: 'car', heading: 30, tone: 'go', active: true }]} />
          </div>
        </div>
      </Section>
      <footer className="px-5 py-10 text-center text-xs text-mute">AURA — Move with Confidence · {t('دليل الهوية v1.0', 'Brand Book v1.0')}</footer>
    </div>
  )
}
