import { defineStore } from 'pinia'

export interface ContactPayload {
  nom: string
  email: string
  sujet: string
  message: string
  /** Pot de miel : laissé vide par un visiteur, rempli par un robot. */
  site?: string
}

type Etat = 'repos' | 'envoi' | 'succes' | 'erreur'

/**
 * État du formulaire de contact.
 *
 * Le store vit hors du composant pour que l'issue d'un envoi survive à la
 * navigation : un visiteur qui écrit depuis l'accueil, puis va voir les
 * actualités et revient, retrouve la confirmation plutôt qu'un formulaire vide
 * qui laisserait croire que rien n'est parti.
 */
export const useContactStore = defineStore('contact', {
  state: () => ({
    etat: 'repos' as Etat,
    erreur: '' as string,
  }),
  getters: {
    enCours: (s) => s.etat === 'envoi',
    reussi: (s) => s.etat === 'succes',
  },
  actions: {
    reinitialiser() {
      this.etat = 'repos'
      this.erreur = ''
    },
    async envoyer(payload: ContactPayload) {
      this.etat = 'envoi'
      this.erreur = ''
      try {
        await $fetch('/api/contact', { method: 'POST', body: payload })
        this.etat = 'succes'
        return true
      } catch (e: unknown) {
        this.etat = 'erreur'
        this.erreur =
          (e as { data?: { message?: string } })?.data?.message ||
          'Une erreur est survenue. Réessayez, ou écrivez-nous directement par e-mail.'
        return false
      }
    },
  },
})
