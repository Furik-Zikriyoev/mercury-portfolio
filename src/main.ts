import { createApp } from 'vue'
import App from './App.vue'
import { startIntroGate } from './composables/useIntro'
import './styles/base.css'

const isLab = new URLSearchParams(window.location.search).has('lab')
if (!isLab) startIntroGate()

createApp(App).mount('#app')
