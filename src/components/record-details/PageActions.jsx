"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/components/app-shell/useUser";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useDeleteRecord } from "@/lib/api";
import { TYPES } from "@/lib/constants";
import { dashboardLink } from "@/lib/format";

// The buttons at the top of the full page. Only admins can delete.
export function PageActions({ record }) {
  const user = useUser();
  const router = useRouter();
  const deleteRecord = useDeleteRecord(record.type);
  const [confirming, setConfirming] = useState(false);
  const { path, label } = TYPES[record.type];

  async function confirmDelete() {
    try {
      await deleteRecord.mutateAsync(record.id);
      toast.success(`${record.name} was deleted.`);
      router.push(path);
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <>
      <Button variant="outline" asChild>
        <Link href={dashboardLink(record)}>
          <CalendarDays /> Show on calendar
        </Link>
      </Button>
      <Button asChild>
        <Link href={`${path}/${record.id}/edit`}>
          <Pencil /> Edit form
        </Link>
      </Button>
      {user?.role === "admin" && (
        <>
          <Button variant="outline" onClick={() => setConfirming(true)} aria-label={`Delete ${record.name}`} className="text-destructive">
            <Trash2 />
          </Button>
          <ConfirmDialog
            open={confirming}
            onOpenChange={setConfirming}
            title={`Delete ${record.name}?`}
            description={`This removes the ${label.toLowerCase()} form, its photo and its history for everyone. It can't be undone.`}
            confirmLabel="Delete"
            destructive
            pending={deleteRecord.isPending}
            onConfirm={confirmDelete}
          />
        </>
      )}
    </>
  );
}
