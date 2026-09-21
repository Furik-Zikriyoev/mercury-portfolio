import { ref } from 'vue'

/** Терминал доступен только с клавиатурой и мышью */
const supported = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
const open = ref(false)

export function useTerminal() {
  return {
    open,
    supported,
    toggle: (value = !open.value) => {
      if (supported) open.value = value
    },
  }
}
