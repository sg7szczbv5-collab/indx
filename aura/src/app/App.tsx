import { Device } from '../ds/Device'
import { PassengerApp } from '../apps/passenger/PassengerApp'
import { DriverApp } from '../apps/driver/DriverApp'
export function App() {
  return <div className="flex min-h-screen items-center justify-center gap-6 bg-road p-6"><Device scale={0.82}><PassengerApp /></Device><Device scale={0.82} statusTone="light"><DriverApp /></Device></div>
}
