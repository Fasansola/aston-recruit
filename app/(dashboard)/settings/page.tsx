import { redirect } from "next/navigation";
import { auth } from "@/auth";

const EMAIL_TEMPLATES = [
  { name: "Application Received", stage: "APPLIED", trigger: "On application creation" },
  { name: "Under Review", stage: "SCREENING", trigger: "APPLIED → SCREENING" },
  { name: "Shortlisted", stage: "SHORTLISTED", trigger: "SCREENING → SHORTLISTED" },
  { name: "Interview Invite", stage: "INTERVIEW", trigger: "SHORTLISTED → INTERVIEW" },
  { name: "Offer", stage: "OFFER", trigger: "Any → OFFER" },
  { name: "Rejected", stage: "REJECTED", trigger: "Any → REJECTED" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  INTERVIEWER: "Interviewer",
  VIEWER: "Viewer",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // @ts-expect-error — custom role field
  const role = session.user.role as string | undefined;
  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : "Unknown";

  return (
    <div className="space-y-7 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Account and system configuration
        </p>
      </div>

      {/* Your Account */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Your Account
          </h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-zinc-600">Name</span>
            <span className="text-sm text-zinc-200 font-medium">
              {session.user.name ?? "—"}
            </span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-zinc-600">Email</span>
            <span className="text-sm text-zinc-200">
              {session.user.email ?? "—"}
            </span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-zinc-600">Role</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Webhook Configuration
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-zinc-400">
            Configure Make.com to POST application data to this endpoint:
          </p>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              Endpoint
            </p>
            <code className="block bg-[#0d0d0d] border border-white/[0.06] rounded-lg px-4 py-2.5 text-xs text-[#c9a84c] font-mono break-all">
              POST /api/webhooks/application
            </code>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              Required header
            </p>
            <code className="block bg-[#0d0d0d] border border-white/[0.06] rounded-lg px-4 py-2.5 text-xs text-zinc-400 font-mono break-all">
              x-webhook-secret: <span className="text-zinc-600">{"<your WEBHOOK_SECRET>"}</span>
            </code>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            The secret must match the <code className="text-zinc-500">WEBHOOK_SECRET</code> environment variable set in Vercel. Requests without a valid secret are rejected with 401.
          </p>
        </div>
      </div>

      {/* Email Templates */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Email Templates
          </h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-zinc-400 mb-5">
            All stage emails use Aston VIP branded templates via Resend. Template customisation is coming in a future release.
          </p>
          <div className="space-y-0 divide-y divide-white/[0.04]">
            {EMAIL_TEMPLATES.map((t) => (
              <div
                key={t.stage}
                className="flex items-center justify-between py-3.5 gap-4"
              >
                <div>
                  <p className="text-sm text-zinc-300">{t.name}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{t.trigger}</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-800/80 text-zinc-500 border border-white/[0.06] shrink-0">
                  Default
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
