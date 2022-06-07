import fp from "fastify-plugin";
import swagger from "@fastify/swagger";

export default fp(async (fastify, opts) => {
  fastify.register(swagger, {
    routePrefix: "/swagger-doc",
    swagger: {
      info: {
        title: "SwaggerDoc",
        description: "Fastify swagger API",
        version: "0.1.0",
      },
      externalDocs: {
        url: "https://swagger.io",
        description: "Find more info here",
      },
      host: "127.0.0.1:7001",
      schemes: ["http"],
      consumes: ["application/json", "multipart/form-data"],
      produces: ["application/json"],
      tags: [{ name: "user", description: "用户相关接口" }],
      // definitions: {
      //   User: {
      //     type: "object",
      //     required: ["id", "email"],
      //     properties: {
      //       id: { type: "string", format: "uuid" },
      //       firstName: { type: "string" },
      //       lastName: { type: "string" },
      //       email: { type: "string", format: "email" },
      //     },
      //   },
      // },
      securityDefinitions: {
        Bearer: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
        },
      },
      security: [{ Bearer: [] }],
    },
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        if (process.env.NODE_ENV === "dev") {
          next();
        } else {
          next(fastify.httpErrors.forbidden("你没有访问权限！"));
        }
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    // staticCSP: true,
    // transformStaticCSP: header => header,
    exposeRoute: true,
  });
});
