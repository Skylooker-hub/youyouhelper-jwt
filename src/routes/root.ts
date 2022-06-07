import { FastifyPluginAsync } from "fastify";
import { Static, Type } from "@sinclair/typebox";

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const verifyEmailCodeSchema = Type.Object({
    email: Type.String({ format: "email", description: "电子邮箱地址" }),
  });

  fastify.post<{
    Body: Static<typeof verifyEmailCodeSchema>;
  }>(
    "/verify_email",
    {
      schema: {
        description: "验证电子邮箱",
        body: verifyEmailCodeSchema,
      },
    },
    async function (request, reply) {
      const { redis } = fastify;

      const expires = await redis['verify_email'].hget(request.body.email, "expires");
      if (expires && parseInt(expires) > Date.now()) {
        reply.badRequest("验证码已发送，请勿重复发送");
        return;
      }

      const code = Math.random().toString().substring(2, 8);

      await redis['verify_email'].hmset(
        request.body.email,
        {
          code,
          expires: Date.now() + 1000 * 60 * 5,
        },
      );
      await redis['verify_email'].expire(request.body.email, 60 * 5);
      try {
        await fastify.mailer.youyou.sendMail({
          to: request.body.email,
          text: code,
          html: `
            <div style="display: flex;flex-direction: column;justify-content: center;align-items: center;
            width: 300px;height: 300px;box-shadow: 0px 0px 10px #ccc;border-radius: 30px;margin: 66px auto;">
            <p>如果并非本人操作，请勿采取任何动作</p>
            <span style="line-height: 36px;">来自 <strong>YouYouHelper</strong> 的邮箱验证码：</span>
            <div style="font-weight: 600;font-size: 22px;line-height: 46px;">${code}</div>
            </div>
          `,
        });
      } catch (e) {
        reply.internalServerError("邮件发送失败");
        reply.clearCookie("verify_email_code");
        return;
      }
      return {
        message: "邮件发送成功",
      };
    }
  );
};

export default root;
