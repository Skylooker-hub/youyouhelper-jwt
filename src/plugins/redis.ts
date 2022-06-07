import fastifyRedis from "@fastify/redis";
import fp from "fastify-plugin";

export default fp(async (fastify, opts) => {
  fastify.register(fastifyRedis, { host: "127.0.0.1", namespace: "verify_email" });
});
