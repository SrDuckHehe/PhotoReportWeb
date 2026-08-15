import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { scryptSync, timingSafeEqual } from "node:crypto";

const SALT = "mugjFceD9L_2cC1r61uoQE39Hn54MQjr";
const USER_HASH = Buffer.from(
  "TGt3UqczMT00nM6N4bshCqq4e8EwkT_i1Ivvex3ede7oqPXRd4xzRVcJ1mD0qtFZR_YAIOJDuTCgTpZyaJEMWw",
  "base64url",
);
const PASS_HASH = Buffer.from(
  "qHFct78z8PBNmR71IX_OMRNOg8Zv3F4UWQ4NUux8YCwutOEKlZQDxKiVBjN6fD_96uRypwfSE6K-9ztCvgwZXA",
  "base64url",
);

const SESSION_NAME = "obrafoto_session";
const SESSION_SECRET = "ca7730a457f549d43d6535afb949849343271387db098ecab1c957af2b566b10";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type SessionData = { authed?: boolean };

const getSession = createServerOnlyFn(() =>
  useSession<SessionData>({
    name: SESSION_NAME,
    password: SESSION_SECRET,
    maxAge: SESSION_MAX_AGE,
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  }),
);

function verifyCredentials(username: string, password: string): boolean {
  const user = scryptSync(username, SALT, 64);
  const pass = scryptSync(password, SALT, 64);
  const userOk = user.length === USER_HASH.length && timingSafeEqual(user, USER_HASH);
  const passOk = pass.length === PASS_HASH.length && timingSafeEqual(pass, PASS_HASH);
  return userOk && passOk;
}

export const login = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { username: string; password: string })
  .handler(async ({ data }) => {
    if (!verifyCredentials(data.username, data.password)) {
      throw new Error("Credenciais invalidas");
    }
    const session = await getSession();
    await session.update({ authed: true });
    return { ok: true };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getSession();
  await session.clear();
  return { ok: true };
});

export const isAuthenticated = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  return session.data.authed === true;
});

export const requireAuth = createServerOnlyFn(async () => {
  const session = await getSession();
  if (session.data.authed !== true) {
    throw new Error("Nao autorizado");
  }
});
