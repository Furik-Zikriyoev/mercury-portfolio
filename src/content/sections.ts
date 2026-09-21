/** Порядок секций главной, их фон и тип поверхности (тёмная / светлая) */
export const SECTIONS = [
  { id: 'hero', bg: '#0b0b0c', surface: 'dark' },
  { id: 'sandbox', bg: '#09090a', surface: 'dark' },
  { id: 'manifesto', bg: '#0b0b0c', surface: 'dark' },
  { id: 'about', bg: '#0e0e10', surface: 'dark' },
  { id: 'experience', bg: '#0d0c0b', surface: 'dark' },
  { id: 'specs', bg: '#f3f2ee', surface: 'light' },
  { id: 'work', bg: '#0b0b0c', surface: 'dark' },
  { id: 'contact', bg: '#110c0a', surface: 'dark' },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']
export type Surface = (typeof SECTIONS)[number]['surface']
