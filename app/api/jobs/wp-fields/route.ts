import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * GET /api/jobs/wp-fields
 *
 * Fetches the allowed values for ACF select fields on the WordPress career CPT
 * by calling OPTIONS on the WP REST endpoint, which returns the full JSON Schema
 * including enum constraints for each field.
 *
 * Returns:
 * {
 *   job_location:    string[]   e.g. ["Dubai", "London"]
 *   in_office__remote: string[] e.g. ["Remote", "In-office", "Hybrid"]
 *   job_type:        string[]   e.g. ["Full-time", "Part-time", "Contract"]
 *   wages:           string[]   (empty if free-text)
 * }
 */

export interface WpFieldOptions {
  job_location: string[];
  in_office__remote: string[];
  job_type: string[];
  wages: string[];
}

type WpSchemaProperty = {
  enum?: string[];
  type?: string;
};

type WpSchema = {
  properties?: {
    acf?: {
      properties?: Record<string, WpSchemaProperty>;
    };
  };
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { WORDPRESS_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD } =
      process.env;

    if (!WORDPRESS_URL || !WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
      // WP not configured — return empty arrays so the form still renders
      return NextResponse.json<WpFieldOptions>({
        job_location: [],
        in_office__remote: [],
        job_type: [],
        wages: [],
      });
    }

    const credentials = Buffer.from(
      `${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD.replace(/\s/g, "")}`
    ).toString("base64");

    const endpoint = `${WORDPRESS_URL.replace(/\/$/, "")}/wp-json/wp/v2/career`;

    // OPTIONS returns the full JSON Schema for this endpoint including
    // enum constraints that ACF adds for Select fields.
    const res = await fetch(endpoint, {
      method: "OPTIONS",
      headers: { Authorization: `Basic ${credentials}` },
    });

    if (!res.ok) {
      throw new Error(`WP schema fetch failed: ${res.status}`);
    }

    const schema = (await res.json()) as WpSchema;
    const acfProps = schema?.properties?.acf?.properties ?? {};

    function enumOf(field: string): string[] {
      return acfProps[field]?.enum ?? [];
    }

    return NextResponse.json<WpFieldOptions>({
      job_location: enumOf("job_location"),
      in_office__remote: enumOf("in_office__remote"),
      job_type: enumOf("job_type"),
      wages: enumOf("wages"),
    });
  } catch (error) {
    console.error("[GET /api/jobs/wp-fields]", error);
    // Degrade gracefully — form renders with empty selects
    return NextResponse.json<WpFieldOptions>({
      job_location: [],
      in_office__remote: [],
      job_type: [],
      wages: [],
    });
  }
}
