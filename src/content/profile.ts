/**
 * Контакты и ссылки — не зависят от языка.
 * Чтобы скрыть ссылку, оставьте href пустой строкой.
 */
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
  timeZone: 'Asia/Tashkent',
  /** PDF резюме: положите файл в /public и укажите '/resume.pdf' */
  resumeUrl: '',
  socials: socials.filter((s) => s.href !== ''),
}
