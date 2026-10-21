import { CalendarDays, Mail, Phone } from "lucide-react";

import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Avatar, PageHeader } from "@/components/common";
import { Protected } from "@/components/Protected";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/constants";
import { formatDate, formatPhone } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Your account" };

export default function Page() {
  return (
    <Protected>
      <Account />
    </Protected>
  );
}

async function Account() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader title="Your account" description="Your details, and the password you sign in with." />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} className="size-14 text-lg" />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{user.name}</h2>
              <Badge variant={user.role === "admin" ? "default" : "secondary"} className="mt-1">
                {ROLES[user.role].label}
              </Badge>
            </div>
          </div>

          <dl className="mt-6 space-y-4 text-sm">
            <Detail icon={Mail} label="Email" value={user.email} />
            <Detail icon={Phone} label="Phone" value={user.phone ? formatPhone(user.phone) : "Not added yet"} />
            <Detail icon={CalendarDays} label="Member since" value={formatDate(user.createdAt, "d MMMM yyyy")} />
          </dl>

          <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
            Your name and phone number are shown on every form you submit.{" "}
            {user.role === "admin" ? "You can change them on the Team page." : "To change them, ask your admin."}
          </p>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Changing it keeps you signed in here and signs you out on every other device.</p>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="truncate font-medium">{value}</dd>
      </div>
    </div>
  );
}
