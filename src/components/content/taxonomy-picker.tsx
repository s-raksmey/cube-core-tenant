"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { useTaxonomyPicker } from "@/hooks/use-taxonomy-picker";

export function TaxonomyPicker({ label, placeholder, value, selectedLabel, onChange, data, disabled }: {
  label: string; placeholder: string; value: string; selectedLabel?: string;
  onChange: (value: string) => void; data: ReturnType<typeof useTaxonomyPicker>; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState({ id: "", label: "" });
  const currentLabel = data.options.find((item) => item.id === value)?.label
    ?? (choice.id === value ? choice.label : selectedLabel);
  return <>
    <Button type="button" variant="outline" disabled={disabled} aria-label={label} onClick={() => setOpen(true)}>
      {value ? currentLabel ?? "Selected category" : placeholder}<ChevronDown className="size-3.5" />
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); data.applySearch(); }}>
          <Input aria-label={`Search ${label.toLowerCase()}`} placeholder="Search" maxLength={160} value={data.searchInput} onChange={(event) => data.setSearchInput(event.target.value)} />
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <Button type="button" variant="ghost" onClick={() => { onChange(""); setOpen(false); }}>{placeholder}</Button>
        {data.error ? <p role="alert" className="text-sm text-destructive">{data.error.message}</p> : null}
        <div className="grid max-h-72 gap-1 overflow-y-auto" aria-busy={data.loading}>
          {data.loading ? <p role="status" className="p-3 text-sm">Loading…</p> : data.options.map((option) => (
            <Button key={option.id} type="button" variant={option.id === value ? "secondary" : "ghost"} className="justify-start" onClick={() => { setChoice(option); onChange(option.id); setOpen(false); }}>{option.label}</Button>
          ))}
          {!data.loading && !data.error && !data.options.length ? <p className="p-3 text-sm text-muted-foreground">No results found.</p> : null}
        </div>
        {data.page > 1 || data.totalPages > 1 ? <div className="flex items-center justify-end gap-3 text-sm">
          <Button type="button" variant="outline" disabled={data.loading || data.page <= 1} onClick={() => data.setPage(data.page - 1)}>Previous</Button>
          <span>Page {data.page} of {data.totalPages}</span>
          <Button type="button" variant="outline" disabled={data.loading || data.page >= data.totalPages} onClick={() => data.setPage(data.page + 1)}>Next</Button>
        </div> : null}
      </DialogContent>
    </Dialog>
  </>;
}
