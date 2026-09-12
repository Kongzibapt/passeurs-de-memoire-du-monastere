import { getSupabaseServer } from '../utils/supabase'
import { getMailer } from '../utils/mailer'
import { buildContactEmail } from '../utils/contactEmail'

interface Body {
  nom?: string
  email?: string
  sujet?: string
  message?: string
  /** Pot de miel : rempli seulement par un robot (voir SectionContact.vue). */
  site?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Les sujets proposés par le formulaire. Une valeur hors liste est refusée. */
const SUJETS = [
  'Un renseignement',
  "J'ai des photos ou des documents anciens",
  'Je veux adhérer ou aider',
  'Les événements et visites',
  'Autre',
]

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<Body>(event)

  // Pot de miel : un vrai visiteur ne voit pas ce champ, donc ne le remplit
  // jamais. On répond 200 sans rien faire — un robot qui reçoit une erreur
  // recommence, un robot qui croit avoir réussi passe au site suivant.
  if ((body?.site || '').trim()) return { ok: true, envoye: false, archive: false }

  const nom = (body?.nom || '').trim()
  const email = (body?.email || '').trim()
  const message = (body?.message || '').trim()
  const sujet = (body?.sujet || '').trim() || SUJETS[0]!

  if (!nom || !email || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: "Le nom, l'adresse e-mail et le message sont nécessaires.",
    })
  }
  if (!EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Adresse e-mail invalide.' })
  }
  if (message.length > 5000) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Message trop long.' })
  }
  if (!SUJETS.includes(sujet)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Sujet inconnu.' })
  }

  // --- Envoi de l'e-mail (canal principal) -------------------------------
  const mailer = getMailer()
  let envoye = false
  if (mailer) {
    const recuLe = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    }).format(new Date())

    const mail = buildContactEmail({ nom, email, sujet, message, recuLe })

    try {
      await mailer.sendMail({
        from: `"Site des Passeurs de Mémoire" <${config.smtpUser}>`,
        to: config.contactTo,
        replyTo: `"${nom}" <${email}>`,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      })
      envoye = true
    } catch (err) {
      console.error('[contact] envoi e-mail impossible :', (err as Error).message)
      throw createError({
        statusCode: 502,
        statusMessage: 'Bad Gateway',
        message: "Impossible d'envoyer le message pour le moment.",
      })
    }
  }

  // --- Archivage Supabase (secondaire, facultatif) -----------------------
  const supabase = getSupabaseServer()
  let archive = false
  if (supabase) {
    const { error } = await supabase.from('messages_contact').insert({
      nom,
      email,
      sujet,
      message,
      user_agent: getRequestHeader(event, 'user-agent') ?? null,
    })
    if (error) {
      console.error('[contact] archivage Supabase impossible :', error.message)
      // L'e-mail est parti : on ne fait pas échouer la requête pour autant.
      if (!envoye) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Internal Server Error',
          message: "Impossible d'enregistrer le message pour le moment.",
        })
      }
    } else {
      archive = true
    }
  }

  if (!envoye && !archive) {
    // Ni e-mail ni base : le message serait perdu sans que personne le sache.
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: "Le formulaire n'est pas encore configuré. Écrivez-nous directement par e-mail.",
    })
  }

  return { ok: true, envoye, archive }
})
