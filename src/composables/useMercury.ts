import { ref, shallowRef } from 'vue'
import type { Mercury } from '@/engine'

type Status = 'pending' | 'ready' | 'unsupported'

const engine = shallowRef<Mercury | null>(null)
const status = ref<Status>('pending')

/** Доступ к движку из любого компонента. Создаёт его MercuryCanvas */
export function useMercury() {
  return { engine, status }
}

export function setMercury(value: Mercury | null, next: Status): void {
  engine.value = value
  status.value = next
}
