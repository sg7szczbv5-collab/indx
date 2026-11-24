import { useMemo, useState } from 'react'
import { MapPinPlus, Trash2 } from 'lucide-react'
import { CityMap } from '../../../map/CityMap'
import { Badge, Button, cx, DemoBadge, Field, Input, Select, Switch, useToast } from '../../../ds/ui'
import { useI18n } from '../../../i18n/I18n'
import { actions, useAllTrips, useEco } from '../../../core/store'
import { CITIES, DISTRICTS } from '../../../core/geo'
import { DAY, int, startOfDay } from '../../../core/format'
import type { LatLng, Zone, ZoneKind } from '../../../core/types'
import { Can, PageHeader, Panel, useAdmin } from '../kit'

const KIND_LABEL: Record<ZoneKind, { ar: string; en: string }> = {
  service: { ar: 'نطاق الخدمة', en: 'Service area' },
  high_demand: { ar: 'طلب مرتفع', en: 'High demand' },
  restricted: { ar: 'منطقة حظر', en: 'Restricted' },
  airport: { ar: 'مطار', en: 'Airport' },
}

export function ZonesPage() {
  const { t, L } = useI18n()
  const toast = useToast()
  const { admin, can } = useAdmin()
  const zones = useEco((s) => s.zones)
  const trips = useAllTrips()
  const [sel, setSel] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)
  const [draft, setDraft] = useState<Zone | null>(null)
  const editable = can('zones.edit')
  const riyadh = zones.filter((z) => z.cityId === 'riyadh')
  const cityTrips = useMemo(() => {
    const from = startOfDay() - 29 * DAY
    const m = new Map<string, number>()
    for (const x of trips) if (x.createdAt >= from) m.set(x.cityId, (m.get(x.cityId) ?? 0) + 1)
    return m
  }, [trips])
  const selected = draft ?? riyadh.find((z) => z.id === sel)

  const startAdd = (p: LatLng) => {
    setDraft({ id: `z-${Date.now().toString(36)}`, cityId: 'riyadh', name: { ar: 'منطقة جديدة', en: 'New zone' }, kind: 'high_demand', center: p, radiusKm: 1.5, active: true, multiplier: 1.2 })
    setPlacing(false)
    setSel(null)
  }

  return (
    <div>
      <PageHeader
        title={t('المدن والمناطق', 'Cities & zones')}
        sub={<span className="flex items-center gap-2">{t('مناطق الخدمة والحظر والطلب المرتفع وحدود التشغيل', 'Service, restricted and high-demand areas and operating limits')} <DemoBadge /></span>}
        actions={
          <Can perm="zones.edit">
            <Button size="sm" variant={placing ? 'go' : 'primary'} icon={<MapPinPlus size={15} />} onClick={() => setPlacing(!placing)}>
              {placing ? t('انقر على الخريطة لوضع المنطقة', 'Click the map to place the zone') : t('إضافة منطقة', 'Add zone')}
            </Button>
          </Can>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="relative h-[560px] overflow-hidden rounded-3xl ring-1 ring-line">
          <CityMap
            center={{ lat: 24.76, lng: 46.68 }}
            zoom={22}
            controls
            onPick={placing ? startAdd : undefined}
            zones={[...riyadh.filter((z) => z.id !== draft?.id), ...(draft ? [draft] : [])].map((z) => ({
              id: z.id,
              center: z.center,
              radiusKm: z.radiusKm,
              kind: z.kind,
              label: `${L(z.name)}${z.multiplier && z.kind === 'high_demand' ? ` ×${z.multiplier}` : ''}`,
              active: z.active,
              selected: selected?.id === z.id,
              onClick: () => { setDraft(null); setSel(z.id) },
            }))}
          />
          <div className="absolute start-4 top-4 rounded-xl bg-white px-3 py-2 text-xs shadow">
            <p className="font-semibold">{t('الرياض', 'Riyadh')}</p>
            <p className="num text-mute">{DISTRICTS.length} {t('حياً معروضاً', 'districts shown')}</p>
          </div>
        </div>
        <div className="space-y-4">
          {selected ? (
            <ZoneEditor
              key={selected.id}
              zone={selected}
              isNew={!!draft}
              editable={editable}
              onCancel={() => { setDraft(null); setSel(null) }}
              onSave={(z) => { actions.upsertZone(z, admin); setDraft(null); setSel(z.id); toast(t('تم حفظ المنطقة. يطبّق على الطلبات الجديدة فوراً.', 'Zone saved. Applies to new requests immediately.')) }}
              onDelete={() => { actions.deleteZone(selected.id, admin); setSel(null); toast(t('تم حذف المنطقة', 'Zone deleted'), 'info') }}
            />
          ) : (
            <Panel title={t('مناطق الرياض', 'Riyadh zones')}>
              <div className="space-y-2">
                {riyadh.map((z) => (
                  <button key={z.id} onClick={() => setSel(z.id)} className="flex w-full items-center gap-3 rounded-xl bg-road px-3 py-2.5 text-start">
                    <span className={cx('size-3 rounded-full', z.kind === 'restricted' ? 'bg-danger' : z.kind === 'high_demand' ? 'bg-go' : 'bg-ink')} />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{L(z.name)}</span>
                      <span className="block text-xs text-mute">
                        {L(KIND_LABEL[z.kind])} · <span className="num">{z.radiusKm} km</span>
                        {z.multiplier && z.kind === 'high_demand' ? <span className="num"> · ×{z.multiplier}</span> : null}
                      </span>
                    </span>
                    {!z.active && <Badge tone="outline">{t('معطّلة', 'Off')}</Badge>}
                  </button>
                ))}
              </div>
            </Panel>
          )}
          <Panel title={t('المدن المدعومة', 'Supported cities')}>
            <div className="space-y-2">
              {CITIES.map((c) => (
                <div key={c.id} className="flex items-center justify-between border-b border-line pb-2 text-sm last:border-0">
                  <span>
                    <span className="font-semibold">{L(c.name)}</span>
                    <span className="num block text-xs text-mute">
                      {c.districts} {t('حي', 'districts')} · {int(cityTrips.get(c.id) ?? 0)} {t('رحلة/٣٠ي', 'trips/30d')}
                    </span>
                  </span>
                  <Badge tone={c.status === 'live' ? 'live' : c.status === 'pilot' ? 'warn' : 'outline'}>{c.status === 'live' ? t('تشغيل', 'Live') : c.status === 'pilot' ? t('تجريبي', 'Pilot') : t('مخطط', 'Planned')}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] text-mute">{t('خرائط المدن الأخرى تُفعّل عند ربط مزوّد خرائط تجاري.', 'Maps for other cities activate when a commercial map provider is connected.')}</p>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function ZoneEditor({ zone, isNew, editable, onSave, onCancel, onDelete }: { zone: Zone; isNew: boolean; editable: boolean; onSave: (z: Zone) => void; onCancel: () => void; onDelete: () => void }) {
  const { t, L } = useI18n()
  const [z, setZ] = useState(zone)
  return (
    <Panel title={isNew ? t('منطقة جديدة', 'New zone') : L(zone.name)} action={<button onClick={onCancel} className="text-xs font-semibold text-mute">{t('إغلاق', 'Close')}</button>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label={t('الاسم (ع)', 'Name (AR)')}>
            <Input disabled={!editable} value={z.name.ar} onChange={(e) => setZ({ ...z, name: { ...z.name, ar: e.target.value } })} />
          </Field>
          <Field label={t('الاسم (EN)', 'Name (EN)')}>
            <Input disabled={!editable} dir="ltr" value={z.name.en} onChange={(e) => setZ({ ...z, name: { ...z.name, en: e.target.value } })} />
          </Field>
        </div>
        <Field label={t('النوع', 'Type')}>
          <Select className="h-11 w-full" value={z.kind} onChange={(v) => editable && setZ({ ...z, kind: v as ZoneKind })} options={(Object.keys(KIND_LABEL) as ZoneKind[]).map((k) => ({ value: k, label: L(KIND_LABEL[k]) }))} />
        </Field>
        <Field label={`${t('نصف القطر', 'Radius')} · ${z.radiusKm.toFixed(1)} km`}>
          <input type="range" className="aura-range" min={0.5} max={z.kind === 'service' ? 30 : 6} step={0.1} disabled={!editable} value={z.radiusKm} onChange={(e) => setZ({ ...z, radiusKm: Number(e.target.value) })} />
        </Field>
        {z.kind === 'high_demand' && (
          <Field label={`${t('مُضاعِف السعر', 'Price multiplier')} · ×${(z.multiplier ?? 1).toFixed(2)}`} hint={t('يُطبَّق على المسافة والوقت فقط ويظهر للعميل قبل التأكيد.', 'Applies to distance and time only; shown to the rider before confirming.')}>
            <input type="range" className="aura-range" min={1} max={2} step={0.05} disabled={!editable} value={z.multiplier ?? 1} onChange={(e) => setZ({ ...z, multiplier: Number(e.target.value) })} />
          </Field>
        )}
        {z.kind === 'restricted' && <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger">{t('يُمنع طلب الالتقاء داخل هذه المنطقة في تطبيق العميل.', 'Riders cannot request pickups inside this zone.')}</p>}
        <label className="flex items-center justify-between text-sm">
          {t('مفعّلة', 'Active')}
          <Switch checked={z.active} disabled={!editable} onChange={(v) => setZ({ ...z, active: v })} />
        </label>
        <p className="num text-xs text-mute" dir="ltr">
          {z.center.lat.toFixed(4)}, {z.center.lng.toFixed(4)}
        </p>
        {editable ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSave(z)}>
              {t('حفظ', 'Save')}
            </Button>
            {!isNew && (
              <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={onDelete}>
                {t('حذف', 'Delete')}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-mute">{t('عرض فقط', 'Read-only')}</p>
        )}
      </div>
    </Panel>
  )
}
