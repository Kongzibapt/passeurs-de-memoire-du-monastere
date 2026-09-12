<script setup lang="ts">
import type { Archive } from '#shared/archives'

/**
 * Gestion du fonds d'archives.
 *
 * Les images ne sont pas téléversées ici : on saisit leur chemin. Les fichiers
 * du fonds vivent dans `public/img/`, versionnés avec le site — un document
 * d'archives est un objet qu'on garde, pas un contenu jetable, et le
 * versionner évite qu'il disparaisse avec un compte de stockage.
 */
definePageMeta({ middleware: 'admin' })

useHead({ title: 'Archives — Back-office' })

const { data: archives, refresh } = await useAsyncData('admin-archives', () =>
  useRequestFetch()<Archive[]>('/api/admin/archives'),
)

const vide = (): Archive => ({ id: '', src: '', alt: '', titre: '', legende: '', ordre: 0, source: 'db' })

const brouillon = ref<Archive>(vide())
const edition = ref(false)
const message = ref('')
const erreur = ref('')
const enregistrement = ref(false)

function nouveau() {
  brouillon.value = vide()
  // Le nouveau document se pose au-dessus du tas existant.
  brouillon.value.ordre = Math.max(0, ...(archives.value ?? []).map((a) => a.ordre)) + 1
  edition.value = true
  message.value = ''
  erreur.value = ''
}

function editer(a: Archive) {
  brouillon.value = { ...a }
  edition.value = true
  message.value = ''
  erreur.value = ''
}

async function enregistrer() {
  enregistrement.value = true
  erreur.value = ''
  message.value = ''
  try {
    const corps = {
      src: brouillon.value.src.trim(),
      alt: brouillon.value.alt.trim(),
      titre: brouillon.value.titre.trim(),
      legende: brouillon.value.legende.trim(),
      ordre: Number(brouillon.value.ordre) || 0,
    }
    const enBase = brouillon.value.id && !brouillon.value.id.startsWith('seed:')
    if (enBase) {
      await $fetch(`/api/admin/archives/${brouillon.value.id}`, { method: 'PATCH', body: corps })
    } else {
      await $fetch('/api/admin/archives', { method: 'POST', body: corps })
    }
    message.value = 'Enregistré.'
    edition.value = false
    await refresh()
  } catch (e: unknown) {
    erreur.value = (e as { statusMessage?: string })?.statusMessage || 'Enregistrement impossible.'
  } finally {
    enregistrement.value = false
  }
}

async function supprimer(a: Archive) {
  if (!confirm(`Retirer « ${a.titre} » du fonds affiché ?`)) return
  erreur.value = ''
  try {
    await $fetch(`/api/admin/archives/${a.id}`, { method: 'DELETE' })
    message.value = 'Retiré.'
    await refresh()
  } catch (e: unknown) {
    erreur.value = (e as { statusMessage?: string })?.statusMessage || 'Suppression impossible.'
  }
}

const champ =
  'mt-1 w-full border border-black/15 bg-white px-3 py-2 text-[14px] outline-none focus:border-clay-500'
const etiquette = 'block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600'
</script>

<template>
  <AdminShell titre="Archives">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-[26px] font-bold tracking-tight">Archives</h1>
        <p class="mt-1 max-w-[65ch] text-[14px] text-slate-600">
          Le fonds affiché dans « Ce que les greniers ont conservé ». Les six premiers documents
          occupent les emplacements dessinés ; au-delà, la composition se répète.
        </p>
      </div>
      <button
        type="button"
        class="bg-clay-600 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-clay-700"
        @click="nouveau"
      >
        + Nouveau document
      </button>
    </div>

    <p v-if="message" class="mt-5 border-l-4 border-sage-500 bg-sage-100 px-4 py-3 text-[14px] text-sage-700">
      {{ message }}
    </p>
    <p v-if="erreur" class="mt-5 border-l-4 border-[#A23A2A] bg-[#F2D9D3] px-4 py-3 text-[14px] text-[#A23A2A]">
      {{ erreur }}
    </p>

    <form v-if="edition" class="mt-7 border border-black/10 bg-white p-6" @submit.prevent="enregistrer">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label :class="etiquette" for="a-src">Chemin de l'image</label>
          <input id="a-src" v-model="brouillon.src" :class="champ" required placeholder="/img/archive-pont.jpg">
          <p class="mt-1 text-[12px] text-slate-500">
            Déposer le fichier dans <code class="font-mono">public/img/</code> du dépôt, puis
            indiquer ici son chemin depuis la racine du site.
          </p>
        </div>
        <div>
          <label :class="etiquette" for="a-titre">Titre (en gras dans la légende)</label>
          <input id="a-titre" v-model="brouillon.titre" :class="champ" required>
        </div>
        <div>
          <label :class="etiquette" for="a-ordre">Ordre d'affichage</label>
          <input id="a-ordre" v-model.number="brouillon.ordre" type="number" :class="champ">
        </div>
        <div class="sm:col-span-2">
          <label :class="etiquette" for="a-leg">Suite de la légende</label>
          <input id="a-leg" v-model="brouillon.legende" :class="champ" placeholder="· imp. Carrère, Rodez">
          <p class="mt-1 text-[12px] text-slate-500">
            Elle s'affiche sous le titre : commencer par « · » comme les autres documents.
          </p>
        </div>
        <div class="sm:col-span-2">
          <label :class="etiquette" for="a-alt">Description de l'image (texte alternatif)</label>
          <input id="a-alt" v-model="brouillon.alt" :class="champ">
          <p class="mt-1 text-[12px] text-slate-500">
            Ce que montre l'image, pour qui ne la voit pas : « Carte postale ancienne : le vieux
            pont du Monastère ».
          </p>
        </div>
      </div>

      <div class="mt-7 flex flex-wrap gap-3 border-t border-black/10 pt-6">
        <button
          type="submit"
          class="bg-clay-600 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-clay-700 disabled:opacity-50"
          :disabled="enregistrement"
        >
          {{ enregistrement ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        <button type="button" class="border border-black/20 px-5 py-2.5 text-[14px] font-semibold" @click="edition = false">
          Annuler
        </button>
      </div>
    </form>

    <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <figure v-for="a in archives" :key="a.id" class="border border-black/10 bg-white p-3">
        <img :src="a.src" :alt="a.alt" class="aspect-[4/3] w-full object-cover" loading="lazy">
        <figcaption class="mt-3">
          <div class="font-display text-[14px] font-bold">{{ a.titre }}</div>
          <div class="font-accent text-[13px] italic text-slate-600">{{ a.legende }}</div>
          <div class="mt-3 flex items-center gap-3 text-[13px]">
            <span class="text-slate-400">#{{ a.ordre }}</span>
            <button type="button" class="font-semibold text-clay-700" @click="editer(a)">Modifier</button>
            <button
              v-if="a.source === 'db'"
              type="button"
              class="font-semibold text-[#A23A2A]"
              @click="supprimer(a)"
            >
              Retirer
            </button>
            <span v-else class="text-[11px] uppercase tracking-[0.1em] text-slate-400">Dans le code</span>
          </div>
        </figcaption>
      </figure>
    </div>
  </AdminShell>
</template>
