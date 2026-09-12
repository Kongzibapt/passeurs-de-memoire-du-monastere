import nodemailer, { type Transporter } from 'nodemailer'

let transporter: Transporter | null = null

/**
 * Transporteur Nodemailer configuré pour le SMTP de Gmail, ou `null` quand les
 * identifiants ne sont pas définis (le site tourne alors sans e-mail : le
 * formulaire archive dans Supabase, ou renvoie l'adresse directe).
 *
 * Nécessite un « mot de passe d'application » Google (Compte Google →
 * Sécurité → Validation en 2 étapes → Mots de passe des applications). Le mot
 * de passe habituel du compte ne fonctionne pas en SMTP.
 */
export function getMailer(): Transporter | null {
  if (transporter) return transporter

  const config = useRuntimeConfig()
  const user = config.smtpUser
  const pass = config.smtpPass
  if (!user || !pass) return null

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })
  return transporter
}
