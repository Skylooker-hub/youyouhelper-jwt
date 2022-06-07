import fp from "fastify-plugin";
import fastifyAuth, { FastifyAuthFunction } from "@fastify/auth";
import fastifyJwt from "@fastify/jwt";
import * as bcrypt from "bcrypt";

declare module "fastify" {
  interface FastifyInstance {
    verifyUsernameAndPassword: FastifyAuthFunction;
    verifyJwt: FastifyAuthFunction;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string }; // payload type is used for signing and verifying
    user: { id: string }; // user type is return type of `request.user` object
  }
}

export default fp(async (fastify, opts) => {
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY is not defined");
  }

  fastify.register(fastifyAuth);

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_KEY,
  });

  fastify.decorate("verifyUsernameAndPassword", async function (request: any, reply: any) {
    const { username, password } = request.body;
    const user = await fastify.prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      return new Error("用户不存在");
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return new Error("用户名或密码错误");
    }
  });

  fastify.decorate("verifyJwt", async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
});
