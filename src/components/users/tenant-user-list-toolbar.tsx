"use client";

import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TenantUserListToolbarProps = {
  searchInput: string;
  canCreateUsers: boolean;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onCreate: () => void;
};

/** Reusable search and primary-action toolbar for tenant user lists. */
export function TenantUserListToolbar({ searchInput, canCreateUsers, onSearchInputChange, onSearch, onCreate }: TenantUserListToolbarProps) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex w-full max-w-md gap-2"><div className="relative flex-1"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchInput} onChange={(event) => onSearchInputChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onSearch(); }} placeholder="Search by name, username, or email" className="pl-9" /></div><Button type="button" variant="outline" onClick={onSearch}>Search</Button></div>
    {canCreateUsers ? <Button type="button" onClick={onCreate}><Plus className="size-4" />Create User</Button> : null}
  </div>;
}
