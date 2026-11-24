import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { PLACES, type Place } from '@/data/places'
import { PAYMENTS, RIDE_TYPES, fareFor, type Driver, type PaymentMethod, type RideType } from '@/data/rides'

type Trip = { id: string; driver: Driver }

type RideState = {
  phone: string
  setPhone: (v: string) => void
  place: Place
  setPlaceId: (id: string) => void
  ride: RideType
  setRideId: (id: RideType['id']) => void
  payment: PaymentMethod
  setPaymentId: (id: PaymentMethod['id']) => void
  fare: number
  trip: Trip | null
  setTrip: (t: Trip | null) => void
}

const Ctx = createContext<RideState | null>(null)

export function RideProvider({ children }: { children: ReactNode }) {
  const [phone, setPhone] = useState('')
  const [placeId, setPlaceId] = useState(PLACES[1].id)
  const [rideId, setRideId] = useState<RideType['id']>('eco')
  const [paymentId, setPaymentId] = useState<PaymentMethod['id']>('card')
  const [trip, setTrip] = useState<Trip | null>(null)

  const value = useMemo<RideState>(() => {
    const place = PLACES.find((p) => p.id === placeId) ?? PLACES[0]
    const ride = RIDE_TYPES.find((r) => r.id === rideId) ?? RIDE_TYPES[0]
    const payment = PAYMENTS.find((p) => p.id === paymentId) ?? PAYMENTS[0]
    return {
      phone,
      setPhone,
      place,
      setPlaceId,
      ride,
      setRideId,
      payment,
      setPaymentId,
      fare: fareFor(place, ride),
      trip,
      setTrip,
    }
  }, [phone, placeId, rideId, paymentId, trip])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRide() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useRide must be used inside <RideProvider>')
  return v
}
