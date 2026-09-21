<script setup lang="ts">
import LangSwitch from '@/components/LangSwitch.vue'
import { useI18n } from '@/content/i18n'
import { profile } from '@/content/profile'
import { useClock } from '@/composables/useClock'

const { t } = useI18n()
const { time } = useClock(profile.timeZone)
</script>

<template>
  <div class="page">
    <header class="top container">
      <span class="logo mono">Mercury</span>
      <LangSwitch />
    </header>

    <main class="hero container">
      <div class="drop" aria-hidden="true" />

      <p class="eyebrow mono">
        <span class="dot" />
        {{ t.hero.status }} · {{ t.hero.location }}
      </p>

      <h1 class="name">
        <span class="chrome-text">{{ t.hero.firstName }}</span>
        <span class="name__last">{{ t.hero.lastName }}</span>
      </h1>

      <p class="role">{{ t.hero.role }}</p>

      <section class="soon" aria-labelledby="soon-title">
        <h2 id="soon-title" class="mono soon__label">{{ t.soon.label }}</h2>
        <p class="soon__text">{{ t.soon.text }}</p>
        <ul class="links">
          <li>
            <a :href="`mailto:${profile.email}`">{{ t.contact.email }} ↗</a>
          </li>
          <li v-for="s in profile.socials" :key="s.id">
            <a :href="s.href" target="_blank" rel="noopener noreferrer">{{ s.label }} ↗</a>
          </li>
        </ul>
      </section>
    </main>

    <footer class="bottom container mono">
      <span>{{ t.hero.localTime }} · {{ time }}</span>
      <span>© {{ new Date().getFullYear() }}</span>
    </footer>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
  overflow: hidden;
}

.top,
.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: 1.5rem;
  color: var(--text-muted);
}

.logo {
  color: var(--text);
  letter-spacing: 0.3em;
}

.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: 4rem;
}

/* Временная статичная «капля» — на этапе 2 её заменит WebGL-ртуть */
.drop {
  position: absolute;
  z-index: -1;
  right: max(var(--gutter), 6vw);
  top: 50%;
  width: clamp(180px, 30vw, 420px);
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 36% 30%, #fff 0 6%, transparent 22%),
    radial-gradient(circle at 50% 50%, #cfcfd6 0%, #8d8d96 38%, #1b1b1f 64%, #54545c 82%, #9a9aa2 100%);
  box-shadow:
    0 40px 120px -20px rgb(255 106 43 / 0.25),
    inset 0 -20px 60px rgb(0 0 0 / 0.5);
  transform: translateY(-50%);
  animation: float 8s var(--ease-in-out) infinite alternate;
}

@keyframes float {
  to {
    transform: translateY(-46%) scale(1.03, 0.97);
  }
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 0 var(--accent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  70% {
    box-shadow: 0 0 0 10px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

.name {
  margin-top: 1.5rem;
  font-size: var(--fs-hero);
  font-weight: 700;
  display: flex;
  flex-direction: column;
}

.name__last {
  color: transparent;
  -webkit-text-stroke: 1px var(--text-faint);
}

.role {
  margin-top: 1.5rem;
  font-size: var(--fs-xl);
  font-weight: 500;
}

.soon {
  margin-top: 3.5rem;
  max-width: 34rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}

.soon__label {
  font-family: var(--font-mono);
  font-weight: 400;
  color: var(--accent);
}

.soon__text {
  margin-top: 0.75rem;
  color: var(--text-muted);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-top: 1.25rem;
}

.links a {
  position: relative;
  font-weight: 600;
}

.links a::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 1px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform var(--dur-med) var(--ease-out);
}

.links a:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

@media (max-width: 700px) {
  .drop {
    top: 18%;
    right: -12vw;
    opacity: 0.6;
  }
}
</style>
