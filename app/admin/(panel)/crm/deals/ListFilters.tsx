"use client";

import Link from "next/link";
import { Select } from "@/components/ui/Select";
import { Card, deskLinkButton, deskField } from "@/components/admin/desk";
import { useAutoSubmit } from "@/components/admin/use-auto-submit";
import { DEAL_STAGES } from "@/lib/taxonomy/brokerage";
import type { DealFilters } from "./_views";

const FIELD_LABEL = "text-[11px] font-semibold uppercase tracking-[0.1em] text-muted";

/**
 * A plain GET form. The filters end up in the URL, which means the back
 * button works, a filtered pipeline can be sent to someone, and the view
 * survives the reload that a stage change triggers — none of which a
 * client-side filter would give for free.
 */
export function ListFilters({
  filters,
  agents,
  shown,
  total,
}: {
  filters: DealFilters;
  agents: string[];
  shown: number;
  total: number;
}) {
  const { formRef, submitNow, submitSoon } = useAutoSubmit();
  const stageOptions = [
    { value: "", label: "All stages" },
    ...DEAL_STAGES.map((s) => ({ value: s, label: s })),
  ];
  const agentOptions = [
    { value: "", label: "All agents" },
    ...agents.map((a) => ({ value: a, label: a })),
  ];
  const isFiltered =
    Boolean(filters.stage || filters.agent || filters.q.trim()) || filters.openOnly;

  return (
    <Card>
      <form ref={formRef} method="get" className="flex flex-col gap-4">
        <input type="hidden" name="view" value="list" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Search</span>
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder="Client, property or ref code"
              className={`${deskField} w-full`}
            onChange={submitSoon}
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Stage</span>
            <Select
              name="stage"
              options={stageOptions}
              defaultValue={filters.stage}
              aria-label="Filter by stage" onValueChange={submitNow}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Agent</span>
            <Select
              name="agent"
              options={agentOptions}
              defaultValue={filters.agent}
              aria-label="Filter by agent" onValueChange={submitNow}
            />
          </div>

          <div className="flex flex-col justify-end gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                name="open"
                value="1"
                defaultChecked={filters.openOnly}
                className="size-4 accent-ink"
              onChange={submitNow}
              />
              Still in play
            </label>
            <div className="flex items-center gap-3">
              {/* No Apply button: the form submits itself. Kept so Enter in the
                                search box still submits and the filters work before the
                                JavaScript loads. */}
                            <button type="submit" className="sr-only">
                              Apply filters
                            </button>
              {isFiltered && (
                <Link href="/admin/crm/deals?view=list" className={deskLinkButton}>
                  Clear
                </Link>
              )}
            </div>
          </div>
        </div>

        <p className="text-[12px] text-muted" aria-live="polite">
          {isFiltered
            ? `Showing ${shown} of ${total} deal${total === 1 ? "" : "s"}.`
            : `${total} deal${total === 1 ? "" : "s"}.`}
        </p>
      </form>
    </Card>
  );
}
