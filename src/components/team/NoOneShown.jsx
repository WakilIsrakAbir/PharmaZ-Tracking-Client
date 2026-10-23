import { Search, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";

// The team list is empty: nothing matches the search, or the tab has no one in it.
export function NoOneShown({ search, tab }) {
  if (search) {
    return <EmptyState className="m-3 border-none" icon={Search} title={`No one matches "${search}"`} description="Try a different name, email or phone number." />;
  }
  if (tab === "active") {
    return <EmptyState className="m-3 border-none" icon={Users} title="No active teammates" description="Add your first teammate to get started." />;
  }
  return (
    <EmptyState
      className="m-3 border-none"
      icon={Users}
      title="No deactivated accounts"
      description="People you deactivate show up here. You can reactivate them at any time."
    />
  );
}
