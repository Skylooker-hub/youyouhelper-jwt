import { join } from "path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import fastifyStatic from "@fastify/static";
import * as path from "path";

function ajvPlugin(
  ajv: {
    addKeyword: (
      arg0: string,
      arg1: { compile: (schema: any, parent: any, it: any) => () => boolean }
    ) => void;
  },
  options: any
) {
  ajv.addKeyword("isFileType", {
    compile: (schema: any, parent: { type: string; format: string; isFileType: any }, it: any) => {
      // Change the schema type, as this is post validation it doesn't appear to error.
      parent.type = "file";
      parent.format = "binary";
      delete parent.isFileType;
      return () => true;
    },
  });
  return ajv;
}

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  // Place here your custom code!
  fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/", // optional: default '/'
  });

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });
};

export const options: FastifyServerOptions = {
  ajv: {
    plugins: [ajvPlugin],
  },
};

export default app;
export { app };
