import fp from "fastify-plugin";

type IsEqual<A, B> = (A extends B ? true : false) & (B extends A ? true : false);

type Includes<Arr extends unknown[], FindItem> = Arr extends [infer First, ...infer Rest]
  ? IsEqual<First, FindItem> extends true
    ? true
    : Includes<Rest, FindItem>
  : false;

type OmitArray<T extends object, K extends Array<keyof T>> = {
  [Key in keyof T as Includes<K, Key> extends true ? never : Key]: T[Key];
};

function excludeSomeProperties<T extends object>(
  obj: T,
  ...keys: Array<keyof T>
): OmitArray<T, Array<keyof T>> {
  for (let key of keys) {
    delete obj[key];
  }
  return obj;
}

export default fp(
  async (fastify, options) => {
    fastify.decorate("excludeSomeProperties", excludeSomeProperties);
  },
  {
    name: "excludeSomeProperties",
  }
);

declare module "fastify" {
  interface FastifyInstance {
    excludeSomeProperties: typeof excludeSomeProperties;
  }
}
