import type { Work } from './types'
import dotai from './items/dotai'
import tehpark from './items/tehpark'
import wedding from './items/wedding'

/** Порядок на странице работ: сверху то, что показываю первым */
export const WORKS: Work[] = [dotai, wedding, tehpark]

export const findWork = (slug: string): Work | undefined => WORKS.find((w) => w.slug === slug)

export type { Work } from './types'
