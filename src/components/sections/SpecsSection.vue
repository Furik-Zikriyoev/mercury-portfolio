<script setup lang="ts">
import { useI18n } from '@/content/i18n'
import { vReveal } from '@/directives/reveal'

const { t } = useI18n()
</script>

<template>
  <section id="specs" class="specs" data-surface="light">
    <div class="container">
      <header class="specs__head">
        <p class="section-index">05 · {{ t.nav.sections.specs }}</p>
        <h2 v-reveal class="specs__title">{{ t.specs.title }}</h2>
        <div class="specs__drop" data-drop-home data-drop-size="40" data-drop-count="4" aria-hidden="true" />
      </header>

      <dl class="rows">
        <div v-for="(row, i) in t.specs.rows" :key="row.label" v-reveal="i * 70" class="row">
          <dt class="row__label">{{ row.label }}</dt>
          <dd class="row__value">
            <span class="row__main">{{ row.main }}</span>
            <span class="row__note">{{ row.note }}</span>
          </dd>
        </div>
      </dl>

      <div class="awards">
        <article v-reveal class="award">
          <p class="award__label mono">{{ t.specs.awardLabel }}</p>
          <p class="award__place">{{ t.specs.award.place }}</p>
          <h3 class="award__title">{{ t.specs.award.title }}</h3>
          <p class="award__meta">
            <span>{{ t.specs.award.meta }}</span>
            <span class="award__prize">{{ t.specs.award.prize }}</span>
          </p>
        </article>

        <div v-reveal="120" class="also">
          <p class="award__label mono">{{ t.specs.alsoLabel }}</p>
          <ul class="also__list">
            <li v-for="item in t.specs.also" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.specs {
  padding-block: var(--section-space);
}

.specs__head {
  position: relative;
}

.specs__title {
  margin-top: 1rem;
  max-width: 12em;
  font-size: var(--fs-3xl);
  font-weight: 700;
  letter-spacing: -0.04em;
}

.specs__drop {
  position: absolute;
  top: 20%;
  right: 8%;
  width: 1px;
  height: 1px;
}

/* ---------- строки ---------- */
.rows {
  margin-top: clamp(3rem, 8vh, 6rem);
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 2fr);
  gap: 1.5rem;
  padding-block: clamp(1.5rem, 3vh, 2.25rem);
  border-top: 1px solid var(--line-strong);
  transition: padding-left 0.5s var(--ease-out);
}

.row:last-child {
  border-bottom: 1px solid var(--line-strong);
}

.row__label {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-muted);
  transition: color var(--dur-med);
}

.row__value {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.row__main {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 0.9rem + 1.3vw, 2rem);
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.row__note {
  color: var(--text-muted);
}

@media (hover: hover) {
  .row:hover {
    padding-left: 0.75rem;
  }

  .row:hover .row__label {
    color: var(--accent);
  }
}

/* ---------- достижения ---------- */
.awards {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 1.25rem;
  margin-top: clamp(3rem, 8vh, 5rem);
}

.award,
.also {
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border-radius: var(--radius-lg);
}

.award {
  background: var(--light-text);
  color: #f3f2ee;
}

.award__label {
  color: var(--accent);
}

.award__place {
  margin-top: 1.25rem;
  font-family: var(--font-display);
  font-size: clamp(3rem, 2rem + 4vw, 6rem);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.04em;
  background: var(--chrome);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.award__title {
  margin-top: 1rem;
  max-width: 22em;
  font-size: var(--fs-xl);
  line-height: 1.25;
}

.award__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-top: 1.5rem;
  color: rgb(243 242 238 / 0.6);
}

.award__prize {
  color: var(--accent);
  font-weight: 600;
}

.also {
  box-shadow: inset 0 0 0 1px var(--line-strong);
}

.also__list {
  display: grid;
  gap: 0.9rem;
  margin-top: 1.25rem;
}

.also__list li {
  position: relative;
  padding-left: 1.25rem;
  font-weight: 500;
}

.also__list li::before {
  content: '';
  position: absolute;
  top: 0.6em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

@media (max-width: 800px) {
  .row,
  .awards {
    grid-template-columns: 1fr;
  }

  .row {
    gap: 0.5rem;
  }
}
</style>
