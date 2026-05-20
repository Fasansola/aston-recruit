import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Sidebar from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    // @ts-expect-error — custom field attached in auth callbacks
    role: session.user.role as string | undefined,
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
