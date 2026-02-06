import { getApps, initializeApp } from "firebase/app";

import config from "@/config/client";

if (config.firebaseConfig && !getApps().length) {
  initializeApp(config.firebaseConfig);
}
