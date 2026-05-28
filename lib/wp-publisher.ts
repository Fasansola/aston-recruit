/**
 * WordPress REST API publisher for the Aston VIP career CPT.
 *
 * The career post type on aston.ae uses no ACF fields — all job content
 * lives in the standard Gutenberg `content` field. This publisher formats
 * the description and requirements as proper Gutenberg block HTML so the
 * published post matches the look and feel of manually created posts.
 *
 * Requirements on the WordPress side:
 *  - The "career" CPT must be registered with `show_in_rest: true`
 *  - An Application Password must be generated for a WP admin user
 *    (WP Admin → Users → your user → Application Passwords)
 *
 * Environment variables required:
 *  WORDPRESS_URL          e.g. https://aston.ae
 *  WORDPRESS_USERNAME     WP admin username
 *  WORDPRESS_APP_PASSWORD Application Password from WP admin
 */

export interface WpPublishResult {
  wpPostId: number;
  wpPostUrl: string;
}

export interface JobData {
  title: string;
  description: string;      // plain text, paragraphs separated by \n\n
  requirements: string;     // plain text, bullets starting with • or -
  shortDescription?: string | null; // ACF: short_description
  department?: string | null;
  location?: string | null;         // ACF: job_location
  wages?: string | null;            // ACF: wages
  workType?: string | null;         // ACF: in_office__remote
  jobType?: string | null;          // ACF: job_type
  closesAt?: Date | null;
  wpJobOpeningId: string;           // ACF: zoho_opening_id (reused for Elementor hidden field)
}

/**
 * Wraps a plain-text paragraph in a Gutenberg paragraph block.
 */
function gutenbergParagraph(text: string): string {
  const escaped = text.replace(/\n/g, "<br>");
  return `<!-- wp:paragraph -->\n<p class="wp-block-paragraph">${escaped}</p>\n<!-- /wp:paragraph -->`;
}

/**
 * Wraps a heading string in a Gutenberg heading block.
 */
function gutenbergHeading(text: string, level: 3 | 4 = 3): string {
  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `<!-- wp:heading {"level":${level}} -->\n<h${level} class="wp-block-heading" id="h-${id}">${text}</h${level}>\n<!-- /wp:heading -->`;
}

/**
 * Wraps an array of plain-text items in a Gutenberg list block.
 */
function gutenbergList(items: string[]): string {
  const liItems = items.map((item) => `<li>${item.trim()}</li>`).join("\n\n\n\n");
  return `<!-- wp:list -->\n<ul class="wp-block-list">\n${liItems}\n</ul>\n<!-- /wp:list -->`;
}

/**
 * Converts plain-text job content into Gutenberg block HTML that matches
 * the structure of existing career posts on aston.ae.
 *
 * Output structure:
 *   [intro paragraphs from description]
 *   ## What you will do
 *   [bullet list parsed from description — lines after "responsibilities" marker]
 *   ## What you need for this
 *   [bullet list from requirements]
 *   ## What we offer
 *   [closing paragraph about Aston VIP]
 */
function buildGutenbergContent(
  description: string,
  requirements: string
): string {
  const blocks: string[] = [];

  // ── Description ────────────────────────────────────────────────────────
  // Split description into paragraphs; lines starting with • or - become
  // a "What you will do" list; everything else is intro paragraphs.
  const descLines = description.split(/\n+/);
  const introParagraphs: string[] = [];
  const responsibilityItems: string[] = [];

  for (const line of descLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^[•\-]/.test(trimmed)) {
      responsibilityItems.push(trimmed.replace(/^[•\-]\s*/, ""));
    } else {
      introParagraphs.push(trimmed);
    }
  }

  // Intro paragraphs
  for (const para of introParagraphs) {
    blocks.push(gutenbergParagraph(para));
  }

  // "What you will do" section (only if there are responsibility bullets)
  if (responsibilityItems.length > 0) {
    blocks.push(gutenbergHeading("What you will do", 3));
    blocks.push(gutenbergList(responsibilityItems));
  }

  // ── Requirements ───────────────────────────────────────────────────────
  const reqItems = requirements
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l)
    .map((l) => l.replace(/^[•\-]\s*/, ""));

  if (reqItems.length > 0) {
    blocks.push(gutenbergHeading("What you need for this", 3));
    blocks.push(gutenbergList(reqItems));
  }

  // ── What we offer (standard Aston VIP closing) ─────────────────────────
  blocks.push(gutenbergHeading("What we offer", 4));
  blocks.push(
    gutenbergParagraph(
      "Join a fast-growing international corporate advisory firm based in the UAE. " +
      "You will work directly with senior leadership and gain hands-on exposure to business setup, " +
      "free zone licensing, visa services, and corporate structuring across one of the world's most " +
      "dynamic business environments."
    )
  );

  return blocks.join("\n\n");
}

