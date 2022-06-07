import { FastifyPluginAsync } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";
import * as util from "util";

const users: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const UserCreateSchema = Type.Object({
    username: Type.String({ minLength: 2, maxLength: 60, description: "用户名" }),
    password: Type.String({ minLength: 6, maxLength: 30, description: "密码" }),
    email: Type.String({
      format: "email",
      description: "电子邮箱地址",
    }),
    verifyEmailCode: Type.String({ description: "邮箱验证码" }),
  });

  fastify.post<{ Body: Static<typeof UserCreateSchema> }>(
    "/create",
    {
      schema: {
        description: "创建用户",
        tags: ["user"],
        body: UserCreateSchema,
      },
    },
    async function (request, reply) {
      const user = request.body;
      const verifyEmailCode = await fastify.redis["verify_email"].hget(user.email, "code");
      if (!verifyEmailCode || verifyEmailCode !== user.verifyEmailCode) {
        reply.badRequest("邮箱验证码错误");
        return;
      }
      user.password = await bcrypt.hash(user.password, 10);
      let res = null;
      try {
        res = await fastify.prisma.user.create({
          data: {
            username: user.username,
            password: user.password,
            email: user.email,
          },
        });
      } catch (error) {
        throw new Error("创建用户失败");
      }
      const userWithOutSomeProperties = fastify.excludeSomeProperties(res, "password");
      request.session.delete();
      return userWithOutSomeProperties;
    }
  );

  const UserLoginSchema = Type.Object({
    username: Type.String({ minLength: 2, maxLength: 60, description: "用户名" }),
    password: Type.String({ minLength: 6, maxLength: 30, description: "密码" }),
  });

  fastify.post<{
    Body: Static<typeof UserLoginSchema>;
  }>(
    "/login",
    {
      schema: {
        description: "用户登录",
        tags: ["user"],
        body: UserLoginSchema,
      },
      preHandler: [fastify.auth([fastify.verifyUsernameAndPassword])],
    },
    async function (request, reply) {
      const user = await fastify.prisma.user.findUnique({
        where: { username: request.body.username },
      });
      if (!user) {
        reply.badRequest("用户名或密码错误");
        return;
      }
      if (!process.env.REFRESH_KEY) {
        throw new Error("REFRESH_KEY is not defined");
      }
      return {
        access_token: fastify.jwt.sign({ id: user.id }, { expiresIn: "10m" }),
        refresh_token: jwt.sign({ id: user.id }, process.env.REFRESH_KEY, {
          expiresIn: "3d",
        }),
      };
    }
  );

  const RefreshTokenSchema = Type.Object({
    refresh_token: Type.String({ minLength: 1, maxLength: 255, description: "刷新令牌" }),
  });

  fastify.post<{ Body: Static<typeof RefreshTokenSchema> }>(
    "/refresh_token",
    {
      schema: {
        description: "刷新token",
        tags: ["user"],
        body: RefreshTokenSchema,
      },
    },
    async function (request, reply) {
      if (!process.env.REFRESH_KEY) {
        throw new Error("REFRESH_KEY is not defined");
      }
      const refreshToken = request.body.refresh_token;
      let user = null;
      try {
        const jwtPayload: any = jwt.verify(refreshToken, process.env.REFRESH_KEY);
        user = await fastify.prisma.user.findUnique({
          where: { id: jwtPayload.id },
        });
      } catch (error) {
        reply.unauthorized("refresh_token验证失败");
        return;
      }
      if (user === null) {
        reply.unauthorized("refresh_token验证失败");
        return;
      }
      return {
        access_token: fastify.jwt.sign({ id: user.id }, { expiresIn: "10m" }),
        refresh_token: jwt.sign({ id: user.id }, process.env.REFRESH_KEY, {
          expiresIn: "3d",
        }),
      };
    }
  );

  fastify.get(
    "/user_info",
    {
      schema: {
        description: "获取用户信息",
        tags: ["user"],
      },
      preHandler: [fastify.auth([fastify.verifyJwt])],
    },
    async function (request, reply) {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
      });
      return {
        user,
      };
    }
  );

  const UserUniqueFieldSchema = Type.Object({
    username: Type.Optional(Type.String({ minLength: 2, maxLength: 60, description: "用户名" })),
    email: Type.Optional(Type.String({ format: "email", description: "电子邮箱地址" })),
  });

  fastify.get<{
    Querystring: Static<typeof UserUniqueFieldSchema>;
  }>(
    "/exists_user_unique_fields",
    {
      schema: {
        description: "检查用户唯一字段是否存在",
        tags: ["user"],
        querystring: UserUniqueFieldSchema,
      },
    },
    async function (request, reply) {
      const { username, email } = request.query;
      let or = [];
      username && or.push({ username });
      email && or.push({ email });
      if (or.length > 0) {
        const res = await fastify.prisma.user.findMany({
          where: {
            OR: or,
          },
        });
        res.forEach(user => {
          user = fastify.excludeSomeProperties(user, "password");
        });
        return res;
      }
      return [];
    }
  );

  const UserInfoUpdateSchema = Type.Object({
    username: Type.Optional(Type.String({ minLength: 2, maxLength: 60, description: "用户名" })),
    email: Type.Optional(Type.String({ format: "email", description: "电子邮箱地址" })),
    signature: Type.Optional(Type.String({ minLength: 1, maxLength: 255, description: "签名" })),
  });

  fastify.put<{
    Body: Static<typeof UserInfoUpdateSchema>;
  }>(
    "/update_user_info",
    {
      schema: {
        description: "更新用户信息",
        tags: ["user"],
        body: UserInfoUpdateSchema,
      },
      preHandler: [fastify.auth([fastify.verifyJwt])],
    },
    async function (request, reply) {
      const user = request.user;
      const { username, email, signature } = request.body;
      let res = null;
      try {
        res = await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            username,
            email,
            signature,
          },
        });
      } catch (error) {
        throw new Error("更新用户失败");
      }
      const userWithOutSomeProperties = fastify.excludeSomeProperties(res, "password");
      return userWithOutSomeProperties;
    }
  );

  const UserPasswordUpdateSchema = Type.Object({
    password: Type.String({ minLength: 6, maxLength: 30, description: "密码" }),
    verifyEmailCode: Type.String({ description: "邮箱验证码" }),
  });

  fastify.put<{
    Body: Static<typeof UserPasswordUpdateSchema>;
  }>(
    "/update_user_password",
    {
      schema: {
        description: "更新用户密码",
        tags: ["user"],
        body: UserPasswordUpdateSchema,
      },
      preHandler: [fastify.auth([fastify.verifyJwt])],
    },
    async function (request, reply) {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
      });
      if (!user) {
        reply.unauthorized("用户不存在");
        return;
      }
      const verifyEmailCode = request.session.get("verify_email_code");
      const verifyEmail = request.session.get("verify_email");
      if (
        !verifyEmailCode ||
        !verifyEmail ||
        verifyEmail !== user.email ||
        verifyEmailCode !== request.body.verifyEmailCode
      ) {
        reply.badRequest("邮箱验证码错误");
        return;
      }
      const { password } = request.body;
      const hash = await bcrypt.hash(password, 10);
      let res = null;
      try {
        res = await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            password: hash,
          },
        });
      } catch (error) {
        throw new Error("更新用户失败");
      }
      const userWithOutSomeProperties = fastify.excludeSomeProperties(res, "password");
      return userWithOutSomeProperties;
    }
  );

  fastify.put<{
    Body: {
      [key: string]: any;
    };
  }>(
    "/upload/avatar",
    {
      schema: {
        // hide: true,
        consumes: ["multipart/form-data"],
        description: "上传用户头像",
        tags: ["user"],
        body: {
          type: "object",
          required: ["file"],
          properties: {
            file: { isFileType: "true", description: "头像文件" },
          },
        },
      },
      preHandler: [fastify.auth([fastify.verifyJwt])],
    },
    async function (request, reply) {
      const uploadValue = await request.body.file.toBuffer(); // access files
      await util.promisify(fs.mkdir)(process.cwd() + `/uploads/${request.user.id}/`, {
        recursive: true,
      });
      const extname = request.body.file.filename.split(".").pop();
      // const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
      const dest = `/${request.user.id}/avatar` + "." + extname;
      await util.promisify(fs.writeFile)(process.cwd() + `/uploads` + dest, uploadValue);

      const url = `/uploads` + dest;

      const res = await fastify.prisma.user.update({
        where: { id: request.user.id },
        data: {
          avatar: url,
        },
      });

      return {
        message: "头像成功",
        user: fastify.excludeSomeProperties(res, "password"),
      };
    }
  );
};

export default users;
