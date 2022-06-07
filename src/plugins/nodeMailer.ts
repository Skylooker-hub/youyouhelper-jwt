import fp from "fastify-plugin";
import { Transporter } from "nodemailer";

export interface FastifyMailerNamedInstance {
  youyou: Transporter;
}
export type FastifyMailer = FastifyMailerNamedInstance & Transporter;

declare module "fastify" {
  interface FastifyInstance {
    mailer: FastifyMailer;
  }
}

export default fp(async (fastify, opts) => {
  fastify.register(require("fastify-mailer"), {
    defaults: {
      // set the default sender email address to jane.doe@example.tld
      from: "YouYouHelper <youyouhelper@126.com>",
      // set the default email subject to 'default example'
      subject: "YouYouHelper验证码邮件",
    },
    namespace: "youyou",
    transport: {
      host: "smtp.126.com",
      port: 465,
      secure: true, // use TLS
      auth: {
        user: "youyouhelper@126.com",
        pass: process.env.MAIL_PASS,
      },
    },
  });
});
