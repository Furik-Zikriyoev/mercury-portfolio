import { ref, shallowRef } from 'vue'
import type { Mercury } from '@/engine'

type Status = 'pending' | 'ready' | 'unsupported'

const engine = shallowRef<Mercury | null>(null)
const status = ref<Status>('pending')
/** Движок держит один металлический текст — здесь тот MercuryText, которому он сейчас принадлежит */
const textOwner = shallowRef<symbol | null>(null)

/** Доступ к движку из любого компонента. Создаёт его MercuryCanvas */
export function useMercury() {
  return { engine, status, textOwner }
}

export function setMercury(value: Mercury | null, next: Status): void {
  engine.value = value
  status.value = next
}
