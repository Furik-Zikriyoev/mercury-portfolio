<script setup lang="ts">
import { LOCALES, useI18n } from '@/content/i18n'

const { t, locale, setLocale } = useI18n()
</script>

<template>
  <div class="lang" role="group" :aria-label="t.a11y.switchLang">
    <button
      v-for="code in LOCALES"
      :key="code"
      type="button"
      class="lang__btn mono"
      :class="{ 'is-active': locale === code }"
      :aria-pressed="locale === code"
      @click="setLocale(code)"
    >
      {{ code }}
    </button>
    <span class="lang__pill" :style="{ transform: `translateX(${locale === 'en' ? 100 : 0}%)` }" />
  </div>
</template>

<style scoped>
.lang {
  position: relative;
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  padding: 4px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--line);
  background: rgb(255 255 255 / 0.03);
  backdrop-filter: blur(16px);
}

.lang__btn {
  position: relative;
  z-index: 1;
  min-width: 44px;
  padding: 0.45rem 0.8rem;
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  transition: color var(--dur-med) var(--ease-out);
}

.lang__btn:hover,
.lang__btn.is-active {
  color: var(--text);
}

.lang__pill {
  position: absolute;
  inset: 4px auto 4px 4px;
  width: calc(50% - 4px);
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  box-shadow: inset 0 0 0 1px var(--line-strong);
  transition: transform var(--dur-med) var(--ease-out);
}
</style>
