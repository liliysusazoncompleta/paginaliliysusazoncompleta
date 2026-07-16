import dotenv from 'dotenv';

dotenv.config();

const required = ['DATABASE_URL'] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

// Origenes permitidos por CORS. En produccion (GitHub Pages + backend en la nube)
// se configura con la variable FRONTEND_URL (uno o varios, separados por coma).
// Si no se define, se usan estos por defecto (dev local + GitHub Pages del proyecto).
const defaultFrontendUrls = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://liliysusazoncompleta.github.io',
];

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL as string,
  // Postgres en la nube (Render, Neon, Supabase, Railway, etc.) casi siempre exige SSL.
  // DATABASE_SSL=true lo activa explicitamente; tambien se activa solo si el host no es localhost.
  databaseSsl:
    process.env.DATABASE_SSL === 'true' ||
    (process.env.DATABASE_SSL !== 'false' &&
      !!process.env.DATABASE_URL &&
      !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)),
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  openAiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  whatsappPhone: process.env.WHATSAPP_PHONE ?? '573177719249',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  frontendUrls: (process.env.FRONTEND_URL ?? defaultFrontendUrls.join(','))
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 2525),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  contactToEmail: process.env.CONTACT_TO_EMAIL ?? 'liliysusazoncompleto@gmail.com',
  contactFromEmail: process.env.CONTACT_FROM_EMAIL ?? 'Lili y su Sazon Completa <no-reply@liliysusazoncompleta.com>',

  // Datos del negocio impresos en la factura (backend/src/services/pdf.ts).
  businessNit: process.env.BUSINESS_NIT ?? '43.089.544-4',
  businessRegimen: process.env.BUSINESS_REGIMEN ?? 'Regimen Simplificado',
  businessPhoneFixed: process.env.BUSINESS_PHONE_FIXED ?? '(604) 5955045',
  businessCity: process.env.BUSINESS_CITY ?? 'Medellin - Ant.',
  businessAddress: process.env.BUSINESS_ADDRESS ?? 'Calle 112 # 51A-15, Medellin, Antioquia, Colombia',
  instagramHandle: process.env.INSTAGRAM_HANDLE ?? '@liliysusazoncompleta',

  // Datos de la cuenta para pagos, impresos en la factura.
  bankName: process.env.BANK_NAME ?? 'Bancolombia',
  bankAccountType: process.env.BANK_ACCOUNT_TYPE ?? 'Cuenta de Ahorros',
  bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER ?? '25300003634',
  bankAccountHolder: process.env.BANK_ACCOUNT_HOLDER ?? 'CRUZ MARIA VALENCIA',
  bankAccountHolderId: process.env.BANK_ACCOUNT_HOLDER_ID ?? '43089544',
  paymentDepositNote: process.env.PAYMENT_DEPOSIT_NOTE ?? 'Transfiere el 50% para confirmar tu pedido',
  advisorConfirmationNote:
    process.env.ADVISOR_CONFIRMATION_NOTE ??
    'Nuestros asesores se comunicaran para confirmar tu pedido al numero registrado.',
  deliveryNoticeNote:
    process.env.DELIVERY_NOTICE_NOTE ??
    'El valor del domicilio sera notificado en la factura enviada por Lili y su Sazon Completa.',
};
