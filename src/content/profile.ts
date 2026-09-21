// Контакты. Пустой href — ссылка не показывается.
export interface SocialLink {
  id: 'telegram' | 'github' | 'linkedin' | 'instagram' | 'hh'
  label: string
  href: string
}

const socials: SocialLink[] = [
  { id: 'telegram', label: 'Telegram', href: 'https://t.me/mercury23' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/Furik-Zikriyoev' },
  { id: 'linkedin', label: 'LinkedIn', href: '' },
]

export const profile = {
  email: 'zff2304@mail.ru',
  /** для ссылки tel: и копирования */
  phone: '+998507834299',
  phoneDisplay: '+998 50 783 42 99',
  timeZone: 'Asia/Tashkent',
  /** например '/resume.pdf' из папки public */
  resumeUrl: '',
  socials: socials.filter((s) => s.href !== ''),
}
