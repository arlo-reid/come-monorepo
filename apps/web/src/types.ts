import { Icons } from "./components/shared/icons";
import { UpdateRolesRequestDtoRolesItem as UserRolesItem, UserResponseDto as AppUser } from './generated/model';
import type {
  QueryBlogSlugPageDataResult,
  QueryHomePageDataResult,
  QueryImageTypeResult,
} from "./lib/sanity/sanity.types";

export type PageBuilderBlockTypes = NonNullable<
  NonNullable<QueryHomePageDataResult>["pageBuilder"]
>[number]["_type"];

export type PagebuilderType<T extends PageBuilderBlockTypes> = Extract<
  NonNullable<NonNullable<QueryHomePageDataResult>["pageBuilder"]>[number],
  { _type: T }
>;

export type SanityButtonProps = NonNullable<
  NonNullable<PagebuilderType<"hero">>["buttons"]
>[number];

// export type SanityImageProps = Extract<
//   NonNullable<QueryImageTypeResult>,
//   { alt: string; blurData: string | null; dominantColor: string | null }
// >;
export type SanityImageProps = NonNullable<QueryImageTypeResult>;

export type SanityRichTextProps =
  NonNullable<QueryBlogSlugPageDataResult>["richText"];

export type SanityRichTextBlock = Extract<
  NonNullable<NonNullable<SanityRichTextProps>[number]>,
  { _type: "block" }
>;

export type Maybe<T> = T | null | undefined;

export type NavItem = {
  disabled?: boolean;
  title: string;
  href: string;
};

export type MainNavItem = NavItem;

export type SidebarNavItem = {
  icon?: keyof typeof Icons;
  disabled?: boolean;
  external?: boolean;
  title: string;
} & (
  | {
      items?: never;
      href: string;
    }
  | {
      items: NavItem[];
      href?: string;
    }
);

export type DashboardConfig = {
  sidebarNav: SidebarNavItem[];
  mainNav: MainNavItem[];
};

declare module "next-auth" {
  interface Session {
    idTokenExpiresAt?: string;
    idToken?: string;
    user?: AppUser;
  }

  interface User {
    idTokenExpiresAt?: string;
    emailVerified: boolean;
    email?: string | null;
    refreshToken: string;
    firebaseId: string;
    roles: UserRolesItem[];
    idToken?: string;
    id: number;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    idTokenExpiresAt?: string;
    refreshToken?: string;
    sessionUser?: AppUser;
    idToken?: string;
  }
}
