/**
 * WordPress REST API publisher.
 *
 * Publishes a job opening to the Aston VIP WordPress site as a post
 * under the "career" custom post type.
 *
 * Requirements on the WordPress side:
 *  1. The "career" CPT must be registered with `show_in_rest: true`
 *  2. An Application Password must be generated for a WP admin user
 *     (WP Admin → Users → Profile → Application Passwords)
 *
 * Environment variables required:
 *  WORDPRESS_URL          e.g. https://aston.ae
 *  WORDPRESS_USERNAME     WP admin username
 *  WORDPRESS_APP_PASSWORD Application Password (spaces are fine — WP strips them)
 */

export interface WpPublishResult {
  wpPostId: number;
  wpPostUrl: string;
}

export interface JobData {
  title: string;
  description: string;
  requirements: string;
  department?: string | null;
  location?: string | null;
  wpJobOpeningId: string; // stored as post meta so the form hidden field maps correctly
}

/**
 * Formats description + requirements as simple HTML for the WP post body.
 */
function buildPostContent(description: string, requirements: string): string {
  // Convert plain-text paragraphs (separated by \n\n or \n) to <p> tags
  const descHtml = description
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  // Convert bullet lines (starting with •) to <li> items
  const reqLines = requirements.split("\n").filter((l) => l.trim());
  const reqHtml =
    "<h3>Requirements</h3>\n<ul>\n" +
    reqLines
      .map((l) => `<li>${l.replace(/^[•\-]\s*/, "").trim()}</li>`)
      .join("\n") +
    "\n</ul>";

  return `${descHtml}\n\n${reqHtml}`;
}

export async function publishJobToWordPress(job: JobData): Promise<WpPublishResult> {
  const { WORDPRESS_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD } = process.env;

  if (!WORDPRESS_URL || !WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
    throw new Error(
      "WordPress publishing is not configured. Set WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD in your environment variables."
    );
  }

  // Basic auth: base64(username:app_password). WP app passwords may contain spaces — remove them first.
  const credentials = Buffer.from(
    `${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD.replace(/\s/g, "")}`
  ).toString("base64");

  const endpoint = `${WORDPRESS_URL.replace(/\/$/, "")}/wp-json/wp/v2/career`;

  const body = {
    title: job.title,
    content: buildPostContent(job.description, job.requirements),
    status: "publish",
    // Store the ATS job ID as post meta so Elementor forms can reference it
    meta: {
      job_opening_id: job.wpJobOpeningId,
      ...(job.department && { job_department: job.department }),
      ...(job.location && { job_location: job.location }),
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "(no body)");
    throw new Error(
      `WordPress API returned ${response.status}: ${errorText}`
    );
  }

  const data = (await response.json()) as { id: number; link: string };

  return {
    wpPostId: data.id,
    wpPostUrl: data.link,
  };
}
