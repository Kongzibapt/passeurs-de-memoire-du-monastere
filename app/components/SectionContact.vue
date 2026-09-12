<script setup lang="ts">
import { ASSOCIATION } from '#shared/association'
import { useContactStore } from '~/stores/contact'

/**
 * « Une question, une photo, une histoire ».
 *
 * La maquette envoyait le formulaire en `mailto:` — ce qui n'aboutit que si le
 * visiteur a un client de messagerie configuré, et perd le message sinon. Ici
 * la soumission part vers `/api/contact`, qui expédie l'e-mail depuis le
 * serveur et archive une copie dans Supabase.
 */
const SUJETS = [
  'Un renseignement',
  "J'ai des photos ou des documents anciens",
  'Je veux adhérer ou aider',
  'Les événements et visites',
  'Autre',
]

const contact = useContactStore()

const formulaire = reactive({
  nom: '',
  email: '',
  sujet: SUJETS[0]!,
  message: '',
  // Pot de miel : ce champ est masqué aux visiteurs (voir le style en ligne
  // ci-dessous). Un robot qui remplit tout ce qu'il trouve le remplira aussi,
  // et le serveur écartera silencieusement l'envoi.
  site: '',
})

async function soumettre() {
  const ok = await contact.envoyer({ ...formulaire })
  if (!ok) return
  formulaire.nom = ''
  formulaire.email = ''
  formulaire.sujet = SUJETS[0]!
  formulaire.message = ''
}
</script>

<template>
  <section id="contact-form" class="contact pad">
    <div class="sec-head">
      <div class="t-eyebrow">Comment nous joindre ?</div>
      <h2>Une question, une photo, une histoire</h2>
      <p>
        Vous cherchez un renseignement, vous avez un document ancien ou vous voulez donner un coup
        de main : écrivez-nous, nous répondons à chaque message.
      </p>
    </div>

    <form class="cform" novalidate @submit.prevent="soumettre">
      <div class="field">
        <label for="nom">Nom et prénom</label>
        <input id="nom" v-model="formulaire.nom" type="text" name="nom" autocomplete="name" required>
      </div>

      <div class="field">
        <label for="mail">Adresse e-mail</label>
        <input id="mail" v-model="formulaire.email" type="email" name="email" autocomplete="email" required>
      </div>

      <div class="field full">
        <label for="sujet">Sujet</label>
        <select id="sujet" v-model="formulaire.sujet" name="sujet">
          <option v-for="sujet in SUJETS" :key="sujet">{{ sujet }}</option>
        </select>
      </div>

      <div class="field full">
        <label for="msg">Votre message</label>
        <textarea id="msg" v-model="formulaire.message" name="message" maxlength="5000" required />
      </div>

      <!-- Pot de miel. `aria-hidden` + `tabindex="-1"` le retirent du parcours
           au clavier et des lecteurs d'écran : seuls les robots le voient. -->
      <div aria-hidden="true" style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden">
        <label for="site">Ne remplissez pas ce champ</label>
        <input id="site" v-model="formulaire.site" type="text" name="site" tabindex="-1" autocomplete="off">
      </div>

      <p v-if="contact.reussi" class="retour ok" role="status">
        Merci, votre message est parti. Nous vous répondons rapidement.
      </p>
      <p v-else-if="contact.etat === 'erreur'" class="retour ko" role="alert">
        {{ contact.erreur }}
      </p>

      <div class="full" style="display: flex; gap: var(--sp-4); align-items: center; flex-wrap: wrap">
        <button class="btn btn-lg btn-primary" type="submit" :disabled="contact.enCours">
          {{ contact.enCours ? 'Envoi en cours…' : 'Envoyer le message' }}
        </button>
        <span class="note">
          Ou directement : <a :href="`mailto:${ASSOCIATION.email}`">{{ ASSOCIATION.email }}</a>
        </span>
      </div>
    </form>
  </section>
</template>
