import { env } from "./env.mjs";

const config = {
  apiUrl: env.NEXT_PUBLIC_CORE_API_REST_URL,
  firebaseConfig: {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  },
};

export default config;
