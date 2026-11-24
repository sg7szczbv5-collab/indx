/** MASRA design tokens — shared by every screen. */
export const colors = {
  ink: '#0B0D0C',
  ink2: '#121513',
  ink3: '#1A1E1C',
  white: '#FFFFFF',
  mist: '#E9ECEA',
  mist2: '#F4F6F5',
  smoke: '#9AA39E',
  muted: 'rgba(11,13,12,0.55)',
  faint: 'rgba(11,13,12,0.38)',
  line: 'rgba(11,13,12,0.07)',
  green: '#0F5B3A',
  green2: '#137A4D',
  green3: '#1FA36A',
  greenSoft: '#D8EDE2',
  gold: '#C9A45C',
  danger: '#D9534F',
} as const

export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  float: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
} as const
