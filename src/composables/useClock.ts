import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/** Живые часы в заданном часовом поясе */
export function useClock(timeZone: string) {
  const now = ref(new Date())
  let timer: number | undefined

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  onMounted(() => {
    timer = window.setInterval(() => (now.value = new Date()), 1000)
  })
  onBeforeUnmount(() => window.clearInterval(timer))

  return { time: computed(() => formatter.format(now.value)) }
}
