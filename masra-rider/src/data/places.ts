export type Place = {
  id: string
  name: string
  area: string
  addr: string
  km: number
  min: number
  kind: 'airport' | 'recent' | 'place'
}

/** Demo destinations around Dammam, Al Khobar and Dhahran. Distances are illustrative. */
export const PLACES: Place[] = [
  { id: 'airport', name: 'مطار الملك فهد الدولي', area: 'الدمام', addr: 'طريق المطار، الدمام', km: 31.5, min: 28, kind: 'airport' },
  { id: 'corniche-k', name: 'كورنيش الخبر', area: 'الخبر', addr: 'طريق الكورنيش، الخبر الشمالية', km: 14.2, min: 18, kind: 'recent' },
  { id: 'kfupm', name: 'جامعة الملك فهد للبترول والمعادن', area: 'الظهران', addr: 'شارع الجامعة، الظهران', km: 11.8, min: 15, kind: 'place' },
  { id: 'waterfront', name: 'الواجهة البحرية', area: 'الدمام', addr: 'طريق الخليج، حي الشاطئ', km: 6.4, min: 11, kind: 'recent' },
  { id: 'station', name: 'محطة قطار الدمام', area: 'الدمام', addr: 'طريق الملك سعود، حي العدامة', km: 8.9, min: 14, kind: 'place' },
  { id: 'causeway', name: 'مدخل جسر الملك فهد', area: 'الخبر', addr: 'طريق جسر الملك فهد، الخبر', km: 24.6, min: 24, kind: 'place' },
]

export const CURRENT_LOCATION = { name: 'حي الشاطئ', addr: 'طريق الخليج، الدمام' }

export const shortName = (p: Place) => p.name.split(' ').slice(0, 2).join(' ')
