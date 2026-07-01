import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('=== EMAIL SIMULÉ ===');
      console.log(`À: ${to}`);
      console.log(`Sujet: ${subject}`);
      console.log(`Contenu: ${html.substring(0, 200)}...`);
      console.log('====================');
      return { success: true, data: { id: 'simulated' } };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"RestoDirect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès à:', to);
    return { success: true, data: { id: Date.now().toString() } };
  } catch (error: any) {
    console.error('Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
}

export function generateInvitationEmail(type: 'RESTAURANT' | 'LIVREUR', token: string, restaurantName?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const activationLink = `${baseUrl}/invite/${token}`;
  
  if (type === 'RESTAURANT') {
    return {
      subject: 'Activez votre compte RestoDirect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f97316;">Bienvenue sur RestoDirect !</h1>
          <p>Votre compte restaurateur a été créé par notre équipe.</p>
          <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le lien ci-dessous :</p>
          <a href="${activationLink}" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Activer mon compte
          </a>
          <p style="color: #666; font-size: 12px;">Ce lien expire dans 48 heures.</p>
          <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé cette inscription, ignorez cet email.</p>
        </div>
      `,
    };
  } else {
    return {
      subject: `Invitation à devenir livreur pour ${restaurantName || 'un restaurant'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f97316;">Invitation RestoDirect</h1>
          <p>Un restaurateur vous invite à rejoindre son équipe de livreurs sur RestoDirect.</p>
          <p>Pour créer votre compte et définir votre mot de passe, cliquez sur le lien ci-dessous :</p>
          <a href="${activationLink}" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Créer mon compte livreur
          </a>
          <p style="color: #666; font-size: 12px;">Ce lien expire dans 48 heures.</p>
          <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé cette invitation, ignorez cet email.</p>
        </div>
      `,
    };
  }
}

export function generateOrderConfirmationEmail(orderNumber: string, trackingUrl: string) {
  return {
    subject: `Confirmation de votre commande #${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Merci pour votre commande !</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Votre commande <strong style="color: #f97316;">#${orderNumber}</strong> a été reçue et est en cours de traitement.
          </p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Vous pouvez suivre l'avancement de votre commande en temps réel :
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" style="display: inline-block; background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Suivre ma commande
            </a>
          </div>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>Que se passe-t-il maintenant ?</strong><br/>
              1. Le restaurant va préparer votre commande<br/>
              2. Un livreur sera assigné<br/>
              3. Vous recevrez une notification quand la commande sera en route<br/>
              4. Confirmez la réception une fois livrée
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
            Si vous n'avez pas passé cette commande, ignorez cet email.
          </p>
        </div>
      </div>
    `,
  };
}