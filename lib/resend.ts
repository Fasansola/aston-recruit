import { Resend } from "resend";

const globalForResend = globalThis as unknown as {
  resend: Resend | undefined;
};

/**
 * Lazy singleton — only instantiated on first access so the module
 * can be imported at build time without RESEND_API_KEY being present.
 */
function getResend(): Resend {
  if (globalForResend.resend) return globalForResend.resend;

  const client = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder_set_resend_api_key");

  if (process.env.NODE_ENV !== "production") {
    globalForResend.resend = client;
  }

  return client;
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return (getResend() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default resend;
