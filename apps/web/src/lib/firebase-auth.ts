import "./firebase";

import type { OAuthCredential } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential as signInFbWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";

import config from "@/config/client";

const auth = getAuth();

export const register = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return userCredential.user;
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  } catch (ex) {
    console.error(ex);
    return null;
  }
};

export const signInWithCredential = async (credential: OAuthCredential) => {
  const userCredential = await signInFbWithCredential(auth, credential);
  return userCredential.user;
};

export const getUser = () => {
  return getAuth().currentUser;
};

export const getIdToken = () => {
  return auth.currentUser?.getIdToken();
};

export const createCredentialFromIdToken = (idToken: string) => {
  return GoogleAuthProvider.credential(idToken);
};

interface IRefreshTokensResponse {
  refresh_token: string;
  access_token: string;
  expires_in: string;
  token_type: string;
  project_id: string;
  id_token: string;
  user_id: string;
}

/**
 * Exchanges refreshToken for an idToken by calling Firebase REST API. Also, returns accessToken.
 * https://firebase.google.com/docs/reference/rest/auth#section-refresh-token
 */
export const refreshTokens = async (refreshToken: string) => {
  try {
    const url = `https://securetoken.googleapis.com/v1/token?key=${encodeURI(
      config.firebaseConfig.apiKey,
    )}`;

    const response = await fetch(url, {
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      method: "POST",
    });
    const responseData = await response.json();

    if (!response.ok) {
      throw responseData;
    }

    const refreshResult = responseData as IRefreshTokensResponse;

    return {
      idToken: refreshResult.id_token,
      idTokenExpiresAt: new Date(
        Date.now() + parseInt(refreshResult.expires_in, 10) * 1000,
      ).toISOString(),
      refreshToken: refreshResult.refresh_token,
    };
  } catch (err) {
    console.error("tokens refresh error:", err);
    throw new Error("Tokens refresh error.");
  }
};
