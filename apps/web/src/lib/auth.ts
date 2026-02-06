import type { User as FbUser } from "firebase/auth";
import type { JwtPayload } from "jwt-decode";
import { jwtDecode } from "jwt-decode";
import type { Account, AuthOptions, User } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { Provider } from "next-auth/providers/index";

import config from "@/config/server";
import type { UserResponseDto } from "@/generated/model";
import { UpdateRolesRequestDtoRolesItem } from "@/generated/model";
import api from "@/lib/api";
import {
  createCredentialFromIdToken,
  getUser,
  refreshTokens,
  signIn,
  signInWithCredential,
} from "@/lib/firebase-auth";

type JwtWithUser = JwtPayload & {
  roles: string[];
  userId: number;
};

const providers: Provider[] = [
  CredentialsProvider({
    async authorize(credentials) {
      // You need to provide your own logic here that takes the credentials
      // submitted and returns either a object representing a user or value
      // that is false/null if the credentials are invalid.
      // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
      // You can also use the `req` object to obtain additional parameters
      // (i.e., the request IP address)

      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const fbUser = await signIn(credentials.email, credentials.password);

      if (!fbUser) {
        return null;
      }

      const authorisedUser = getAuthorisedUserFromFbUser(fbUser);
      return authorisedUser;
    },
    credentials: {
      email: {
        label: "Email",
        placeholder: "jsmith@email.com",
        type: "email",
      },
      password: { label: "Password", type: "password" },
    },
    name: "Credentials",
  }),
];

if (config.googleAuth.clientId && config.googleAuth.clientSecret) {
  providers.push(
    GoogleProvider({
      clientId: config.googleAuth.clientId,
      clientSecret: config.googleAuth.clientSecret,
    }),
  );
}

/** Returns ISO date when token expires */
function getIdTokenExpiration(exp: number | undefined): string | undefined {
  if (!exp) {
    return;
  }

  return new Date(exp * 1000).toISOString();
}

async function getAuthorisedUserFromFbUser(fbUser: FbUser): Promise<User> {
  const idToken = await fbUser.getIdToken();

  const idTokenDecoded = jwtDecode<JwtWithUser>(idToken);

  // For new users, userId won't be in the token yet (set after auto-provisioning)
  // We use the Firebase UID as a temporary placeholder; the actual userId
  // will be resolved when getSessionUser triggers auto-provisioning
  const authorisedUser: User = {
    email: fbUser.email,
    emailVerified: fbUser.emailVerified,
    firebaseId: fbUser.uid,
    id: idTokenDecoded.userId ?? fbUser.uid,
    idToken,
    idTokenExpiresAt: getIdTokenExpiration(idTokenDecoded.exp),
    refreshToken: fbUser.refreshToken,
    roles: (idTokenDecoded.roles || []).filter(
      (r): r is UpdateRolesRequestDtoRolesItem =>
        Object.values(UpdateRolesRequestDtoRolesItem).includes(
          r as UpdateRolesRequestDtoRolesItem,
        ),
    ),
  };
  return authorisedUser;
}

async function getAuthorisedUserForProvider(
  account: Account,
  user: User | AdapterUser,
): Promise<User | undefined> {
  if (account.provider === "credentials") {
    return user as User;
  } else if (account.provider === "google" && account.id_token) {
    // Any object returned will be saved in `user` property of the JWT
    // If you return null then an error will be displayed advising the user to check their details.
    // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
    try {
      const credential = createCredentialFromIdToken(account.id_token);
      const fbUser = await signInWithCredential(credential);
      return await getAuthorisedUserFromFbUser(fbUser);
    } catch (ex) {
      console.error(ex);
      throw new Error("Google login error.");
    }
  }
}

async function getSessionUser(idToken: string): Promise<UserResponseDto> {
  // Fetches the current user based on the Bearer token
  // For new users, this triggers auto-provisioning in the API middleware
  const { data } = await api<UserResponseDto>({
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    method: "get",
    url: `/v1/users/me`,
  });

  return data;
}

export const authOptions: AuthOptions = {
  callbacks: {
    async jwt({ account, token, trigger, user }) {
      let authorisedUser: User | undefined;

      if (account && user) {
        // is initial sign in
        authorisedUser = await getAuthorisedUserForProvider(account, user);
      }

      if (trigger === "update") {
        const fbUser = getUser();
        if (fbUser) {
          await fbUser.reload();
          authorisedUser = await getAuthorisedUserFromFbUser(fbUser);
        }

        if (token.idToken && token.sessionUser?.id) {
          token.sessionUser = await getSessionUser(token.idToken);
        }
      }

      if (authorisedUser && authorisedUser.idToken) {
        token.idToken = authorisedUser.idToken;
        token.idTokenExpiresAt = authorisedUser.idTokenExpiresAt;
        token.refreshToken = authorisedUser.refreshToken;
        token.sessionUser = await getSessionUser(token.idToken);
      }

      // refresh idToken 10 mins before it expires
      // (user will be signed out if refresh fail)
      const refreshBeforeExpiryMs = 10 * 60 * 1000;
      if (
        token.idTokenExpiresAt &&
        token.refreshToken &&
        new Date(token.idTokenExpiresAt).getTime() - refreshBeforeExpiryMs <=
          Date.now()
      ) {
        const refreshResult = await refreshTokens(token.refreshToken);

        token.idToken = refreshResult.idToken;
        token.idTokenExpiresAt = refreshResult.idTokenExpiresAt;
        token.refreshToken = refreshResult.refreshToken;
      }

      return token;
    },
    async redirect({ baseUrl, url }) {
      return url.startsWith(baseUrl) ? url : `${baseUrl}${url}`;
    },
    async session({ session, token }) {
      session.user = token.sessionUser;
      session.idToken = token.idToken;
      session.idTokenExpiresAt = token.idTokenExpiresAt;
      return session;
    },
    async signIn() {
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  providers,
  session: {
    strategy: "jwt",
  },
};
