"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

import { Card } from "@/components/record-details/Card";
import { History } from "@/components/record-details/History";
import { StatusUpdate } from "@/components/record-details/StatusUpdate";
import { SubmittedBy } from "@/components/record-details/SubmittedBy";
import { Button } from "@/components/ui/button";

// Section 2, the part you can change: the status update, then the history, then who submitted the form.
// `editHref` puts the "Edit form" button beside the title (the full page has it at the top instead).
export function StatusCard({ record, editHref }) {
  const editButton = editHref && (
    <Button variant="outline" size="sm" asChild>
      <Link href={editHref}>
        <Pencil /> Edit form
      </Link>
    </Button>
  );

  return (
    <Card title="Status" action={editButton}>
      {/* The `key` gives a fresh form after every saved change. */}
      <StatusUpdate key={record.updatedAt} record={record} />
      <CardPart title="History">
        <History history={record.history} />
      </CardPart>
      {record.createdBy && (
        <CardPart title="Submitted by">
          <SubmittedBy person={record.createdBy} submittedAt={record.createdAt} />
        </CardPart>
      )}
    </Card>
  );
}

// A part of a card under a thin line, with a small grey title ("HISTORY", "SUBMITTED BY").
function CardPart({ title, children }) {
  return (
    <div className="mt-5 border-t pt-4">
      <h4 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h4>
      {children}
    </div>
  );
}
