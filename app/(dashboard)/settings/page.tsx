import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // @ts-expect-error — custom role field
  const role = session.user.role as string | undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Account and system settings</p>
      </div>

      {/* Current user */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Your Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Name</p>
              <p className="text-white font-medium">{session.user.name}</p>
            </div>
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Email</p>
              <p className="text-white">{session.user.email}</p>
            </div>
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Role</p>
              <Badge
                variant="outline"
                className="mt-1 border-zinc-700 text-zinc-300"
              >
                {role?.replace("_", " ") ?? "Unknown"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email templates placeholder */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Email Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            Email template customisation is coming in a future release. Currently
            all stage-change emails use the built-in Aston VIP branded templates.
          </p>
          <div className="mt-4 space-y-2">
            {[
              "Application Received",
              "Under Review",
              "Shortlisted",
              "Interview Invite",
              "Offer",
              "Rejected",
            ].map((name) => (
              <div
                key={name}
                className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
              >
                <span className="text-sm text-zinc-300">{name}</span>
                <Badge
                  variant="outline"
                  className="border-zinc-700 text-zinc-500 text-xs"
                >
                  Default
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhook info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Webhook</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400 mb-2">
            Configure Make.com to POST applications to:
          </p>
          <code className="block bg-zinc-800 rounded px-3 py-2 text-xs text-[#c9a84c] font-mono break-all">
            POST /api/webhooks/application
          </code>
          <p className="text-xs text-zinc-500 mt-2">
            Include the <code className="text-zinc-400">x-webhook-secret</code> header
            matching your <code className="text-zinc-400">WEBHOOK_SECRET</code> environment variable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
