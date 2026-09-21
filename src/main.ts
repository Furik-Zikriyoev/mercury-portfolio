import { createApp } from 'vue'
import App from './App.vue'
import { startIntroGate } from './composables/useIntro'
import './styles/base.css'

// после перезагрузки всегда начинаем с первого экрана: сайт — последовательная история
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)
window.addEventListener('beforeunload', () => window.scrollTo(0, 0))

const isLab = new URLSearchParams(window.location.search).has('lab')
if (!isLab) startIntroGate()

createApp(App).mount('#app')
