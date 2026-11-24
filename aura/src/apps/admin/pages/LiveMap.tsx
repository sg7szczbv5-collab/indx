import { useMemo, useState } from 'react'
import { Layers, Search, X } from 'lucide-react'
import { CityMap, type MapMarker, type MapRoute } from '../../../map/CityMap'
import { Avatar, Badge, Button, cx, DemoBadge, Switch, TripStatusBadge } from '../../../ds/ui'
import { Plate } from '../../../ds/vehicle'
import { useI18n } from '../../../i18n/I18n'
import { demandPoints } from '../../../core/fleet'
import { fleetSnapshot, getCustomer, getDriver, getVehicle, store, useEco, useNow } from '../../../core/store'
import { STATUS_LABEL } from '../../../core/trip'
import { classById } from '../../../core/pricing'
import type { FleetUnit } from '../../../core/fleet'
import { PageHeader } from '../kit'
import { go } from '../../../app/router'

type Sel = { kind: 'unit'; id: string } | null

export function LiveMapPage() {
  const { t, L } = useI18n()
  const now = useNow(1000)
  const rev = useEco((s) => s.rev)
  const zones = useEco((s) => s.zones.filter((z) => z.cityId === 'riyadh' && z.active))
  const fleet = useMemo(() => fleetSnapshot(now), [now, rev]) // eslint-disable-line react-hooks/exhaustive-deps
  const searching = useEco((s) => s.trips.filter((x) => x.status === 'searching'))
  const heat = useMemo(() => demandPoints(now), [Math.floor(now / 600_000)]) // eslint-disable-line react-hooks/exhaustive-deps
  const [layers, setLayers] = useState({ captains: true, trips: true, heat: true, zones: true })
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'on_trip' | 'offline'>('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Sel>(null)

  const counts = {
    available: fleet.filter((u) => u.status === 'available').length,
    on_trip: fleet.filter((u) => u.status !== 'available' && u.status !== 'offline').length,
    offline: fleet.filter((u) => u.status === 'offline').length,
  }
  const visible = fleet.filter((u) => (statusFilter === 'all' ? u.status !== 'offline' : statusFilter === 'on_trip' ? u.status !== 'available' && u.status !== 'offline' : u.status === statusFilter))
  const selected = sel ? fleet.find((u) => u.driverId === sel.id) : undefined

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    return fleet
      .filter((u) => {
        const d = getDriver(u.driverId)
        return u.driverId.includes(s) || (u.tripId ?? '').toLowerCase().includes(s) || d?.name.en.toLowerCase().includes(s) || d?.name.ar.includes(q.trim())
      })
      .slice(0, 6)
  }, [q, fleet])

  const markers: MapMarker[] = []
  const routes: MapRoute[] = []
  if (layers.trips) {
    for (const u of visible) {
      if (u.status === 'available' || u.status === 'offline' || !u.pickup || !u.dropoff) continue
      const isSel = selected?.driverId === u.driverId
      if (u.route && (isSel || u.status === 'in_progress')) routes.push({ id: `r-${u.driverId}`, pts: u.route, tone: isSel ? 'go' : 'mute', width: isSel ? 5 : 2.5 })
      if (u.status !== 'in_progress') markers.push({ id: `p-${u.driverId}`, pos: u.pickup.pos, kind: 'dot', tone: 'white', active: isSel })
      markers.push({ id: `d-${u.driverId}`, pos: u.dropoff.pos, kind: isSel ? 'dropoff' : 'dot', tone: 'mute' })
    }
    for (const s of searching) markers.push({ id: `s-${s.id}`, pos: s.pickup.pos, kind: 'pickup', pulse: true, label: t('بحث', 'Searching') })
  }
  if (layers.captains || layers.trips) {
    for (const u of visible) {
      const onTrip = u.status !== 'available' && u.status !== 'offline'
      if (!layers.captains && !onTrip) continue
      markers.push({
        id: u.driverId,
        pos: u.pos,
        kind: 'car',
        heading: u.heading,
        tone: u.status === 'offline' ? 'mute' : onTrip ? 'go' : 'white',
        active: selected?.driverId === u.driverId,
        label: selected?.driverId === u.driverId ? L(getDriver(u.driverId)?.name) : undefined,
        onClick: () => setSel({ kind: 'unit', id: u.driverId }),
      })
    }
  }

  return (
    <div className="flex h-[calc(100vh-112px)] min-h-[560px] flex-col">
      <PageHeader
        title={t('الخريطة التشغيلية المباشرة', 'Live operations map')}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            {t('الرياض', 'Riyadh')} · <span className="num">{fleet.length}</span> {t('كابتن', 'captains')} <DemoBadge />
          </span>
        }
      />
      <div className="relative flex-1 overflow-hidden rounded-3xl ring-1 ring-line">
        <CityMap
          theme="dark"
          center={{ lat: 24.75, lng: 46.67 }}
          zoom={28}
          controls
          markers={markers}
          routes={routes}
          heat={layers.heat ? heat : undefined}
          zones={layers.zones ? zones.filter((z) => z.kind !== 'service').map((z) => ({ id: z.id, center: z.center, radiusKm: z.radiusKm, kind: z.kind, label: L(z.name) })) : []}
          fit={selected ? [selected.pos] : undefined}
          fitKey={selected?.driverId}
          padding={[80, 80, 80, 80]}
        />

        {/* Search + filters */}
        <div className="absolute start-4 top-4 z-10 w-[min(360px,calc(100%-32px))] space-y-2">
          <div className="relative">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('ابحث عن كابتن أو رحلة…', 'Search captain or trip…')} aria-label={t('بحث', 'Search')} className="h-11 w-full rounded-xl bg-white ps-9 pe-3 text-sm shadow-lg outline-none focus:ring-2 focus:ring-go" />
            {results.length > 0 && (
              <div className="absolute inset-x-0 top-12 overflow-hidden rounded-xl bg-white shadow-xl">
                {results.map((u) => {
                  const d = getDriver(u.driverId)
                  return (
                    <button
                      key={u.driverId}
                      onClick={() => {
                        setSel({ kind: 'unit', id: u.driverId })
                        setQ('')
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm hover:bg-road"
                    >
                      <Avatar name={L(d?.name)} size={30} />
                      <span className="flex-1 truncate">{L(d?.name)}</span>
                      <span className="num text-xs text-mute">{u.tripId ?? u.driverId}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['all', t('الكل', 'All'), counts.available + counts.on_trip],
                ['available', t('متاح', 'Available'), counts.available],
                ['on_trip', t('في رحلة', 'On trip'), counts.on_trip],
                ['offline', t('غير متصل', 'Offline'), counts.offline],
              ] as const
            ).map(([k, label, n]) => (
              <button key={k} onClick={() => setStatusFilter(k)} className={cx('h-8 rounded-lg px-3 text-xs font-semibold shadow', statusFilter === k ? 'bg-go text-ink' : 'bg-white text-ink')}>
                {label} <span className="num opacity-60">{n}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Layers */}
        <div className="absolute end-4 top-4 z-10 w-52 rounded-2xl bg-white p-3 shadow-lg">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-mute">
            <Layers size={14} /> {t('الطبقات', 'Layers')}
          </p>
          {(
            [
              ['captains', t('الكباتن المتاحون', 'Available captains')],
              ['trips', t('الرحلات النشطة', 'Active trips')],
              ['heat', t('كثافة الطلب', 'Demand heat')],
              ['zones', t('المناطق', 'Zones')],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between py-1.5 text-[13px]">
              {label}
              <Switch checked={layers[k]} onChange={(v) => setLayers({ ...layers, [k]: v })} label={label} />
            </label>
          ))}
          <div className="mt-2 space-y-1 border-t border-line pt-2 text-[11.5px] text-mute">
            <p className="flex items-center gap-2"><span className="h-2.5 w-1.5 rounded-sm bg-go" /> {t('في رحلة', 'On trip')}</p>
            <p className="flex items-center gap-2"><span className="h-2.5 w-1.5 rounded-sm bg-ink ring-1 ring-mute-2" /> {t('متاح', 'Available')}</p>
            <p className="flex items-center gap-2"><span className="size-2 rounded-full bg-mute-2" /> {t('وجهة', 'Destination')}</p>
          </div>
        </div>

        {/* Selection panel */}
        {selected && <UnitPanel u={selected} onClose={() => setSel(null)} />}

        {/* Requests waiting */}
        {searching.length > 0 && (
          <div className="absolute start-4 bottom-4 z-10 rounded-2xl bg-white px-4 py-3 shadow-lg">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="size-2 animate-pulse rounded-full bg-go" /> {searching.length} {t('طلب بانتظار كابتن', 'requests awaiting a captain')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function UnitPanel({ u, onClose }: { u: FleetUnit; onClose: () => void }) {
  const { t, L } = useI18n()
  const d = getDriver(u.driverId)
  const v = getVehicle(d?.vehicleId)
  const trip = u.tripId && !u.tripId.startsWith('SIM') ? store.state.trips.find((x) => x.id === u.tripId) : undefined
  const rider = trip ? getCustomer(trip.passengerId) : undefined
  return (
    <div className="absolute end-4 bottom-4 z-10 w-[min(340px,calc(100%-32px))] rounded-2xl bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <Avatar name={L(d?.name)} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{L(d?.name)}</p>
          <p className="num text-xs text-mute">
            {d?.id} · ★ {d?.rating.toFixed(2)}
          </p>
        </div>
        <button aria-label={t('إغلاق', 'Close')} onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      {v && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-road px-3 py-2 text-[13px]">
          <span>
            {v.make} {v.model} · {L(v.color)} · <span dir="ltr">{classById(v.classId).name}</span>
          </span>
          <Plate digits={v.plate.digits} lettersAr={v.plate.lettersAr} lettersEn={v.plate.lettersEn} size="sm" />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-mute">{t('الحالة', 'Status')}</span>
        {u.status === 'available' ? <Badge tone="neutral">{t('متاح', 'Available')}</Badge> : u.status === 'offline' ? <Badge tone="outline">{t('غير متصل', 'Offline')}</Badge> : <TripStatusBadge status={u.status} />}
      </div>
      {u.tripId && (
        <div className="mt-2 space-y-1.5 text-[13px]">
          <p className="flex justify-between">
            <span className="text-mute">{t('الرحلة', 'Trip')}</span>
            <span className="num font-semibold">{u.tripId}</span>
          </p>
          {rider && (
            <p className="flex justify-between">
              <span className="text-mute">{t('العميل', 'Customer')}</span>
              <span>{L(rider.name)}</span>
            </p>
          )}
          {trip && (
            <p className="flex justify-between">
              <span className="text-mute">{t('الوجهة', 'Destination')}</span>
              <span className="truncate">{L(trip.dropoff.name)}</span>
            </p>
          )}
          {u.progress !== undefined && (
            <div className="h-1.5 overflow-hidden rounded-full bg-road">
              <div className="h-full rounded-full bg-go" style={{ width: `${u.progress * 100}%` }} />
            </div>
          )}
          {u.tripId.startsWith('SIM') && <p className="text-[11px] text-mute-2">{t('رحلة محاكاة لأغراض العرض', 'Simulated trip for demonstration')} · {L(STATUS_LABEL[u.status as 'in_progress'] ?? STATUS_LABEL.in_progress)}</p>}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => go(`/admin/drivers?id=${u.driverId}`)}>
          {t('ملف الكابتن', 'Captain profile')}
        </Button>
        {trip && (
          <Button size="sm" onClick={() => go(`/admin/trips?id=${trip.id}`)}>
            {t('تفاصيل الرحلة', 'Trip details')}
          </Button>
        )}
      </div>
    </div>
  )
}
