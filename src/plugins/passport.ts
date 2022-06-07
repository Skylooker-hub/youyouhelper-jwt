import fp from "fastify-plugin";
// import { Authenticator } from "@fastify/passport";
// import { Strategy as LocalStrategy } from "passport-local";
// import * as bcrypt from "bcrypt";
// import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
// import { User } from "@prisma/client";

// declare module "fastify" {
//   interface FastifyInstance {
//     userPassport: Authenticator;
//   }
//   interface PassportUser extends Omit<User, "password"> {}
// }

export default fp(
  async (fastify, opts) => {}
  //     const userPassport = new Authenticator({ key: "users", userProperty: "user" });
  //     fastify.register(userPassport.initialize());
  //     fastify.register(userPassport.secureSession());
  //     userPassport.registerUserSerializer(async (user: User, request) => user.id);
  //     userPassport.registerUserDeserializer(async (id: string, request) => {
  //       let user = null;
  //       user = await fastify.prisma.user.findUnique({ where: { id } });
  //       user = user && fastify.excludeSomeProperties(user, "password");
  //       return user;
  //     });
  //     fastify.decorate("userPassport", userPassport);

  //     userPassport.use(
  //       "local",
  //       new LocalStrategy(
  //         {
  //           usernameField: "username",
  //           passwordField: "password",
  //           // session: false, // 这个选项是无效的
  //         },
  //         async function (username, password, done) {
  //           let user = null;
  //           try {
  //             user = await fastify.prisma.user.findUnique({
  //               where: { username },
  //             });
  //           } catch (error) {
  //             return done(fastify.httpErrors.internalServerError("数据库错误"));
  //           }
  //           if (user === null) {
  //             return done(fastify.httpErrors.badRequest("用户名或密码错误"), false);
  //           }
  //           if (!bcrypt.compareSync(password, user.password)) {
  //             return done(fastify.httpErrors.badRequest("用户名或密码错误"), false);
  //           }
  //           user = user && fastify.excludeSomeProperties(user, "password");
  //           return done(null, user);
  //         }
  //       )
  //     );

  //     userPassport.use(
  //       new JwtStrategy(
  //         {
  //           jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  //           secretOrKey: process.env.JWT_KEY,
  //         },
  //         async function (jwtPayload, done) {
  //           let user = null;
  //           try {
  //             user = await fastify.prisma.user.findUnique({ where: { id: jwtPayload.id } });
  //           } catch (error) {
  //             return done(fastify.httpErrors.internalServerError("数据库错误"));
  //           }
  //           if (user === null) {
  //             return done(fastify.httpErrors.badRequest("查找不到对应用户"), false);
  //           }
  //           user = user && fastify.excludeSomeProperties(user, "password");
  //           return done(null, user);
  //         }
  //       )
  //     );
  //   },
  // {
  //   name: "passport",
  //   dependencies: ["session"],
  // }
);
