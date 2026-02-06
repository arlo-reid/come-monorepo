import "server-only";

import config from "@/config/server";

export const token = config.sanity.readToken;

const getToken = () => {
  if (!token || token === "replace_me") {
    throw new Error("Missing SANITY_API_READ_TOKEN");
  }
  return token;
};

export { getToken };
