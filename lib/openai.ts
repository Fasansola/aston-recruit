import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

/**
 * Lazy singleton — only instantiated on first access so the module
 * can be imported at build time without OPENAI_API_KEY being present.
 */
function getOpenAI(): OpenAI {
  if (globalForOpenAI.openai) return globalForOpenAI.openai;

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "placeholder-set-openai-api-key",
  });

  if (process.env.NODE_ENV !== "production") {
    globalForOpenAI.openai = client;
  }

  return client;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default openai;
