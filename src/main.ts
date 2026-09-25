import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { startIntroGate } from './composables/useIntro'
import { resetScroll } from './composables/useSmoothScroll'
import './styles/base.css'

// после перезагрузки всегда начинаем с первого экрана: сайт — последовательная история
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)
window.addEventListener('beforeunload', () => window.scrollTo(0, 0))

const isLab = new URLSearchParams(window.location.search).has('lab')
// интро — только на главной
if (!isLab && window.location.pathname === '/') startIntroGate()

router.afterEach(() => resetScroll())

createApp(App).use(router).mount('#app')
