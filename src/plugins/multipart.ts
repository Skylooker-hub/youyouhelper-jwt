import fastifyMutipart from '@fastify/multipart';
import fp from 'fastify-plugin';

export default fp(async (fastify, opts) => {
  fastify.register(fastifyMutipart, {
    attachFieldsToBody: true,
  })
})