/**
 * Fetches the allowed enum values for ACF select fields on the career CPT
 * by calling OPTIONS on the WP REST endpoint.
 * Returns an object keyed by ACF field name → string[] of allowed values.
 */
async function fetchAcfEnums(
  endpoint: string,
  credentials: string
): Promise<Record<string, string[]>> {
  type Schema = { properties?: { acf?: { properties?: Record<string, { enum?: string[] }> } } };

  async function parseEnums(res: Response): Promise<Record<string, string[]>> {
    const schema = (await res.json()) as Schema;
    const props = schema?.properties?.acf?.properties ?? {};
    return Object.fromEntries(
      Object.entries(props)
        .filter(([, v]) => Array.isArray(v.enum))
        .map(([k, v]) => [k, v.enum as string[]])
    );
  }

  try {
    // Try unauthenticated OPTIONS first — avoids triggering edit-context
    // permission checks that can 401 on some WP setups.
    const publicRes = await fetch(endpoint, { method: "OPTIONS" });
    if (publicRes.ok) {
      const enums = await parseEnums(publicRes);
      if (Object.keys(enums).length > 0) return enums;
    }

    // Fall back to authenticated OPTIONS if public schema had no enums
    const authRes = await fetch(endpoint, {
      method: "OPTIONS",
      headers: { Authorization: `Basic ${credentials}` },
    });
    if (authRes.ok) return await parseEnums(authRes);

    return {};
  } catch {
    return {};
  }
}

/**
 * If the value is a valid enum option, return it as-is.
 * If not (or if enums unknown), return the value unchanged — WP will reject
 * invalid selects, but free-text fields will accept anything.
 * Passing an empty string is safer than an invalid option for select fields.
 */
function safeEnumValue(
  value: string | null | undefined,
  enums: Record<string, string[]>,
  field: string
): string {
  const allowed = enums[field];
  const v = value ?? "";
  if (!allowed || allowed.length === 0) return v;   // free-text field
  if (allowed.includes(v)) return v;                // exact match ✓
  return "";                                         // invalid — send empty
}

export async function publishJobToWordPress(job: JobData): Promise<WpPublishResult> {
  const {
    WORDPRESS_URL,
    WORDPRESS_USERNAME,
    WORDPRESS_APP_PASSWORD,
    WORDPRESS_CAREER_TOKEN,
  } = process.env;

  if (!WORDPRESS_URL) {
    throw new Error(
      "WordPress publishing is not configured. Set WORDPRESS_URL in your environment variables."
    );
  }

  const baseUrl = WORDPRESS_URL.replace(/\/$/, "");

  // ── ACF enum fetch (still uses standard WP REST OPTIONS — no auth needed) ──
  const wpV2Endpoint = `${baseUrl}/wp-json/wp/v2/career`;
  const credentials =
    WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD
      ? Buffer.from(
          `${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD.replace(/\s/g, "")}`
        ).toString("base64")
      : "";
  const enums = await fetchAcfEnums(wpV2Endpoint, credentials);

  const requestBody = {
    title: job.title,
    content: buildGutenbergContent(
      job.description,
      job.requirements
    ),
    acf: {
      zoho_opening_id: job.wpJobOpeningId,
      short_description: job.shortDescription ?? "",
      job_location: safeEnumValue(job.location, enums, "job_location"),
      wages: safeEnumValue(job.wages, enums, "wages"),
      in_office__remote: safeEnumValue(job.workType, enums, "in_office__remote"),
      job_type: safeEnumValue(job.jobType, enums, "job_type"),
    },
  };

  // ── Prefer the custom token endpoint (bypasses WP capability checks) ──────
  // Falls back to the standard WP REST API with Basic Auth if no token is set.
  if (WORDPRESS_CAREER_TOKEN) {
    const customEndpoint = `${baseUrl}/wp-json/aston/v1/career`;
    const response = await fetch(customEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aston-Token": WORDPRESS_CAREER_TOKEN,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "(no body)");
      throw new Error(`WordPress API returned ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as { id: number; link: string };
    return { wpPostId: data.id, wpPostUrl: data.link };
  }

  // ── Fallback: standard WP REST API with Basic Auth ────────────────────────
  if (!credentials) {
    throw new Error(
      "WordPress publishing requires either WORDPRESS_CAREER_TOKEN or both WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD."
    );
  }

  const response = await fetch(wpV2Endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({ ...requestBody, status: "publish" }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "(no body)");
    throw new Error(`WordPress API returned ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { id: number; link: string };
  return { wpPostId: data.id, wpPostUrl: data.link };
}
