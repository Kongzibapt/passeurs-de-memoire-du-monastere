/**
 * Construit l'e-mail de notification du formulaire de contact.
 *
 * Le HTML est volontairement à l'ancienne — tableaux + styles en ligne — parce
 * que les clients de messagerie (Gmail, Outlook, Apple Mail) suppriment les
 * blocs <style>, ignorent flexbox et la plupart du CSS moderne. Les couleurs
 * reprennent les jetons de la charte (tokens.css).
 */

const MARQUE = {
  ardoise: '#1E2E36',
  terre: '#AC683A',
  terreSombre: '#663C25',
  creme: '#FCF0E1',
  papier: '#FFFFFF',
  sourdine: '#6C8590',
  filet: '#DFD8CB',
  corps: '#2E4450',
}

const POLICE = "Georgia, 'Times New Roman', serif"
const POLICE_UI = "'Helvetica Neue', Helvetica, Arial, sans-serif"

const echapper = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )

export interface ContactEmailInput {
  nom: string
  email: string
  sujet: string
  message: string
  /** Horodatage déjà mis en forme pour l'affichage. */
  recuLe: string
}

export function buildContactEmail(input: ContactEmailInput) {
  const nom = echapper(input.nom)
  const email = echapper(input.email)
  const sujet = echapper(input.sujet)
  const messageHtml = echapper(input.message).replace(/\n/g, '<br>')
  const recuLe = echapper(input.recuLe)

  const subject = `Site — ${input.sujet} — ${input.nom}`

  const preheader = `${input.nom} vous a écrit depuis le site : ${input.message.slice(0, 90)}`

  const text =
    `LES PASSEURS DE MÉMOIRE DU MONASTÈRE — nouveau message du site\n\n` +
    `Nom     : ${input.nom}\n` +
    `E-mail  : ${input.email}\n` +
    `Sujet   : ${input.sujet}\n` +
    `Reçu le : ${input.recuLe}\n\n` +
    `Message :\n${input.message}\n\n` +
    `— Répondre directement à cet e-mail écrira à ${input.email}.`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:${MARQUE.creme};font-family:${POLICE_UI};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${MARQUE.creme};">${echapper(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MARQUE.creme};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${MARQUE.papier};border:1px solid ${MARQUE.filet};">

          <!-- en-tête -->
          <tr>
            <td style="background:${MARQUE.ardoise};padding:26px 34px;">
              <div style="font-size:13px;font-weight:700;letter-spacing:.16em;color:#ffffff;text-transform:uppercase;line-height:1.3;">
                Les&nbsp;Passeurs&nbsp;de&nbsp;Mémoire
              </div>
              <div style="font-family:${POLICE};font-style:italic;font-size:15px;color:#cbd6db;margin-top:4px;">
                du Monastère
              </div>
            </td>
          </tr>

          <!-- titre -->
          <tr>
            <td style="padding:34px 34px 6px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:.18em;color:${MARQUE.terre};text-transform:uppercase;">
                Formulaire de contact
              </div>
              <div style="font-size:25px;font-weight:700;letter-spacing:-.02em;color:${MARQUE.ardoise};margin-top:8px;line-height:1.2;">
                ${nom} vous a écrit.
              </div>
            </td>
          </tr>

          <!-- métadonnées -->
          <tr>
            <td style="padding:20px 34px 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${MARQUE.filet};">
                <tr>
                  <td style="padding:15px 18px;border-bottom:1px solid ${MARQUE.filet};">
                    <div style="font-size:10px;font-weight:700;letter-spacing:.14em;color:${MARQUE.sourdine};text-transform:uppercase;">Nom</div>
                    <div style="font-size:16px;font-weight:600;color:${MARQUE.ardoise};margin-top:3px;">${nom}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px 18px;border-bottom:1px solid ${MARQUE.filet};">
                    <div style="font-size:10px;font-weight:700;letter-spacing:.14em;color:${MARQUE.sourdine};text-transform:uppercase;">E-mail</div>
                    <div style="font-size:16px;font-weight:600;margin-top:3px;">
                      <a href="mailto:${email}" style="color:${MARQUE.terre};text-decoration:none;">${email}</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px 18px;border-bottom:1px solid ${MARQUE.filet};">
                    <div style="font-size:10px;font-weight:700;letter-spacing:.14em;color:${MARQUE.sourdine};text-transform:uppercase;">Sujet</div>
                    <div style="font-size:16px;font-weight:600;color:${MARQUE.ardoise};margin-top:3px;">${sujet}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px 18px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:.14em;color:${MARQUE.sourdine};text-transform:uppercase;">Reçu le</div>
                    <div style="font-size:16px;font-weight:600;color:${MARQUE.ardoise};margin-top:3px;">${recuLe}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- message -->
          <tr>
            <td style="padding:24px 34px 8px;">
              <div style="font-size:10px;font-weight:700;letter-spacing:.14em;color:${MARQUE.sourdine};text-transform:uppercase;margin-bottom:10px;">Message</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-left:3px solid ${MARQUE.terre};background:#FAF6F0;padding:18px 22px;font-size:16px;line-height:1.6;color:${MARQUE.corps};">
                    ${messageHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- bouton de réponse -->
          <tr>
            <td style="padding:24px 34px 34px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${MARQUE.terre};">
                    <a href="mailto:${email}?subject=${encodeURIComponent('Re: votre message aux Passeurs de Mémoire du Monastère')}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Répondre à ${nom}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- pied -->
          <tr>
            <td style="background:${MARQUE.ardoise};padding:20px 34px;">
              <div style="font-size:12px;color:#9fb1b9;letter-spacing:.02em;line-height:1.5;">
                Envoyé automatiquement depuis le site des Passeurs de Mémoire du Monastère.<br>
                Répondez à cet e-mail pour écrire directement à ${nom}.
              </div>
            </td>
          </tr>

        </table>
        <div style="font-family:${POLICE};font-style:italic;font-size:13px;color:${MARQUE.terreSombre};margin-top:18px;">
          « Chaque pierre du Monastère porte une voix. »
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, text, html }
}
