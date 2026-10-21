"use client";

import { TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";

export default function DashboardError({ retry, reset }) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title="This page didn't load"
      description="Something went wrong on our side, or the connection dropped. Please try again in a moment."
      action={<Button onClick={() => (retry ?? reset)?.()}>Try again</Button>}
    />
  );
}
