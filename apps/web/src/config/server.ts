import { env } from "./env.mjs";

const config = {
  googleAuth: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  email: {
    mailersendApiKey: env.MAILERSEND_API_KEY,
    fromEmail: env.FROM_EMAIL,
    supportEmail: env.SUPPORT_EMAIL,
  },
  sanity: { readToken: env.SANITY_API_READ_TOKEN },
};

export default config;
