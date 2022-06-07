import fp from "fastify-plugin";
import fastifySecureSession from "@fastify/secure-session";

declare module "@fastify/secure-session" {
  interface SessionData {
    verify_email_code: string;
    verify_email_expires: number;
    verify_email: string;
  }
}

export default fp(
  async (fastify, opts) => {
    if (!process.env.SESSION_KEY) {
      throw new Error("SESSION_KEY is not defined");
    }
    fastify.register(fastifySecureSession, {
      key: Buffer.from(process.env.SESSION_KEY, "hex"),
      cookie: {
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        path: "/",
      },
      cookieName: "Sess",
    });
  },
  {
    name: "session",
  }
);
