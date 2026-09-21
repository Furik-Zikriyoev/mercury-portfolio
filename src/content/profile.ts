// Контакты. Пустой href — ссылка не показывается.
export interface SocialLink {
  id: 'telegram' | 'github' | 'linkedin' | 'instagram' | 'hh'
  label: string
  /** как показывать в контактах */
  handle: string
  href: string
}

const socials: SocialLink[] = [
  { id: 'telegram', label: 'Telegram', handle: '@mercury23', href: 'https://t.me/mercury23' },
  {
    id: 'github',
    label: 'GitHub',
    handle: 'Furik-Zikriyoev',
    href: 'https://github.com/Furik-Zikriyoev',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'Furuzonfar Zikriyoev',
    href: 'https://www.linkedin.com/in/furuzonfar-zikriyoev-22b248424/',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@mercury.1.9',
    href: 'https://www.instagram.com/mercury.1.9/',
  },
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
