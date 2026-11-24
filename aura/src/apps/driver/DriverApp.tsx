import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, History, Wallet, User } from 'lucide-react'
import { ICON, Surface, ToastHost } from '../../ds/ui'
import { useI18n } from '../../i18n/I18n'
import { actions, clearSession, getDriver, getSession, setSession, useEco } from '../../core/store'
import { isActive } from '../../core/trip'
import { TabBar, screenMotion } from '../shared/mobile'
import { ApplicationStatus, DriverAuth, DriverSplash } from './Onboarding'
import { DriverActiveTrip, DriverHome, DriverTripSummary } from './Work'
import { DriverAccountTab, DriverTripsTab, EarningsTab, PerformancePanel } from './Tabs'
import { InboxPanel } from '../passenger/Tabs'

type Tab = 'home' | 'trips' | 'earnings' | 'account'
const DISMISS_KEY = 'aura.driver.dismissed'
const SEEN_KEY = 'aura.driver.inboxSeen'

export function DriverApp({ embedded }: { embedded?: boolean }) {
  const { t, dir } = useI18n()
  const [stage, setStage] = useState<'splash' | 'auth' | 'main'>(embedded && getSession().driverId ? 'main' : 'splash')
  const [did, setDid] = useState<string | undefined>(() => getSession().driverId)
  const [tab, setTab] = useState<Tab>('home')
  const [perf, setPerf] = useState(false)
  const [inbox, setInbox] = useState(false)
  const [seen, setSeen] = useState(() => Number(localStorage.getItem(SEEN_KEY) ?? 0))
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(DISMISS_KEY) ?? '[]')
    } catch {
      return []
    }
  })
  const trips = useEco((s) => s.trips)
  const inboxCount = useEco((s) => s.inbox.filter((i) => (i.to === 'all' || i.to === 'captains') && i.at > seen).length)
  useEco((s) => s.rev)
  const driver = getDriver(did)

  const active = useMemo(
    () => trips.find((x) => x.driverId === did && (isActive(x.status) || (x.status === 'completed' && !x.driverRating && !dismissed.includes(x.id)))),
    [trips, did, dismissed],
  )

  const onSplash = useCallback(() => setStage(getSession().driverId ? 'main' : 'auth'), [])
  const logout = () => {
    if (did) actions.setOnline(did, false)
    clearSession(['driverId'])
    setDid(undefined)
    setStage('auth')
    setTab('home')
  }
  const dismiss = (id: string) => {
    const next = [...dismissed, id]
    setDismissed(next)
    try {
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next))
    } catch {
      /* noop */
    }
  }

  let content: React.ReactNode
  if (stage === 'splash') content = <DriverSplash onDone={onSplash} />
  else if (stage === 'auth' || !driver)
    content = (
      <DriverAuth
        onAuthed={(id) => {
          setSession({ driverId: id })
          setDid(id)
          setStage('main')
        }}
      />
    )
  else if (driver.status !== 'approved') content = <ApplicationStatus driverId={driver.id} onApproved={() => setTab('home')} onLogout={logout} />
  else if (active) content = active.status === 'completed' ? <DriverTripSummary trip={active} onDone={() => dismiss(active.id)} /> : <DriverActiveTrip trip={active} driver={driver} />
  else
    content = (
      <div className="absolute inset-0 flex flex-col">
        <div className="relative flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={tab} {...screenMotion} className="absolute inset-0">
              {tab === 'home' && <DriverHome driver={driver} inboxCount={inboxCount} onInbox={() => setInbox(true)} onPerformance={() => setPerf(true)} />}
              {tab === 'trips' && <DriverTripsTab driver={driver} />}
              {tab === 'earnings' && <EarningsTab driver={driver} />}
              {tab === 'account' && <DriverAccountTab driver={driver} onLogout={logout} />}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {perf && <PerformancePanel driver={driver} onClose={() => setPerf(false)} />}
            {inbox && (
              <InboxPanel
                audience="captains"
                onClose={() => {
                  setInbox(false)
                  const now = Date.now()
                  setSeen(now)
                  localStorage.setItem(SEEN_KEY, String(now))
                }}
              />
            )}
          </AnimatePresence>
        </div>
        <TabBar<Tab>
          value={tab}
          onChange={setTab}
          items={[
            { id: 'home', label: t('الرئيسية', 'Home'), icon: <Home size={22} {...ICON} /> },
            { id: 'trips', label: t('الرحلات', 'Trips'), icon: <History size={22} {...ICON} /> },
            { id: 'earnings', label: t('الأرباح', 'Earnings'), icon: <Wallet size={22} {...ICON} /> },
            { id: 'account', label: t('حسابي', 'Account'), icon: <User size={22} {...ICON} /> },
          ]}
        />
      </div>
    )

  return (
    <Surface tone="dark">
      <ToastHost contained>
        <div dir={dir} className="absolute inset-0 overflow-hidden bg-ink font-sans text-white">
          {content}
        </div>
      </ToastHost>
    </Surface>
  )
}
